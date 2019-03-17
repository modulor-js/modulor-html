import jsdom from 'jsdom';
import { configure } from '@modulor-js/html';


const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html>
  <div id="container"></div>
`);

configure({
  document: dom.window.document,
  Node: dom.window.Node,
  parser: new dom.window.DOMParser(),
});


global.document = dom.window.document;
global.DocumentFragment = dom.window.DocumentFragment;

