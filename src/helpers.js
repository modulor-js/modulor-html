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

export function isString(value){
  return typeof value === 'string';
}

export function proxyPromise(fn){
  return function proxy(name, value){
    //@TODO implement via Promise.all with polyfill
    return isPromise(name)
      ? name.then((newName) => proxy(newName, value))
      : isPromise(value)
        ? value.then(newValue => proxy(name, newValue))
        : fn(name, value);
  }
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

export function noop(){}
