import 'document-register-element';

import { html, render, r, until } from '../src/html';
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

});
