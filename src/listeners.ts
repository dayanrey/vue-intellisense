import { EXTENSION_ID } from './extension';
import { find } from './finder';
import { parse, SFCBlock } from './parser';
import { commands, Range, TextDocumentChangeEvent, window } from 'vscode';

export const detectComponent = (e: TextDocumentChangeEvent): void => {
  const changes = e.contentChanges;
  const document = e.document;

  const components = find(document.uri.fsPath);
  const names = components.map((component) => component.name);

  const { template } = parse(document.getText());

  if (template) {
    for (const change of changes) {
      const isInside = isInsideTemplate(change.range, template);

      if (isInside) {
        const element = change.text.match(new RegExp(`(${names.join('|')})`));

        if (element) {
          const [_, name] = element;
          const component = components.find((component) => component.name === name);

          if (component) {
            commands.executeCommand(`${EXTENSION_ID}.registerComponent`, component);
          }
        }
      }
    }
  }
};

function isInsideTemplate(range: Range, template: SFCBlock): boolean {
  const loc = template.loc;

  return range.start.line > loc.start.line && range.end.line < loc.end.line;
}
