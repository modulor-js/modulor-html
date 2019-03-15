import { bench } from '../index';
import { createRenderers } from '../renderers';
import { getRandomString } from '../helpers';


describe('update class benchmark', () => {

  describe('static', () => {
    const tpl = (scope, html) => html`
      <span class="foo bar baz"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn([], container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('dynamic no change', () => {
    const tpl = (scope, html) => html`
      <span class="${scope[0]} ${scope[1]}"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn(['test', 'bla'], container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('dynamic change', () => {
    const tpl = (scope, html) => html`
      <span class="${scope[0]} ${scope[1]}"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn([getRandomString(), getRandomString()], container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('mixed no change', () => {
    const tpl = (scope, html) => html`
      <span class="${scope[0]} ${scope[1]} foo bar baz"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn(['test', 'bla'], container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('mixed change', () => {
    const tpl = (scope, html) => html`
      <span class="${scope[0]} ${scope[1]} foo bar baz"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn([getRandomString(), getRandomString()], container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('with delete', () => {
    const tpl = (scope, html) => html`
      <span class="${scope[0]} ${scope[1]}"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench((i) => {
        fn([i % 2 ? getRandomString() : void 0, i % 2 ? void 0 : getRandomString()], container);
      });
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

});

