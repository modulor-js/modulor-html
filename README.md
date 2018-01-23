# modulor-html
Template engine + dom diffing based on tagged template literals

## Basic examples

### Render into container

```js
import { html, render } from 'modulor-html';

const tpl = html`
  <span>hello ${myVar}</span>
`;

const $container = document.createElement('div'); //or any other container, e.g. document.querySelector('<my-selector>')

render(tpl, $container);

//or alternative way
tpl.render($container);

//or generate document fragment out of template
const $fragment = render(tpl);
```


### Generate document fragment

```js
import { r } from 'modulor-html';

const myVar = 'world';

const $fragment = r`
  <span>hello ${myVar}</span>
`;

```

## Features

### Simple text value

```js
const template = (scope) => html`
  <span>hi ${scope.val}</span>
`;

const $container = document.createElement('div');
render(template({ val: 'foo' }), $container);

console.log($container.querySelector('span').innerHTML); //=> 'hi foo'
```

### Attributes

```js
const template = (scope) => html`
  <input foo="${bar}" checked="${checked}" ${dynamicAttr}/>
`;

const $container = document.createElement('div');
render(template({ foo: 'bar', checked: true, dynamicAttr: 'disabled' }), $container);

console.log($container.querySelector('input').getAttribute('foo')); //=> 'bar'
console.log($container.querySelector('input').checked); //=> true
console.log($container.querySelector('input').disabled); //=> true
```

### HTML elements

```js
const template = (scope) => html`
  <span>${scope.$element}</span>
`;

const $container = document.createElement('div');

const $element = document.createElement('i');

render(template({ $element }), $container);

console.log($container.querySelector('span').firstChild); //=> $element
```

### Promises

```js
const template = (scope) => html`
  <span>${scope.promiseValue}</span>
`;

const $container = document.createElement('div');

render(template({ promiseValue: Promise.resolve('promise result') }), $container);

console.log($container.querySelector('span').innerHTML); //=> 'promise result'
```

more complex example:

```js
const template = (scope) => html`
  ${scope.promiseArray.then(arr => arr.map(val => html`
    <span>${val}</span>
  `))}
`;

const $container = document.createElement('div');

render(template({ promiseArray: Promise.resolve(['one', 'two']) }), $container);

//await promise
setTimeout(() => {
  console.log($container.querySelectorAll('span').length); //=> 2
  console.log($container.querySelector('span:nth-child(1)').innerHTML); //=> 'one'
  //and so on
}, 1);

```

### Even variables in comments

```js
const template = (scope) => html`
  <!-- ${scope.commentValue} -->
`;

const $container = document.createElement('div');

render(template({ commentValue: 'comment' }), $container);

console.log($container.innerHTML);
/* =>
  <!-- comment -->
*/
```

## Custom Elements

modulor-html works perfect with native custom elements and their existing polyfills.

tested with https://github.com/webcomponents/webcomponentsjs and https://github.com/WebReflection/document-register-element

```js
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

const template = (scope) => html`
  <my-component prop="${scope.prop}" attr="${scope.attr}"></my-conponent>
`;

render(template({ prop: 'foo', attr: 'bar' }), document.body);

//logs:
//created
//attribute attr set to: bar
//prop set to: 'foo'
//connected
```

and more examples in tests
