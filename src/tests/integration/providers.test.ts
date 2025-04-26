import { QuickFixProvider, SnippetProvider } from '../../providers';
import { ok, strictEqual } from 'assert';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Position, Range, TextDocument, Uri } from 'vscode';

suite('QuickFix Provider Test Suite', () => {
  const provider = new QuickFixProvider();

  const fixturePath = resolve(
    __dirname,
    '../../../src/tests/fixtures/vue-project/src/components/HelloWorld.vue'
  );
  const document = mockDocument(fixturePath);

  test('Should format empty elements as self-closing', () => {
    const range = new Range(6, 4, 6, 35);
    const fixes = provider.provideCodeActions(document, range);

    strictEqual(fixes.length > 0, true);
    strictEqual(fixes[0].title, 'Format as self-closing');
  });

  test('Should format elements with multiple attributes as multi-line', () => {
    const range = new Range(9, 6, 9, 6);
    const fixes = provider.provideCodeActions(document, range);

    strictEqual(fixes.length > 0, true);
    strictEqual(fixes[0].title, 'Format as multi-line');
  });
});

suite('Snippet Provider Test Suite', () => {
  const provider = new SnippetProvider();

  const fixturePath = resolve(
    __dirname,
    '../../../src/tests/fixtures/vue-project/src/views/HomeView.vue'
  );
  const document = mockDocument(fixturePath);

  test('Should generate block snippets correctly', () => {
    const position = new Position(0, 0);
    const snippets = provider.provideCompletionItems(document, position);

    for (const label of [
      'script',
      'script setup',
      'script src',
      'template',
      'template src',
      'style',
      'style module',
      'style scoped',
      'style src',
    ]) {
      ok(snippets.some((snippet) => snippet.label === label));
    }
  });
});

function mockDocument(fixturePath: string): TextDocument {
  const content = readFileSync(fixturePath, 'utf-8');
  const lines = content.split('\n');

  return {
    uri: Uri.file(resolve(__dirname, fixturePath)),
    getText: () => content,
    lineAt: (line: number) => ({
      text: lines[line].trimEnd(),
    }),
  } as unknown as TextDocument;
}
