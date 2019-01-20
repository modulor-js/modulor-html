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
let dataAttributeName = `modulor-data-attributes-${+new Date()}`;

let findChunksRegex = new RegExp(getTokenRegExp(), 'i');
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

function replaceTokens(text, dataMap = [], matchChunk){
  if(matchChunk){
    return dataMap[matchChunk[2]];
  }
  return text.replace(replaceChunkRegex, (token, _, index) => {
    const chunk = dataMap[index];
    return isDefined(chunk) ? chunk : '';
  });
};

function applyAttribute(target, { name, value }){
  if(isPromise(value)){
    value.then((result) => applyAttribute(target, { name, value: result }));
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

  if(name in target){
    isBoolean(target[name]) && (value !== false) && target.setAttribute(name, value);
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

function createCompare(applyFn, deleteFn){
  const values = new Map();
  const set = (key, value) => {
    values.set(key, {
      value: value,
      updated: (values.get(key) || {}).value !== value,
      keep: true,
    })
  };
  const update = () => {
    const valuesObject = {};
    let valuesUpdated = false;
    values.forEach(({ updated, value, keep }, key) => {
      if(!keep){
        values.delete(key);
        valuesUpdated = true;
        return deleteFn(key, value);
      }
      if(updated){
        valuesUpdated = true;
        applyFn(key, value);
      }
      (typeof key === 'string') && (valuesObject[key] = value);
      values.set(key, {
        value: value,
        keep: false
      });
    });
    return [valuesUpdated, valuesObject];
  };
  return [set, update];
};

function processNode($container){
  const nodeCopy = {
    nodeType: $container.nodeType,
    namespaceURI: $container.namespaceURI,
    textContent: $container.textContent,
    attributes: [],
    childNodes: [],
  };

  const { childNodes } = nodeCopy;

  const attrsData = $container.getAttribute(dataAttributeName);
  const isDynamic = findChunksRegex.exec(attrsData);

  const attrsList = attrsData ? JSON.parse(attrsData).map(({ name, value = true }) => ({
    name,
    value,
    matchName: matchChunkRegex.exec(name),
    matchValue: matchChunkRegex.exec(value),
    nameIsDynamic: findChunksRegex.test(name),
    valueIsDynamic: findChunksRegex.test(value),
  })) : [];

  nodeCopy.attributes = isDynamic ? [(target) => {
    const [setAttr, updateAttrs] = createCompare(
      (name, value) => applyAttribute(target, { name, value }),
      (name) => {
        target.removeAttribute(name);
        isBoolean(target[name]) && (target[name] = false);
      }
    );
    const [setClass, updateClasses] = createCompare(
      (key) => applyClassFn(key, (className) => target.classList.add(className)),
      (key) => applyClassFn(key, (className) => target.classList.remove(className))
    );

    return function update(values){
      const newAttrValues = {};
      let attrsUpdated = false;
      for(let index in attrsList){
        const { name, value, matchName, matchValue, nameIsDynamic, valueIsDynamic } = attrsList[index];

        const preparedName = nameIsDynamic ? replaceTokens(name, values, matchName) : name;

        if(preparedName === 'class'){
          const classes = value.split(' ');
          for(let index in classes){
            const className = classes[index];
            const newValue = replaceTokens(className, values, className.match(matchChunkRegex));
            newValue && setClass(newValue, true);
          }
          const [classUpdated] = updateClasses();
          attrsUpdated = attrsUpdated || classUpdated;

          newAttrValues.className = target.className;
          continue;
        }

        const preparedValue = valueIsDynamic ? replaceTokens(value, values, matchValue) : value;

        if(!preparedName){
          continue;
        }

        if(isObject(preparedName)){
          for(let key in preparedName){
            setAttr(key, preparedName[key]);
          }
        } else {
          setAttr(preparedName, preparedValue);
        }
      }

      const [attributesUpdated, attributesValues] = updateAttrs();

      return [
        Object.assign(newAttrValues, attributesValues),
        attrsUpdated || attributesUpdated
      ];
    };
  }] : attrsList;

  const containerChildNodes = $container.childNodes || [];
  for(let i = 0; i < containerChildNodes.length; i++){
    const $childNode = containerChildNodes[i];

    if($childNode.nodeType === TEXT_NODE){
      $childNode.textContent.split(findChunksRegex).forEach((chunk) => {
        if(!chunk){
          return;
        }
        const match = matchChunkRegex.exec(chunk);
        childNodes.push(match ? (range) => {
          return (values) => render(values[match[2]], range);
        } : {
          nodeType: TEXT_NODE,
          textContent: chunk,
        });
      });
      continue;
    }

    if($childNode.nodeType === COMMENT_NODE){

      childNodes.push($childNode.textContent.match(findChunksRegex) ? (range) => {
        const $element = document.createComment('');
        const content = $childNode.textContent;
        range.appendChild($element);
        return (values) => {
          $element.textContent = replaceTokens(content, values);
        };
      } : {
        nodeType: COMMENT_NODE,
        textContent: $childNode.textContent,
      });
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
          const newValue = replaceTokens(chunkName, values, matchChunk);
          const oldValue = replaceTokens(chunkName, prevValues, matchChunk);

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
    });

    const match = attrs.match(PREPROCESS_ATTR_REGEX);

    attrs = (match && tagName !== '!--') ? ` ${dataAttributeName}='${JSON.stringify(match.reduce((acc, attr) => {
      const [name, value] = attr.split('=');
      return acc.concat({ name, value: value ? value.replace(/^['"]([^'"]*)['"]$/, '$1') : undefined });
    }, []))}'` : attrs;

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

    const { name, value } = attr;

    applyAttribute(target, { name, value });
    props[name === 'class' ? 'className' : name] = value;
  }

  if(target[preventChildRenderingProp]){
    updates.push((values) => {
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
    setDataAttributeName: (value) => dataAttributeName = value,
    updateChunkRegexes: () => {
      findChunksRegex = new RegExp(getTokenRegExp(), 'i');
      replaceChunkRegex = new RegExp(getTokenRegExp(true), 'ig');
      matchChunkRegex = new RegExp(`^${getTokenRegExp(true)}$`);
    }
  });
}

