import 'document-register-element';
//import 'custom-elements-jest';

import { html, render, r, stopNode, Template } from '../src/html';
import { NodesRange } from '../src/range';

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


const snapshot = (scope) => `<div foo="${scope.foo}" bar="${scope.bar}${scope.foo}" class="foo ${scope.classes}">
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


describe('processing', () => {
  const _html = new Template({
    PREFIX: '{modulor_html_chunk:',
    POSTFIX: '}',
    SANITIZE_NODE_PREFIX: 'sanitize:',
  });

  it('is a function', () => {
    expect(typeof html).toBe('function')
  });

  const testSets = [
    {
      parsedString: _html.prepareLiterals`baz ${1}`,
      expectedPreparedLiterals: 'baz {modulor_html_chunk:0}',
      expectedReplacedTokens: 'baz 1',
      expectedData: { '{modulor_html_chunk:0}': 1 }
    },
    {
      parsedString: _html.prepareLiterals`${1} foo`,
      expectedPreparedLiterals: '{modulor_html_chunk:0} foo',
      expectedReplacedTokens: '1 foo',
      expectedData: { '{modulor_html_chunk:0}': 1 }
    },
    {
      parsedString: _html.prepareLiterals`foo`,
      expectedPreparedLiterals: 'foo',
      expectedReplacedTokens: 'foo',
      expectedData: {}
    },
    {
      parsedString: _html.prepareLiterals`foo ${1} bar ${2} baz`,
      expectedPreparedLiterals: 'foo {modulor_html_chunk:0} bar {modulor_html_chunk:1} baz',
      expectedReplacedTokens: 'foo 1 bar 2 baz',
      expectedData: { '{modulor_html_chunk:0}': 1, '{modulor_html_chunk:1}': 2 }
    }
  ];

  testSets.forEach((testSet, index) => {
    describe(`set ${index}`, () => {
      const parsedString = testSet.parsedString;
      const [str, data] = parsedString;

      it('prepares literals correctly', () => {
        expect(parsedString).toEqual([
          testSet.expectedPreparedLiterals,
          testSet.expectedData
        ]);
      });

      it('generates container correctly', () => {
        const container = _html.generateContainer(str);
        expect(container).toBeInstanceOf(HTMLElement);
        expect(container.innerHTML).toBe(str);
      });

      testSet.expectedReplacedTokens && it('replaces tokens correctly', () => {
        const prepared = _html.replaceTokens(str, data);
        expect(prepared).toBe(testSet.expectedReplacedTokens);
      });
    });
  });

  describe('sanitize', () => {

    const testSets = [
      {
        input: '<div></div>',
        expectation: '<div></div>'
      },
      {
        input: '<table attr-one="1"></table>',
        expectation: '<sanitize:table attr-one="1"></sanitize:table>'
      },
      {
        input: `<table attr-one="1"
        foo=bar bla baz="ok"
        ></table>`,
        expectation: `<sanitize:table attr-one="1"
        foo=bar bla baz="ok"
        ></sanitize:table>`
      },
      {
        input: `
          <table>
            <tr>
              <td>foo</td>
              <td></td>
            </tr>
            <tr>
              <td><div></div></td>
            </tr>
          </table>
        `,
        expectation: `
          <sanitize:table>
            <sanitize:tr>
              <sanitize:td>foo</sanitize:td>
              <sanitize:td></sanitize:td>
            </sanitize:tr>
            <sanitize:tr>
              <sanitize:td><div></div></sanitize:td>
            </sanitize:tr>
          </sanitize:table>
        `
      },
    ]
    testSets.forEach((testSet, index) => {
      it(`set #${index}`, () => {
        expect(_html.sanitize(testSet.input)).toBe(testSet.expectation);
      });
    })
  });

  describe('copy attributes', () => {

    const spyNoValue = jest.fn();
    const spyWithValue = jest.fn();
    const spyWithDynamicValue = jest.fn();

    const element = document.createElement('div');
    element.innerHTML = `
      <input type="checkbox"
             id="some-id"
             foo="{modulor_html_chunk:0}"
             {modulor_html_chunk:1}="ok"
             {modulor_html_chunk:2}
             {modulor_html_chunk:3}="{modulor_html_chunk:4}"
             autofocus="{modulor_html_chunk:5}"
             test-data="{modulor_html_chunk:6}"
             {modulor_html_chunk:7}
             {modulor_html_chunk:8}="bla"
             {modulor_html_chunk:9}="{modulor_html_chunk:10}"
             baz="{modulor_html_chunk:11}"/>
    `;

    const source = element.querySelector('input');

    const target = document.createElement('input');
    target['test-data'] = {};

    const data = {
      '{modulor_html_chunk:0}': 'foo value',
      '{modulor_html_chunk:1}': 'some-attribute',
      '{modulor_html_chunk:2}': 'checked',
      '{modulor_html_chunk:3}': 'value',
      '{modulor_html_chunk:4}': 'some value',
      '{modulor_html_chunk:5}': true,
      '{modulor_html_chunk:6}': { a: { b: 12 } },
      '{modulor_html_chunk:7}': ($target, value) => spyNoValue($target, value),
      '{modulor_html_chunk:8}': ($target, value) => spyWithValue($target, value),
      '{modulor_html_chunk:9}': ($target, value) => spyWithDynamicValue($target, value),
      '{modulor_html_chunk:10}': { c: 123 },
      '{modulor_html_chunk:11}': Promise.resolve('promise result'),
    };

    const _html = new Template({
      PREFIX: '{modulor_html_chunk:',
      POSTFIX: '}',
    });

    _html.dataMap = data;

    _html.copyAttributes(target, source);

    it('doesnt loose static attributes', () => {
      expect(target.getAttribute('type')).toBe('checkbox');
      expect(target.type).toBe('checkbox');

      expect(target.getAttribute('id')).toBe('some-id');
      expect(target.id).toBe('some-id');
    });

    it('copies simple attribute value correctly', () => {
      expect(target.getAttribute('foo')).toBe(data['{modulor_html_chunk:0}']);
      expect(target.foo).toBeUndefined();
    });

    it('handles dynamic attribute name correctly', () => {
      expect(target.getAttribute(data['{modulor_html_chunk:1}'])).toBe('ok');
      expect(target[data['{modulor_html_chunk:1}']]).toBeUndefined();
    });

    it('handles dynamic attribute name and dynamic value correctly', () => {
      expect(target.value).toBe(data['{modulor_html_chunk:4}']);
    });

    it('handles attributes where value is not required', () => {
      expect(target.getAttribute('checked')).toBe('');
      expect(target.checked).toBe(true);
    });

    it('handles attributes as functions', () => {
      expect(spyNoValue).toHaveBeenCalledWith(target, '');
      expect(spyWithValue).toHaveBeenCalledWith(target, 'bla');
      expect(spyWithDynamicValue).toHaveBeenCalledWith(target, data['{modulor_html_chunk:10}']);
    });

    it('handles promises in attributes', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      expect(target.getAttribute('baz')).toBe('promise result');
    });

    it('copies properties correctly', () => {
      expect(target.autofocus).toBe(data['{modulor_html_chunk:5}']);

      expect(target['test-data']).toEqual(data['{modulor_html_chunk:6}']);
      expect(target.hasAttribute('test-data')).toBe(false);
    });
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

    constructorSpy.mockReset();
    setterSpy.mockReset();
    render(tplF(['value1', 'value2', 'value3']), container);
    expect(container.innerHTML).toBe(snapshot2);
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(setterSpy).toHaveBeenCalledTimes(3);
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

    constructorSpy.mockReset();
    setterSpy.mockReset();
    render(tplF(['value1', 'value2', 'value3']), container);

    await new Promise(resolve => setTimeout(resolve, 1));

    expect(container.innerHTML).toBe(snapshot2);
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(setterSpy).toHaveBeenCalledTimes(3);
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

    //expect(constructorSpy).toHaveBeenCalledTimes(2);
    //expect(setterSpy).toHaveBeenCalledTimes(2);

    //constructorSpy.mockReset();
    //setterSpy.mockReset();
    //render(tplF(['value1', 'value2', 'value3']), container);
    //expect(container.innerHTML).toBe(snapshot2);
    //expect(constructorSpy).toHaveBeenCalledTimes(1);
    //expect(setterSpy).toHaveBeenCalledTimes(3);
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

  it('ternary operator', () => {
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

    tpl(false).render($container);
    expect($container.innerHTML).toBe(snapshot1);
    tpl(true).render($container, true);
    expect($container.innerHTML).toBe(snapshot2);
  })
});


//should be moved to integration tests
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






//describe('experiment', () => {

  //it('bla', async () => {

    //const container = document.createElement('div');

    //render(html`<div>${Promise.resolve('ok')}</div>`, container);

    //await new Promise(resolve => setTimeout(resolve, 1));

    //console.log(container.innerHTML);

    //render(html`<div>${Promise.resolve('foo').then((str) => html`wow ${str}`)}</div>`, container);

    //await new Promise(resolve => setTimeout(resolve, 1));

    //console.log(container.innerHTML);

    //expect(true).toBe(true);
  //});
//})
