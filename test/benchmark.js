import { bench } from '../benchmark';

import { html, render, r, Template } from '../src/html';
import hyperHTML from 'hyperhtml';
import {html as litHtml, render as litRender} from 'lit-html';

describe('benchmark', () => {

  const getContainer = () => document.createElement('div');

  const setupDataHyper = [{
    name: 'toFragmentHyper',
    fn: (scope) => hyperHTML(document.createDocumentFragment())`
      <div></div>
    `
  }, {
    name: 'toContainerHyper',
    fn: (scope) => hyperHTML(getContainer())`
      <div></div>
    `
  }];

  const setupDataLitHtml = [{
    name: 'toFragmentLit',
    fn: (scope) => litRender(litHtml`
      <div></div>
    `, document.createDocumentFragment())
  }, {
    name: 'toContainerLit',
    fn: (scope) => litRender(litHtml`
      <div></div>
    `, getContainer())
  }];

  const setupData = [{
    name: 'toFragment',
    fn: (scope) => r`
      <div></div>
    `
  }, {
    name: 'toFragmentSetArg',
    fn: (scope) => r`
      <div attr=${scope}></div>
    `
  }, {
    name: 'toContainer',
    fn: (scope) => render(html`
      <div></div>
    `, getContainer())
  }, {
    name: 'toContainerSetArg',
    fn: (scope) => render(html`
      <div attr=${scope}></div>
    `, getContainer())
  }];

  describe('modulor-html', () => {
    setupData.forEach(item => {
      const result = bench(item.fn);
      it(`${item.name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('hyper-html', () => {
    setupDataHyper.forEach(item => {
      const result = bench(item.fn);
      it(`${item.name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('lit-html', () => {
    setupDataLitHtml.forEach(item => {
      const result = bench(item.fn);
      it(`${item.name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

});

