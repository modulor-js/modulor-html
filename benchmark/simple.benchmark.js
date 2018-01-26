import { bench } from '../benchmark';
import { createRenderers } from '../benchmark/renderers';

describe('benchmark', () => {

  const getContainer = () => document.createElement('div');

  describe('render to document fragment', () => {
    const tpl = (scope, html) => html`
      <span></span>
    `;

    const renderers = createRenderers(tpl);

    renderers.forEach(({ name, fn }) => {
      const result = bench(() => fn({a: 1}, document.createDocumentFragment()));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('render to container', () => {
    const tpl = (scope, html) => html`
      <span></span>
    `;

    const renderers = createRenderers(tpl);

    renderers.forEach(({ name, fn }) => {
      const result = bench(() => fn({}, getContainer()));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('render to fragment with argument', () => {
    const tpl = (scope, html) => html`
      <span attr="${scope}"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const result = bench(() => fn('test', document.createDocumentFragment()));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('render to container with argument', () => {
    const tpl = (scope, html) => html`
      <span attr="${scope}"></span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const result = bench(() => fn('test', getContainer()));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });
});

