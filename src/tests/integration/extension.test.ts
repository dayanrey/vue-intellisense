import { activate, ExtensionSettings, getSettings } from '../../extension';
import { deepEqual, strictEqual } from 'assert';
import { ExtensionContext } from 'vscode';

suite('Extension Test Suite', () => {
  test('Should activate extension and register commands/providers', () => {
    const context: ExtensionContext = {
      subscriptions: [],
    } as unknown as ExtensionContext;

    activate(context);

    strictEqual(context.subscriptions.length, 3);
  });

  test('Should return the settings correctly', () => {
    const actual = getSettings();
    const expected: ExtensionSettings = {
      api: 'Composition API',
      useScriptSetup: true,
      preprocessors: {
        script: 'ts',
        template: 'none',
        style: 'none',
      },
    };

    deepEqual(actual, expected);
  });
});
