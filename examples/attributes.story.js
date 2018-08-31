import { storiesOf } from 'modulor-storybook';
const { withConsole } = require('modulor-storybook/addons/console');

import * as MHTML from '../';

const { html, render } = MHTML;


storiesOf('Attributes')
  .add('basic', () => (container) => {

    const tpl = ({ checked, dynamicAttr }) => html`
      <input type="checkbox" checked="${checked}" ${dynamicAttr} />
    `;

    render(tpl({
      checked: true,
      dynamicAttr: 'disabled'
    }), container);

  })
  .add('promise', () => (container) => {

    const tpl = ({ checked }) => html`
      <div>
        waiting for promise to resolve: ${checked.then(() => 'resolved')}
      </div>
      <input type="checkbox" checked=${checked} />
    `;

    render(tpl({
      checked: new Promise((resolve) => setTimeout(() => resolve(true), 2000))
    }), container);

  })
  .add('value as function', () => (container) => {

    const tpl = ({ onChange }) => html`
      <div>check checkbox and look at console</div>
      <input type="checkbox" onchange=${onChange} />
    `;

    render(tpl({
      onChange: ({ target }) => console.log(`checked: ${event.target.checked}`)
    }), container);

  })
  .add('key as function', withConsole(() => (container) => {

    const fn = (target, value) => {
      console.log(`attr value is: ${value}`);
      console.log(`element value is: ${target.value}`);
    }

    const tpl = (fn) => html`
      <input value="look at console" ${fn}="test">
    `;

    render(tpl(fn), container);

  }))
  .add('styles as object', () => (container) => {

    const tpl = ({ style }) => html`
      <div style=${style}>
        hello world
      </div>
    `;

    render(tpl({
      style: {
        border: '1px solid #ddd',
        borderRadius: '3px',
        backgroundColor: '#eee',
        margin: '5px',
        padding: '5px',
        display: 'inline-block',
      }
    }), container);

  })
