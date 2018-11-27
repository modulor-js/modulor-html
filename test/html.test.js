import 'web-components-polyfill';

import { html, render, stopNode, Template, containersMap } from '@modulor-js/html';
import { r } from '@modulor-js/html/directives';


const template = (scope) => r`
  <div foo="${scope.foo}" bar="${scope.bar}${scope.foo}" class="foo ${scope.classes}">
    <span>${scope.text}</span>
    i am ${scope.text} ok ${scope.foo} !
    ${scope.element}
    ${scope.arr.map(item => html`
      <div id="test-${item}">
      </div>
    `)}
    ${scope.promiseArray.then(items => items.map(item => html`
      <span>${item}</span>
    `))}
    <!-- foo ${scope.text} -->
    <input type="text" value="${scope.foo}" ${scope.checked ? 'checked' : ''}/>
    <custom-comp value="${scope.complex}">
      <div>${scope.promiseVal}</div>
    </custom-comp>
    <script></script>
  </div>
`;


const snapshot = (scope) => `<div class="foo ${scope.classes}" foo="${scope.foo}" bar="${scope.bar}${scope.foo}">
    <span>${scope.text}</span>
    i am ${scope.text} ok ${scope.foo} !
    ${scope.element.outerHTML}
    ${scope.arr.map(item => `<div id="test-${item}">
      </div>
    `).join('')}
    <span>foo</span>
    <span>bar</span>
    
    <!-- foo ${scope.text} -->
    <input type="text">
    <custom-comp>
      <div>promise result</div>
    </custom-comp>
    <script></script>
  </div>
`;

const container = document.createElement('div');

customElements.define('custom-comp', class extends HTMLElement {
  constructor(){
    super();
    //console.log('constructor');
  }
  connectedCallback(){
    //console.log('connected');
  }
  set value(val){
    this._value = val;
  }
  get value(){
    return this._value;
  }
});


describe('basic',() => {
  it('matches snapshot', async () => {

    const scope = {
      foo: 'bar',
      bar: 12,
      text: 'text',
      classes: 'blah',
      checked: false,
      complex: { a: 'wow' },
      element: document.createElement('div'),
      arr: [1, 2],
      promiseVal: Promise.resolve('promise result'),
      promiseArray: Promise.resolve(['foo', 'bar']),
    };

    container.appendChild(template(scope));

    await new Promise(resolve => setTimeout(resolve, 1));

    document.body.appendChild(container);

    expect(container.querySelector('input').value).toEqual(scope.foo);
    expect(container.querySelector('input').checked).toEqual(scope.checked);
    expect(container.querySelector('custom-comp').value).toEqual(scope.complex);
    expect(container.innerHTML).toBe(snapshot(scope));
  });
});

describe('tables', () => {

  const template = (rows, cols = []) => html`
    <table>${rows.map(i => html`
      <tr>${cols.map(j => html`<td>number: ${i}</td>`)}</tr>
    `)}</table>
  `;

  //'`'
  const fixture = (rows, cols = []) => `<table>${rows.map(i => `<tr>${cols.map(j => `<td>number: ${i}</td>`).join('')}</tr>
    `).join('')}</table>
  `;
  //'`'

  const $container = document.createElement('div');

  it('renders correctly', () => {
    const value1 = [1, 2, 3];
    render(template(value1), $container);
    expect($container.innerHTML).toBe(fixture(value1));

    const value2 = [1, 2, 3, 6];
    render(template(value2), $container);
    expect($container.innerHTML).toBe(fixture(value2));

    const value3 = [[1, 2], [3,4]];
    render(template(value3[0], value3[1]), $container);
    expect($container.innerHTML).toBe(fixture(value3[0], value3[1]));

    const value4 = [1];
    render(template(value1), $container);
    expect($container.innerHTML).toBe(fixture(value1));
  });
});

describe('<style> tag', () => {
  const template = (color) => html`
    <style>
      .test-input { color: ${color}; }
    </style>
    <input class="test-input" />
  `;

  const fixture = (color) => `<style>
      .test-input { color: ${color}; }
    </style>
    <input class="test-input">
  `;

  const $container = document.createElement('div');

  it('renders correctly', () => {
    const value1 = 'red'
    const value2 = 'green'
    render(template(value1), $container);
    expect($container.innerHTML).toBe(fixture(value1));
    render(template(value2), $container);
    expect($container.innerHTML).toBe(fixture(value2));
  });
});

describe('transitions', () => {

  const tpl = html`
    for ${1} bar
    <div bar="bla">
      <span attr-one="1"></span>
    </div>
    <div bar="bla">
      <span attr-one="1"></span>
    </div>
    <div bar="bla">
      <span attr-one="1"></span>
    </div>
  `;

  const snapshot1 = `for 1 bar
    <div bar="bla">
      <span attr-one="1"></span>
    </div>
    <div bar="bla">
      <span attr-one="1"></span>
    </div>
    <div bar="bla">
      <span attr-one="1"></span>
    </div>
  `;

  const tpl2 = html`
    foo ${1} bar
    ${['foo', 'bar'].map((tt) => html`
      <div bar="${tt}">
      </div>
    `)}
    ${Promise.resolve('ok')}
  `;

  const snapshot2 = `foo 1 bar
    <div bar="foo">
      </div>
    <div bar="bar">
      </div>
    
    ok
  `;

  it('basic', async () => {
    const container = document.createElement('div');
    render(tpl, container);

    expect(container.innerHTML).toBe(snapshot1);

    render(tpl2, container);

    await new Promise(resolve => setTimeout(resolve, 1));

    expect(container.innerHTML).toBe(snapshot2);
  });

  it('basic update', () => {

    const tpl = (text) => html`${text}`;

    const container = document.createElement('div');

    render(tpl('foo'), container);
    expect(container.innerHTML).toBe('foo');

    render(tpl('bar'), container);
    expect(container.innerHTML).toBe('bar');

    render(tpl('foo'), container);
    expect(container.innerHTML).toBe('foo');
  });

  it('falsy values', async () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`
      ${scope.a}
      <span>${scope.b}</span>
      <div>${scope.c}</div>
    `;

    const snapshot1 = `0
      <span>false</span>
      <div></div>
    `;

    render(tpl({ a: 0, b: false }), container);
    expect(container.innerHTML).toBe(snapshot1);

    const snapshot2 = `1
      <span></span>
      <div>null</div>
    `;

    render(tpl({ a: 1, c: null }), container);
    expect(container.innerHTML).toBe(snapshot2);

    const snapshot3 = `
      <span>test</span>
      <div>0</div>
    `;

    render(tpl({ b: 'test', c: 0 }), container);
    expect(container.innerHTML).toBe(snapshot3);
  });


  it('elements', () => {

    const container = document.createElement('div');

    const element = document.createElement('div');
    element.id = 'my-element';

    const tpl = (scope) => html`
      <div>
        <span class="foo"></span>
        ${scope.element}
        <span class="bar"></span>
      </div>
    `;

    const snapshot1 = (scope) => `<div>
        <span class="foo"></span>
        ${scope.element.outerHTML}
        <span class="bar"></span>
      </div>
    `;

    render(tpl({ element }), container);

    expect(container.innerHTML).toBe(snapshot1({ element }));
    expect(container.contains(element)).toBe(true);
    expect(container.querySelector('#my-element')).toBe(element);

    render(tpl({ element }), container);

    expect(container.innerHTML).toBe(snapshot1({ element }));
    expect(container.contains(element)).toBe(true);
    expect(container.querySelector('#my-element')).toBe(element);
  });

  it('stopNode handling', () => {

    const container = document.createElement('div');

    const tpl = html`
      <div id="my-element" ${stopNode}>
        <span></span>
      </div>
    `;

    const snapshot1 = `<div id="my-element">
        <span></span>
      </div>
    `;

    render(tpl, container);

    expect(container.innerHTML).toBe(snapshot1);

    const $testElement = document.createElement('div');
    $testElement.setAttribute('foo', 'bar');
    container.querySelector('#my-element').appendChild($testElement);

    const snapshot2 = `<div id="my-element">
        <span></span>
      ${$testElement.outerHTML}</div>
    `;

    render(tpl, container);

    expect(container.innerHTML).toBe(snapshot2);
  });

  it('promise', async () => {

    const container = document.createElement('div');

    const tpl = (scope) => html`${scope}`;

    const promiseResult = Promise.resolve('async value');

    render(tpl('test'), container);
    expect(container.innerHTML).toBe('test');

    render(tpl(promiseResult), container);
   
    render(tpl('test2'), container);
    expect(container.innerHTML).toBe('test2');

    await promiseResult;

    expect(container.innerHTML).toBe('async value');
  });

});

describe('function', () => {

  it('only render', () => {

    const tpl = (scope) => html`${scope}`;

    const fn = jest.fn();

    render(tpl(fn));
    expect(fn).toHaveBeenCalled();
  });

  it('update', () => {

    const container = document.createElement('div');

    const tpl = (scope) => html`${scope}`;

    const functionSpy = jest.fn();
    const updateSpy = jest.fn();

    const getFns = () => {
      return (target, prevResult) => {
        functionSpy(prevResult);
        return 'test';
      }
    }

    render(tpl(getFns()), container);
    expect(functionSpy).toHaveBeenCalled();

    functionSpy.mockReset();
    updateSpy.mockReset();

    render(tpl(getFns()), container);
    expect(functionSpy).toHaveBeenCalledWith('test');
  });

});

describe('element', () => {

  it('replace element with element', () => {

    const container = document.createElement('div');

    const element1 = document.createElement('div');
    const element2 = document.createElement('div');

    const tpl = (scope) => html`${scope}`;

    render(tpl(element1), container);
    expect(container.contains(element1)).toBe(true);

    render(tpl(element2), container);
    expect(container.contains(element1)).toBe(false);
    expect(container.contains(element2)).toBe(true);
  });

  it('replace element with fragment', () => {

    const container = document.createElement('div');

    const element = document.createElement('div');
    const fragment = document.createDocumentFragment();

    const subElement1 = document.createElement('div');
    const subElement2 = document.createElement('div');

    fragment.appendChild(subElement1);
    fragment.appendChild(subElement2);

    const tpl = (scope) => html`${scope}`;

    render(tpl(element), container);
    expect(container.contains(element)).toBe(true);

    render(tpl(fragment), container);
    expect(container.contains(element)).toBe(false);
    expect(container.contains(subElement1)).toBe(true);
    expect(container.contains(subElement2)).toBe(true);
  });

  it('replace fragment with element', () => {

    const container = document.createElement('div');

    const fragment = document.createDocumentFragment();

    const subElement1 = document.createElement('div');
    const subElement2 = document.createElement('div');

    fragment.appendChild(subElement1);
    fragment.appendChild(subElement2);

    const element = document.createElement('div');

    const tpl = (scope) => html`${scope}`;

    render(tpl(fragment), container);
    expect(container.contains(subElement1)).toBe(true);
    expect(container.contains(subElement2)).toBe(true);

    render(tpl(element), container);
    expect(container.contains(element)).toBe(true);
    expect(container.contains(subElement1)).toBe(false);
    expect(container.contains(subElement2)).toBe(false);
  });

});

describe('ternary operator', () => {
  it('case 1', () => {
    const $container = document.createElement('div');

    const tpl = (scope) => html`
      ${scope ? html`
        <span></span>
      ` : html`
        <div class="foo1"></div>
        <div class="foo2"></div>
      `}`;

    const snapshot1 = `<div class="foo1"></div>
        <div class="foo2"></div>
      `;

    const snapshot2 = `<span></span>
      `;

    tpl(false)($container);
    expect($container.innerHTML).toBe(snapshot1);
    tpl(true)($container);
    expect($container.innerHTML).toBe(snapshot2);
    tpl(false)($container);
    expect($container.innerHTML).toBe(snapshot1);
    tpl(true)($container);
    expect($container.innerHTML).toBe(snapshot2);
  });

  it('case 2', () => {
    const $container = document.createElement('div');

    const tpl = (show) => html`${show ? html`<span>ok</span>`: ''}`;
    const snapshot = '<span>ok</span>';

    render(tpl(true), $container);
    expect($container.innerHTML).toBe(snapshot);
    render(tpl(false), $container);
    expect($container.innerHTML).toBe('');
    render(tpl(true), $container);
    expect($container.innerHTML).toBe(snapshot);
  });

  it('case 3', () => {
    const $container = document.createElement('div');

    const tpl = (scope) => html`
      ${scope.a ? html`
        ${scope.b ? html`
          foo
        ` : void 0}
        ${scope.c ? html`
          bar
        ` : void 0}
        baz
      ` : void 0}
    `;

    render(tpl({ a: 1, b: 1 }), $container);
    expect($container.innerHTML).toBe(`foo
        
        
        baz
      
    `);

    render(tpl({ a: 1, c: 1 }), $container);
    expect($container.innerHTML).toBe(`
        bar
        
        baz
      
    `);

    render(tpl({ a: 1 }), $container);
    expect($container.innerHTML).toBe(`
        
        baz
      
    `);

    render(tpl({ a: 1, c: 1 }), $container);
    expect($container.innerHTML).toBe(`
        bar
        
        baz
      
    `);

    render(tpl({ a: 1, b: 1 }), $container);
    expect($container.innerHTML).toBe(`foo
        
        
        baz
      
    `);
  });

  it('case 4', () => {
    const $container = document.createElement('div');

    const tpl = (scope) => html`
      ${scope ? html`
        <span>${scope}</span>
      ` : html`
        <div class="foo1"></div>
        <div class="foo2"></div>
      `}`;

    const snapshot1 = `<div class="foo1"></div>
        <div class="foo2"></div>
      `;

    const snapshot2 = (scope) => `<span>${scope}</span>
      `;

    tpl(true)($container);
    expect($container.innerHTML).toBe(snapshot2(true));
    tpl(false)($container);
    expect($container.innerHTML).toBe(snapshot1);
    tpl('foo')($container);
    expect($container.innerHTML).toBe(snapshot2('foo'));
    tpl(48)($container);
    expect($container.innerHTML).toBe(snapshot2(48));
    tpl(false)($container);
    expect($container.innerHTML).toBe(snapshot1);
  });
});


describe('comment section', () => {

  it('static value', () => {
    const $container = document.createElement('div');

    const tpl = () => html`1 <!-- foo -->`;

    render(tpl(), $container);
    expect($container.innerHTML).toBe('1 <!-- foo -->');
  });

  it('dynamic value', () => {
    const $container = document.createElement('div');

    const tpl = (scope) => html`1 <!-- foo ${scope} -->`;

    render(tpl('bar'), $container);
    expect($container.innerHTML).toBe('1 <!-- foo bar -->');

    render(tpl('baz'), $container);
    expect($container.innerHTML).toBe('1 <!-- foo baz -->');
  });

});

describe('dynamic tags', () => {
  describe('string value', () => {

    it('renders tag with dynamic name', () => {

      const $container = document.createElement('div');

      const tpl = (scope) => html`
        <x-${scope[0]}/>
        <x-${scope[1]}></x-${scope[1]}>
        <${scope[2]}-y-${scope[0]}/>
        <${scope[1]}/>
      `;

      const values1 = ['foo', 'bar', 'baz'];
      render(tpl(values1), $container);
      expect($container.innerHTML).toBe(`<x-${values1[0]}></x-${values1[0]}>
        <x-${values1[1]}></x-${values1[1]}>
        <${values1[2]}-y-${values1[0]}></${values1[2]}-y-${values1[0]}>
        <${values1[1]}></${values1[1]}>
      `);

      const values2 = ['quux', 'bla', 'test'];
      render(tpl(values2), $container);
      expect($container.innerHTML).toBe(`<x-${values2[0]}></x-${values2[0]}>
        <x-${values2[1]}></x-${values2[1]}>
        <${values2[2]}-y-${values2[0]}></${values2[2]}-y-${values2[0]}>
        <${values2[1]}></${values2[1]}>
      `);

      const values3 = [1, 'bar', 'baz'];
      render(tpl(values3), $container);
      expect($container.innerHTML).toBe(`<x-${values3[0]}></x-${values3[0]}>
        <x-${values3[1]}></x-${values3[1]}>
        <${values3[2]}-y-${values3[0]}></${values3[2]}-y-${values3[0]}>
        <${values3[1]}></${values3[1]}>
      `);
    });

    it('handles attributes in dynamic tags', () => {

      const $container = document.createElement('div');

      const tpl = ({ tagName, values }) => html`
        <span></span>
        <x-${tagName} foo="${values[0]}" bar-${values[1]}="${values[2]}" class="quux ${values[3]}"/>
      `;

      const values1 = { tagName: 'div', values: ['foo', 1, 'bar', 'baz'] };
      render(tpl(values1), $container);
      expect($container.innerHTML).toBe(`<span></span>
        <x-${values1.tagName} class="quux ${values1.values[3]}" foo="${values1.values[0]}" bar-${values1.values[1]}="${values1.values[2]}"></x-${values1.tagName}>
      `);

      const values2 = { tagName: 'span', values: ['foo', 1, 'bar', 'baz'] };
      render(tpl(values2), $container);
      expect($container.innerHTML).toBe(`<span></span>
        <x-${values2.tagName} class="quux ${values2.values[3]}" foo="${values2.values[0]}" bar-${values2.values[1]}="${values2.values[2]}"></x-${values2.tagName}>
      `);

      const values3 = { tagName: 'span', values: ['quux', 'test', 3, 'baz'] };
      render(tpl(values3), $container);
      expect($container.innerHTML).toBe(`<span></span>
        <x-${values3.tagName} class="quux ${values3.values[3]}" foo="${values3.values[0]}" bar-${values3.values[1]}="${values3.values[2]}"></x-${values3.tagName}>
      `);
    });

    it('renders child content correctly', () => {

      const $container = document.createElement('div');

      const tpl = ({ tagName, value, list }) => html`
        <x-${tagName}>
          ${list ? list.map((val) => html`
            <span>${val}</span>
          `) : void 0}
          <div>${value}</div>
        </x-${tagName}>
      `;

      const values1 = { tagName: 'foo', value: 'bar' };
      render(tpl(values1), $container);
      expect($container.innerHTML).toBe(`<x-${values1.tagName}>
          
          <div>${values1.value}</div>
        </x-${values1.tagName}>
      `);

      const values2 = { tagName: 'foo', value: 'baz', list: ['xxx', 'yyy'] };
      render(tpl(values2), $container);
      expect($container.innerHTML).toBe(`<x-${values2.tagName}>
          <span>${values2.list[0]}</span>
          <span>${values2.list[1]}</span>
          
          <div>${values2.value}</div>
        </x-${values2.tagName}>
      `);

      const values3 = { tagName: 'bar', value: 'baz', list: ['xxx', 'yyy'] };
      render(tpl(values3), $container);
      expect($container.innerHTML).toBe(`<x-${values3.tagName}>
          <span>${values3.list[0]}</span>
          <span>${values3.list[1]}</span>
          
          <div>${values3.value}</div>
        </x-${values3.tagName}>
      `);

      const values4 = { tagName: 'bar', value: 'baz' };
      render(tpl(values4), $container);
      expect($container.innerHTML).toBe(`<x-${values4.tagName}>
          
          <div>${values4.value}</div>
        </x-${values4.tagName}>
      `);
    });

    it('renders child content only on demand', () => {

      const $container = document.createElement('div');

      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const fn3 = jest.fn();
      const fn4 = jest.fn();

      const tpl = ({ tagName, tagName2 }) => html`
        <x-${tagName} ${fn3}>
          ${fn1}
        </x-${tagName}>
        <${tagName2} ${fn4}>
          ${fn2}
        </${tagName2}>
      `;

      const values1 = { tagName: 'foo', tagName2: 'div' };
      render(tpl(values1), $container);
      expect($container.innerHTML).toBe(`<x-${values1.tagName}>
          
        </x-${values1.tagName}>
        <${values1.tagName2}>
          
        </${values1.tagName2}>
      `);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).toHaveBeenCalledTimes(1);
      expect(fn4).toHaveBeenCalledTimes(1);


      const values2 = { tagName: 'foo', tagName2: 'span' };
      render(tpl(values2), $container);
      expect($container.innerHTML).toBe(`<x-${values2.tagName}>
          
        </x-${values2.tagName}>
        <${values2.tagName2}>
          
        </${values2.tagName2}>
      `);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(2);
      expect(fn3).toHaveBeenCalledTimes(1);
      expect(fn4).toHaveBeenCalledTimes(2);


      const values3 = { tagName: 'foo', tagName2: 'div' };
      render(tpl(values3), $container);
      expect($container.innerHTML).toBe(`<x-${values3.tagName}>
          
        </x-${values3.tagName}>
        <${values3.tagName2}>
          
        </${values3.tagName2}>
      `);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(3);
      expect(fn3).toHaveBeenCalledTimes(1);
      expect(fn4).toHaveBeenCalledTimes(3);

    });
  });

  describe('function value', () => {
    describe('props handling', () => {

      const $container = document.createElement('div');
      const Component = jest.fn();

      it('handles simple attributes', () => {

        const tpl = (values) => html`
          <${Component} foo="xxx" ${values[0]}="yyy" ${values[1]}="${values[2]}"/>
        `;

        const values = ['zzz', 'aaa', true];

        render(tpl(values), $container);
        expect(Component).toHaveBeenCalledWith({
          foo: 'xxx',
          [values[0]]: 'yyy',
          [values[1]]: values[2],
          children: expect.any(Function)
        });


        //maybe incorrect behaviour below. maybe should not be called
        Component.mockReset();

        render(tpl(values), $container);
        expect(Component).toHaveBeenCalledWith({
          foo: 'xxx',
          [values[0]]: 'yyy',
          [values[1]]: values[2],
          children: expect.any(Function)
        });


        Component.mockReset();

        render(tpl(values), $container);
        expect(Component).toHaveBeenCalledWith({
          foo: 'xxx',
          [values[0]]: 'yyy',
          [values[1]]: values[2],
          children: expect.any(Function)
        });


        Component.mockReset();
        const values2 = ['bbb', 'ccc', { a: [] }];

        render(tpl(values2), $container);
        expect(Component).toHaveBeenCalledWith({
          foo: 'xxx',
          [values2[0]]: 'yyy',
          [values2[1]]: values2[2],
          children: expect.any(Function)
        });


        Component.mockReset();
        const values3 = ['bbb', 'ccc'];

        render(tpl(values3), $container);
        expect(Component).toHaveBeenCalledWith({
          foo: 'xxx',
          [values3[0]]: 'yyy',
          children: expect.any(Function)
        });


        Component.mockReset();
        const values4 = ['bbb', void 0, [1]];

        render(tpl(values4), $container);
        expect(Component).toHaveBeenCalledWith({
          foo: 'xxx',
          [values4[0]]: 'yyy',
          children: expect.any(Function)
        });

      });

      it('passes only attributes where name is string or number', () => {

        const tpl = (values) => html`
          <${Component} ${values[0]}="yyy" ${values[1]}="${values[2]}"/>
        `;

        const values = ['zzz', 'aaa', true];

        render(tpl(values), $container);
        expect(Component).toHaveBeenCalledWith({
          [values[0]]: 'yyy',
          [values[1]]: values[2],
          children: expect.any(Function)
        });


        Component.mockReset();

        const values2 = [() => {}, true, true];

        render(tpl(values2), $container);
        expect(Component).toHaveBeenCalledWith({
          children: expect.any(Function)
        });


        Component.mockReset();

        const values3 = [null, {}, true];

        render(tpl(values3), $container);
        expect(Component).toHaveBeenCalledWith({
          children: expect.any(Function)
        });

      });

      it('handles simple classes', () => {

        const tpl = (values) => html`
          <${Component} class="foo ${values[0]} ${values[1]}"/>
        `;

        const values = ['zzz'];

        render(tpl(values), $container);
        expect(Component).toHaveBeenCalledWith({
          className: `foo ${values[0]}`,
          children: expect.any(Function)
        });


        Component.mockReset();

        const values2 = [];

        render(tpl(values2), $container);
        expect(Component).toHaveBeenCalledWith({
          className: `foo`,
          children: expect.any(Function)
        });

        Component.mockReset();

        const values3 = ['bla', 'bar'];

        render(tpl(values3), $container);
        expect(Component).toHaveBeenCalledWith({
          className: `foo ${values3[0]} ${values3[1]}`,
          children: expect.any(Function)
        });

      });

      it('handles complex classes', () => {

        const Component = jest.fn();

        const tpl = (values) => html`
          <${Component} class="${values[0] ? values[1] : void 0} ${values[2]} ${values[3]}"/>
        `;

        const values = [true, 'zzz', ['yyy', 'aaa'], null];

        render(tpl(values), $container);
        expect(Component).toHaveBeenCalledWith({
          className: `${values[1]} ${values[2].join(' ')}`,
          children: expect.any(Function)
        });


        Component.mockReset();

        const values2 = [false, 'zzz', 'yyy', false];

        render(tpl(values2), $container);
        expect(Component).toHaveBeenCalledWith({
          className: `${values2[2]}`,
          children: expect.any(Function)
        });


        Component.mockReset();

        const values3 = [true, ['bbb'], ['yyy xxx', 'zzz']];

        render(tpl(values3), $container);
        expect(Component).toHaveBeenCalledWith({
          className: `${values3[1].join(' ')} ${values3[2].join(' ')}`,
          children: expect.any(Function)
        });

      });
    });

    describe('child content rendering', () => {
      it('handles ternary operator', () => {

        const $container = document.createElement('div');

        const Component = ({ children, show }) => html`
          <span id="bar">${show}</span>
          <div class="component-wrapper">
            ${show ? children : void 0}
          </div>
        `;

        const tpl = ({ show, values }) => html`
          <${Component} show=${show}>
            <div id="foo"></div>
            <span test="${values[0]}">${values[1]}</span>
          </${Component}>
        `;


        const values1 = { show: true, values: ['foo', 'bar'] };

        render(tpl(values1), $container);
        expect($container.innerHTML).toBe(`<span id="bar">${values1.show}</span>
          <div class="component-wrapper">
            
            <div id="foo"></div>
            <span test="${values1.values[0]}">${values1.values[1]}</span>
          
          </div>
        
        `);


        const values2 = { show: false, values: ['foo', 'bar'] };

        render(tpl(values2), $container);
        expect($container.innerHTML).toBe(`<span id="bar">${values2.show}</span>
          <div class="component-wrapper">
            
          </div>
        
        `);


        const values3 = { show: true, values: ['baz', 'quux'] };

        render(tpl(values3), $container);
        expect($container.innerHTML).toBe(`<span id="bar">${values3.show}</span>
          <div class="component-wrapper">
            
            <div id="foo"></div>
            <span test="${values3.values[0]}">${values3.values[1]}</span>
          
          </div>
        
        `);

        const values4 = { show: true, values: ['baz', 'zzz'] };

        render(tpl(values4), $container);
        expect($container.innerHTML).toBe(`<span id="bar">${values4.show}</span>
          <div class="component-wrapper">
            
            <div id="foo"></div>
            <span test="${values4.values[0]}">${values4.values[1]}</span>
          
          </div>
        
        `);
      });

      it('handles arrays in child content', () => {

        const $container = document.createElement('div');

        const Component = ({ children }) => html`${children}`;

        const tpl = ({ values }) => html`
          <${Component}>
            ${values.map((value) => html`
              <span>${value}</span>
            `)}
          </${Component}>
        `;


        const values1 = { values: ['foo', 'bar'] };

        render(tpl(values1), $container);
        expect($container.innerHTML).toBe(`
            <span>${values1.values[0]}</span>
            <span>${values1.values[1]}</span>
            
          
        `);


        const values2 = { values: ['quux', 'zzz'] };

        render(tpl(values2), $container);
        expect($container.innerHTML).toBe(`
            <span>${values2.values[0]}</span>
            <span>${values2.values[1]}</span>
            
          
        `);

        const values3 = { values: ['quux', 'zzz', 'yyy'] };

        render(tpl(values3), $container);
        expect($container.innerHTML).toBe(`
            <span>${values3.values[0]}</span>
            <span>${values3.values[1]}</span>
            <span>${values3.values[2]}</span>
            
          
        `);

        const values4 = { values: ['quux', 'yyy'] };

        render(tpl(values4), $container);
        expect($container.innerHTML).toBe(`
            <span>${values4.values[0]}</span>
            <span>${values4.values[1]}</span>
            
          
        `);
      });

      it('handles nested components', () => {

        const $container = document.createElement('div');

        const ComponentA = ({ children, foo }) => html`
          <div id="component-a" foo=${foo}>
            ${children}
          </div>
        `;

        const ComponentB = ({ value }) => html`
          <span id="component-b">
            <${ComponentA} foo=${value + '-bla'}>
              <p>${value}</p>
            </${ComponentA}>
          </span>
        `;

        const tpl = ({ values }) => html`
          <${ComponentB} value=${values[0]}/>
        `;


        const values1 = { values: ['foo'] };

        render(tpl(values1), $container);
        expect($container.innerHTML).toBe(`<span id="component-b">
            <div id="component-a" foo="${values1.values[0]}-bla">
            
              <p>${values1.values[0]}</p>
            
          </div>
        
          </span>
        
        `);


        const values2 = { values: ['bar'] };

        render(tpl(values2), $container);
        expect($container.innerHTML).toBe(`<span id="component-b">
            <div id="component-a" foo="${values2.values[0]}-bla">
            
              <p>${values2.values[0]}</p>
            
          </div>
        
          </span>
        
        `);
      });

    });

  });

  it('handles mixed content', () => {

    const $container = document.createElement('div');

    const Component = ({ children }) => html`
      <div id="component">
        ${children}
      </div>
    `;

    const tpl = ({ tag, childContent }) => html`
      <${tag}>
        <span>${childContent}</span>
      </${tag}>
    `;


    const values1 = { tag: 'x-foo', childContent: 'test' };

    render(tpl(values1), $container);
    expect($container.innerHTML).toBe(`<${values1.tag}>
        <span>${values1.childContent}</span>
      </${values1.tag}>
    `);


    const values2 = { tag: Component, childContent: 'foo' };

    render(tpl(values2), $container);
    expect($container.innerHTML).toBe(`<div id="component">
        
        <span>${values2.childContent}</span>
      
      </div>
    
    `);


    const values3 = { tag: 'x-foo', childContent: 'foo' };

    render(tpl(values3), $container);
    expect($container.innerHTML).toBe(`<${values3.tag}>
        <span>${values3.childContent}</span>
      </${values3.tag}>
    `);


    const values4 = { tag: 'x-bar', childContent: 'foo' };

    render(tpl(values4), $container);
    expect($container.innerHTML).toBe(`<${values4.tag}>
        <span>${values4.childContent}</span>
      </${values4.tag}>
    `);
  });

});
