import { configure } from './config';

import { isNode, createTextNode, createDocumentFragment } from './dom_helpers';

import { NodesRange } from './range';
import { noop, isDefined, isPromise, isFunction } from './helpers';
import { parse } from './parser';
import { morph, applyAttribute } from './morph';

export { NodesRange, configure };


const CHUNK_TYPE_FUNCTION = 'function';
const CHUNK_TYPE_ARRAY = 'array';
const CHUNK_TYPE_ELEMENT = 'element';
const CHUNK_TYPE_PROMISE = 'promise';
const CHUNK_TYPE_UNDEFINED = 'undefined';
const CHUNK_TYPE_TEXT = 'text';

function getChunkType(chunk){
  if(isFunction(chunk)){
    return CHUNK_TYPE_FUNCTION;
  } else if(chunk instanceof Array){
    return CHUNK_TYPE_ARRAY;
  } else if(isNode(chunk)){
    return CHUNK_TYPE_ELEMENT;
  } else if(isPromise(chunk)){
    return CHUNK_TYPE_PROMISE;
  } else if(!isDefined(chunk)){
    return CHUNK_TYPE_UNDEFINED;
  }
  return CHUNK_TYPE_TEXT;
}

const updatesMap = new Map();

export function emptyNode(node){
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}


export function render(value, range = createDocumentFragment()){
  const cached = updatesMap.get(range) || {};
  const chunkType = getChunkType(value);
  const { lastChunk, lastRenderedChunkType, update } = cached;
  if(lastChunk === value){
    return range;
  }
  if(chunkType === CHUNK_TYPE_PROMISE){
    chunkProcessingFunctions[CHUNK_TYPE_PROMISE](range, value);
    return range;
  }
  if(lastRenderedChunkType !== chunkType){
    emptyNode(range);
  } else if(update){
    const updateResult = update(value);
    isFunction(updateResult) && (cached.update = updateResult);
    cached.lastChunk = value;
    return range;
  }
  updatesMap.set(range, {
    update: chunkProcessingFunctions[chunkType](range, value),
    lastRenderedChunkType: chunkType,
    lastChunk: value
  });
  return range;
};

const chunkProcessingFunctions = {
  [CHUNK_TYPE_ARRAY]: function processArrayChunk(range, value){
    const preprocessedChunksContainer = {
      childNodes: [].concat(value).map((chunk, index) => {
        return (range) => (values) => render(values[index], range);
      })
    };
    const [update, initialRender] = morph(preprocessedChunksContainer, range, { useDocFragment: true });
    update(value);
    initialRender();
    return (newValue) => {
      if(newValue.length !== value.length){
        return processArrayChunk(range, newValue);
      }
      update(newValue);
    }
  },
  [CHUNK_TYPE_UNDEFINED]: emptyNode,
  [CHUNK_TYPE_TEXT]: (range, value) => {
    const textNode = createTextNode(value);
    range.appendChild(textNode);
    return (value) => textNode.textContent = value;
  },
  [CHUNK_TYPE_ELEMENT]: (range, value) => {
    range.appendChild(value);
    return (value) => {
      if(range.childNodes.length > 1){
        Array.prototype.slice.call(range.childNodes, 1).forEach(node => range.removeChild(node));
      }
      range.replaceChild(value, range.childNodes[0]);
    }
  },
  [CHUNK_TYPE_PROMISE]: (range, value) => {
    value.then((response) => {
      range.update();
      render(response, range);
    });
  },
  [CHUNK_TYPE_FUNCTION]: (range, value) => {
    let result = value(range);
    return (value) => {
      result = value(range, result);
    }
  },
};

export function html(chunks = [], ...values){

  if(!chunks.length){
    return this;
  }

  const [container, templateId] = parse(chunks);

  function renderFn(target = createDocumentFragment(), result){
    if(result && result.templateId === templateId){
      return result(values);
    } else {
      const [update, initialRender] = morph(container, target, { useDocFragment: true });
      update(values);
      initialRender();
      update.templateId = templateId;
      return update;
    }
  }
  return renderFn;
}


/**
 *  stopNode directive
 *  @deprecated
 * */
export const stopNode = noop;

