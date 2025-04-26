import { Component, find } from '../../finder';
import { deepEqual } from 'assert';
import { suite, test } from 'mocha';
import { resolve } from 'path';

suite('Finder Test Suite', () => {
  test('Should return all components found in the project root', () => {
    const filePath = resolve(
      __dirname,
      '../../../src/tests/fixtures/vue-project/src/components/HelloWorld.vue'
    );

    const actual = find(filePath);
    const expected: Component[] = [
      {
        name: 'HelloWorld',
        source: '@/components/HelloWorld.vue',
      },
      {
        name: 'HomeView',
        source: '@/views/HomeView.vue',
      },
      {
        name: 'IconComponent',
        source: '@/components/icons/IconComponent.vue',
      },
    ];

    deepEqual(actual, expected);
  });
});
