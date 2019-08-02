!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t(e.MHTML={})}(this,function(e){"use strict";function t(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document.createTextNode(""),t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:document.createTextNode("");return this.childNodes=[],this.firstChild=null,this.lastChild=null,this.startNode=e,this.stopNode=t,e&&t?e.parentNode!==t.parentNode?this:(this.update(),this):this}t.prototype.appendChild=function(e){this.stopNode.parentNode.insertBefore(e,this.stopNode),this.update()},t.prototype.removeChild=function(e){this.stopNode.parentNode.removeChild(e),this.update()},t.prototype.replaceChild=function(e,t){t.parentNode.replaceChild(e,t),this.update()},t.prototype.extractContents=function(){var e=document.createDocumentFragment();return e.appendChild(this.startNode),this.childNodes.reduce(function(e,t){return e.appendChild(t),e},e),e.appendChild(this.stopNode),e},t.prototype.update=function(){this.childNodes=[];for(var e=this.startNode.nextSibling;e&&e!==this.stopNode;e=e.nextSibling)this.childNodes.push(e);this.firstChild=this.childNodes[0],this.lastChild=this.childNodes[this.childNodes.length-1]};var n,r=1,o=3,i=8,a=document.body.namespaceURI,u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function c(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function s(e,t){return e.nodeType===t.nodeType&&(e.tagName&&t.tagName&&e.tagName.toLowerCase()===t.tagName.toLowerCase())}function d(e){return void 0!==e}function l(e){return!!e&&("object"===(void 0===e?"undefined":u(e))||f(e))&&f(e.then)}function f(e){return"function"==typeof e}function p(e){return(void 0===e?"undefined":u(e))===u(!0)}function h(e){return e.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g,"\\$&")}function m(){}var v=function(){return function(e,t){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return function(e,t){var n=[],r=!0,o=!1,i=void 0;try{for(var a,u=e[Symbol.iterator]();!(r=(a=u.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){o=!0,i=e}finally{try{!r&&u.return&&u.return()}finally{if(o)throw i}}return n}(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}();function y(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var g={},N=new Map,C=new Map,b=new DOMParser,x="{modulor_html_chunk_"+ +new Date+":",w="}",T=/<([/]?)([^ />]+)((?:\s+[\w}{:-]+(?:([\s])*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)[ ]*>/gim,j=/([-A-Za-z0-9_}{:]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/gim,A=["table","tr","td","style"],k="modulor-dynamic-tag-"+ +new Date,D="modulor-chunk-"+ +new Date,O="{modulor_capitalize-"+ +new Date+":",R=new RegExp(h(O)+"([a-z]+)"+h(w),"g"),E=new RegExp(G(),"ig"),F=new RegExp(G(!0),"ig"),S=new RegExp("^"+G(!0)+"$"),L="preventChildRendering",U="function",I="array",_="element",M="promise",$="undefined",z="text";function B(e){return f(e)?U:e instanceof Array?I:e instanceof Node?_:l(e)?M:d(e)?z:$}function P(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[];return e.replace(F,function(e,n,r){var o=t[r];return d(o)?o:""})}function Z(e,t,n){var r=t.name,o=t.value;if(l(o))o.then(function(t){return Z(e,{name:r,value:t},n)});else if("style"!==r)if(f(r))r(e,o);else{if(!(n&&""===o)&&r in e)try{return void(e[r]=o)}catch(e){}e.setAttribute(r,o)}else!function(e){return e&&"object"===(void 0===e?"undefined":u(e))&&e.constructor===Object}(o)?e.setAttribute(r,o):Object.assign(e.style,o)}function H(e,t){if(d(e)&&""!==e){var n=B(e);return n===M?e.then(function(e){return H(e,t)}):(n===I?e:(""+e).split(" ")).forEach(function(e){return t(e)})}}function V(e){for(var t={nodeType:e.nodeType,namespaceURI:e.namespaceURI,textContent:e.textContent,attributes:[],childNodes:[]},n=t.attributes,r=t.childNodes,a=e.attributes||[],u=function(t){var r=a[t].value,o=a[t].name.replace(R,function(e,t){return t.toUpperCase()});if(o===D)return"continue";var i=o.match(E),u=r.match(E),c=o.match(S),s=r.match(S);if("class"===o){var d=r.split(" ").reduce(function(e,t){return e[t.match(E)?0:1].push(t),e},[[],[]]),l=v(d,2),f=l[0],h=l[1];return n.push({name:o,value:h.join(" ")}),f.length&&n.push(function(e){return function(t,n){var r=f.reduce(function(r,o){var i=o.match(S),a=i?t[i[2]]:P(o,t),u=i?n[i[2]]:P(o,n);return u!==a?(u&&H(u,function(t){return e.classList.remove(t)}),a&&H(a,function(t){return e.classList.add(t)}),!0):r},!1);return[{key:"className",value:e.className},r]}}),"continue"}i||u?n.push(function(t){return function(n,i){var a=c?n[c[2]]:P(o,n),u=c?i[c[2]]:P(o,i),d=s?n[s[2]]:P(r,n),l=s?i[s[2]]:P(r,i),f={key:a,value:d};return a===u&&d===l?[f,!1]:(a!==u&&t.removeAttribute(u),a?(f[a]=d,Z(t,{name:a,value:d},p(e[a])),[f,!0]):[f,!0])}}):n.push({name:o,value:r,isBoolean:p(e[o])})},c=0;c<a.length;c++)u(c);for(var s=e.childNodes||[],d=function(e){var t=s[e];return t.nodeType===o?(t.textContent.split(E).filter(function(e){return!!e}).forEach(function(e){var t=e.match(S);if(t){var n=t[2];r.push(function(e){return function(t){return J(t[n],e)}})}else r.push({nodeType:o,textContent:e})}),"continue"):t.nodeType===i?(t.textContent.match(E)?r.push(function(e){var n=document.createComment(""),r=t.textContent;return e.appendChild(n),function(e){n.textContent=P(r,e)}}):r.push({nodeType:i,textContent:t.textContent}),"continue"):void r.push(V(t))},l=0;l<s.length;l++)d(l);var f=e.tagName;if(f===k.toUpperCase()){var h=e.attributes[D].value,g=h.match(S);if(h.match(E))return function(e){var n=void 0;return function(r,o){var i=g?r[g[2]]:P(h,r),a=g?o[g[2]]:P(h,o);if(n&&i===a)return n(r);var u,c,s,d=B(i),l={childNodes:[Object.assign({},t,{tagName:i})]};if(d===U){var f=W(l,{appendChild:m,replaceChild:m,childNodes:[(u={props:function(t){return J(i(t),e)}},c={},s=Object.assign(y({props:m,tagName:null,setAttribute:function(e,t){"class"===e&&(c=t.split(" ").reduce(function(e,t){return Object.assign(e,y({},t,!0))},{}))},removeAttribute:m,classList:{add:function(e){c[e]=!0,s.className=Object.keys(c).join(" ").trim()},remove:function(e){delete c[e],s.className=Object.keys(c).join(" ").trim()}},className:"",attributes:[],childNodes:[],appendChild:m,isVirtual:!0},L,!0),u),s)]}),p=v(f,1);return(n=p[0])(r)}var N=W(l,e,{useDocFragment:!0}),C=v(N,2),b=C[0],x=C[1];b(r),x(),n=b}};t.tagName=h.toUpperCase()}else f&&(t.tagName=e.tagName.toUpperCase());return t}function q(e){var t,n=(t=e,Array.isArray(t)?t:Array.from(t)),r=n[0];return n.slice(1).reduce(function(e,t,n){var r=""+x+n+w;return e.concat(r).concat(t)},r)}function G(e){var t=(e?"(":"")+"\\d+"+(e?")":"");return"("+h(x)+t+h(w)+")"}function J(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:document.createDocumentFragment(),n=N.get(t)||{},r=B(e),o=n.lastChunk,i=n.lastRenderedChunkType,a=n.update;if(o===e)return t;if(r===M)return K[M](t,e),t;if(i!==r)c(t);else if(a){var u=a(e);return f(u)&&(n.update=u),n.lastChunk=e,t}return N.set(t,{update:K[r](t,e),lastRenderedChunkType:r,lastChunk:e}),t}var K=(y(n={},I,function e(t,n){var r=W({childNodes:[].concat(n).map(function(e,t){return function(e){return function(n){return J(n[t],e)}}})},t,{useDocFragment:!0}),o=v(r,2),i=o[0],a=o[1];return i(n),a(),function(r){if(r.length!==n.length)return e(t,r);i(r)}}),y(n,$,c),y(n,z,function(e,t){var n=document.createTextNode(t);return e.appendChild(n),function(e){return n.textContent=e}}),y(n,_,function(e,t){return e.appendChild(t),function(t){e.childNodes.length>1&&Array.prototype.slice.call(e.childNodes,1).forEach(function(t){return e.removeChild(t)}),e.replaceChild(t,e.childNodes[0])}}),y(n,M,function(e,t){t.then(function(t){e.update(),J(t,e)})}),y(n,U,function(e,t){var n=t(e);return function(t){n=t(e,n)}}),n);function Q(e,t,n){for(var r=t.attributes,o=e.attributes,i=0;i<o.length;i++)e.removeAttribute(o[i].name);for(var a=[],u={},c=0;c<r.length;c++){var s=r[c];if(f(s))a.push(s(e));else{var d=s.name,l=s.value,p=s.isBoolean;Z(e,{name:d,value:l},p),u["class"===d?"className":d]=l}}if(e[L]&&a.push(function(e,n){return[{key:"children",value:function(n,r){if(r)return r(e),r;var o=W(t,n,{useDocFragment:!0}),i=v(o,2),a=i[0],u=i[1];return a(e),u(),a}},!0]}),"props"in e){var h=f(e.props)?e.props:function(t,n){return n&&(e.props=t)};if(a.length)return[function(e,t){var n=a.reduce(function(n,r){var o=v(n,2),i=o[0],a=o[1],u=r(e,t),c=v(u,2),s=c[0],d=s.key,l=s.value,f=c[1],p="string"==typeof d||"number"==typeof d?y({},d,l):{};return[Object.assign({},i,p),a||f]},[u,!1]),r=v(n,2),o=r[0],i=r[1];h(o,i)}];h(u,!0)}return a}function W(e,n){var u=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};if(n[L])return[m,[]];for(var c,d,l=[],p=u.useDocFragment?document.createDocumentFragment():n,h=e.childNodes,v=function(e){return e?function(t){return n.replaceChild(t,e)}:function(e){return p.appendChild(e)}},y=0,g=0;;y++){var N=h[y],b=n.childNodes[y+g];if(!N&&!b)break;if(N)if(b&&s(N,b))d=b,(o===(c=N).nodeType!==c.nodeType||c.textContent!==d.textContent)&&s(N,b)&&(l=l.concat(W(N,b)[0]).concat(Q(b,N)));else{var x=v(b);if(f(N)){var w=C.get(b);if(!w){var T=(w=new t).startNode;x(w.extractContents()),C.set(T,w)}var j=N(w);j&&l.push(j),w.update(),g+=w.childNodes.length+1;continue}switch(N.nodeType){case o:x(document.createTextNode(N.textContent));break;case i:x(document.createComment(N.textContent));break;case r:var A=N.namespaceURI,k=N.tagName,D=void 0;D=b&&b[L]?b:A===a?document.createElement(k.toLowerCase()):document.createElementNS(A,k.toLowerCase()),l=l.concat(W(N,D)[0]).concat(Q(D,N)),x(D)}}else n.removeChild(b),y--}var O=[];return[function e(t){return l.forEach(function(e){return e(t,O)}),O=t,e},function(){return u.useDocFragment?n.appendChild(p):void 0}]}e.NodesRange=t,e.emptyNode=c,e.render=J,e.morph=W,e.html=function(){for(var e=arguments.length,t=Array(e>1?e-1:0),n=1;n<e;n++)t[n-1]=arguments[n];var r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];if(!r.length)return this;var o,i=function(e){for(var t=5381,n=e.length;n;)t=33*t^e.charCodeAt(--n);return t>>>0}(r.join(x+w)),a=g[i],u=void 0;if(d(a))u=a;else{var c=q(r);o=c.replace(T,function(e,t,n,r,o,i){return r=r.replace(/\/$/,function(){return i="/",""}).replace(j,function(e,t){return e.replace(t,t.replace(/[A-Z]/gm,function(e){return""+O+e+w}))}),(~A.indexOf(n)||n.match(E))&&(r=" "+D+'="'+n.trim()+'"'+r,n=k),i?"<"+n+r+"></"+n+">":t?"</"+n+">":"<"+t+n+r+">"}),u=V(b.parseFromString(o,"text/html").body),g[i]=u}return function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document.createDocumentFragment(),n=arguments[1];if(n&&n.templateId===i)return n(t);var r=W(u,e,{useDocFragment:!0}),o=v(r,2),a=o[0],c=o[1];return a(t),c(),a.templateId=i,a}},e.stopNode=function(){},Object.defineProperty(e,"__esModule",{value:!0})});
