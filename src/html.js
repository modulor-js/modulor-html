import { NodesRange } from './range';

const templatesCache = {};

const NODE_TYPES = {
  TEMPLATE_NODE: -1,
  TEXT_RESULT_NODE: -2,
  PROMISE_NODE: -3,
  ELEMENT_RESULT_NODE: -4,
  CHUNK_NODE: -5,
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

function same(nodeA, nodeB){
  if(!nodeA || !nodeB){
    return false;
  }
  if(nodeA.nodeType !== nodeB.nodeType){
    return false;
  }
  if(nodeA.range != nodeB.range){
    return false;
  }
  if(nodeA.tagName && nodeB.tagName &&
    (nodeA.tagName.toLowerCase() === nodeB.tagName.toLowerCase())
  ){
    return true;
  }
  return false;
};

function isSameTextNode(nodeA, nodeB){
  if(nodeA.nodeType === NODE_TYPES.TEXT_NODE && nodeA.nodeType === NODE_TYPES.TEXT_NODE && nodeA.textContent === nodeB.textContent){
    return true;
  }
  return false;
};

function isDefined(value){
  return typeof value !== 'undefined';
}

function isPromise(obj){
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
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
  if(chunk instanceof Node){
    return 'element';
  } else if(chunk instanceof Template){
    return 'template';
  } else if(isPromise(chunk)){
    return 'futureResult';
  } else if(typeof chunk == 'function'){
    return 'function';
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


export const containersMap = new Map();

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

    const childNodes = $container.childNodes || [];
    for(let i = 0; i < childNodes.length; i++){
      if(childNodes[i].nodeType === NODE_TYPES.TEXT_NODE){
        const chunks = childNodes[i].textContent.split(splitChunkRegex);
        chunks.filter(chunk => !!chunk).forEach((chunk) => {
          const match = chunk.match(matchChunkRegex);
          if(match){
            nodeCopy.childNodes.push({
              nodeType: NODE_TYPES.CHUNK_NODE,
              matchIndex: match[2]
            });
          } else {
            nodeCopy.childNodes.push({
              nodeType: NODE_TYPES.TEXT_RESULT_NODE,
              textContent: chunk,
            });
          }
        });
        continue;
      }
      nodeCopy.childNodes.push(processNode(childNodes[i]));
    }

    const childAttributes = $container.attributes || [];
    for(let j = 0; j < childAttributes.length; j++){
      const { name, value }  = childAttributes[j];
      nodeCopy.attributes.push({ name, value });
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

  function copyTextNodeChunks(chunks){
    const container = {
      childNodes: [].concat(chunks).reduce((acc, chunk) => {

        if(!isDefined(chunk)){
          return acc;
        }

        const chunkType = getChunkType(chunk);

        const $el = {};

        if(chunkType === 'text'){
          $el.nodeType = NODE_TYPES.TEXT_RESULT_NODE;
          $el.textContent = chunk;
        }
        if(chunkType === 'element'){
          $el.nodeType = NODE_TYPES.ELEMENT_RESULT_NODE;
        }
        if(chunkType === 'template'){
          $el.nodeType = NODE_TYPES.TEMPLATE_NODE;
        }
        if(chunkType === 'futureResult'){
          $el.nodeType = NODE_TYPES.PROMISE_NODE;
        }

        $el[chunkType] = chunk;

        return acc.concat($el);
      }, [])
    };
    return container;
  };

  function copyAttributes(target, source){
    const sourceAttributes = source.attributes;
    const targetAttributes = target.attributes;

    const updates = [];
    const attributesToKeep = {};

    for(let i = 0; i < sourceAttributes.length; i++){
      const { name, value }  = sourceAttributes[i];
      const nameIsDynamic = name.match(findChunksRegex);
      const valueIsDynamic = value.match(findChunksRegex);

      attributesToKeep[name] = true;

      if(!nameIsDynamic && !valueIsDynamic){
        setAttribute(target, name, value);
        continue;
      }

      if(name === 'class'){
        target.className = '';
        value.split(' ').forEach((className) => {
          if(!className.match(findChunksRegex)){
            target.classList.add(className);
            return;
          }
          updates.push((values, prevValues) => {
            const newValue = replaceTokens(className, values);
            const oldValue = replaceTokens(className, prevValues);
            if(oldValue !== newValue){
              oldValue && target.classList.remove(oldValue);
              newValue && target.classList.add(newValue);
            }
          });
        });

        continue;
      }

      const matchName = name.match(matchChunkRegex);
      const matchValue = value.match(matchChunkRegex);

      updates.push((values, prevValues) => {
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
      });
    }


    for(let i = 0; i < targetAttributes.length; i++){
      let { name } = targetAttributes[i];
      if(!attributesToKeep[name]){
        target.removeAttribute(name);
      }
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
        const getRange = ($targetElement, replacementType) => {

          if($targetElement && $targetElement.range && $targetElement.replacementType === replacementType){
            return $targetElement.range;
          } else {
            const range = new NodesRange(document.createTextNode(''), document.createTextNode(''));
            const { startNode } = range;
            startNode.range = range;
            startNode.replacementType = replacementType;
            domFn(range.extractContents());
            return range;
          }
        }
        switch($sourceElement.nodeType){
          //regular DOM nodes
          case NODE_TYPES.COMMENT_NODE:
            const $element = document.createComment('');
            const content = $sourceElement.textContent;
            domFn($element);
            updates.push((values, prevValues) => {
              $element.textContent = replaceTokens(content, values);
            });
            break;
          case NODE_TYPES.ELEMENT_NODE:
            const newChild = document.createElement($sourceElement.tagName.toLowerCase());

            updates = updates
              .concat(morph($sourceElement, newChild)[0])
              .concat(copyAttributes(newChild, $sourceElement));

            domFn(newChild);

            break;

          //custom nodes
          //@TODO cover this case by tests
          case NODE_TYPES.TEXT_NODE:
          case NODE_TYPES.TEXT_RESULT_NODE:
            domFn(document.createTextNode($sourceElement.textContent));
            break;
          case NODE_TYPES.CHUNK_NODE:
            {
              const matchIndex = $sourceElement.matchIndex;
              const range = getRange($targetElement, 'chunkRange');
              const updateFn = (values, prevValues) => {
                const newValue = getChunkById(matchIndex, values);
                const oldValue = getChunkById(matchIndex, prevValues);

                if(newValue === oldValue){
                  return;
                }

                const preocessedChunksContainer = copyTextNodeChunks(newValue);
                const [subUpdates, initialRender] = morph(preocessedChunksContainer, range, { useDocFragment: true });
                initialRender();
              }
              updates.push(updateFn);
              offset += range.childNodes.length + 1;
            }
            break;
          case NODE_TYPES.TEMPLATE_NODE:
            {
              const range = getRange($targetElement, 'template');

              $sourceElement.template.render(range);
              range.update();
              offset += range.childNodes.length + 1;

              break;
            }
          case NODE_TYPES.PROMISE_NODE:
            {
              const range = getRange($targetElement, 'futureResult');

              $sourceElement.futureResult.then((response) => {
                range.update();
                const preocessedChunksContainer = copyTextNodeChunks(response);
                const [subUpdates, initialRender] = morph(preocessedChunksContainer, range, { useDocFragment: true });
                initialRender();
                return preocessedChunksContainer;
              });
              offset += range.childNodes.length + 1;

              break;
            }
          case NODE_TYPES.ELEMENT_RESULT_NODE:
            {
              const range = getRange($targetElement, 'element');
              if($sourceElement.element instanceof DocumentFragment || range.childNodes.length !== 1){
                range.childNodes.forEach(node => range.removeChild(node));
                range.appendChild($sourceElement.element);
              } else {
                range.replaceChild($sourceElement.element, range.childNodes[0]);
              }

              offset += range.childNodes.length + 1;

              break;
            }
        }

        if($target instanceof NodesRange){
          $target.update();
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
    return [updates, () => options.useDocFragment ? $target.appendChild($currentTarget) : void 0];
  };

  function html(...args){
    return new Template(...args);
  }

  function render(template, target){
    return template.render(target);
  }

  function Template(chunks = [], ...interpolations){
    this.prevValues = [];
    this.values = interpolations;

    if(!chunks.length){
      return this;
    }

    this.templateId = hash(chunks.join(PREFIX + POSTFIX));
    const cached = templatesCache[this.templateId];

    if(!isDefined(cached)){
      const template = prepareLiterals(chunks);
      this.container = generateContainer(sanitize(template));
      templatesCache[this.templateId] = this.container;
    } else {
      this.container = cached;
    }

    this.updates = [];

    return this;
  };

  Template.prototype.render = function(target = document.createDocumentFragment()){
    const cached = containersMap.get(target);
    if((cached || {}).templateId === this.templateId){
      cached.update(this.values);
      return;
    }
    const [updates, initialRender] = morph(this.container, target, { useDocFragment: true });
    updates.forEach(u => u(this.values, this.prevValues));
    initialRender();
    this.updates = updates;
    containersMap.set(target, {
      templateId: this.templateId,
      update: this.update.bind(this),
    });
    return target;
  };

  Template.prototype.update = function(newData){
    this.prevValues = this.values;
    this.values = newData;
    this.updates.forEach(u => u(this.values, this.prevValues));
  };


  return {
    html,
    render,
    Template,
    prepareLiterals,
    generateContainer,
    sanitize,
    replaceTokens,
    copyAttributes,
    morph,
    processNode,
  }
};

const defaultInstance = createHtml({});

export const html = defaultInstance.html;

export const render = defaultInstance.render;
export const r = (...args) => render(html(...args));

export const Template = defaultInstance.Template;
