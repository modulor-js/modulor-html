import { NodesRange } from './range';
import {
  emptyNode, same, hash, regExpEscape, noop,
  isSameTextNode, isDefined, isPromise, isFunction, isObject, isBoolean
} from './helpers';

import { ELEMENT_NODE, TEXT_NODE, COMMENT_NODE, DEFAULT_NAMESPACE_URI } from './constants';

export { NodesRange, emptyNode };

const templatesCache = {};

const updatesMap = new Map();
const rangesMap = new Map();

let parser = new DOMParser();

let PREFIX = `{modulor_html_chunk_${+new Date()}:`;
let POSTFIX = '}';

const PREPROCESS_TEMPLATE_REGEX = /<([/]?)([^ />]+)((?:\s+[\w}{:-]+(?:([\s])*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)[ ]*>/igm;
const PREPROCESS_ATTR_REGEX = /([-A-Za-z0-9_}{:]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/gim;

const sanitizeTags = ['table', 'tr', 'td', 'style'];

let specialTagName = `modulor-dynamic-tag-${+new Date()}`;
let specialAttributeName = `modulor-chunk-${+new Date()}`;

let capitalisePrefix = `{modulor_capitalize-${+(new Date())}:`;
let capitaliseRegex = new RegExp(`${regExpEscape(capitalisePrefix)}([a-z]+)${regExpEscape(POSTFIX)}`, 'g');

let findChunksRegex = new RegExp(getTokenRegExp(), 'ig');
let replaceChunkRegex = new RegExp(getTokenRegExp(true), 'ig');
let matchChunkRegex = new RegExp(`^${getTokenRegExp(true)}$`);

let preventChildRenderingProp = 'preventChildRendering';

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
  } else if(chunk instanceof Node){
    return CHUNK_TYPE_ELEMENT;
  } else if(isPromise(chunk)){
    return CHUNK_TYPE_PROMISE;
  } else if(!isDefined(chunk)){
    return CHUNK_TYPE_UNDEFINED;
  }
  return CHUNK_TYPE_TEXT;
}

function replaceTokens(text, dataMap = []){
  return text.replace(replaceChunkRegex, (token, _, index) => {
    const chunk = dataMap[index];
    return isDefined(chunk) ? chunk : '';
  });
};

function applyAttribute(target, { name, value }, isBoolean){
  if(isPromise(value)){
    value.then((result) => applyAttribute(target, { name, value: result }, isBoolean));
    return;
  }

  if(name === 'style'){
    isObject(value)
      ? Object.assign(target.style, value)
      : target.setAttribute(name, value);
    return;
  }

  if(isFunction(name)){
    name(target, value);
    return;
  }

  const forceSetAttribute = isBoolean && value === '';

  if(!forceSetAttribute && name in target){
    try {
      target[name] = value;
      return;
    } catch(e) {}
  }
  target.setAttribute(name, value);
}

function applyClassFn(value, fn){
  if(!isDefined(value) || value === ''){
    return;
  }
  const chunkType = getChunkType(value);
  if(chunkType === CHUNK_TYPE_PROMISE){
    return value.then((newValue) => applyClassFn(newValue, fn));
  }
  let classesArray = chunkType === CHUNK_TYPE_ARRAY ? value : ('' + value).split(' ');
  return classesArray.forEach((className) => fn(className));
}

function createVirtualElement(extend){
  let classes = {};
  const element = Object.assign({
    props: noop,
    tagName: null,
    setAttribute: (name, value) => {
      if(name === 'class'){
        classes = value.split(' ').reduce((acc, className) => Object.assign(acc, {
          [className]: true
        }), {});
      }
    },
    removeAttribute: noop,
    classList: {
      add: (value) => {
        classes[value] = true;
        element.className = Object.keys(classes).join(' ').trim();
      },
      remove: (value) => {
        delete classes[value];
        element.className = Object.keys(classes).join(' ').trim();
      }
    },
    className: '',
    attributes: [],
    childNodes: [],
    appendChild: noop,
    isVirtual: true,
    [preventChildRenderingProp]: true
  }, extend);
  return element;
};


function processNode($container){
  const nodeCopy = {
    nodeType: $container.nodeType,
    namespaceURI: $container.namespaceURI,
    textContent: $container.textContent,
    attributes: [],
    childNodes: [],
  };

  const { attributes, childNodes } = nodeCopy;

  const childAttributes = $container.attributes || [];

  const dynamicAttributes = [];

  for(let j = 0; j < childAttributes.length; j++){
    const value = childAttributes[j].value;
    const name = childAttributes[j].name.replace(capitaliseRegex, (_, letter) => {
      return letter.toUpperCase();
    });
    if(name === specialAttributeName){
      continue;
    }

    const nameIsDynamic = name.match(findChunksRegex);
    const valueIsDynamic = value.match(findChunksRegex);

    const matchName = name.match(matchChunkRegex);
    const matchValue = value.match(matchChunkRegex);

    if(name === 'class'){
      const [dynamic, initial] = value.split(' ').reduce((acc, className) => {
        acc[className.match(findChunksRegex) ? 0 : 1].push(className);
        return acc;
      }, [[], []]);
      attributes.push({ name, value: initial.join(' ') });
      dynamic.length && attributes.push((target) => {
        return (values, prevValues) => {
          const updated = dynamic.reduce((acc, className) => {
            const matchClass = className.match(matchChunkRegex);
            const newValue = matchClass ? values[matchClass[2]] : replaceTokens(className, values);
            const oldValue = matchClass ? prevValues[matchClass[2]] : replaceTokens(className, prevValues);
            if(oldValue !== newValue){
              oldValue && applyClassFn(oldValue, (className) => target.classList.remove(className));
              newValue && applyClassFn(newValue, (className) => target.classList.add(className));
              return true;
            }
            return acc;
          }, false);
          return [{ className: target.className }, updated];
        };
      });
      continue;
    }

    if(nameIsDynamic || valueIsDynamic){
      dynamicAttributes.push({ name, value, matchName, matchValue });
    } else {
      attributes.push({ name, value, isBoolean: isBoolean($container[name]) });
    }
  }

  if(dynamicAttributes.length){
    attributes.push((target) => {
      let attrValues = {};
      let preparedPrevName, preparedPrevValue;
      return function update(values, prevValues){
        const newAttrValues = {};
        let updated = false;
        for(let { name, value, matchName, matchValue } of dynamicAttributes){
          const preparedName = matchName ? values[matchName[2]] : replaceTokens(name, values);
          const preparedPrevName = matchName ? prevValues[matchName[2]] : replaceTokens(name, prevValues);

          const preparedValue = matchValue ? values[matchValue[2]] : replaceTokens(value, values);
          const preparedPrevValue = matchValue ? prevValues[matchValue[2]] : replaceTokens(value, prevValues);

          const chunkUpdated = (preparedName !== preparedPrevName) || (preparedValue !== preparedPrevValue);
          chunkUpdated && (updated = true);

          if(!preparedName){
            continue;
          }

          const newAttributes = [];

          if(isObject(preparedName)){
            for(let key in preparedName){
              const val = preparedName[key];
              newAttributes.push({ name: key, value: val, updated: val !== attrValues[key] });
            }
          } else {
            newAttributes.push({ name: preparedName, value: preparedValue, updated: chunkUpdated });
          }

          for(let { name, value, updated } of newAttributes){
            (typeof name === 'string') && (newAttrValues[name] = value);
            updated && applyAttribute(target, { name, value }, isBoolean($container[name]));
          }

        }
        for(let key in attrValues){
          !(key in newAttrValues) && target.removeAttribute(key);
        }
        attrValues = newAttrValues;
        return [newAttrValues, updated];
      };
    });
  }

  const containerChildNodes = $container.childNodes || [];
  for(let i = 0; i < containerChildNodes.length; i++){
    const $childNode = containerChildNodes[i];
    if($childNode.nodeType === TEXT_NODE){
      const chunks = $childNode.textContent.split(findChunksRegex);
      chunks.filter(chunk => !!chunk).forEach((chunk) => {
        const match = chunk.match(matchChunkRegex);
        if(match){
          const matchIndex = match[2];
          childNodes.push((range) => {
            return (values) => render(values[matchIndex], range);
          });
        } else {
          childNodes.push({
            nodeType: TEXT_NODE,
            textContent: chunk,
          });
        }
      });
      continue;
    }
    if($childNode.nodeType === COMMENT_NODE){
      if($childNode.textContent.match(findChunksRegex)){
        childNodes.push((range) => {
          const $element = document.createComment('');
          const content = $childNode.textContent;
          range.appendChild($element);
          return (values) => {
            $element.textContent = replaceTokens(content, values);
          };
        });
      } else {
        childNodes.push({
          nodeType: COMMENT_NODE,
          textContent: $childNode.textContent,
        });
      }
      continue;
    }
    childNodes.push(processNode($childNode));
  }

  const tagName = $container.tagName;
  if(tagName === specialTagName.toUpperCase()){
    const chunkName = $container.attributes[specialAttributeName].value;
    const matchChunk = chunkName.match(matchChunkRegex);

    if(chunkName.match(findChunksRegex)){
      return (range) => {
        let update;
        return (values, prevValues) => {
          const newValue = matchChunk ? values[matchChunk[2]] : replaceTokens(chunkName, values);
          const oldValue = matchChunk ? prevValues[matchChunk[2]] : replaceTokens(chunkName, prevValues);

          if(update && newValue === oldValue){
            return update(values);
          }
          const chunkType = getChunkType(newValue);

          const container = {
            childNodes: [Object.assign({}, nodeCopy, {
              tagName: newValue
            })]
          };

          if(chunkType === CHUNK_TYPE_FUNCTION){
            const target = {
              appendChild: noop,
              replaceChild: noop,
              childNodes: [createVirtualElement({
                props: (value) => render(newValue(value), range)
              })]
            };
            [update] = morph(container, target);
            return update(values);
          }

          const [newUpdate, initialRender] = morph(container, range, { useDocFragment: true });
          newUpdate(values);
          initialRender();
          update = newUpdate;
        };
      };
    }
    nodeCopy.tagName = chunkName.toUpperCase();
  } else if(tagName){
    nodeCopy.tagName = $container.tagName.toUpperCase();
  }


  return nodeCopy;
}

function generateContainer(markup){
  return processNode(parser.parseFromString(markup, "text/html").body);
};

function prepareLiterals([firstChunk, ...restChunks]){
  return restChunks.reduce((acc, chunk, index) => {
    const keyName = `${PREFIX}${index}${POSTFIX}`;
    return acc.concat(keyName).concat(chunk);
  }, firstChunk);
};

function getTokenRegExp(groupMatches){
  const indexRegex = `${groupMatches ? '(' : ''}\\d+${groupMatches ? ')' : ''}`;
  return `(${regExpEscape(PREFIX)}${indexRegex}${regExpEscape(POSTFIX)})`;
};

function preprocess(str){

  return str.replace(PREPROCESS_TEMPLATE_REGEX, (input, isClosing, tagName, attrs, _, isSelfClosing) => {

    //TODO: make this workaround a part of regex, test case: test/html/processing.test.js:300

    attrs = attrs.replace(/\/$/, () => {
      isSelfClosing = '/';
      return '';
    }).replace(PREPROCESS_ATTR_REGEX, (attrBlock, attrName) => {
      return attrBlock.replace(attrName, attrName.replace(/[A-Z]/gm, letter => `${capitalisePrefix}${letter}${POSTFIX}`));
    });

    if(~sanitizeTags.indexOf(tagName) || tagName.match(findChunksRegex)){
      attrs = ` ${specialAttributeName}="${tagName.trim()}"${attrs}`;
      tagName = specialTagName;
    }

    if(isSelfClosing){
      return `<${tagName}${attrs}></${tagName}>`
    }
    if(isClosing){
      return `</${tagName}>`;
    }
    return `<${isClosing}${tagName}${attrs}>`;
  });
};

export function render(value, range = document.createDocumentFragment()){
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
    const textNode = document.createTextNode(value);
    range.appendChild(textNode);
    return (value) => textNode.textContent = value;
  },
  [CHUNK_TYPE_ELEMENT]: (range, value) => {
    range.appendChild(value);
    return (value) => {
      if(range.childNodes.length > 1){
        range.childNodes.slice(1).forEach(node => range.removeChild(node));
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

function copyAttributes(target, source, interceptChildrenRendering){
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

    const { name, value, isBoolean } = attr;

    applyAttribute(target, { name, value }, isBoolean);
    props[name === 'class' ? 'className' : name] = value;
  }

  if(target[preventChildRenderingProp]){
    updates.push((values, prevValues) => {
      const children = (range, update) => {
        if(update){
          update(values);
          return update;
        }
        const [newUpdate, initialRender] = morph(source, range, { useDocFragment: true });
        newUpdate(values);
        initialRender();
        return newUpdate;
      };
      return [{ children }, true];
    });
  }

  if('props' in target){
    const setProps = isFunction(target.props)
      ? target.props
      : (props, updated) => updated && (target.props = props);
    if(updates.length){
      return [(values, prevValues) => {
        const [newProps, updated] = updates.reduce(([props, accUpdated], u) => {
          const [updatedProps, updated] = u(values, prevValues);
          return [Object.assign({}, props, updatedProps), accUpdated || updated];
        }, [props, false]);
        setProps(newProps, updated);
      }];
    }
    setProps(props, true);
  }
  return updates;

}

export function morph($source, $target, options = {}){

  if($target[preventChildRenderingProp]){
    return [noop, []];
  }

  let updates = [];

  const $currentTarget = options.useDocFragment ? document.createDocumentFragment() : $target;

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
          domFn(document.createTextNode($sourceElement.textContent));
          break;
        case COMMENT_NODE:
          domFn(document.createComment($sourceElement.textContent));
          break;
        case ELEMENT_NODE:
          const namespaceURI = $sourceElement.namespaceURI;
          const tagName = $sourceElement.tagName;

          let newChild;
          let morphUpdates = [];
          if($targetElement && $targetElement[preventChildRenderingProp]){
            newChild = $targetElement;
          } else {
            newChild = namespaceURI === DEFAULT_NAMESPACE_URI
              ? document.createElement(tagName.toLowerCase())
              : document.createElementNS(namespaceURI, tagName.toLowerCase());

          }

          updates = updates.concat(morph($sourceElement, newChild)[0])
            .concat(copyAttributes(newChild, $sourceElement));

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
      updates.forEach(u => u(values, prevValues))
      prevValues = values;
      return update;
    },
    () => options.useDocFragment ? $target.appendChild($currentTarget) : void 0
  ];
};


export function html(chunks = [], ...values){

  if(!chunks.length){
    return this;
  }

  const templateId = hash(chunks.join(PREFIX + POSTFIX));
  const cached = templatesCache[templateId];

  let container;

  if(!isDefined(cached)){
    const template = prepareLiterals(chunks);
    container = generateContainer(preprocess(template));
    templatesCache[templateId] = container;
  } else {
    container = cached;
  }


  function renderFn(target = document.createDocumentFragment(), result){
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
export function stopNode(){};

// expose some methods for testing
// below will not get to final bundle because of tree shacking
if(process.env.NODE_ENV === 'test'){
  Object.assign(module.exports, {
    replaceTokens, processNode, generateContainer,
    copyAttributes, prepareLiterals,
    preprocess,
    setPrefix: (value) => PREFIX = value,
    setPostfix: (value) => POSTFIX = value,
    setCapitalisePrefix: (value) => {
      capitalisePrefix = value;
      capitaliseRegex = new RegExp(`${regExpEscape(capitalisePrefix)}([a-z]+)${regExpEscape(POSTFIX)}`, 'g');
    },
    setSpecialTagName: (value) => specialTagName = value,
    setSpecialAttributeName: (value) => specialAttributeName = value,
    updateChunkRegexes: () => {
      findChunksRegex = new RegExp(getTokenRegExp(), 'ig');
      replaceChunkRegex = new RegExp(getTokenRegExp(true), 'ig');
      matchChunkRegex = new RegExp(`^${getTokenRegExp(true)}$`);
    }
  });
}

