import 'document-register-element';

import { html, render } from '../src/html';
import { r, until, unsafeHtml, asyncAppend, asyncReplace } from '../src/directives';
import { NodesRange } from '../src/range';


describe('Range', () => {

  it('render template into range', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div id="a1"></div>
      <div id="a2"></div>
      <div id="a3"></div>
    `;

    const snapshot = `
      <div id="a1"></div><span></span>
    <div id="a3"></div>
    `;

    const startNode = container.querySelector('#a1');
    const stopNode = container.querySelector('#a3');
    const range = new NodesRange(startNode, stopNode);

    render(html`
      <span></span>
    `, range);

    expect(container.innerHTML).toBe(snapshot);
  });

});

describe('components', () => {
  it('components', () => {

    const constructorSpy = jest.fn();
    const setterSpy = jest.fn();

    customElements.define('my-test-component', class extends HTMLElement {
      constructor(){
        super();
        constructorSpy();
      }
      set value(value){
        setterSpy(value);
      }
    });

    const tplF = (scope) => html`
      ${scope.map(value => html`
        <my-test-component value=${value}></my-test-component>
      `)}
    `;

    const snapshot1 = `<my-test-component></my-test-component>
      <my-test-component></my-test-component>
      
    `;

    const snapshot2 = `<my-test-component></my-test-component>
      <my-test-component></my-test-component>
      <my-test-component></my-test-component>
      
    `;

    const snapshot3 = `<my-test-component></my-test-component>
    `;

    const container = document.createElement('div');

    render(tplF(['value1', 'value2']), container);
    expect(container.innerHTML).toBe(snapshot1);
    expect(constructorSpy).toHaveBeenCalledTimes(2);
    expect(setterSpy).toHaveBeenCalledTimes(2);
    expect(setterSpy).toHaveBeenCalledWith('value1');
    expect(setterSpy).toHaveBeenCalledWith('value2');

    constructorSpy.mockReset();
    setterSpy.mockReset();
    render(tplF(['value1', 'value2', 'value3']), container);
    expect(container.innerHTML).toBe(snapshot2);
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(setterSpy).toHaveBeenCalledTimes(1);
    expect(setterSpy).toHaveBeenCalledWith('value3');

    constructorSpy.mockReset();
    setterSpy.mockReset();
    render(tplF(['value10', 'value20', 'value3']), container);
    expect(container.innerHTML).toBe(snapshot2);
    expect(constructorSpy).not.toHaveBeenCalled();
    expect(setterSpy).toHaveBeenCalledTimes(2);
    expect(setterSpy).toHaveBeenCalledWith('value10');
    expect(setterSpy).toHaveBeenCalledWith('value20');
  });

  it('components through promise', async () => {

    const constructorSpy = jest.fn();
    const setterSpy = jest.fn();

    customElements.define('my-test-component-a', class extends HTMLElement {
      constructor(){
        super();
        constructorSpy();
      }
      set value(value){
        setterSpy(value);
      }
    });

    const tplF = (scope) => html`
      ${Promise.resolve(scope).then(result => result.map(value => html`
        <my-test-component-a value=${value}></my-test-component-a>
      `))}
    `;

    const snapshot1 = `<my-test-component-a></my-test-component-a>
      <my-test-component-a></my-test-component-a>
      
    `;

    const snapshot2 = `<my-test-component-a></my-test-component-a>
      <my-test-component-a></my-test-component-a>
      <my-test-component-a></my-test-component-a>
      
    `;

    const snapshot3 = `<my-test-component></my-test-component>
    `;

    const container = document.createElement('div');

    render(tplF(['value1', 'value2']), container);

    await new Promise(resolve => setTimeout(resolve, 1));

    expect(container.innerHTML).toBe(snapshot1);
    expect(constructorSpy).toHaveBeenCalledTimes(2);
    expect(setterSpy).toHaveBeenCalledTimes(2);
    expect(setterSpy).toHaveBeenCalledWith('value1');
    expect(setterSpy).toHaveBeenCalledWith('value2');

    constructorSpy.mockReset();
    setterSpy.mockReset();
    render(tplF(['value1', 'value2', 'value3']), container);

    await new Promise(resolve => setTimeout(resolve, 1));

    expect(container.innerHTML).toBe(snapshot2);
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(setterSpy).toHaveBeenCalledWith('value3');

    constructorSpy.mockReset();
    setterSpy.mockReset();
    render(tplF(['value10', 'value20', 'value3']), container);

    await new Promise(resolve => setTimeout(resolve, 1));

    expect(container.innerHTML).toBe(snapshot2);
    expect(constructorSpy).not.toHaveBeenCalled();
    expect(setterSpy).toHaveBeenCalledTimes(2);
    expect(setterSpy).toHaveBeenCalledWith('value10');
    expect(setterSpy).toHaveBeenCalledWith('value20');
  });

  it('doesnt go deeper if component is also container itself', () => {

    const constructorSpy = jest.fn();
    const constructorASpy = jest.fn();
    const setterSpy = jest.fn();
    const setterASpy = jest.fn();

    customElements.define('my-test-component-b', class extends HTMLElement {
      constructor(){
        super();
        constructorSpy();
      }
      set value(value){
        setterSpy(value);
        render(html`
          <my-test-component-c value=${value + ' ok'}></my-test-component>
        `, this);
      }
    });

    customElements.define('my-test-component-c', class extends HTMLElement {
      constructor(){
        super();
        constructorASpy();
      }
      set value(value){
        setterASpy(value);
      }
    });

    const tplF = (scope) => html`
      <my-test-component-b value=${scope}></my-test-component>
    `;

    const snapshot1 = `<my-test-component-b><my-test-component-c>
        </my-test-component-c></my-test-component-b>`;

    const container = document.createElement('div');

    render(tplF('value1'), container);
    expect(container.innerHTML).toBe(snapshot1);
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(setterSpy).toHaveBeenCalledTimes(1);

    expect(constructorASpy).toHaveBeenCalledTimes(1);
    expect(setterASpy).toHaveBeenCalledTimes(1);

    constructorSpy.mockReset();
    constructorASpy.mockReset();
    setterSpy.mockReset();
    setterASpy.mockReset();

    render(tplF('value2'), container);
    expect(constructorASpy).not.toHaveBeenCalled();
    expect(setterASpy).toHaveBeenCalledTimes(1);
  });

});

describe('component props', () => {
  it('basic', () => {

    const valueSetterSpy = jest.fn();
    const propsSetterSpy = jest.fn();
    const setterArgs = [];

    customElements.define('my-test-component-d', class extends HTMLElement {
      set value(value){
        valueSetterSpy(value);
        setterArgs.push('value');
      }
      set props(props){
        propsSetterSpy(props);
        setterArgs.push('props');
      }
    });

    const tplF = (scope) => html`
      <my-test-component-d value=${scope.value} static-attr="test" int-attr="${scope.intAttr}" obj-attr="${scope.objAttr}"></my-test-component-d>
    `;

    const container = document.createElement('div');

    const data = {
      value: 'test',
      intAttr: 1,
      objAttr: { foo: 'bar' }
    }

    render(tplF(data), container);
    expect(valueSetterSpy).toHaveBeenCalledTimes(1);
    expect(valueSetterSpy).toHaveBeenCalledWith(data.value);
    expect(propsSetterSpy).toHaveBeenCalledTimes(1);
    expect(propsSetterSpy).toHaveBeenCalledWith({
      value: data.value,
      'int-attr': data.intAttr,
      'obj-attr': data.objAttr,
      'static-attr': 'test',
    });
    expect(setterArgs).toEqual(['value', 'props']);

    valueSetterSpy.mockReset();
    propsSetterSpy.mockReset();

    render(tplF(data), container);

    expect(valueSetterSpy).not.toHaveBeenCalled();
    expect(propsSetterSpy).not.toHaveBeenCalled();
  });

  it('static attrs', () => {

    const valueSetterSpy = jest.fn();
    const propsSetterSpy = jest.fn();
    const setterArgs = [];

    customElements.define('my-test-component-e', class extends HTMLElement {
      set value(value){
        valueSetterSpy(value);
        setterArgs.push('value');
      }
      set props(props){
        propsSetterSpy(props);
        setterArgs.push('props');
      }
    });

    const tplF = (scope) => html`
      <my-test-component-e value="test"></my-test-component-e>
    `;

    const container = document.createElement('div');

    render(tplF(), container);
    expect(valueSetterSpy).toHaveBeenCalledTimes(1);
    expect(valueSetterSpy).toHaveBeenCalledWith('test');
    expect(propsSetterSpy).toHaveBeenCalledTimes(1);
    expect(propsSetterSpy).toHaveBeenCalledWith({
      value: 'test',
    });
    expect(setterArgs).toEqual(['value', 'props']);

    valueSetterSpy.mockReset();
    propsSetterSpy.mockReset();

    render(tplF(), container);

    expect(valueSetterSpy).not.toHaveBeenCalled();
    expect(propsSetterSpy).not.toHaveBeenCalled();
  });

  it('passes unchanged properties along with changed', () => {

    const propsSetterSpy = jest.fn();

    customElements.define('my-test-component-f', class extends HTMLElement {
      set props(props){
        propsSetterSpy(props);
      }
    });

    const tplF = (scope) => html`
      <my-test-component-f attr="123" value="${scope.value}" foo="${scope.foo}"></my-test-component-f>
    `;

    const container = document.createElement('div');

    render(tplF({
      value: 'bla',
      foo: 'bar'
    }), container);

    expect(propsSetterSpy).toHaveBeenCalledTimes(1);
    expect(propsSetterSpy).toHaveBeenCalledWith({
      attr: '123',
      value: 'bla',
      foo: 'bar'
    });

    propsSetterSpy.mockReset();

    render(tplF({
      value: 'baz',
      foo: 'bar'
    }), container);

    expect(propsSetterSpy).toHaveBeenCalledTimes(1);
    expect(propsSetterSpy).toHaveBeenCalledWith({
      attr: '123',
      value: 'baz',
      foo: 'bar'
    });

    propsSetterSpy.mockReset();

    render(tplF({
      value: 'baz',
      foo: 'bar'
    }), container);

    expect(propsSetterSpy).not.toHaveBeenCalled();

    propsSetterSpy.mockReset();

    render(tplF({
      value: 'baz',
      foo: 'quux'
    }), container);

    expect(propsSetterSpy).toHaveBeenCalledTimes(1);
    expect(propsSetterSpy).toHaveBeenCalledWith({
      attr: '123',
      value: 'baz',
      foo: 'quux'
    });
  });

});

describe('directives', () => {

  it('until', async () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`
      ${until(scope.promiseResult, 'foo')}
    `;

    const promiseResult = new Promise(resolve => {
      setTimeout(() => resolve('ok'), 1);
    });

    render(tpl({ promiseResult }), container);

    expect(container.innerHTML).toBe(`foo
    `);

    await promiseResult;

    expect(container.innerHTML).toBe(`ok
    `);
  });

  it('unsafeHtml', () => {
    const container = document.createElement('div');

    const content = '<span>foo</span>';

    const tpl = (scope) => html`
      ${unsafeHtml(scope.content)}
    `;

    render(tpl({ content }), container);

    expect(container.innerHTML).toBe(`${content}
    `);

    expect(container.firstElementChild.tagName).toBe('SPAN');
  });

});

describe('iterators', () => {
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function iter(limit){
    let value = 0;
    return {
      next(){
        if(value === limit){
          return new Promise(resolve => setTimeout(() => resolve({ done: true }), 5));
        }
        return new Promise(resolve => setTimeout(() => resolve({ done: false, value: value++ }), 5));
      }
    }
  };

  it('asyncReplace', async () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`${asyncReplace(scope.iter(3))}`;

    render(tpl({ iter }), container);

    for(let i = 0; i < 3; i++){
      await wait(5);
      expect(container.innerHTML).toBe(`${i}`);
    }

    render(tpl({ iter }), container);

    for(let i = 0; i < 3; i++){
      await wait(5);
      expect(container.innerHTML).toBe(`${i}`);
    }

  });

  it('asyncAppend', async () => {
    const container = document.createElement('div');

    const tpl = (scope) => html`${asyncAppend(scope.iter(3))}`;

    render(tpl({ iter }), container);

    let out = '';
    for(let i = 0; i < 3; i++){
      await wait(5);
      out = `${out}${i}`;
      expect(container.innerHTML).toBe(out);
    }

    render(tpl({ iter }), container);

    out = '';
    for(let i = 0; i < 3; i++){
      await wait(5);
      out = `${out}${i}`;
      expect(container.innerHTML).toBe(out);
    }

  });

});
