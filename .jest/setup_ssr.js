import jsdom from 'jsdom';
import installCE from 'web-components-polyfill';
import { configure } from '@modulor-js/html';


const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html>
  <div id="container"></div>
`);

installCE(Object.assign(dom.window, {
  'Object': global.Object,
  'Math': global.Math,
  'Promise': global.Promise,
}), 'force');

configure({
  document: dom.window.document,
  Node: dom.window.Node,
  parser: new dom.window.DOMParser(),
});


global.document = dom.window.document;
global.DocumentFragment = dom.window.DocumentFragment;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

