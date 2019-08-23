import { bench } from '../index';
import { createRenderers } from '../renderers';
import { getRandomString } from '../helpers';

describe('update text node benchmark', () => {

  describe('static', () => {
    const tpl = (scope, html) => html`
      <span>foo</span>
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
      <span>${scope}</span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn('text', container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('dynamic change', () => {
    const tpl = (scope, html) => html`
      <span>${scope}</span>
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
      <span>${scope} foo</span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn('text', container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('mixed change', () => {
    const tpl = (scope, html) => html`
      <span>${scope} foo</span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn(getRandomString(), container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('conditional', () => {
    const tpl = (scope, html) => html`
      ${scope ? html`
        <span>${scope}</span>
      ` : void 0}
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench((i) => {
        fn(i % 2 ? getRandomString() : void 0, container);
      });
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

});

