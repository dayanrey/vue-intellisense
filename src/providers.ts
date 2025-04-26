import { EXTENSION_NAME, getSettings } from './extension';
import { Component, find } from './finder';
import { parse, SFCBlock, SFCScriptBlock } from './parser';
import {
  CodeAction,
  CodeActionKind,
  CodeActionProvider,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  MarkdownString,
  Position,
  Range,
  SnippetString,
  TextDocument,
  WorkspaceEdit,
} from 'vscode';

export class QuickFixProvider implements CodeActionProvider {
  provideCodeActions(document: TextDocument, range: Range): CodeAction[] {
    const quickFixes: CodeAction[] = [];

    const line = document.lineAt(range.start.line).text;

    const templateElements = [
      'main',
      'section',
      'div',
      'a',
      'header',
      'footer',
      'nav',
      'ul',
      'li',
      'button',
      'form',
      'input',
      'img',
      'component',
      'RouterLink',
      'RouterView',
    ];
    const components = find(document.uri.fsPath).map((component) => component.name);

    const emptyElement = line.match(
      new RegExp(`^(\\s*)<(component|${components.join('|')})([^>]*)><\\/\\2>`)
    );
    const multiAttrElement = line.match(
      new RegExp(
        `^(\\s*)<(${templateElements.join('|')}|${components.join('|')})` +
          `((?:\\s+[^\\s=]+(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?)+)` +
          '\\s*(?:\\/?>|(?:>(.*?)<\\/\\2>))?$'
      )
    );

    if (emptyElement) {
      const title = 'Format as self-closing';
      const edit = new WorkspaceEdit();

      edit.replace(
        document.uri,
        new Range(range.start.line, 0, range.start.line, line.length),
        this.generateSelfClosingFormat(emptyElement)
      );

      quickFixes.push(this.createQuickFix(title, edit));
    }

    if (multiAttrElement) {
      const title = 'Format as multi-line';
      const edit = new WorkspaceEdit();

      edit.replace(
        document.uri,
        new Range(range.start.line, 0, range.start.line, line.length),
        this.generateMultiLineFormat(multiAttrElement)
      );

      quickFixes.push(this.createQuickFix(title, edit));
    }

    return quickFixes;
  }

  private createQuickFix(title: string, edit: WorkspaceEdit): CodeAction {
    return {
      title,
      kind: CodeActionKind.QuickFix,
      edit,
    };
  }

  private generateMultiLineFormat(match: RegExpMatchArray): string {
    const [matched, indentation, name, attrs, content] = match;

    const regex = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    const parsedAttrs = [...attrs.matchAll(regex)].map((match) => {
      const [, name, doubleQuoted, singleQuoted, unquoted] = match;

      let value: string;

      if (doubleQuoted !== undefined) {
        value = `${doubleQuoted}`;
      } else if (singleQuoted !== undefined) {
        value = `${singleQuoted}`;
      } else if (unquoted !== undefined) {
        value = `${unquoted}`;
      } else {
        value = '';
      }

      return value === '' ? `\t${name}` : `\t${name}="${value}"`;
    });

    let format: string;

    if (matched.includes(`</${name}>`)) {
      format = `<${name}\n${parsedAttrs.join('\n')}\n>\n\t${content}\n</${name}>`;
    } else if (matched.includes('/>')) {
      format = `<${name}\n${parsedAttrs.join('\n')}\n/>`;
    } else {
      format = `<${name}\n${parsedAttrs.join('\n')}\n>`;
    }

    return (format = format
      .split('\n')
      .map((line) => `${indentation}${line}`)
      .join('\n'));
  }

  private generateSelfClosingFormat(match: RegExpMatchArray): string {
    const [, indentation, name, attrs] = match;

    return `${indentation}<${name}${attrs} />`;
  }
}

export class SnippetProvider implements CompletionItemProvider {
  provideCompletionItems(document: TextDocument, position: Position): CompletionItem[] {
    const snippets: CompletionItem[] = [];

    const components = find(document.uri.fsPath);
    const sfc = parse(document.getText());
    const settings = getSettings();

    const { script, scriptSetup, template, styles } = sfc;
    const { api, preprocessors, useScriptSetup } = settings;

    const isInsideScript = script && this.isInsideBlock(position, script);
    const isInsideScriptSetup = scriptSetup && this.isInsideBlock(position, scriptSetup);
    const isInsideTemplate = template && this.isInsideBlock(position, template);
    const isInsideStyle = styles.some((style) => this.isInsideBlock(position, style));

    if (isInsideScriptSetup) {
      const isValid = this.isValidInScriptSetup(position, scriptSetup);

      if (isValid) {
        snippets.push(...this.generateDefineSnippets(scriptSetup.content, scriptSetup.lang));
      }
    } else if (isInsideTemplate) {
      const isValid = this.isValidInTemplate(position, template);

      if (isValid) {
        snippets.push(...this.generateComponentSnippets(components, template.lang));
      }
    } else if (!isInsideScript && !isInsideStyle) {
      if (!script) {
        snippets.push(
          ...this.generateScriptSnippets(
            api,
            !useScriptSetup,
            scriptSetup?.lang ?? preprocessors.script
          )
        );
      }

      if (!scriptSetup && api === 'Composition API' && useScriptSetup) {
        snippets.push(this.generateScriptSetupSnippet(script?.lang ?? preprocessors.script));
      }

      if (!template) {
        snippets.push(...this.generateTemplateSnippets(components, preprocessors.template));
      }

      snippets.push(...this.generateStyleSnippets(preprocessors.style));
    }

    return snippets;
  }

  private createSnippet(label: string, insertText: string, documentation?: string): CompletionItem {
    return {
      label,
      kind: CompletionItemKind.Snippet,
      detail: EXTENSION_NAME,
      insertText: new SnippetString(insertText),
      documentation: documentation
        ? new MarkdownString(documentation)
        : new MarkdownString(`\`\`\`vue\n${insertText.replace('$0', '|')}`),
    };
  }

  private generateComponentSnippets(components: Component[], language?: string): CompletionItem[] {
    return components.map((component) => {
      const label = component.name;

      let insertText: string;
      let documentation: string;

      if (language === 'pug') {
        insertText = component.name;
        documentation = `\`\`\`pug\n${component.name}|`;
      } else {
        insertText = `<${component.name}$0></${component.name}>`;
        documentation = `\`\`\`html\n<${component.name}|></${component.name}>`;
      }

      return this.createSnippet(label, insertText, documentation);
    });
  }

  private generateDefineSnippets(content: string, language?: string): CompletionItem[] {
    const hasProps = /\bdefineProps\b/.test(content);
    const hasEmits = /\bdefineEmits\b/.test(content);
    const hasSlots = /\bdefineSlots\b/.test(content);

    return ['props', 'emits', 'slots']
      .filter((label) => {
        const excludeLabel =
          (label === 'props' && hasProps) ||
          (label === 'emits' && hasEmits) ||
          (label === 'slots' && hasSlots) ||
          (label === 'slots' && language !== 'ts');

        return excludeLabel ? false : true;
      })
      .map((label) => {
        const defineMacro = `define${label.charAt(0).toUpperCase()}${label.slice(1)}`;

        let insertText: string;
        let documentation: string;

        if (language === 'ts') {
          insertText = `const ${label} = ${defineMacro}<$0>()`;
          documentation = `\`\`\`typescript\nconst ${label} = ${defineMacro}<|>()`;
        } else {
          insertText = `const ${label} = ${defineMacro}($0)`;
          documentation = `\`\`\`javascript\nconst ${label} = ${defineMacro}(|)`;
        }

        return this.createSnippet(label, insertText, documentation);
      });
  }

  private generateScriptSnippets(
    api: string,
    useSetup: boolean,
    preprocessor?: string
  ): CompletionItem[] {
    return ['script', 'script src'].map((label) => {
      let insertText: string;

      if (label === 'script src') {
        insertText = `<script src="$0"></script>`;
      } else {
        const attrs = preprocessor ? ` lang="${preprocessor}"` : '';

        let content: string;

        if (preprocessor === 'ts') {
          content = `import { defineComponent } from 'vue'\n\nexport default defineComponent({\n\t$0\n})`;
        } else {
          content = `export default {\n\t$0\n}`;
        }

        if (api === 'Composition API' && useSetup) {
          content = content.replace('$0', 'setup() {\n\t\t$0\n\t}');
        }

        insertText = `<script${attrs}>\n${content}\n</script>\n`;
      }

      return this.createSnippet(label, insertText);
    });
  }

  private generateScriptSetupSnippet(preprocessor?: string): CompletionItem {
    const lang = preprocessor ? ` lang="${preprocessor}"` : '';

    const label = 'script setup';
    const insertText = `<script setup${lang}>\n$0\n</script>\n`;

    return this.createSnippet(label, insertText);
  }

  private generateTemplateSnippets(
    components: Component[],
    preprocessor?: string
  ): CompletionItem[] {
    const templateElements = [
      'main',
      'section',
      'div',
      'a',
      'header',
      'footer',
      'nav',
      'ul',
      'li',
      'button',
      'form',
      'component',
      'RouterLink',
      'RouterView',
    ];
    const wrappers = `${templateElements.join(',')},${components
      .map((component) => component.name)
      .join(',')}`;

    return ['template', 'template src'].map((label) => {
      let insertText: string;
      let documentation: string | undefined;

      if (label === 'template src') {
        insertText = '<template src="$0"></template>';
      } else if (preprocessor === 'pug') {
        insertText = `<template lang="pug">\n\t\${1|${wrappers}|}$0\n</template>\n`;
        documentation = `\`\`\`vue\n<template lang="pug">\n\tmain|\n</template>\n`;
      } else {
        insertText = `<template>\n\t<\${1|${wrappers}|}$0>\n\t\t\n\t</$1>\n</template>\n`;
        documentation = `\`\`\`vue\n<template>\n\t<main|>\n\t\t\n\t</main>\n</template>\n`;
      }

      return this.createSnippet(label, insertText, documentation);
    });
  }

  private generateStyleSnippets(preprocessor?: string): CompletionItem[] {
    return ['style', 'style module', 'style scoped', 'style src'].map((label) => {
      const lang = preprocessor ? ` lang="${preprocessor}"` : '';

      let insertText: string;

      if (label === 'style src') {
        insertText = `<style src="$0"></style>`;
      } else {
        insertText = `<${label}${lang}>\n$0\n</style>\n`;
      }

      return this.createSnippet(label, insertText);
    });
  }

  private isInsideBlock(position: Position, block: SFCBlock): boolean {
    return position.line >= block.loc.start.line && position.line <= block.loc.end.line;
  }

  private isValidInScriptSetup(position: Position, scriptSetup: SFCScriptBlock): boolean {
    for (const statement of scriptSetup.ast) {
      const loc = statement.loc!;

      if (position.line >= loc.start.line && position.line <= loc.end.line) {
        if (loc.start.line === loc.end.line && position.character > loc.end.column) {
          return true;
        }

        return false;
      }
    }

    return true;
  }

  private isValidInTemplate(position: Position, template: SFCBlock): boolean {
    const { line, character } = position.translate(-template.loc.start.line - 1, 0);
    const lines = template.content.split('\n').slice(1, -1);

    if (lines[line].includes('<') || lines[line].includes('>')) {
      const characters = lines[line].split('');

      if (characters[character] === '<') {
        return true;
      } else if (characters[character] === '>') {
        return false;
      }

      for (let i = character + 1; i < characters.length; i++) {
        if (characters[i] === '<') {
          return true;
        } else if (characters[i] === '>') {
          return false;
        }
      }

      return true;
    }

    for (let i = line + 1; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('</')) {
        return true;
      } else if (lines[i].trimStart().startsWith('<')) {
        return true;
      } else if (lines[i].trimStart().startsWith('>')) {
        return false;
      }
    }

    return true;
  }
}
