"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var html=require("@modulor-js/html"),directives=require("@modulor-js/html/directives"),_createClass=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}();function _defineProperty(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function _possibleConstructorReturn(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function _inherits(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}function createElement(e){return function(t){function r(){return _classCallCheck(this,r),_possibleConstructorReturn(this,(r.__proto__||Object.getPrototypeOf(r)).apply(this,arguments))}return _inherits(r,HTMLElement),_createClass(r,[{key:"connectedCallback",value:function(){if(!this._props&&!this.hasAttribute("prerendered")){for(var e={children:directives.unsafeHtml(this.innerHTML)};this.attributes.length>0;){var t=this.attributes[0],r=t.value,n="class"===t.name?"className":t.name;Object.assign(e,_defineProperty({},n,this.types[n]?this.types[n](r):r)),this.removeAttribute(t.name)}this.props(e,!0)}}},{key:"props",value:function(e,t){html.render(this.render(this._props=e),this)}},{key:"render",value:function(t){return e(t)}},{key:"preventChildRendering",get:function(){return!0}},{key:"preventAttributeSet",get:function(){return!0}},{key:"types",get:function(){return{}}}]),r}()}var ModulorElement=createElement(function(){});exports.createElement=createElement,exports.ModulorElement=ModulorElement;
