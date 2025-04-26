# Vue Intellisense

**Vue Intellisense** is a powerful Visual Studio Code extension that provides dynamic snippets and quick actions for Vue Single File Components (SFCs). Enhance your Vue 3 development workflow with context-aware completions, auto-imports, and formatting quick fixes.

## Features

### Dynamic Snippets for Vue SFCs

- Provides `script`, `template`, and `style` snippets

![Dynamic Snippets](https://github.com/dayanrey/vue-intellisense/blob/main/images/block-snippets.gif?raw=true)

- Provides `component` snippets inside the `<template>` block

![Dynamic Snippets](https://github.com/dayanrey/vue-intellisense/blob/main/images/component-snippets.gif?raw=true)

- Provides `props`, `emits` and `slots` snippets inside the `<script setup>` block

![Dynamic Snippets](https://github.com/dayanrey/vue-intellisense/blob/main/images/define-snippets.gif?raw=true)

### Auto Import and Registration

- Automatically imports and registers Vue components inserted through snippets

![Auto Import](https://github.com/dayanrey/vue-intellisense/blob/main/images/auto-import.gif?raw=true)

### Quick Fixes

- Format multi-attribute elements of the `<template>` block as multi-line

![Quick Fixes](https://github.com/dayanrey/vue-intellisense/blob/main/images/multi-line.gif?raw=true)

- Format empty elements of the `<template>` block as self-closing

![Quick Fixes](https://github.com/dayanrey/vue-intellisense/blob/main/images/self-closing.gif?raw=true)

## Requirements

To get the best experience from this extension, we recommend installing the following tool:

- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

While not strictly required, it will significantly improve your workflow.

## Extension Settings

This extension contributes the following settings:

- `vue-intellisense.SFC.api`

  - Description: The preferred API Style to use with your Single-File Components (SFCs)
  - Type: `string`
  - Values: `Composition API`, `Options API`
  - Default: `Composition API`

- `vue-intellisense.SFC.useScriptSetup`

  - Description: Use `<script setup>` block in your SFC. Only applies with `Composition API`
  - Type: `boolean`
  - Default: `true`

- `vue-intellisense.SFC.preprocessors.script`

  - Description: The preferred language pre-processor to use with the `script` blocks
  - Type: `string`
  - Values: `none`, `ts`
  - Default: `ts`

- `vue-intellisense.SFC.preprocessors.template`

  - Description: The preferred language pre-processor to use with the `template` block
  - Type: `string`
  - Values: `none`, `pug`
  - Default: `none`

- `vue-intellisense.SFC.preprocessors.style`
  - Description: The preferred language pre-processor to use with the `style` blocks
  - Type: `string`
  - Values: `none`, `less`, `postcss`, `sass`, `scss`, `stylus`
  - Default: `none`

These settings are designed to enhance your development experience by providing more accurate and context-aware snippets.

## Release Notes

### 0.0.1

- Initial release

## Contributing

Contributions are welcome and encouraged

- Found a bug? [Open an issue](https://github.com/dayanrey/vue-intellisense/issues)
- Have an idea or improvement? [Create a pull request](https://github.com/dayanrey/vue-intellisense/pulls)

## License

MIT &copy; [Dayan Rey](https://github.com/dayanrey)
