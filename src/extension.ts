import { registerComponent } from './commands';
import { detectComponent } from './listeners';
import { QuickFixProvider, SnippetProvider } from './providers';
import { commands, DocumentSelector, ExtensionContext, languages, workspace } from 'vscode';

export const EXTENSION_ID = 'vue-intellisense';
export const EXTENSION_NAME = 'Vue Intellisense';

export interface ExtensionSettings {
  api: 'Composition API' | 'Options API';
  useScriptSetup: boolean;
  preprocessors: {
    script?: 'none' | 'ts';
    template?: 'none' | 'pug';
    style?: 'none' | 'less' | 'postcss' | 'sass' | 'scss' | 'stylus';
  };
}

export function activate(context: ExtensionContext) {
  const selector: DocumentSelector = {
    language: 'vue',
    pattern: '**/*.vue',
    scheme: 'file',
  };

  context.subscriptions.push(
    commands.registerTextEditorCommand(`${EXTENSION_ID}.registerComponent`, registerComponent),
    languages.registerCodeActionsProvider(selector, new QuickFixProvider()),
    languages.registerCompletionItemProvider(selector, new SnippetProvider()),
    workspace.onDidChangeTextDocument(detectComponent)
  );
}

export function getSettings(): ExtensionSettings {
  const configuration = workspace.getConfiguration(EXTENSION_ID);
  const settings = configuration.get<ExtensionSettings>('SFC')!;

  for (const key in settings.preprocessors) {
    const blockType = key as keyof typeof settings.preprocessors;
    const preprocessor = settings.preprocessors[blockType];

    if (preprocessor === 'none') {
      settings.preprocessors[blockType] = undefined;
    }
  }

  return settings;
}
