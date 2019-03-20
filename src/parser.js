import { ELEMENT_NODE, TEXT_NODE, COMMENT_NODE } from './constants';

import { render } from './html';

import {
  isDefined, isObject, isString, isPromise, isFunction, isBoolean, proxyPromise, hash,
} from './helpers';

import {
  matchModulorChunks, hasModulorChunks, buildChunk, config,
} from './config';

import { morph, copyAttributes, applyAttribute } from './morph';


const PREPROCESS_TEMPLATE_REGEX = /<([/]?)([^ />]+)((?:\s+[\w}{:-]+(?:([\s])*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)[ ]*>/igm;
const PREPROCESS_ATTR_REGEX = /([-A-Za-z0-9_}{:]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/gim;

const sanitizeTags = ['table', 'tr', 'td', 'style'];


export function prepareLiterals([firstChunk, ...restChunks]){
  return restChunks.reduce((acc, chunk, index) => {
    const keyName = buildChunk(index);
    return acc.concat(keyName).concat(chunk);
  }, firstChunk);
};

export function preprocess(str){

  return str.replace(PREPROCESS_TEMPLATE_REGEX, (input, isClosing, tagName, attrs, _, isSelfClosing) => {

    //TODO: make this workaround a part of regex, test case: test/html/processing.test.js:300
    attrs = attrs.replace(/\/$/, () => {
      isSelfClosing = '/';
      return '';
    });

    const match = attrs.match(PREPROCESS_ATTR_REGEX);

    attrs = (match && tagName !== '!--') ? ` ${config.dataAttributeName}='${JSON.stringify(match.reduce((acc, attr) => {
      const [name, value] = attr.split(/=(.*)/);
      return acc.concat({ name, value: value ? value.replace(/(^['"])|(['"]$)/g, '') : undefined });
    }, []))}'` : attrs;

    if(~sanitizeTags.indexOf(tagName) || hasModulorChunks(tagName)){
      attrs = ` ${config.specialAttributeName}="${tagName.trim()}"${attrs}`;
      tagName = config.specialTagName;
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

export function replaceTokens(text, dataMap = [], matchChunk){
  if(matchChunk){
    return dataMap[matchChunk[2]];
  }
  return text.replace(config.replaceChunkRegex, (token, _, index) => {
    const chunk = dataMap[index];
    return isDefined(chunk) ? chunk : '';
  });
};

function createCompare(applyFn, deleteFn, preventCallbacks){
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
        return !preventCallbacks && deleteFn(key, value);
      }
      if(updated){
        valuesUpdated = true;
        !preventCallbacks && applyFn(key, value);
      }
      isString(key) && (valuesObject[key] = value);
      values.set(key, {
        value: value,
        keep: false
      });
    });
    return [valuesUpdated, valuesObject];
  };
  return [set, update];
};

function createSetAttribute(target){
  return (name, value) => applyAttribute(target, { name, value });
};

function createRemoveAttribute(target){
  return (name) => {
    target.removeAttribute(name);
    isBoolean(target[name]) && (target[name] = false);
  };
};

function createAddClass(target){
  return (className) => className && target.classList.add(className);
};

function createRemoveClass(target){
  return (className) => className && target.classList.remove(className);
};

function createChangeComment(target){
  return (value) => target.textContent = value;
};

function createRender(target){
  return (value) => render(value, target);
};

function createChildrenMorpher(source){
  return (target) => {
    return (values) => {
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
    }
  }
}

export function createAttributesMorpher(attrsList){
  return (target) => {
    const preventApply = target[config.preventAttributeSet];
    const [setAttr, updateAttrs] = createCompare(
      proxyPromise(createSetAttribute(target)),
      proxyPromise(createRemoveAttribute(target)),
      preventApply
    );
    const [setClass, updateClasses] = createCompare(
      proxyPromise(createAddClass(target)),
      proxyPromise(createRemoveClass(target)),
      preventApply
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
            const newValue = replaceTokens(className, values, matchModulorChunks(className));
            const classesList = isString(newValue) ? newValue.split(' ') : [].concat((newValue || []));
            classesList.forEach(setClass);
          }
          const [classUpdated, classesMap] = updateClasses();
          attrsUpdated = attrsUpdated || classUpdated;

          newAttrValues.className = Object.keys(classesMap).join(' ');
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
  }
}

export function createValueUpdater(updateValue, text){
  const match = matchModulorChunks(text);
  let update;
  return (values, prevValues) => {
    const value = replaceTokens(text, values, match);
    const prevValue = replaceTokens(text, prevValues, match);
    if(update && value === prevValue){
      return update;
    }
    return update = updateValue(value, prevValue);
  }
}

export function processNode($container){
  const {
    nodeType, namespaceURI, textContent, tagName: containerTagName,
  } = $container;

  const tagName = containerTagName === config.specialTagName.toUpperCase()
    ? $container.getAttribute(config.specialAttributeName)
    : containerTagName;

  const childNodes = [];

  const attrsData = $container.getAttribute(config.dataAttributeName);

  const attrsList = attrsData ? JSON.parse(attrsData).map(({ name, value = true }) => ({
    name,
    value,
    matchName: matchModulorChunks(name),
    matchValue: matchModulorChunks(value),
    nameIsDynamic: hasModulorChunks(name),
    valueIsDynamic: hasModulorChunks(value),
  })) : [];


  const attributes = hasModulorChunks(attrsData) ? [] : attrsList;

  const containerChildNodes = $container.childNodes || [];
  for(let i = 0; i < containerChildNodes.length; i++){
    const $childNode = containerChildNodes[i];
    const { textContent, nodeType } = $childNode;

    if(nodeType === TEXT_NODE){
      textContent.split(config.findChunksRegex).forEach((textContent) => {
        if(!textContent){
          return;
        }
        childNodes.push(
          hasModulorChunks(textContent)
            ? (target) => {
              return createValueUpdater(createRender(target), textContent)
            }
            : {
              nodeType,
              textContent,
            }
        );
      });
      continue;
    }

    if(nodeType === COMMENT_NODE){
      childNodes.push({
        nodeType,
        textContent:
          hasModulorChunks(textContent)
            ? (target) => {
              return createValueUpdater(createChangeComment(target), textContent)
            }
            : textContent,
      });
      continue;
    }

    childNodes.push(processNode($childNode));
  }

  const nodeCopy = {
    nodeType,
    namespaceURI,
    textContent,
    attributes,
    childNodes,
    tagName,
  };

  const createPropsSetter = (target) => {

    const updateStack = [];
    const hasChildrenProp = target[config.preventChildRenderingProp];
    const hasPropsSetter = 'props' in target;

    if(hasChildrenProp){
      const childRenderer = createChildrenMorpher(nodeCopy);
      updateStack.push(childRenderer(target))
    }

    const setProps = hasPropsSetter
      ? isFunction(target.props)
        ? (props, updated) => target.props(props, updated)
        : (props, updated) => updated && (target.props = props)
      : () => {};

    if(hasModulorChunks(attrsData)){
      const handleDynamicAttrs = createAttributesMorpher(attrsList);
      updateStack.push(handleDynamicAttrs(target))
    } else {
      const staticAttrsMap = attrsList.reduce((acc, { name, value }) => {
        const canonicName = name === 'class' ? 'className' : name;
        return Object.assign(acc, { [canonicName]: value });
      }, {});

      if(hasPropsSetter){
        updateStack.push(() => [staticAttrsMap])
        setProps(staticAttrsMap, true)
      }
    }

    return (values, prevValues) => {
      const [props, updated] = updateStack.reduce(([acc, attrsUpdated], fn) => {
        const [value, updated] = fn(values, prevValues);
        return [Object.assign(acc, value), attrsUpdated || updated];
      }, [{}, false]);
      setProps(props, updated);
    };
  }

  attributes.push(createPropsSetter);

  if(hasModulorChunks(tagName)){
    return (range) => {
      const updater = createValueUpdater((newValue) => {
        const container = {
          childNodes: [
            isFunction(newValue)
            ? (range) => {
              const tagUpdate = createRender(range);
              const $el = {
                props: (value) => tagUpdate(newValue(value)),
                [config.preventAttributeSet]: true,
                [config.preventChildRenderingProp]: true
              };
              return createPropsSetter($el);
            }
            : Object.assign({}, nodeCopy, {
              tagName: newValue,
            })
          ]
        }

        return morph(container, range)[0];
      }, tagName);
      return (values, prevValues) => {
        const update = updater(values, prevValues);
        update(values, prevValues);
      };
    }
  }

  return nodeCopy;
}

const templatesCache = {};
export function parse(chunks = []){

  if(!chunks.length){
    return this;
  }

  const templateId = hash(chunks.join(buildChunk('')));
  const cached = templatesCache[templateId];

  let container;

  if(!isDefined(cached)){
    const template = prepareLiterals(chunks);
    container = processNode(config.parse(preprocess(template)));
    templatesCache[templateId] = container;
  } else {
    container = cached;
  }

  return [container, templateId];
}
