import { registerComponent } from '../../commands';
import { Component } from '../../finder';
import { strictEqual } from 'assert';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { TextDocument, TextEditor, window, workspace } from 'vscode';

suite('Register Component Command Test Suite', () => {
  const fixturePath = resolve(
    __dirname,
    '../../../src/tests/fixtures/vue-project/src/views/HomeView.vue'
  );
  const fixtureContent = readFileSync(fixturePath, 'utf-8');

  const component: Component = {
    name: 'MyComponent',
    source: '@/components/MyComponent.vue',
  };

  let document: TextDocument;
  let editor: TextEditor;

  setup(async () => {
    document = await workspace.openTextDocument({
      content: fixtureContent,
      language: 'vue',
    });
    editor = await window.showTextDocument(document);
  });

  test('Should insert the component import within a script setup block', async function () {
    this.timeout(200000);

    await editor.edit((editBuilder) => {
      registerComponent(editor, editBuilder, component);
    });

    const actual = editor.document.getText();
    const expected =
      '<script setup lang="ts">\r\n' +
      "import MyComponent from '@/components/MyComponent.vue'\r\n" +
      '</script>\r\n\r\n';

    strictEqual(actual, expected);
  });
});
