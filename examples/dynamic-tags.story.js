import { storiesOf } from 'modulor-storybook';
const { withConsole } = require('modulor-storybook/addons/console');

import * as MHTML from '../';

const { html, render } = MHTML;


storiesOf('Dynamic tags')
  .add('basic', () => (container) => {
    const Component = () => html`<b>hi</b>`;

    render(html`<${Component}/>`, container);
  })
  .add('with props', () => (container) => {
    const Component = (props) => html`<b>hello ${props.name}</b>`;

    const name = 'world';

    render(html`<${Component} name=${name}/>`, container);
  })
  .add('with children', () => (container) => {
    const Component = (props) => html`
      <div>child content:</div>
      ${props.children}
    `;

    render(html`
      <${Component}>
        <span>hello</span>
      </${Component}>
    `, container);
  })
  .add('with events', () => (container) => {
    const Component = ({ name, updateName }) => html`
      <input value=${name} onkeyup=${({ target }) => updateName(target.value)}/>
      <div>hello ${name}</div>
    `;

    const updateName = (name) => {
      render(html`
        <${Component} name=${name} ${'updateName'}=${updateName} />
      `, container);
    }

    updateName('world');
  })
