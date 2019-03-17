import { JSDOM } from 'jsdom';
import installCE from 'web-components-polyfill';
import { configure } from '@modulor-js/html';


const { window } = new JSDOM();
const { document, DocumentFragment, HTMLElement, Element, Node, DOMParser } = window;

const windowContainer = {
  window, document,
  DocumentFragment, HTMLElement, Element, Node, DOMParser,
  Object, Promise, Math,
};

installCE(windowContainer, 'force');

configure({
  document: windowContainer.document,
  Node: windowContainer.Node,
  parser: new windowContainer.DOMParser(),
});


['document', 'DocumentFragment', 'HTMLElement', 'customElements'].forEach((key) => {
  global[key] = windowContainer[key];
});

