!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t(e.MHTML={})}(this,function(e){"use strict";function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document.createTextNode(""),t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:document.createTextNode("");return this.childNodes=[],this.firstChild=null,this.lastChild=null,this.startNode=e,this.stopNode=t,e&&t?e.parentNode!==t.parentNode?this:(this.update(),this):this}t.prototype.appendChild=function(e){this.stopNode.parentNode.insertBefore(e,this.stopNode),this.update()},t.prototype.removeChild=function(e){this.stopNode.parentNode.removeChild(e),this.update()},t.prototype.replaceChild=function(e,t){t.parentNode.replaceChild(e,t),this.update()},t.prototype.extractContents=function(){var e=document.createDocumentFragment();return e.appendChild(this.startNode),this.childNodes.reduce(function(e,t){return e.appendChild(t),e},e),e.appendChild(this.stopNode),e},t.prototype.update=function(){this.childNodes=[];for(var e=this.startNode.nextSibling;e&&e!==this.stopNode;e=e.nextSibling)this.childNodes.push(e);this.firstChild=this.childNodes[0],this.lastChild=this.childNodes[this.childNodes.length-1]};var n=1,r=3,o=8,i=document.body.namespaceURI,u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function a(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function c(e,t){return e.nodeType===t.nodeType&&(e.tagName&&t.tagName&&e.tagName.toLowerCase()===t.tagName.toLowerCase())}function d(e){return void 0!==e}function s(e){return!!e&&("object"===(void 0===e?"undefined":u(e))||f(e))&&f(e.then)}function f(e){return"function"==typeof e}function l(e){return(void 0===e?"undefined":u(e))===u(!0)}function h(e){return e.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g,"\\$&")}var p=function(){return function(e,t){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return function(e,t){var n=[],r=!0,o=!1,i=void 0;try{for(var u,a=e[Symbol.iterator]();!(r=(u=a.next()).done)&&(n.push(u.value),!t||n.length!==t);r=!0);}catch(e){o=!0,i=e}finally{try{!r&&a.return&&a.return()}finally{if(o)throw i}}return n}(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}();var m={},v=new Map,y=new Map,g=new DOMParser,C="{modulor_html_chunk_"+ +new Date+":",N="}",b="modulor_sanitize_node_"+ +new Date+":",x=new RegExp("<([ /])?("+["table","tr","td","style"].join("|")+")([ ][^]>)?","igm"),w=/<([^\s]+)([ ].+)?\/([ ]+)?>/gim,T=new RegExp(O(),"ig"),j=new RegExp(O(!0),"ig"),A=new RegExp("^"+O(!0)+"$");function E(e){return f(e)?"function":e instanceof Array?"array":e instanceof Node?"element":s(e)?"promise":d(e)?"text":"undefined"}function D(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[];return e.replace(j,function(e,n,r){var o=t[r];return d(o)?o:""})}function R(e,t,n){var r=t.name,o=t.value;if(s(o))o.then(function(t){return R(e,{name:r,value:t},n)});else if("style"!==r)if(f(r))r(e,o);else{if(!(n&&""===o)&&r in e)try{return void(e[r]=o)}catch(e){}e.setAttribute(r,o)}else!function(e){return e&&"object"===(void 0===e?"undefined":u(e))&&e.constructor===Object}(o)?e.setAttribute(r,o):Object.assign(e.style,o)}function S(e,t){if(d(e)&&""!==e){var n=E(e);return"promise"===n?e.then(function(e){return S(e,t)}):("array"===n?e:(""+e).split(" ")).forEach(function(e){return t(e)})}}function k(e){var t={nodeType:e.nodeType,namespaceURI:e.namespaceURI,textContent:e.textContent,attributes:[],childNodes:[]};e.tagName&&(t.tagName=e.tagName.toLowerCase().replace(b,"").toUpperCase());for(var n=e.attributes||[],i=function(r){var o=n[r],i=o.name,u=o.value,a=i.match(T),c=u.match(T),d=i.match(A),s=u.match(A);if("class"===i){var f=u.split(" ").reduce(function(e,t){return e[t.match(T)?0:1].push(t),e},[[],[]]),h=p(f,2),m=h[0],v=h[1];return t.attributes.push({name:i,value:v.join(" ")}),m.length&&t.attributes.push(function(e,t){return function(t,n){m.forEach(function(r){var o=r.match(A),i=o?t[o[2]]:D(r,t),u=o?n[o[2]]:D(r,n);u!==i&&(u&&S(u,function(t){return e.classList.remove(t)}),i&&S(i,function(t){return e.classList.add(t)}))})}}),"continue"}a||c?t.attributes.push(function(t){return function(n,r){var o=d?n[d[2]]:D(i,n),a=d?r[d[2]]:D(i,r),c=s?n[s[2]]:D(u,n),f=s?r[s[2]]:D(u,r);if((o!==a||c!==f)&&(o!==a&&t.removeAttribute(a),o))return R(t,{name:o,value:c},l(e[o])),function(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}({},o,c)}}):t.attributes.push({name:i,value:u,isBoolean:l(e[i])})},u=0;u<n.length;u++)i(u);for(var a=e.childNodes||[],c=function(e){var n=a[e];return n.nodeType===r?(n.textContent.split(T).filter(function(e){return!!e}).forEach(function(e){var n=e.match(A);if(n){var o=n[2];t.childNodes.push(function(e){return function(t){return $(t[o],e)}})}else t.childNodes.push({nodeType:r,textContent:e})}),"continue"):n.nodeType===o?(n.textContent.match(T)?t.childNodes.push(function(e){var t=document.createComment(""),r=n.textContent;return e.appendChild(t),function(e){t.textContent=D(r,e)}}):t.childNodes.push({nodeType:o,textContent:n.textContent}),"continue"):void t.childNodes.push(k(n))},d=0;d<a.length;d++)c(d);return t}function F(e){var t,n=(t=e,Array.isArray(t)?t:Array.from(t)),r=n[0];return n.slice(1).reduce(function(e,t,n){var r=""+C+n+N;return e.concat(r).concat(t)},r)}function O(e){var t=(e?"(":"")+"\\d+"+(e?")":"");return"("+h(C)+t+h(N)+")"}function $(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:document.createDocumentFragment(),n=v.get(t)||{},r=E(e),o=n.lastChunk,i=n.lastRenderedChunkType,u=n.update;if(o===e)return t;if("promise"===r)return _.promise(t,e),t;if(i!==r)a(t);else if(u){var c=u(e);return f(c)&&(n.update=c),n.lastChunk=e,t}return v.set(t,{update:_[r](t,e),lastRenderedChunkType:r,lastChunk:e}),t}var _={array:function e(t,n){var r=L({childNodes:[].concat(n).map(function(e,t){return function(e){return function(n){return $(n[t],e)}}})},t,{useDocFragment:!0}),o=p(r,2),i=o[0],u=o[1];return i(n),u(),function(r){if(r.length!==n.length)return e(t,r);i(r)}},undefined:a,text:function(e,t){var n=document.createTextNode(t);return e.appendChild(n),function(e){return n.textContent=e}},element:function(e,t){return e.appendChild(t),function(t){e.childNodes.length>1&&e.childNodes.slice(1).forEach(function(t){return e.removeChild(t)}),e.replaceChild(t,e.childNodes[0])}},promise:function(e,t){t.then(function(t){e.update(),$(t,e)})},function:function(e,t){var n=t(e);return function(t){n=t(e,n)}}};function I(e,t){for(var n=t.attributes,r=e.attributes,o=0;o<r.length;o++)e.removeAttribute(r[o].name);for(var i=[],u={},a=0;a<n.length;a++){var c=n[a];if(f(c))i.push(c(e));else{var d=c.name,s=c.value,l=c.isBoolean;R(e,{name:d,value:s},l),u[d]=s}}if("props"in e){if(i.length)return[function(t,n){var r=i.reduce(function(e,r){return Object.assign(e,r(t,n))},{});Object.keys(r).length&&(e.props=Object.assign(u,r))}];e.props=u}return i}function L(e,u){for(var a,d,s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},l=[],h=s.useDocFragment?document.createDocumentFragment():u,p=e.childNodes,m=function(e){return e?function(t){return u.replaceChild(t,e)}:function(e){return h.appendChild(e)}},v=0,g=0;;v++){var C=p[v],N=u.childNodes[v+g];if(!C&&!N)break;if(C)if(N&&c(C,N))d=N,(r===(a=C).nodeType!==a.nodeType||a.textContent!==d.textContent)&&c(C,N)&&(l=l.concat(L(C,N)[0]).concat(I(N,C)));else{var b=m(N);if(f(C)){var x=y.get(N);if(!x){var w=(x=new t).startNode;b(x.extractContents()),y.set(w,x)}var T=C(x);T&&l.push(T),x.update(),g+=x.childNodes.length+1;continue}switch(C.nodeType){case r:b(document.createTextNode(C.textContent));break;case o:b(document.createComment(C.textContent));break;case n:var j=C.namespaceURI,A=C.tagName.toLowerCase(),E=j===i?document.createElement(A):document.createElementNS(j,A);l=l.concat(L(C,E)[0]).concat(I(E,C)),b(E)}}else u.removeChild(N),v--}var D=[];return[function e(t){return l.forEach(function(e){return e(t,D)}),D=t,e},function(){return s.useDocFragment?u.appendChild(h):void 0}]}e.NodesRange=t,e.emptyNode=a,e.render=$,e.morph=L,e.html=function(){for(var e=arguments.length,t=Array(e>1?e-1:0),n=1;n<e;n++)t[n-1]=arguments[n];var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];if(!r.length)return this;var o,i=function(e){for(var t=5381,n=e.length;n;)t=33*t^e.charCodeAt(--n);return t>>>0}(r.join(C+N)),u=m[i],a=void 0;if(d(u))a=u;else{var c=F(r);o=function(e){return e.replace(x,"<$1"+b+"$2")}(c.replace(w,"<$1$2></$1>")),a=k(g.parseFromString(o,"text/html").body),m[i]=a}return function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document.createDocumentFragment(),n=arguments[1];if(n&&n.templateId===i)return n(t);var r=L(a,e,{useDocFragment:!0}),o=p(r,2),u=o[0],c=o[1];return u(t),c(),u.templateId=i,u}},e.stopNode=function(){},Object.defineProperty(e,"__esModule",{value:!0})});
