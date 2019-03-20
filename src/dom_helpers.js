import { config } from './config';


export const isNode = (value) => value instanceof config.Node;

export const getDocument = () => config.document;

export const createElement = (tagName, namespaceURI) => {
  return !namespaceURI || namespaceURI === getDocument().body.namespaceURI
      ? getDocument().createElement(tagName)
      : getDocument().createElementNS(namespaceURI, tagName);
};

export const createTextNode = (content) => getDocument().createTextNode(content);
export const createComment = (content) => getDocument().createComment(content);
export const createDocumentFragment = () => getDocument().createDocumentFragment();
