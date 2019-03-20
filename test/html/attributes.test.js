import {
  html, render, configure,
} from '../../src/html';
import { copyAttributes } from '../../src/morph';

import { processNode } from '../../src/parser';

configure({
  prefix: '{modulor_html_chunk:',
  postfix: '}',
  dataAttributeName: 'attrs-data',
});

describe('copy attributes', () => {

  const spyNoValue = jest.fn();
  const spyWithValue = jest.fn();
  const spyWithDynamicValue = jest.fn();

  const element = document.createElement('div');
  element.innerHTML = `
    <input attrs-data='${JSON.stringify([
        {
          "name": "type",
          "value": "checkbox"
        },
        {
          "name": "id",
          "value": "some-id"
        },
        {
          "name": "foo",
          "value": "{modulor_html_chunk:0}"
        },
        {
          "name": "{modulor_html_chunk:1}",
          "value": "ok"
        },
        {
          "name": "{modulor_html_chunk:2}"
        },
        {
          "name": "{modulor_html_chunk:3}",
          "value": "{modulor_html_chunk:4}"
        },
        {
          "name": "autofocus",
          "value": "{modulor_html_chunk:5}"
        },
        {
          "name": "test-data",
          "value": "{modulor_html_chunk:6}"
        },
        {
          "name": "{modulor_html_chunk:7}"
        },
        {
          "name": "{modulor_html_chunk:8}",
          "value": "bla"
        },
        {
          "name": "{modulor_html_chunk:9}",
          "value": "{modulor_html_chunk:10}"
        },
        {
          "name": "baz",
          "value": "{modulor_html_chunk:11}"
        },
        {
          "name": "attr-{modulor_html_chunk:12}",
          "value": "test"
        }
    ])}'/>
  `;

  const source = processNode(element.querySelector('input'));

  const target = document.createElement('input');
  target['test-data'] = {};

  const data = [
    'foo value',
    'some-attribute',
    'checked',
    'value',
    'some value',
    true,
    { a: { b: 12 } },
    ($target, value) => spyNoValue($target, value),
    ($target, value) => spyWithValue($target, value),
    ($target, value) => spyWithDynamicValue($target, value),
    { c: 123 },
    Promise.resolve('promise result'),
    'test',
  ];

  const updates = copyAttributes(target, source);
  updates.forEach(u => u(data, []));

  it('doesnt loose static attributes', () => {
    expect(target.getAttribute('type')).toBe('checkbox');
    expect(target.type).toBe('checkbox');

    expect(target.getAttribute('id')).toBe('some-id');
    expect(target.id).toBe('some-id');
  });

  it('copies simple attribute value correctly', () => {
    expect(target.getAttribute('foo')).toBe(data[0]);
    expect(target.foo).toBeUndefined();
  });

  it('handles dynamic attribute name correctly', () => {
    expect(target.getAttribute(data[1])).toBe('ok');
    expect(target[data[1]]).toBeUndefined();
  });

  it('handles dynamic attribute name and dynamic value correctly', () => {
    expect(target.value).toBe(data[4]);
    expect(target.getAttribute(`attr-${data[12]}`)).toBe('test');
  });

  it('handles attributes where value is not required', () => {
    expect(target.getAttribute('checked')).toBe('true');
    expect(target.checked).toBe(true);
  });

  it('handles attributes as functions', () => {
    expect(spyNoValue).toHaveBeenCalledWith(target, true);
    expect(spyWithValue).toHaveBeenCalledWith(target, 'bla');
    expect(spyWithDynamicValue).toHaveBeenCalledWith(target, data[10]);
  });

  it('handles promises in attributes', async () => {
    await new Promise(resolve => setTimeout(resolve, 1));
    expect(target.getAttribute('baz')).toBe('promise result');
  });

  it('copies properties correctly', () => {
    expect(target.autofocus).toBe(data[5]);

    expect(target['test-data']).toEqual(data[6]);
    expect(target.hasAttribute('test-data')).toBe(false);
  });

  it('updates attributes correctly', () => {

    const newData = [
      'foo value',
      '',
      '',
      'value',
      'some value',
      true,
      { a: { b: 12 } },
      ($target, value) => spyNoValue($target, value),
      ($target, value) => spyWithValue($target, value),
      ($target, value) => spyWithDynamicValue($target, value),
      { c: 123 },
      Promise.resolve('promise result'),
      'quux',
    ];

    updates.forEach(u => u(newData, data));

    expect(target.getAttribute('checked')).toBe(null);
    expect(target.checked).toBe(false);

    expect(target.getAttribute('some-attribute')).toBe(null);

    expect(target.getAttribute(`attr-${data[12]}`)).toBe(null);
    expect(target.getAttribute(`attr-${newData[12]}`)).toBe('test');
  });

  it('copies style attribute correctly', () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <input attrs-data='${JSON.stringify([
        { name: "style", value: "display: {modulor_html_chunk:0};" }
      ])}'/>
    `;

    const source = processNode(element.querySelector('input'));

    const target = document.createElement('input');

    const spy = jest.spyOn(target, 'setAttribute');

    const data = [
      'block',
    ];

    const updates = copyAttributes(target, source);
    updates.forEach(u => u(data, []));

    expect(target.getAttribute('style')).toBe('display: block;');
    expect(spy).toHaveBeenCalledWith('style', 'display: block;');
  });

  it('copies style attribute as object correctly', () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <input attrs-data='${JSON.stringify([
        { name: "style", value: "{modulor_html_chunk:0}" }
      ])}'/>
    `;

    const source = processNode(element.querySelector('input'));

    const target = document.createElement('input');

    const data = [
      {
        display: 'block',
        marginRight: '0'
      },
    ];

    const updates = copyAttributes(target, source);
    updates.forEach(u => u(data, []));

    expect(target.getAttribute('style')).toBe('display: block; margin-right: 0px;');
  });
});

describe('classes', () => {
  it('basic', () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`
      <div class="foo ${scope.a} ${scope.b}-bar baz-${scope.c}" ref="inner"></div>
    `;

    const data1 = { a: 1, b: 2, c: 3, d: 4 };
    const snapshot1 = `<div class="foo ${data1.a} ${data1.b}-bar baz-${data1.c}" ref="inner"></div>
    `;

    render(tpl(data1), container);
    expect(container.innerHTML).toBe(snapshot1);

    const data2 = { a: 3, b: 5, c: 7, d: 9 };
    const snapshot2 = `<div class="foo ${data2.a} ${data2.b}-bar baz-${data2.c}" ref="inner"></div>
    `;

    render(tpl(data2), container);
    expect(container.innerHTML).toBe(snapshot2);

    container.querySelector('[ref="inner"]').classList.add('manually-added');
    const data3 = { a: 8, b: 3, c: 9, d: 2 };
    const snapshot3 = `<div class="foo manually-added ${data3.a} ${data3.b}-bar baz-${data3.c}" ref="inner"></div>
    `;

    render(tpl(data3), container);
    expect(container.innerHTML).toBe(snapshot3);
  });

  it('in loop', () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`
      ${scope.a.map((item, index) => html`
        <div class="foo foo-${index} bar-${item}"></div>
      `)}
    `;

    const data1 = { a: [1, 2, 3] };
    const snapshot1 = `<div class="foo foo-0 bar-1"></div>
      <div class="foo foo-1 bar-2"></div>
      <div class="foo foo-2 bar-3"></div>
      
    `;

    render(tpl(data1), container);
    expect(container.innerHTML).toBe(snapshot1);

    const data2 = { a: [5, false, 3] };
    const snapshot2 = `<div class="foo foo-0 bar-5"></div>
      <div class="foo foo-1 bar-false"></div>
      <div class="foo foo-2 bar-3"></div>
      
    `;

    render(tpl(data2), container);
    expect(container.innerHTML).toBe(snapshot2);
  });

  it('multiple classes in string', () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`
      <div class="foo ${scope}"></div>
    `;

    const data1 = 'class-a class-b';
    const snapshot1 = `<div class="foo ${data1}"></div>
    `;

    render(tpl(data1), container);
    expect(container.innerHTML).toBe(snapshot1);

    const data2 = 'class-d class-c';
    const snapshot2 = `<div class="foo ${data2}"></div>
    `;

    render(tpl(data2), container);
    expect(container.innerHTML).toBe(snapshot2);

    const data3 = 'class-e';
    const snapshot3 = `<div class="foo ${data3}"></div>
    `;

    render(tpl(data3), container);
    expect(container.innerHTML).toBe(snapshot3);
  });

  it('arrays', () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`
      <div class="foo ${scope}"></div>
    `;

    const data1 = ['class-a', 'class-b'];
    const snapshot1 = `<div class="foo ${data1.join(' ')}"></div>
    `;

    render(tpl(data1), container);
    expect(container.innerHTML).toBe(snapshot1);

    const data2 = ['class-d', 'class-c'];
    const snapshot2 = `<div class="foo ${data2.join(' ')}"></div>
    `;

    render(tpl(data2), container);
    expect(container.innerHTML).toBe(snapshot2);

    const data3 = ['class-e'];
    const snapshot3 = `<div class="foo ${data3.join(' ')}"></div>
    `;

    render(tpl(data3), container);
    expect(container.innerHTML).toBe(snapshot3);
  });

  it('promises', async () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`
      <div class="foo ${scope}"></div>
    `;

    const data1 = Promise.resolve('class-a');
    const snapshot1 = `<div class="foo class-a"></div>
    `;

    render(tpl(data1), container);

    await new Promise(resolve => setTimeout(resolve, 1));

    expect(container.innerHTML).toBe(snapshot1);

    const data2 = Promise.resolve('class-c');
    const snapshot2 = `<div class="foo class-c"></div>
    `;

    render(tpl(data2), container);

    await new Promise(resolve => setTimeout(resolve, 1));

    expect(container.innerHTML).toBe(snapshot2);

    const data3 = Promise.resolve('');
    const snapshot3 = `<div class="foo"></div>
    `;

    render(tpl(data3), container);

    await new Promise(resolve => setTimeout(resolve, 1));

    expect(container.innerHTML).toBe(snapshot3);
  });

});

it('updates attributes correctly', () => {
  const container = document.createElement('div');

  const tpl = (scope) => html`
    <div ref="inner" foo="${scope.a}" bla-${scope.b}-${scope.c}="ok-${scope.d}"></div>
  `;

  const snapshot = (scope, extra = '') => `<div ref="inner" foo="${scope.a}"${extra} bla-${scope.b}-${scope.c}="ok-${scope.d}"></div>
  `;

  const data1 = { a: 1, b: 2, c: 3, d: 4 };
  render(tpl(data1), container);
  expect(container.innerHTML).toBe(snapshot(data1));

  container.querySelector('[ref="inner"]').setAttribute('extra', 'bla');
  const data2 = { a: 10, b: 20, c: 30, d: 40 };
  render(tpl(data2), container);
  expect(container.innerHTML).toBe(snapshot(data2, ' extra="bla"'));
});


describe('boolean attrs and value', () => {
  it('updates value correctly', () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`<input value=${scope} />`;

    render(tpl('test'), container);
    expect(container.firstChild.value).toBe('test');

    render(tpl(''), container);
    expect(container.firstChild.value).toBe('');

    render(tpl('ok'), container);
    expect(container.firstChild.value).toBe('ok');

    render(tpl(null), container);
    expect(container.firstChild.value).toBe('');

    render(tpl(false), container);
    expect(container.firstChild.value).toBe('false');
  });


  it('updates boolean attrs correctly', () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`
      <input type="checkbox" ${scope.disabled} checked=${scope.checked} autofocus />
    `;

    render(tpl({ disabled: 'disabled', checked: true }), container);
    expect(container.querySelector('input').disabled).toBe(true);
    expect(container.querySelector('input').checked).toBe(true);
    expect(container.querySelector('input').autofocus).toBe(true);

    render(tpl({ checked: false }), container);
    expect(container.querySelector('input').disabled).toBe(false);
    expect(container.querySelector('input').checked).toBe(false);
    expect(container.querySelector('input').autofocus).toBe(true);

    render(tpl({ checked: 'true' }), container);
    expect(container.querySelector('input').checked).toBe(true);
  });
});

describe('name as object', () => {
  it('basic', () => {
    const container = document.createElement('div');

    const tpl = (attrs) => html`
      <input ${attrs} />
    `;

    render(tpl({ disabled: true, checked: true, test: 'ok' }), container);
    expect(container.querySelector('input').disabled).toBe(true);
    expect(container.querySelector('input').checked).toBe(true);
    expect(container.querySelector('input').getAttribute('test')).toBe('ok');

    render(tpl({ checked: false }), container);
    expect(container.querySelector('input').disabled).toBe(false);
    expect(container.querySelector('input').checked).toBe(false);
    expect(container.querySelector('input').getAttribute('test')).toBe(null);

    render(tpl({ checked: 'true' }), container);
    expect(container.querySelector('input').checked).toBe(true);
  });

  it('multiple objects', () => {
    const container = document.createElement('div');

    const tpl = (attrs1, attrs2) => html`
      <input ${attrs1} ${attrs2} />
    `;

    render(tpl({ foo: 'bar' }, { baz: 'bla' }), container);
    expect(container.querySelector('input').getAttribute('foo')).toBe('bar');
    expect(container.querySelector('input').getAttribute('baz')).toBe('bla');

    render(tpl({ bar: 'foo' }, { baz: 'bla' }), container);
    expect(container.querySelector('input').getAttribute('foo')).toBe(null);
    expect(container.querySelector('input').getAttribute('bar')).toBe('foo');
    expect(container.querySelector('input').getAttribute('baz')).toBe('bla');

    render(tpl({ bar: 'foo', test: 'ok' }, { bar: 'bla' }), container);
    expect(container.querySelector('input').getAttribute('foo')).toBe(null);
    expect(container.querySelector('input').getAttribute('bar')).toBe('bla');
    expect(container.querySelector('input').getAttribute('test')).toBe('ok');
    expect(container.querySelector('input').getAttribute('baz')).toBe(null);

    render(tpl({ bar: 'foo' }), container);
    expect(container.querySelector('input').getAttribute('foo')).toBe(null);
    expect(container.querySelector('input').getAttribute('bar')).toBe('foo');
    expect(container.querySelector('input').getAttribute('test')).toBe(null);
    expect(container.querySelector('input').getAttribute('baz')).toBe(null);
  });

  it('with static attributes', () => {
    const container = document.createElement('div');

    const tpl = (attrs, attrs2) => html`
      <input ${attrs} quux="foo" ${attrs2} />
    `;

    render(tpl({ foo: 'bar' }), container);
    expect(container.querySelector('input').getAttribute('foo')).toBe('bar');
    expect(container.querySelector('input').getAttribute('quux')).toBe('foo');

    render(tpl({ bla: 'bazz' }), container);
    expect(container.querySelector('input').getAttribute('bla')).toBe('bazz');
    expect(container.querySelector('input').getAttribute('foo')).toBe(null);
    expect(container.querySelector('input').getAttribute('quux')).toBe('foo');

    render(tpl({ quux: 'new' }), container);
    expect(container.querySelector('input').getAttribute('bla')).toBe(null);
    expect(container.querySelector('input').getAttribute('foo')).toBe(null);
    expect(container.querySelector('input').getAttribute('quux')).toBe('foo');

    render(tpl({ barr: 'ok' }), container);
    expect(container.querySelector('input').getAttribute('barr')).toBe('ok');
    expect(container.querySelector('input').getAttribute('bla')).toBe(null);
    expect(container.querySelector('input').getAttribute('foo')).toBe(null);
    expect(container.querySelector('input').getAttribute('quux')).toBe('foo');

    render(tpl({}, { quux: 'new' }), container);
    expect(container.querySelector('input').getAttribute('bla')).toBe(null);
    expect(container.querySelector('input').getAttribute('foo')).toBe(null);
    expect(container.querySelector('input').getAttribute('quux')).toBe('new');

    render(tpl({}, {}), container);
    expect(container.querySelector('input').getAttribute('bla')).toBe(null);
    expect(container.querySelector('input').getAttribute('foo')).toBe(null);
    expect(container.querySelector('input').getAttribute('quux')).toBe('foo');

    render(tpl({ test: 1 }, { test: 2 }), container);
    expect(container.querySelector('input').getAttribute('quux')).toBe('foo');
    expect(container.querySelector('input').getAttribute('test')).toBe('2');

  });
});

