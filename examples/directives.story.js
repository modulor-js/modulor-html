import { storiesOf } from 'modulor-storybook';
const { withConsole } = require('modulor-storybook/addons/console');

import * as MHTML from '../';
import * as directives from '../directives';

const { html, render } = MHTML;
const { until, unsafeHtml } = directives;


storiesOf('Directives')
  .add('until', () => (container) => {

    const tpl = ({ value }) => html`
      <div>${until(value, 'resolving promise')}</div>
    `;

    render(tpl({
      value: new Promise((resolve) => setTimeout(() => resolve('resolved'), 2000))
    }), container);

  })
  .add('unsafeHtml', () => (container) => {

    const tpl = ({ value }) => html`
      <div>${unsafeHtml(value)}</div>
    `;

    render(tpl({
      value: 'hello <b>world</b>'
    }), container);

  })
