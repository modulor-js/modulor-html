import { storiesOf } from 'modulor-storybook';
import * as MHTML from '../';

const { html, render } = MHTML;


storiesOf('Basic')
  .add('hello world', () => (container) => {

    const tpl = (myVar) => html`
      <span>Hello ${myVar}</span>
    `;

    render(tpl('world'), container);

  })
  .add('tick', () => (container) => {

    const tpl = (date) => html`
      <span>Time: ${date.toLocaleTimeString()}</span>
    `;

    setInterval(() => {
      render(tpl(new Date()), container);
    }, 1000);

  })
  .add('arrays', () => (container) => {

    const tpl = (names) => html`
      <span>Hello:</span>
      <ul>
        ${names.map((name) => html`
          <li>${name}</li>
        `)}
      </ul>
    `;

    render(tpl(['Steven', 'John']), container);

  })
  .add('promises', () => (container) => {

    const tpl = (myVar) => html`
      <span>Hello ${myVar}</span>
    `;

    render(tpl(Promise.resolve('world')), container);

  })
  .add('html elements', () => (container) => {

    const tpl = ($el) => html`
      <div class="wrapper">${$el}</div>
    `;

    const $element = document.createElement('span');
    $element.style.color = 'red';
    $element.innerText = 'i am element';

    render(tpl($element), container);

  })
  .add('functions', () => (container) => {

    const tpl = (fn) => html`
      <span>counter: ${fn}</span>
    `;

    const fn = (container) => {
      let i = 0;
      const $text = document.createTextNode(i);
      container.appendChild($text);
      setInterval(() => {
        $text.textContent = i++;
      }, 1000);
    }

    render(tpl(fn), container);

  })
