## Overview

`modulor-html` provides a way to efficiently (re)render templates to DOM.

It is highly influenced by [`lit-html`](https://github.com/Polymer/lit-html) and designed to be compatible with it.

The main exports are:

  - `html`: creates template function (wire)

  - `render`: renders template into DOM container

### Basic example ([demo](https://codepen.io/nogizhopaboroda/pen/ejJvje))

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

const tpl = (myVar) => html`
  <span>Hello ${myVar}</span>
`;

render(tpl('world'), container);

//or alternative way
tpl('world')(container);
```


### Update ([demo](https://codepen.io/nogizhopaboroda/pen/ajdwEm))

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

const tpl = (date) => html`
  <span>Time: ${date.toLocaleTimeString()}</span>
`;

setInterval(() => {
  render(tpl(new Date()), container);
}, 1000);
```


## Features / accepted chunk types

### Arrays ([demo](https://codepen.io/nogizhopaboroda/pen/ajdJjK))

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

const tpl = (names) => html`
  <span>Hello:</span>
  <ul>
    ${names.map((name) => html`
      <li>${name}</li>
    `)}
  </ul>
`;

render(tpl(['Steven', 'John']), container);
```

### Promises ([demo 1](https://codepen.io/nogizhopaboroda/pen/rrxjEW), [demo 2](https://codepen.io/nogizhopaboroda/pen/ZjQeqa))

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

const tpl = (myVar) => html`
  <span>Hello ${myVar}</span>
`;

render(tpl(Promise.resolve('world')), container);
```

### HTML elements ([demo](https://codepen.io/nogizhopaboroda/pen/wxMJra))

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

const tpl = ($el) => html`
  <div class="wrapper">${$el}</div>
`;

const $element = document.createElement('span');
$element.classList.add('my-class');
$element.innerText = 'i am element';

render(tpl($element), container);
```

### Functions ([demo](https://codepen.io/nogizhopaboroda/pen/ejJWEQ))

Values as functions can be used to get low-level access to rendering process. It most cases you won't need it.

Such functions are called with only one argument `container`, which has standart `Node` api such as `.appendChild()` and so on.

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

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
```


## Attributes

### Basic example ([demo](https://codepen.io/nogizhopaboroda/pen/ejJvYB))

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

const tpl = ({ checked, dynamicAttr }) => html`
  <input type="checkbox" checked="${checked}" ${dynamicAttr} />
`;

render(tpl({
  checked: true,
  dynamicAttr: 'disabled'
}), container);
```

If target element has a `property` of attribute name, then value will be set as that property. This makes possible to pass values other than primitive ones

### Promise values ([demo](https://codepen.io/nogizhopaboroda/pen/WKrXeK))

Values can be promises. In such case attribute value will be set once promise is resolved

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

const tpl = ({ checked }) => html`
  <input type="checkbox" checked=${checked} />
`;

render(tpl({
  checked: new Promise((resolve) => setTimeout(() => resolve(true), 2000))
}), container);
```

### Styles as object

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

const tpl = ({ style }) => html`
  <div style=${style}>
    hello world
  </div>
`;

render(tpl({
  style: {
    border: '1px solid #ddd',
    borderRadius: '3px',
  }
}), container);
```

### Key as function ([demo 1](https://codepen.io/nogizhopaboroda/pen/pZgePN), [demo 2](https://codepen.io/nogizhopaboroda/pen/XBXMbR))

If attribute key is a function, it will be called with parameters `target, attributeValue`. E.g.:

```js
html`
  <input ${(target, value) => {
    //target === <input element>
    //value === 'test'
  }}="test">
`
```

Following example shows such case:

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

const on = (eventName) => ($el, callback) => {
  $el.addEventListener(eventName, callback);
};

const handler = (event) => console.log(event.target);

const tpl = (handler) => html`
  <span ${on("click")}="${handler}">click me</span>
`;

render(tpl(handler), container);
```

## Directives

### `until(promise, placeholderContent)` ([demo](https://codepen.io/nogizhopaboroda/pen/djGZYN))

Renders `placeholderContent` until `promise` resolves

### `unsafeHtml(content)`

Renders `content` as html


## Custom Elements ([demo](https://codepen.io/nogizhopaboroda/pen/wxMJLz))

`modulor-html` works perfect with native custom elements and their existing polyfills.

tested with https://github.com/webcomponents/webcomponentsjs and https://github.com/WebReflection/document-register-element

```js
import { html, render } from '@modulor-js/html';
const container = document.querySelector('#container');

customElements.define('my-component', class extends HTMLElement {
  constructor(){
    super();
    console.log('constructor');
  }
  connectedCallback(){
    console.log('connected');
  }
  set prop(val){
    console.log(`prop set to: ${val}`);
  }
  static get observedAttributes() {
    return ['attr'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`attribute ${name} set to: ${newValue}`);
  }
});

const tpl = (scope) => html`
  <my-component prop="${scope.prop}" attr="${scope.attr}"></my-conponent>
`;

render(tpl({ prop: 'foo', attr: 'bar' }), container);

//"constructor"
//"prop set to: foo"
//"attribute attr set to: bar"
//"connected"

```


## Good to know

  - **templates must have valid html markup**

  - attribute value can be set without quotes (`<input type="${type}" />` == `<input type=${type} />`)

  - self-closing tags (except for ones from [this list](http://xahlee.info/js/html5_non-closing_tag.html)) are not supported yet

  - IE shuffles attributes in a strange manner so execution order might be unexpected (this is important to know when using `CustomElements`)

  - calling `render` without second attribute generates `DocumentFragment` out of template
