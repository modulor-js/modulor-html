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

and more examples in tests
