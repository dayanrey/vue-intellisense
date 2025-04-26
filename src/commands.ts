import {
  ExportDefaultDeclaration,
  ImportDeclaration,
  isCallExpression,
  isExportDefaultDeclaration,
  isIdentifier,
  isImportDeclaration,
  isObjectExpression,
  isObjectProperty,
  ObjectProperty,
} from '@babel/types';
import { getSettings } from './extension';
import { Component } from './finder';
import { parse, SFCScriptBlock } from './parser';
import { Position, TextEditor, TextEditorEdit } from 'vscode';

export const registerComponent = (
  editor: TextEditor,
  edit: TextEditorEdit,
  component: Component
): void => {
  const text = editor.document.getText();

  const { scriptSetup, script } = parse(text);
  const { api, preprocessors, useScriptSetup } = getSettings();

  const componentImport = `import ${component.name} from '${component.source}'`;
  const typeHelperImport = "import { defineComponent } from 'vue'";

  const componentsOption = `components: {\n\t\t${component.name},\n\t},`;
  const setupOption = 'setup() {\n\t\t\n\t},';

  const extractComponentsOption = (
    exportDefault: ExportDefaultDeclaration
  ): ObjectProperty | undefined => {
    let options: ObjectProperty[] = [];

    if (isCallExpression(exportDefault.declaration)) {
      const argument = exportDefault.declaration.arguments[0];

      if (isObjectExpression(argument)) {
        options = argument.properties.filter((property) => isObjectProperty(property));
      }
    } else if (isObjectExpression(exportDefault.declaration)) {
      options = exportDefault.declaration.properties.filter((property) =>
        isObjectProperty(property)
      );
    }

    return options.find((property) => isIdentifier(property.key, { name: 'components' }));
  };
  const extractImports = (block: SFCScriptBlock): ImportDeclaration[] => {
    return block.ast.filter((statement) => isImportDeclaration(statement));
  };
  const extractExportDefault = (script: SFCScriptBlock): ExportDefaultDeclaration | undefined => {
    return script.ast.find((statement) => isExportDefaultDeclaration(statement));
  };
  const generateContent = (preprocessor?: string): string => {
    let result: string;

    if (preprocessor === 'ts') {
      result = `${typeHelperImport}\n${componentImport}\n\n${generateExportDefault(preprocessor)}`;
    } else {
      result = `${componentImport}\n\n${generateExportDefault(preprocessor)}`;
    }

    return result;
  };
  const generateExportDefault = (preprocessor?: string): string => {
    let result: string;

    if (preprocessor === 'ts') {
      result = `export default defineComponent({\n\t${componentsOption}\n})`;
    } else {
      result = `export default {\n\t${componentsOption}\n}`;
    }

    if (api === 'Composition API') {
      result = result.replace(componentsOption, `${componentsOption}\n\t${setupOption}`);
    }

    return result;
  };
  const insertComponentImport = (block: SFCScriptBlock): void => {
    const isAlreadyImported = block.content.includes(component.source.replace('@/', ''));

    if (isAlreadyImported) {
      return;
    }

    const imports = extractImports(block);
    const lastImport = imports[imports.length - 1];

    const location = lastImport
      ? new Position(lastImport.loc!.end.line + 1, 0)
      : new Position(block.loc.start.line + 1, 0);
    const value = lastImport ? `${componentImport}\n` : `${componentImport}\n\n`;

    edit.insert(location, value);
  };
  const insertComponentName = (componentsOption: ObjectProperty): void => {
    const isAlreadyRegistered =
      isObjectExpression(componentsOption.value) &&
      componentsOption.value.properties.some(
        (property) =>
          isObjectProperty(property) && isIdentifier(property.value, { name: component.name })
      );

    if (isAlreadyRegistered) {
      return;
    }

    const location = new Position(
      componentsOption.loc!.end.line,
      componentsOption.loc!.end.column - '}'.length
    );
    const value = `\t${component.name},\n\t`;

    edit.insert(location, value);
  };
  const insertComponentsOption = (exportDefault: ExportDefaultDeclaration): void => {
    const isDefineCall = isCallExpression(exportDefault.declaration);
    const isSingleLine = exportDefault.loc!.start.line === exportDefault.loc!.end.line;

    const location = isDefineCall
      ? new Position(
          exportDefault.loc!.start.line,
          exportDefault.loc!.start.column + 'export default defineComponent({'.length
        )
      : new Position(0, 0);
    const value = isSingleLine ? `\n\t${componentsOption}\n` : `\n\t${componentsOption}`;

    edit.insert(location, value);
  };
  const insertContent = (block: SFCScriptBlock): void => {
    const isSingleLine = block.loc.start.line === block.loc.end.line;
    const isScriptSetup = !!block.setup;

    const location = new Position(block.loc.end.line, block.loc.end.column - '</script>'.length);

    let value: string;

    if (isScriptSetup) {
      value = `${componentImport}\n`;
    } else {
      value = `${generateContent(block.lang)}\n`;
    }

    if (isSingleLine) {
      value = `\n${value}`;
    }

    edit.insert(location, value);
  };
  const insertExportDefault = (script: SFCScriptBlock): void => {
    const location = new Position(script.loc.end.line, script.loc.end.column - '</script>'.length);
    const value = `\n${generateExportDefault(script.lang)}\n`;

    if (script.lang === 'ts') {
      const location = new Position(script.loc.start.line, '<script lang="ts">'.length);
      const value = `\n${typeHelperImport}`;

      edit.insert(location, value);
    }

    edit.insert(location, value);
  };
  const insertScriptSetup = (preprocessor?: string): void => {
    const lang = preprocessor ? ` lang="${preprocessor}"` : '';

    const location = new Position(0, 0);
    const value = `<script setup${lang}>\n${componentImport}\n</script>\n\n`;

    edit.insert(location, value);
  };
  const insertScript = (preprocessor?: string): void => {
    const lang = preprocessor ? ` lang="${preprocessor}"` : '';

    const location = new Position(0, 0);
    const value = `<script${lang}>\n${generateContent(preprocessor)}\n</script>\n\n`;

    edit.insert(location, value);
  };

  if (scriptSetup) {
    const isEmpty = scriptSetup.content.trim() === '';

    if (isEmpty) {
      insertContent(scriptSetup);
    } else {
      insertComponentImport(scriptSetup);
    }
  } else if (script) {
    const isEmpty = script.content.trim() === '';

    if (isEmpty) {
      insertContent(script);
    } else {
      const exportDefault = extractExportDefault(script);

      insertComponentImport(script);

      if (exportDefault) {
        const componentsOption = extractComponentsOption(exportDefault);

        if (componentsOption) {
          insertComponentName(componentsOption);
        } else {
          insertComponentsOption(exportDefault);
        }
      } else {
        insertExportDefault(script);
      }
    }
  } else if (api === 'Composition API' && useScriptSetup) {
    insertScriptSetup(preprocessors.script);
  } else {
    insertScript(preprocessors.script);
  }
};
