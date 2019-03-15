import { bench } from '../index';
import { createRenderers } from '../renderers';
import { getRandomString } from '../helpers';

describe('update attributes benchmark', () => {

  describe('static', () => {
    const tpl = (scope, html) => html`
      <span attr="foo"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn({}, container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('dynamic no change', () => {
    const tpl = (scope, html) => html`
      <span attr="${scope}"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn('test', container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('dynamic change', () => {
    const tpl = (scope, html) => html`
      <span attr="${scope}"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn(getRandomString(), container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('mixed no change', () => {
    const tpl = (scope, html) => html`
      <span attr="${scope} foo"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn('test', container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('mixed change', () => {
    const tpl = (scope, html) => html`
      <span attr="${scope} foo"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn(getRandomString(), container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('several attrs, mixed, change', () => {
    const tpl = (scope, html) => html`
      <span attr="${scope}" bar="foo" bla="${scope} foo"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn(getRandomString(), container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

});

