import { bench } from '.';
import { createRenderers } from './renderers';
import { getRandomString } from './helpers';

describe('update benchmark', () => {

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

