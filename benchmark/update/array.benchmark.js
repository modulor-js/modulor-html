import { bench } from '../index';
import { createRenderers } from '../renderers';
import { getRandomString, getRandomNumber } from '../helpers';

describe('update array benchmark', () => {

  describe('no change', () => {
    const tpl = (scope, html) => html`
      ${scope.map(item => html`
        <span>${item}</span>
      `)}
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn([1, 2, 3], container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('change', () => {
    const tpl = (scope, html) => html`
      ${scope.map(item => html`
        <span>${item}</span>
      `)}
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn([getRandomString(), getRandomString(), getRandomString()], container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('dynamic length, no change', () => {
    const tpl = (scope, html) => html`
      ${scope.map(item => html`
        <span>${item}</span>
      `)}
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench((i) => {
        fn([1, 2, 3].concat(i % 2 ? 4 : []), container)
      });
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });


  describe('dynamic length, change', () => {
    const tpl = (scope, html) => html`
      ${scope.map(item => html`
        <span>${item}</span>
      `)}
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench((i) => {
        fn([getRandomString(), getRandomString(), getRandomString()].concat(i % 2 ? getRandomString() : []), container);
      });
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

});

