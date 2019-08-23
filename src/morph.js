import { config } from './config';

import {
  createElement, createTextNode, createComment, createDocumentFragment,
} from './dom_helpers';

import {
  isFunction, isObject, isBoolean,
} from './helpers';

import { ELEMENT_NODE, TEXT_NODE, COMMENT_NODE } from './constants';
import { NodesRange } from './range';


const rangesMap = new Map();

export function same(nodeA, nodeB){
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

export function applyAttribute(target, { name, value }){
  if(isFunction(name)){
    name(target, value);
    return;
  }
  if(name === 'style'){
    isObject(value)
      ? Object.assign(target.style, value)
      : target.setAttribute(name, value);
    return;
  }

  if(name in target){
    isBoolean(target[name]) && (value !== false) && target.setAttribute(name, value);
    try {
      target[name] = value;
      return;
    } catch(e) {}
  }
  target.setAttribute(name, value);
};


export function copyAttributes(target, source){
  const sourceAttributes = source.attributes;
  const targetAttributes = target.attributes;

  for(let i = 0; i < targetAttributes.length; i++){
    target.removeAttribute(targetAttributes[i].name);
  }

  const updates = [];

  const props = {};

  for(let i = 0; i < sourceAttributes.length; i++){
    const attr = sourceAttributes[i];

    if(isFunction(attr)){
      updates.push(attr(target));
      continue;
    }

    const { name, value } = attr;

    applyAttribute(target, { name, value });
  }
  return updates;

}

export function morph($source, $target, options = {}){

  let updates = [];

  const $currentTarget = options.useDocFragment ? createDocumentFragment() : $target;

  const sourceChildren = $source.childNodes;

  const getDomFn = ($targetElement) => {
    if(!$targetElement){
      //element should be newly created
      return ($el) => $currentTarget.appendChild($el);
    }
    //replace old node with new one
    return ($el) => $target.replaceChild($el, $targetElement);
  };

  for(let i = 0, offset = 0;; i++){

    const $sourceElement = sourceChildren[i];
    const $targetElement = $target.childNodes[i + offset];

    //no further elements, end of loop
    if(!$sourceElement && !$targetElement){
      break;
    }

    //element doesn't exist anymore
    if(!$sourceElement){
      $target.removeChild($targetElement);
      i--;
      continue;
    }

    if(!$targetElement || !same($sourceElement, $targetElement)){
      const domFn = getDomFn($targetElement);
      if(isFunction($sourceElement)){
        let range = rangesMap.get($targetElement);

        if(!range){
          range = new NodesRange();
          const { startNode } = range;
          domFn(range.extractContents());

          rangesMap.set(startNode, range);
        }

        const resFn = $sourceElement(range);

        if(resFn){
          updates.push(resFn);
        }

        range.update();

        offset += range.childNodes.length + 1;
        continue;
      }
      switch($sourceElement.nodeType){
        case TEXT_NODE:
          domFn(createTextNode($sourceElement.textContent));
          break;
        case COMMENT_NODE:
          const textContent = $sourceElement.textContent;
          const $el = createComment(textContent);
          if(isFunction(textContent)){
            updates.push(textContent($el))
          }
          domFn($el);
          break;
        case ELEMENT_NODE:
          const namespaceURI = $sourceElement.namespaceURI;
          const tagName = $sourceElement.tagName;

          const newChild = createElement(tagName.toLowerCase(), namespaceURI);

          if(!newChild[config.preventChildRenderingProp]){
            updates = updates.concat(morph($sourceElement, newChild)[0])
          }

          updates = updates.concat(copyAttributes(newChild, $sourceElement));

          domFn(newChild);

          break;
      }

      continue;
    }

    //at this point we are sure both elements exist

    //same text
    if(isSameTextNode($sourceElement, $targetElement)){
      continue;
    }

    //same node
    if(same($sourceElement, $targetElement)){
      updates = updates
        .concat(morph($sourceElement, $targetElement)[0])
        .concat(copyAttributes($targetElement, $sourceElement));

      continue;
    }
  }
  let prevValues = [];
  return [
    function update(values){
      updates.forEach(u => u(values, prevValues));
      prevValues = values;
      return update;
    },
    () => options.useDocFragment ? $target.appendChild($currentTarget) : void 0
  ];
};

