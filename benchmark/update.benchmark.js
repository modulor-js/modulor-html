import { bench } from '../benchmark';
import { createRenderers } from '../benchmark/renderers';

describe('update benchmark', () => {

  describe('attribute update', () => {
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

  describe('text node update', () => {
    const tpl = (scope, html) => html`
      <span>${scope}</span>
    `;

    const renderers = createRenderers(tpl, ['modulor', 'lit']);

    renderers.forEach(({ name, fn }) => {
      const container = document.createElement('div');
      const result = bench(() => fn(Math.random().toString(36).substring(7), container));
      it(`${name}: ${result.hz} ops/sec`, () => expect(true).toBe(true));
    });
  });

  describe('array update', () => {
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
});

