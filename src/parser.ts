import { isExpressionStatement, isIdentifier, Statement } from '@babel/types';
import { parse as babelParse } from '@babel/parser';
import { parse as baseParse, HTMLElement } from 'node-html-parser';

interface Location {
  start: Position;
  end: Position;
}

interface Position {
  line: number;
  column: number;
  offset: number;
}

interface SFC {
  script?: SFCScriptBlock;
  scriptSetup?: SFCScriptBlock;
  template?: SFCTemplateBlock;
  styles: SFCStyleBlock[];
}

export interface SFCBlock {
  type: string;
  content: string;
  loc: Location;
  lang?: string;
  src?: string;
}

export interface SFCScriptBlock extends SFCBlock {
  type: 'script';
  setup?: boolean;
  ast: Statement[];
}

export interface SFCTemplateBlock extends SFCBlock {
  type: 'template';
}

export interface SFCStyleBlock extends SFCBlock {
  type: 'style';
  module?: boolean;
  scoped?: boolean;
}

export function parse(text: string): SFC {
  const nodes = baseParse(text).children;

  return {
    script: extractScript(nodes, text),
    scriptSetup: extractScriptSetup(nodes, text),
    template: extractTemplate(nodes, text),
    styles: extractStyles(nodes, text),
  };
}

function extractScript(nodes: HTMLElement[], text: string): SFCScriptBlock | undefined {
  const target = nodes.find(
    (node) => node.rawTagName === 'script' && !node.rawAttrs.includes('setup')
  );

  if (!target) {
    return undefined;
  }

  const { attrs, range, rawAttrs, rawTagName } = target;

  const content = getContent(rawTagName, rawAttrs, ...range, text);
  const loc = getLocation(...range, text);
  const ast = generateAst(content, loc.start.line);

  return {
    type: 'script',
    content,
    loc,
    lang: attrs.lang,
    src: attrs.src,
    ast,
  };
}

function extractScriptSetup(nodes: HTMLElement[], text: string): SFCScriptBlock | undefined {
  const target = nodes.find(
    (node) => node.rawTagName === 'script' && node.rawAttrs.includes('setup')
  );

  if (!target) {
    return undefined;
  }

  const { attrs, range, rawAttrs, rawTagName } = target;

  const content = getContent(rawTagName, rawAttrs, ...range, text);
  const loc = getLocation(...range, text);
  const ast = generateAst(content, loc.start.line);

  return {
    type: 'script',
    content,
    loc,
    lang: attrs.lang,
    src: attrs.src,
    setup: true,
    ast,
  };
}

function extractTemplate(nodes: HTMLElement[], text: string): SFCTemplateBlock | undefined {
  const target = nodes.find((node) => node.rawTagName === 'template');

  if (!target) {
    return undefined;
  }

  const { attrs, range, rawAttrs, rawTagName } = target;

  return {
    type: 'template',
    content: getContent(rawTagName, rawAttrs, ...range, text),
    loc: getLocation(...range, text),
    lang: attrs.lang,
    src: attrs.src,
  };
}

function extractStyles(nodes: HTMLElement[], text: string): SFCStyleBlock[] {
  const targets = nodes.filter((node) => node.rawTagName === 'style');

  if (targets.length === 0) {
    return [];
  }

  return targets.map((target) => {
    const { attrs, range, rawAttrs, rawTagName } = target;

    return {
      type: 'style',
      content: getContent(rawTagName, rawAttrs, ...range, text),
      loc: getLocation(...range, text),
      lang: attrs.lang,
      src: attrs.src,
      module: rawAttrs.includes('module') ? true : undefined,
      scoped: rawAttrs.includes('scoped') ? true : undefined,
    };
  });
}

function generateAst(content: string, startLine: number): Statement[] {
  const result = babelParse(content, {
    sourceType: 'module',
    plugins: ['typescript'],
    startLine,
  });

  return result.program.body.filter(
    (statement) => !(isExpressionStatement(statement) && isIdentifier(statement.expression))
  );
}

function getContent(name: string, attrs: string, start: number, end: number, text: string): string {
  const openingTag = `<${name}${attrs !== '' ? ` ${attrs}` : ''}>`;
  const closingTag = `</${name}>`;

  return text.slice(start + openingTag.length, end - closingTag.length);
}

function getLocation(start: number, end: number, text: string): Location {
  return {
    start: getPosition(start, text),
    end: getPosition(end, text),
  };
}

function getPosition(offset: number, text: string): Position {
  const lines = text.slice(0, offset).split('\n');

  return {
    line: lines.length - 1,
    column: lines[lines.length - 1].length,
    offset,
  };
}
