import { parse, SFCScriptBlock, SFCTemplateBlock, SFCStyleBlock } from '../../parser';
import { parse as babelParse } from '@babel/parser';
import { deepEqual } from 'assert';
import { readFileSync } from 'fs';
import { suite, test } from 'mocha';
import { resolve } from 'path';

suite('Finder Test Suite', () => {
  const fixturePath = resolve(__dirname, '../../../src/tests/fixtures/VueComponent.vue');
  const fixtureContent = readFileSync(fixturePath, 'utf-8');

  const sfc = parse(fixtureContent);

  test('Should parse the script setup block correctly', () => {
    const content = "\r\nimport ChildComponent from './components/ChildComponent.vue'\r\n";
    const result = babelParse(content, {
      sourceType: 'module',
      plugins: ['typescript'],
      startLine: 0,
    });

    const actual = sfc.scriptSetup;
    const expected: SFCScriptBlock = {
      type: 'script',
      setup: true,
      lang: 'ts',
      src: undefined,
      content,
      loc: {
        start: {
          line: 0,
          column: 0,
          offset: 0,
        },
        end: {
          line: 2,
          column: 9,
          offset: 97,
        },
      },
      ast: result.program.body,
    };

    deepEqual(actual, expected);
  });

  test('Should parse the template block correctly', () => {
    const actual = sfc.template;
    const expected: SFCTemplateBlock = {
      type: 'template',
      lang: undefined,
      src: undefined,
      content:
        '\r\n  <div class="wrapper">\r\n' +
        '    <ChildComponent>\r\n' +
        '      <template #content>\r\n' +
        '        <span>Hello World</span>\r\n' +
        '      </template>\r\n' +
        '    </ChildComponent>\r\n' +
        '  </div>\r\n',
      loc: {
        start: {
          line: 4,
          column: 0,
          offset: 101,
        },
        end: {
          line: 12,
          column: 11,
          offset: 284,
        },
      },
    };

    deepEqual(actual, expected);
  });

  test('Should parse the style block correctly', () => {
    const actual = sfc.styles;
    const expected: SFCStyleBlock[] = [
      {
        type: 'style',
        scoped: true,
        module: undefined,
        lang: undefined,
        src: undefined,
        content:
          '\r\n.wrapper {\r\n' +
          '  display: flex;\r\n' +
          '  flex-direction: column;\r\n' +
          '  justify-content: center;\r\n' +
          '  align-items: center;\r\n' +
          '}\r\n',
        loc: {
          start: {
            line: 14,
            column: 0,
            offset: 288,
          },
          end: {
            line: 21,
            column: 8,
            offset: 424,
          },
        },
      },
    ];

    deepEqual(actual, expected);
  });
});
