import 'document-register-element';

import { html, render } from '@modulor-js/html';
import { ModulorElement, createElement } from '@modulor-js/html/element';


describe('modulor element', () => {
  it('class based components', () => {

    const container = document.createElement('div');

    const renderSpy = jest.fn();

    customElements.define('my-test-component', class extends ModulorElement {
      render(props){
        renderSpy(props);
        return html`
          <span>${props.value}</span>
        `;
      }
    });

    const tplF = ({ value, foo }) => html`
      <my-test-component value=${value} foo=${foo} />
    `;

    const snapshot1 = `<my-test-component><span>test</span>
        </my-test-component>
    `;

    render(tplF({ value: 'test', foo: { bar: true } }), container);

    expect(container.innerHTML).toBe(snapshot1);
    expect(renderSpy).toHaveBeenCalledWith({
      value: 'test',
      foo: { bar: true },
      children: expect.any(Function)
    });

    renderSpy.mockReset();

    const snapshot2 = `<my-test-component><span>bar</span>
        </my-test-component>
    `;

    render(tplF({ value: 'bar', foo: [1, 2, 3] }), container);

    expect(container.innerHTML).toBe(snapshot2);
    expect(renderSpy).toHaveBeenCalledWith({
      value: 'bar',
      foo: [1, 2, 3],
      children: expect.any(Function)
    });
  });

  it('handles connection correctly', async () => {

    const container = document.createElement('div');
    document.body.appendChild(container);

    const renderSpy = jest.fn();
    const connectedSpy = jest.fn();


    container.innerHTML = `
      <my-test-component-b foo="bar" checked baz="1" test="false" class="myclass">
        <a>d</a>
      </my-test-component-b>
    `;

    customElements.define('my-test-component-b', class extends ModulorElement {
      connectedCallback(){
        super.connectedCallback();
        connectedSpy();
      }
      render(props){
        renderSpy(props);
        return html`
          <input checked=${props.checked} />
          <div>
            ${props.children}
          </div>
        `;
      }
      get types(){
        return {
          checked(value){
            return value !== 'false';
          },
          test(value){
            return value !== 'false';
          },
          baz: Number
        }
      }
    });

    expect(renderSpy).toHaveBeenCalledWith({
      checked: true,
      test: false,
      baz: 1,
      className: 'myclass',
      foo: 'bar',
      children: expect.any(Function)
    });
  });

  describe('functional components', () => {
    ['web-components', 'plain-function'].forEach((type) => {
      it(`${type}`, () => {

        const isWebComponents = (type === 'web-components');

        const container = document.createElement('div');
        const renderSpy = jest.fn();

        const renderFn = jest.fn(({ checked, value, children, className }) => html`
          <input checked=${checked} />
          <span class="foo ${className}">${value}</span>
          ${children}
        `);


        const tplF = ({ value, foo, component, childText, className, ...rest }) => html`
          <${component} value=${value} foo=${foo} class="${className}" ${rest}>
            <p class="ok">${childText}</p>
          </${component}>
        `;

        const component = isWebComponents ? 'my-test-component-a' : renderFn;

        if(isWebComponents){
          customElements.define(component, createElement(renderFn));
        }

        const snapshot1 = `<input>
          <span class="foo">test</span>
          
            <p class=\"ok\"></p>`;

        render(tplF({ value: 'test', foo: { bar: true }, component }), container);

        const target = isWebComponents ? container.querySelector(component) : container;

        expect(target.innerHTML.trim()).toBe(snapshot1);
        expect(renderFn).toHaveBeenCalledTimes(1);
        expect(renderFn).toHaveBeenLastCalledWith({
          value: 'test',
          foo: { bar: true },
          className: '',
          children: expect.any(Function)
        });


        const snapshot2 = `<input>
          <span class="foo"></span>
          
            <p class=\"ok\"></p>`;

        render(tplF({ foo: { bar: false }, component }), container);

        expect(target.innerHTML.trim()).toBe(snapshot2);
        expect(renderFn).toHaveBeenCalledTimes(2);
        expect(renderFn).toHaveBeenLastCalledWith({
          value: undefined,
          foo: { bar: false },
          className: '',
          children: expect.any(Function)
        });


        const snapshot3 = `<input checked="true">
          <span class="foo bar"></span>
          
            <p class=\"ok\"></p>`;

        render(tplF({ checked: true, className: ['bar'], component }), container);

        expect(target.innerHTML.trim()).toBe(snapshot3);
        expect(renderFn).toHaveBeenCalledTimes(3);
        expect(renderFn).toHaveBeenLastCalledWith({
          value: undefined,
          foo: undefined,
          className: 'bar',
          checked: true,
          children: expect.any(Function)
        });

      });
    })
  });


});

