import { render } from '@modulor-js/html';
import { unsafeHtml } from '@modulor-js/html/directives';

export function createElement(renderFn){
  return class ModulorElement extends HTMLElement {
    get preventChildRendering(){
      return true;
    }

    get preventAttributeSet(){
      return true;
    }

    get types(){
      return {};
    }

    connectedCallback(){
      if(this._props || this.hasAttribute('prerendered')){
        //rendered with engine
        return;
      }

      const props = {
        children: unsafeHtml(this.innerHTML)
      };


      while(this.attributes.length > 0){
        const attr = this.attributes[0];
        const value = attr.value;
        const name = attr.name === 'class' ? 'className' : attr.name;
        Object.assign(props, {
          [name]: this.types[name] ? this.types[name](value) : value
        });
        this.removeAttribute(attr.name);
      }

      this.props(props, true);
    }

    props(props, updated){
      render(this.render(this._props = props), this);
    }

    render(props){
      return renderFn(props);
    }
  }
}

export const ModulorElement = createElement(() => {});
