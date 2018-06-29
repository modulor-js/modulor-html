import { NodesRange } from './range';

const templatesCache = {};

const NODE_TYPES = {
  FUNCTION_NODE: -1,
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12
};


function emptyNode(node){
  const { childNodes } = node;
  for(let i = 0; i < childNodes.length; i++){
    node.removeChild(childNodes[i]);
  }
}

function same(nodeA, nodeB){
  if(nodeA.nodeType !== nodeB.nodeType){
    return false;
  }
  return nodeA.tagName && nodeB.tagName &&
         nodeA.tagName.toLowerCase() === nodeB.tagName.toLowerCase();
};

function isSameTextNode(nodeA, nodeB){
  return NODE_TYPES.TEXT_NODE === nodeA.nodeType === nodeA.nodeType &&
         nodeA.textContent === nodeB.textContent;
};

function isDefined(value){
  return typeof value !== 'undefined';
}

function isPromise(obj){
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

function isFunction(value){
  return typeof value == 'function';
}

//hash function taken from https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
  var hash = 5381,
      i    = str.length;
  while(i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }
  return hash >>> 0;
};

function regExpEscape(literalString){
  return literalString.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
};

function getChunkType(chunk){
  if(isFunction(chunk)){
    return 'function';
  } else if(chunk instanceof Array){
    return 'array';
  } else if(chunk instanceof Node){
    return 'element';
  } else if(isPromise(chunk)){
    return 'futureResult';
  } else if(!isDefined(chunk)){
    return 'undefined';
  }
  return 'text';
}

function setAttribute($target, attributeName, attributeValue){
  if(attributeValue !== '' && attributeName !== 'style' && attributeName in $target){
    $target[attributeName] = attributeValue;
    return;
  }
  $target.setAttribute(attributeName, attributeValue);
}

/**
 *  stopNode directive
 *  @deprecated
 * */
export function stopNode(){};

const DEFAULT_PREFIX  = `{modulor_html_chunk_${+new Date()}:`;
const DEFAULT_POSTFIX = '}';
const DEFAULT_PARSER = new DOMParser();

const DEFAULT_SANITIZE_NODE_PREFIX = `modulor_sanitize_node_${+(new Date())}:`;

const sanitizeTags = ['table', 'tr', 'td'];
const sanitizeTagsRegex = new RegExp(`<([ /])?(${sanitizeTags.join('|')})([ ][^]>)?`, 'igm');


export function createHtml(options = {}){

  const PREFIX = options.PREFIX || DEFAULT_PREFIX;
  const POSTFIX = options.POSTFIX || DEFAULT_POSTFIX;

  const parser = options.parser || DEFAULT_PARSER;

  const splitChunkRegex = new RegExp(getTokenRegExp(), 'ig');
  const findChunksRegex = new RegExp(getTokenRegExp(), 'ig');
  const replaceChunkRegex = new RegExp(getTokenRegExp(true), 'ig');
  const matchChunkRegex = new RegExp(`^${getTokenRegExp(true)}$`);

  const sanitizeNodePrefix = options.SANITIZE_NODE_PREFIX || DEFAULT_SANITIZE_NODE_PREFIX;

  function getChunkById(id, dataMap = []){
    return dataMap[id];
  };

  function replaceTokens(text, dataMap = []){
    return text.replace(replaceChunkRegex, (token, _, index) => {
      const chunk = getChunkById(index, dataMap);
      return isDefined(chunk) ? chunk : '';
    });
  };

  function processNode($container){
    const nodeCopy = {
      nodeType: $container.nodeType,
      textContent: $container.textContent,
      attributes: [],
      childNodes: []
    };

    if($container.tagName){
      nodeCopy.tagName = $container.tagName.toLowerCase().replace(sanitizeNodePrefix, '').toUpperCase();
    }

    const childAttributes = $container.attributes || [];
    for(let j = 0; j < childAttributes.length; j++){
      const { name, value }  = childAttributes[j];

      const nameIsDynamic = name.match(findChunksRegex);
      const valueIsDynamic = value.match(findChunksRegex);

      const matchName = name.match(matchChunkRegex);
      const matchValue = value.match(matchChunkRegex);

      if(nameIsDynamic || valueIsDynamic){
        nodeCopy.attributes.push((target) => {

          if(name === 'class'){
            target.className = '';
            return value.split(' ').reduce((acc, className) => {
              if(!className.match(findChunksRegex)){
                target.classList.add(className);
                return acc;
              }
              return acc.concat((values, prevValues) => {
                const newValue = replaceTokens(className, values);
                const oldValue = replaceTokens(className, prevValues);
                if(oldValue !== newValue){
                  oldValue && target.classList.remove(oldValue);
                  newValue && target.classList.add(newValue);
                }
              });
            }, []);
          }

          return [(values, prevValues) => {
            const preparedName = matchName ? getChunkById(matchName[2], values) : replaceTokens(name, values);
            const preparedPrevName = matchName ? getChunkById(matchName[2], prevValues) : replaceTokens(name, prevValues);

            const preparedValue = matchValue ? getChunkById(matchValue[2], values) : replaceTokens(value, values);
            const preparedPrevValue = matchValue ? getChunkById(matchValue[2], prevValues) : replaceTokens(value, prevValues);

            if(preparedName === preparedPrevName && preparedValue === preparedPrevValue){
              return;
            }

            if(preparedName !== preparedPrevName){
              target.removeAttribute(preparedPrevName);
            }

            if(!preparedName){
              return;
            }

            if(getChunkType(preparedName) === 'function'){
              preparedName(target, preparedValue);
              return;
            }

            if(getChunkType(preparedValue) === 'futureResult'){
              preparedValue.then((result) => setAttribute(target, preparedName, result));
              return;
            }

            setAttribute(target, preparedName, preparedValue);
          }];

        });
      } else {
        nodeCopy.attributes.push({ name, value });
      }
    }

    const childNodes = $container.childNodes || [];
    for(let i = 0; i < childNodes.length; i++){
      const $childNode = childNodes[i];
      if($childNode.nodeType === NODE_TYPES.TEXT_NODE){
        const chunks = $childNode.textContent.split(splitChunkRegex);
        chunks.filter(chunk => !!chunk).forEach((chunk) => {
          const match = chunk.match(matchChunkRegex);
          if(match){
            const matchIndex = match[2];
            nodeCopy.childNodes.push((range) => {
              return (values) => renderChunk(getChunkById(matchIndex, values), range);
            });
          } else {
            nodeCopy.childNodes.push({
              nodeType: NODE_TYPES.TEXT_NODE,
              textContent: chunk,
            });
          }
        });
        continue;
      }
      if($childNode.nodeType === NODE_TYPES.COMMENT_NODE && $childNode.textContent.match(findChunksRegex)){
        nodeCopy.childNodes.push((range) => {
          const $element = document.createComment('');
          const content = $childNode.textContent;
          range.appendChild($element);
          return (values) => {
            $element.textContent = replaceTokens(content, values);
          };
        });
        continue;
      }
      nodeCopy.childNodes.push(processNode($childNode));
    }

    return nodeCopy;
  }

  function generateContainer(markup){
    return processNode(parser.parseFromString(markup, "text/html").body);
  };

  function generateTokenName(index){
    return `${PREFIX}${index}${POSTFIX}`;
  };

  function prepareLiterals([firstChunk, ...restChunks]){
    return restChunks.reduce((acc, chunk, index) => {
      const keyName = generateTokenName(index);
      return acc.concat(keyName).concat(chunk);
    }, firstChunk);
  };

  function getTokenRegExp(groupMatches){
    const indexRegex = `${groupMatches ? '(' : ''}\\d+${groupMatches ? ')' : ''}`;
    return `(${regExpEscape(PREFIX)}${indexRegex}${regExpEscape(POSTFIX)})`;
  };

  function sanitize(str){
    return str.replace(sanitizeTagsRegex, `<$1${sanitizeNodePrefix}$2`);
  };

  const updatesMap = new Map();
  const rangesMap = new Map();

  function renderChunk(value, range, chunkType = getChunkType(value)){
    const cached = updatesMap.get(range) || {};
    const { lastChunk, lastRenderedChunkType, update } = cached;
    if(lastChunk === value){
      return range;
    }
    if(chunkType === 'futureResult'){
      chunkProcessingFunctions['futureResult'](range, value);
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
    'array': (range, value) => {
      const preprocessedChunksContainer = {
        childNodes: [].concat(value).map((chunk, index) => {
          return (range) => (values) => renderChunk(values[index], range);
        })
      };
      const [update, initialRender] = morph(preprocessedChunksContainer, range, { useDocFragment: true });
      update(value);
      initialRender();
      return (newValue) => {
        if(newValue.length !== value.length){
          return chunkProcessingFunctions['array'](range, newValue);
        }
        update(newValue);
      }
    },
    'undefined': emptyNode,
    'text': (range, value) => {
      const textNode = document.createTextNode(value);
      range.appendChild(textNode);
      return (value) => textNode.textContent = value;
    },
    'element': (range, value) => {
      range.appendChild(value);
      return (value) => {
        if(range.childNodes.length > 1){
          range.childNodes.slice(1).forEach(node => range.removeChild(node));
        }
        range.replaceChild(value, range.childNodes[0]);
      }
    },
    'futureResult': (range, value) => {
      value.then((response) => {
        range.update();
        renderChunk(response, range);
      });
    },
    'function': (range, value) => {
      let result = value(range);
      return (value) => {
        result = value(range, result);
      }
    },
  };

  function copyAttributes(target, source){
    const sourceAttributes = source.attributes;
    const targetAttributes = target.attributes;

    for(let i = 0; i < targetAttributes.length; i++){
      target.removeAttribute(targetAttributes[i].name);
    }

    let updates = [];

    for(let i = 0; i < sourceAttributes.length; i++){
      const attr = sourceAttributes[i];

      if(isFunction(attr)){
        updates = updates.concat(attr(target));
        continue;
      }

      const { name, value } = attr;
      setAttribute(target, name, value);
    }

    return updates;
  }

  function morph($source, $target, options = {}){

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
          case NODE_TYPES.COMMENT_NODE:
            const $element = document.createComment('');
            const content = $sourceElement.textContent;
            domFn($element);
            break;
          case NODE_TYPES.ELEMENT_NODE:
            const newChild = document.createElement($sourceElement.tagName.toLowerCase());

            updates = updates
              .concat(morph($sourceElement, newChild)[0])
              .concat(copyAttributes(newChild, $sourceElement));

            domFn(newChild);

            break;
          case NODE_TYPES.TEXT_NODE:
            domFn(document.createTextNode($sourceElement.textContent));
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


  function render(template, target = document.createDocumentFragment()){
    return renderChunk(template, target, 'function');
  }

  function html(chunks = [], ...values){

    if(!chunks.length){
      return this;
    }

    let templateId = hash(chunks.join(PREFIX + POSTFIX));
    const cached = templatesCache[templateId];

    let container;

    if(!isDefined(cached)){
      const template = prepareLiterals(chunks);
      container = generateContainer(sanitize(template));
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

  return {
    html,
    render,
    renderChunk,
    prepareLiterals,
    generateContainer,
    sanitize,
    replaceTokens,
    copyAttributes,
    morph,
    processNode,
  }
};

export const { html, render, renderChunk } = createHtml({});

export const r = (...args) => render(html(...args));

export const until = (promise, defaultContent) => (range) => {
  renderChunk(defaultContent, range);
  renderChunk(promise, range);
};

