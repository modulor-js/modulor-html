export const config = {
  parse: (markup) => (new DOMParser()).parseFromString(markup, "text/html").body,
  getDocument: () => document,
  //PREFIX: `{modulor_html_chunk_${+new Date()}:`,
  //POSTFIX: '}',
  //sanitizeNodePrefix: `modulor_sanitize_node_${+(new Date())}:`,
  //specialTagName: `modulor-dynamic-tag-${+new Date()}`,
  //specialAttributeName: `modulor-chunk-${+new Date()}`,
  //dynamicTagsRegex: getDynamicTagsRegex(),
  //findChunksRegex: new RegExp(getTokenRegExp(), 'ig'),
  //replaceChunkRegex: new RegExp(getTokenRegExp(true), 'ig'),
  //matchChunkRegex: new RegExp(`^${getTokenRegExp(true)}$`),
  //preventChildRenderingProp: 'preventChildRendering',
};

export function configure(extend){
  return Object.assign(config, extend);
}

export const getDocument = config.getDocument;

export function createTextNode(content){
  return getDocument().createTextNode(content);
};

export function createComment(content){
  return getDocument().createComment(content);
};

export function createDocumentFragment(){
  return getDocument().createDocumentFragment();
};

export function parse(markup){
  return config.parse(markup);
};

//export function getPrefix(){
  //return config.PREFIX;
//}
