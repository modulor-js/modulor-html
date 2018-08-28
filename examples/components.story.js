import { storiesOf } from 'modulor-storybook';
const { withConsole } = require('modulor-storybook/addons/console');

import * as MHTML from '../';

const { html, render } = MHTML;


storiesOf('Components')
  .add('basic', () => (container) => {

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
      <my-component prop="${scope.prop}" attr="${scope.attr}">look at console</my-conponent>
    `;

    render(tpl({ prop: 'foo', attr: 'bar' }), container);

  })
  .add('stateless', () => (container) => {

    customElements.define('my-component', class extends HTMLElement {
      set props({ first, second }){
        render(html`
          <div>first: ${first}</div>
          <div>second: ${second}</div>
        `, this);
      }
    });

    const tpl = ({ first, second }) => html`
      <my-component first="${first}" second="${second}"></my-conponent>
    `;

    render(tpl({ first: 'foo', second: 'bar' }), container);

  })
  .add('statefull', () => (container) => {

    customElements.define('my-component', class extends HTMLElement {

      constructor(){
        super();
        this.state = { clicked: 0 };
      }

      get props(){
        return this.state;
      }
      set props(props){
        Object.assign(this.state, props)
        this.render();
      }

      incrementClicked(){
        this.state.clicked++;
        this.render();
      }

      render(){
        render(html`
          <div>clicked: ${this.state.clicked}</div>
          <div>first: ${this.state.first}</div>
          <div>second: ${this.state.second}</div>
          <button onclick=${this.incrementClicked.bind(this)}>click me</button>
        `, this);
      }
    });

    const tpl = ({ first, second }) => html`
      <my-component first="${first}" second="${second}"></my-conponent>
    `;

    render(tpl({ first: 'foo', second: 'bar' }), container);

  })
  .add('with ShadowDOM', () => (container) => {

    customElements.define('my-component', class extends HTMLElement {
      constructor(){
        super();
        this.shadow = this.attachShadow({mode: 'open'});
      }

      set props({ first, second }){
        render(html`
          <div>first: ${first}</div>
          <div>second: ${second}</div>
        `, this.shadow);
      }
    });

    const tpl = ({ first, second }) => html`
      <my-component first="${first}" second="${second}"></my-conponent>
    `;

    render(tpl({ first: 'foo', second: 'bar' }), container);

  })
