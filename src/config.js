import { regExpEscape } from './helpers';


export const config = {};

configure({
  document: global.document,
  parser: global.DOMParser ? new global.DOMParser() : null,
  parse: (markup) => config.parser.parseFromString(markup, "text/html").body,
  prefix: `{modulor_html_chunk_${+new Date()}:`,
  postfix: '}',
  specialTagName: `modulor-dynamic-tag-${+new Date()}`,
  specialAttributeName: `modulor-chunk-${+new Date()}`,
  dataAttributeName: `modulor-data-attributes-${+new Date()}`,
  preventChildRenderingProp: 'preventChildRendering',
  preventAttributeSet: 'preventAttributeSet',
});

function getTokenRegExp(groupMatches){
  const indexRegex = `${groupMatches ? '(' : ''}\\d+${groupMatches ? ')' : ''}`;
  return `(${regExpEscape(config.prefix)}${indexRegex}${regExpEscape(config.postfix)})`;
};

export function configure(values){
  Object.assign(config, values);
  if(values.prefix || values.postfix){
    config.findChunksRegex = new RegExp(getTokenRegExp(), 'i');
    config.replaceChunkRegex = new RegExp(getTokenRegExp(true), 'ig');
    config.matchChunkRegex = new RegExp(`^${getTokenRegExp(true)}$`);
  }
};

export const matchModulorChunks = (value) => config.matchChunkRegex.exec(value);
export const hasModulorChunks = (value) => config.findChunksRegex.test(value);
export const buildChunk = (chunkNumber) => `${config.prefix}${chunkNumber}${config.postfix}`;

export const parseHTML = (markup) => config.parse(markup);
export const getDocument = () => config.document;

export function createElement(tagName){
  getDocument().createElement(tagName);
};
