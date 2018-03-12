!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t(e.MHTML={})}(this,function(e){"use strict";function t(e,t){return this.childNodes=[],this.firstChild=null,this.lastChild=null,this.startNode=e,this.stopNode=t,e&&t?e.parentNode!==t.parentNode?this:(this.update(),this):this}t.prototype.appendChild=function(e){this.stopNode.parentNode.insertBefore(e,this.stopNode),this.update()},t.prototype.removeChild=function(e){this.stopNode.parentNode.removeChild(e),this.update()},t.prototype.replaceChild=function(e,t){t.parentNode.replaceChild(e,t),this.update()},t.prototype.extractContents=function(){var e=document.createDocumentFragment();return e.appendChild(this.startNode),this.childNodes.reduce(function(e,t){return e.appendChild(t),e},e),e.appendChild(this.stopNode),e},t.prototype.update=function(){var e=this;this.childNodes=[];for(var t=this.startNode.nextSibling;t&&t!==this.stopNode;t=t.nextSibling)t.range&&(t.range.onUpdate=function(){return e.update()}),this.childNodes.push(t);this.firstChild=this.childNodes[0],this.lastChild=this.childNodes[this.childNodes.length-1],this.onUpdate&&this.onUpdate()},t.prototype.getByIndex=function(e){};var n={},r={ELEMENT_NODE:1,ATTRIBUTE_NODE:2,TEXT_NODE:3,CDATA_SECTION_NODE:4,ENTITY_REFERENCE_NODE:5,ENTITY_NODE:6,PROCESSING_INSTRUCTION_NODE:7,COMMENT_NODE:8,DOCUMENT_NODE:9,DOCUMENT_TYPE_NODE:10,DOCUMENT_FRAGMENT_NODE:11,NOTATION_NODE:12};function o(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"";return!(!e||!t)&&(e.nodeType===t.nodeType&&(e.range==t.range&&(!(!e.tagName||!t.tagName||e.tagName.toLowerCase().replace(n,"")!==t.tagName.toLowerCase())||e.isEqualNode(t))))}function i(e){return e.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g,"\\$&")}function a(e){return e instanceof Node?"element":e instanceof m?"template":e instanceof Promise?"futureResult":"function"==typeof e?"function":"text"}function s(e,t,n,r){""!==r&&t in e?e[t]=n:e.setAttribute(t,n)}var u="modulor_stop_node_"+ +new Date;function p(e){e.nodeStopper=u}var h="{modulor_html_chunk_"+ +new Date+":",c="}",d=new DOMParser,l="modulor_sanitize_node_"+ +new Date+":",f=new RegExp("<([ /])?("+["table","tr","td"].join("|")+")([ ][^]>)?","igm");function m(e){return this.PREFIX=e.PREFIX||h,this.POSTFIX=e.POSTFIX||c,this.parser=e.parser||d,this.splitChunkRegex=new RegExp(this.getTokenRegExp(),"ig"),this.findChunksRegex=new RegExp(this.getTokenRegExp(!0),"ig"),this.replaceChunkRegex=new RegExp(this.getTokenRegExp(!0),"ig"),this.matchChunkRegex=new RegExp("^"+this.getTokenRegExp(!0)+"$"),this.sanitizeNodePrefix=e.SANITIZE_NODE_PREFIX||l,this.updates=[],this}var N=new Map;m.prototype.parse=function(e){this.prevValues=[];for(var t=arguments.length,r=Array(t>1?t-1:0),o=1;o<t;o++)r[o-1]=arguments[o];this.values=r,this.template=this.prepareLiterals(e),this.templateId=function(e){for(var t=5381,n=e.length;n;)t=33*t^e.charCodeAt(--n);return t>>>0}(this.template);var i=n[this.templateId];return void 0===i?(this.container=this.generateContainer(this.sanitize(this.template)),n[this.templateId]=this.container):this.container=i,this},m.prototype.getChunkById=function(e){return(arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.values)[e]},m.prototype.processTextNodeChunks=function(e){var t=this;return e.reduce(function(e,n){if(!(""+n).length)return e;var r=n.match(t.matchChunkRegex),o=r?t.getChunkById(r[2]):n;if(void 0===o)return e;var i=a(o);if("text"!==i){var s=document.createComment("");return s.isSpecialChunk=!0,s[i]=o,s.chunkType=i,s.templateId=t.templateId,s.chunkId=r[2],e.concat(s)}return e.concat(o)},[])},m.prototype.copyTextNodeChunks=function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:document.createDocumentFragment();return[].concat(e).reduce(function(e,n){if(n.isSpecialChunk)return e.appendChild(n),e;var r=a(n);if("text"===r)e.appendChild(document.createTextNode(n));else{var o=document.createComment("");o[r]=n,o.isSpecialChunk=!0,o.chunkType=r,o.templateId=t.templateId,e.appendChild(o)}return e},n)},m.prototype.copyAttributes=function(e,t){for(var n=this,r=t.attributes,o=e.attributes,i=[],u={},p=function(t){var o=r[t],p=o.name,h=o.value,c=p.match(n.splitChunkRegex),d=h.match(n.splitChunkRegex);if(u[p]=!0,!c&&!d)return s(e,p,h),"continue";if("class"===p)return e.className="",h.split(" ").forEach(function(t){t.match(n.splitChunkRegex)?i.push(function(){var r=n.replaceTokens(t),o=n.replaceTokens(t,n.prevValues);o!==r&&(o&&e.classList.remove(o),r&&e.classList.add(r))}):e.classList.add(t)}),"continue";var l=p.match(n.matchChunkRegex),f=h.match(n.matchChunkRegex);i.push(function(){var t=l?n.getChunkById(l[2]):n.replaceTokens(p),r=l?n.getChunkById(l[2],n.prevValues):n.replaceTokens(p,n.prevValues),o=f?n.getChunkById(f[2]):n.replaceTokens(h),i=f?n.getChunkById(f[2],n.prevValues):n.replaceTokens(h,n.prevValues);t===r&&o===i||(t!==r&&e.removeAttribute(r),t&&("function"!==a(t)?"futureResult"!==a(o)?s(e,t,o,h):o.then(function(n){return s(e,t,n)}):t(e,o)))})},h=0;h<r.length;h++)p(h);for(h=0;h<o.length;h++){var c=o[h].name;u[c]||e.removeAttribute(c)}return i.forEach(function(e){return e()}),i},m.prototype.loop=function(e,n,i){for(var a,s,p=this,h=0,c=0;;h++){if(h>1e3){console.log("too much recursion");break}var d=e.childNodes[h],l=n.childNodes[h+c];if(!d&&!l)break;if(d){if(!l||!o(d,l,this.sanitizeNodePrefix))if("continue"===function(){var e=function(e,t){return function(n){return t?e.replaceChild(n,t):e.appendChild(n)}}(n,l),o=function(n,r){if(n&&n.range&&n.replacementType===r&&n.templateId===p.templateId)return n.range;var o=new t(document.createTextNode(""),document.createTextNode("")),i=o.startNode;return i.range=o,i.replacementType=r,i.templateId=p.templateId,e(o.extractContents()),o};switch(d.nodeType){case r.TEXT_NODE:var i=d.textContent.split(p.splitChunkRegex);if(1===i.length){e(document.createTextNode(d.textContent));break}var a=o(l,"textContent"),s=function(){var e=p.processTextNodeChunks(i),t=p.copyTextNodeChunks(e);p.loop(t,a)};p.updates.push(s),s(),c+=a.childNodes.length+1;break;case r.COMMENT_NODE:if(d.isSpecialChunk){var u=d.chunkType,h=o(l,u);if("futureResult"===u){h.update(),d.futureResult.then(function(e){h.update();var t=p.copyTextNodeChunks(e);return p.loop(t,h),t}),c+=h.childNodes.length+1;break}if("template"===u){d.template.render(h),h.update(),c+=h.childNodes.length+1;break}if("element"===u){d.element instanceof DocumentFragment||1!==h.childNodes.length?(h.childNodes.forEach(function(e){return h.removeChild(e)}),h.appendChild(d.element)):h.childNodes[0]!==d.element&&h.replaceChild(d.element,h.childNodes[0]),c+=h.childNodes.length+1;break}}e(document.createComment(p.replaceTokens(d.textContent)));break;case r.ELEMENT_NODE:var f=document.createElement(d.tagName.toLowerCase().replace(p.sanitizeNodePrefix,""));p.loop(d,f),e(f);var m=p.copyAttributes(f,d);p.updates=p.updates.concat(m)}return n instanceof t&&n.update(),"continue"}())continue;if(s=l,(a=d).nodeType!==r.TEXT_NODE||a.nodeType!==r.TEXT_NODE||a.textContent!==s.textContent)if(o(d,l,this.sanitizeNodePrefix)){l.nodeStopper!==u&&this.loop(d,l);var f=this.copyAttributes(l,d);this.updates=this.updates.concat(f)}else;}else n.removeChild(l),h--}return n},m.prototype.render=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document.createDocumentFragment(),t=N.get(e);if((t||{}).templateId!==this.templateId)return p(e),N.set(e,{templateId:this.templateId,update:this.update.bind(this)}),this.loop(this.container,e);t.update(this.values)},m.prototype.update=function(e){this.prevValues=this.values,this.values=e,this.updates.forEach(function(e){return e()})},m.prototype.generateContainer=function(e){return this.parser.parseFromString(e,"text/html").body},m.prototype.sanitize=function(e){return e.replace(f,"<$1"+this.sanitizeNodePrefix+"$2")},m.prototype.prepareLiterals=function(e){var t,n=this,r=(t=e,Array.isArray(t)?t:Array.from(t)),o=r[0];return r.slice(1).reduce(function(e,t,r){var o=n.generateTokenName(r);return e.concat(o).concat(t)},o)},m.prototype.generateTokenName=function(e){return""+this.PREFIX+e+this.POSTFIX},m.prototype.replaceTokens=function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.values;return e.replace(this.replaceChunkRegex,function(e,r,o){return t.getChunkById(o,n)||""})},m.prototype.getTokenRegExp=function(e){var t=(e?"(":"")+"\\d+"+(e?")":"");return"("+i(this.PREFIX)+t+i(this.POSTFIX)+")"};var g=function(){var e;return(e=new m({})).parse.apply(e,arguments)},C=function(e,t){return e.render(t)};e.stopNode=p,e.Template=m,e.containersMap=N,e.html=g,e.render=C,e.r=function(){return C(g.apply(void 0,arguments))},Object.defineProperty(e,"__esModule",{value:!0})});
