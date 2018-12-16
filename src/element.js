import { render, html } from './html';


export class ModulorElement extends HTMLElement {
  constructor(){
    super();
    this.preventChildRendering = true;
  }
  connectedCallback(){
  }

  setProps(props){
    this._props = props;
    render(this.render(props), this);
  }
}

export function element(fn, options){
  return class extends ModulorElement {
    render(props){
      return fn(props);
    }
  }
}
