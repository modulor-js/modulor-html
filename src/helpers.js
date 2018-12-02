import { TEXT_NODE } from './constants';

export function emptyNode(node){
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function same(nodeA, nodeB){
  //console.log(nodeA.isVirtual, nodeA.isVirtual);
  if(nodeA.nodeType !== nodeB.nodeType){
    return false;
  }
  return nodeA.tagName && nodeB.tagName &&
         nodeA.tagName.toLowerCase() === nodeB.tagName.toLowerCase();
};

export function isSameTextNode(nodeA, nodeB){
  return TEXT_NODE === nodeA.nodeType === nodeA.nodeType &&
         nodeA.textContent === nodeB.textContent;
};

export function isDefined(value){
  return typeof value !== 'undefined';
}

export function isPromise(value){
  return !!value && (typeof value === 'object' || isFunction(value)) && isFunction(value.then);
}

export function isFunction(value){
  return typeof value == 'function';
}

export function isObject(value){
  return value && typeof value === 'object' && value.constructor === Object;
}

export function isBoolean(value){
  return typeof value === typeof true;
}

//hash function taken from https://github.com/darkskyapp/string-hash/blob/master/index.js
export function hash(str) {
  var hash = 5381,
      i    = str.length;
  while(i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }
  return hash >>> 0;
};

export function regExpEscape(literalString){
  return literalString.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
};

export function noop(){}


export const CHUNK_TYPE_FUNCTION = 'function';
export const CHUNK_TYPE_ARRAY = 'array';
export const CHUNK_TYPE_ELEMENT = 'element';
export const CHUNK_TYPE_PROMISE = 'promise';
export const CHUNK_TYPE_UNDEFINED = 'undefined';
export const CHUNK_TYPE_TEXT = 'text';

export function getChunkType(chunk){
  if(isFunction(chunk)){
    return CHUNK_TYPE_FUNCTION;
  } else if(chunk instanceof Array){
    return CHUNK_TYPE_ARRAY;
  } else if(chunk instanceof Node){
    return CHUNK_TYPE_ELEMENT;
  } else if(isPromise(chunk)){
    return CHUNK_TYPE_PROMISE;
  } else if(!isDefined(chunk)){
    return CHUNK_TYPE_UNDEFINED;
  }
  return CHUNK_TYPE_TEXT;
}
