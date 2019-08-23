import { html, render, r, Template } from '../src/html';
import {html as hyperHtml, render as hyperRender} from 'lighterhtml';
import {html as litHtml, render as litRender} from 'lit-html';

export const rendererFactories = {
  modulor: (tpl) => (scope, container) => render(tpl(scope, html), container),
  hyper: (tpl) => (scope, container) => hyperRender(container, () => tpl(scope, hyperHtml)),
  lit: (tpl) => (scope, container) => litRender(tpl(scope, litHtml), container),
};

export const createRenderers = (tpl, include = ['modulor', 'hyper', 'lit']) => Object.keys(rendererFactories).reduce((acc, name) => {
  return acc.concat(!~include.indexOf(name) ? [] : {
    name: name,
    fn: rendererFactories[name](tpl)
  });
}, []);
