import { NodesRange } from './range';

const templatesCache = {};

const NODE_TYPES = {
  TEMPLATE_NODE: -1,
  TEXT_RESULT_NODE: -2,
  PROMISE_NODE: -3,
  ELEMENT_RESULT_NODE: -4,
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

function same(nodeA, nodeB, sanitizeNodePrefix = ''){
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
    (nodeA.tagName.toLowerCase().replace(sanitizeNodePrefix, '') === nodeB.tagName.toLowerCase())
  ){
    return true;
  }
  return nodeA.isEqualNode(nodeB);
};

function isSameTextNode(nodeA, nodeB){
  if(nodeA.nodeType === NODE_TYPES.TEXT_NODE && nodeA.nodeType === NODE_TYPES.TEXT_NODE && nodeA.textContent === nodeB.textContent){
    return true;
  }
  return false;
};

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
  } else if(chunk instanceof Promise){
    return 'futureResult';
  } else if(typeof chunk == 'function'){
    return 'function';
  }
  return 'text';
}

function setAttribute($target, attributeName, attributeValue, originalValue){
  if(originalValue !== '' && attributeName in $target){
    $target[attributeName] = attributeValue;
    return;
  }
  $target.setAttribute(attributeName, attributeValue);
}

const stopNodeValue = `modulor_stop_node_${+(new Date())}`;

export function stopNode($target){
  $target.nodeStopper = stopNodeValue;
};

const DEFAULT_PREFIX  = `{modulor_html_chunk_${+new Date()}:`;
const DEFAULT_POSTFIX = '}';
const DEFAULT_PARSER = new DOMParser();

const DEFAULT_SANITIZE_NODE_PREFIX = `modulor_sanitize_node_${+(new Date())}:`;

const sanitizeTags = ['table', 'tr', 'td'];
const sanitizeTagsRegex = new RegExp(`<([ /])?(${sanitizeTags.join('|')})([ ][^]>)?`, 'igm');

export function Template(options){
  this.PREFIX = options.PREFIX || DEFAULT_PREFIX;
  this.POSTFIX = options.POSTFIX || DEFAULT_POSTFIX;

  this.parser = options.parser || DEFAULT_PARSER;

  this.splitChunkRegex = new RegExp(this.getTokenRegExp(), 'ig');
  this.findChunksRegex = new RegExp(this.getTokenRegExp(true), 'ig');
  this.replaceChunkRegex = new RegExp(this.getTokenRegExp(true), 'ig');
  this.matchChunkRegex = new RegExp(`^${this.getTokenRegExp(true)}$`);

  this.sanitizeNodePrefix = options.SANITIZE_NODE_PREFIX || DEFAULT_SANITIZE_NODE_PREFIX;

  this.updates = [];

  return this;
};

export const containersMap = new Map();

Template.prototype.parse = function(chunks, ...interpolations){
  this.prevValues = [];
  this.values = interpolations;

  this.template = this.prepareLiterals(chunks);

  this.templateId = hash(this.template);
  const cached = templatesCache[this.templateId];

  if(typeof cached === 'undefined'){
    this.container = this.generateContainer(this.sanitize(this.template));
    templatesCache[this.templateId] = this.container;
  } else {
    this.container = cached;
  }
  return this;
}

Template.prototype.getChunkById = function(id, dataMap = this.values){
  return dataMap[id];
}

Template.prototype.processTextNodeChunks = function(chunks){
  return chunks.reduce((acc, chunk) => {
    if(!`${chunk}`.length){
      return acc;
    }
    const match = chunk.match(this.matchChunkRegex);
    const value = match ? this.getChunkById(match[2]) : chunk;
    if(typeof value === 'undefined'){ return acc; }
    return acc.concat(value);
  }, []);
};

Template.prototype.copyTextNodeChunks = function(chunks){
  const container = {
    childNodes: [].concat(chunks).map((chunk) => {
      const chunkType = getChunkType(chunk);

      if(chunkType === 'text'){
        return document.createTextNode(chunk);
      }

      const $el = {};

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
      $el.templateId = this.templateId;
      return $el;
    })
  };
  return container;
};

Template.prototype.copyAttributes = function(target, source){
  const sourceAttributes = source.attributes;
  const targetAttributes = target.attributes;

  const updates = [];
  const attributesToKeep = {};

  for(let i = 0; i < sourceAttributes.length; i++){
    let { name, value }  = sourceAttributes[i];
    const nameIsDynamic = name.match(this.splitChunkRegex);
    const valueIsDynamic = value.match(this.splitChunkRegex);

    attributesToKeep[name] = true;

    if(!nameIsDynamic && !valueIsDynamic){
      setAttribute(target, name, value);
      continue;
    }

    if(name === 'class'){
      target.className = '';
      value.split(' ').forEach((className) => {
        if(!className.match(this.splitChunkRegex)){
          target.classList.add(className);
          return;
        }
        updates.push(() => {
          const newValue = this.replaceTokens(className);
          const oldValue = this.replaceTokens(className, this.prevValues);
          if(oldValue !== newValue){
            oldValue && target.classList.remove(oldValue);
            newValue && target.classList.add(newValue);
          }
        });
      });

      continue;
    }

    const matchName = name.match(this.matchChunkRegex);
    const matchValue = value.match(this.matchChunkRegex);

    updates.push(() => {
      const preparedName = matchName ? this.getChunkById(matchName[2]) : this.replaceTokens(name);
      const preparedPrevName = matchName ? this.getChunkById(matchName[2], this.prevValues) : this.replaceTokens(name, this.prevValues);

      const preparedValue = matchValue ? this.getChunkById(matchValue[2]) : this.replaceTokens(value);
      const preparedPrevValue = matchValue ? this.getChunkById(matchValue[2], this.prevValues) : this.replaceTokens(value, this.prevValues);

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

      setAttribute(target, preparedName, preparedValue, value);
    });
  }


  for(let i = 0; i < targetAttributes.length; i++){
    let { name } = targetAttributes[i];
    if(!attributesToKeep[name]){
      target.removeAttribute(name);
    }
  }

  updates.forEach(u => u());

  return updates;
};

Template.prototype.loop = function($source, $target){

  for(let i = 0, offset = 0;; i++){

    const $sourceElement = $source.childNodes[i];
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

    if(!$targetElement || !same($sourceElement, $targetElement, this.sanitizeNodePrefix)){
      //@TODO strange behaviour here, have to make it a closure
      const fn = ($target, $targetElement) => ($el) => {
        if(!$targetElement){
          //element should be newly created
          return $target.appendChild($el);
        }
        //replace old node with new one
        return $target.replaceChild($el, $targetElement);
      };
      const domFn = fn($target, $targetElement);
      const getRange = ($targetElement, replacementType) => {

        if($targetElement && $targetElement.range && $targetElement.replacementType === replacementType && $targetElement.templateId === this.templateId){
          return $targetElement.range;
        } else {
          const range = new NodesRange(document.createTextNode(''), document.createTextNode(''));
          const { startNode } = range;
          startNode.range = range;
          startNode.replacementType = replacementType;
          startNode.templateId = this.templateId;
          domFn(range.extractContents());
          return range;
        }
      }
      switch($sourceElement.nodeType){
        case NODE_TYPES.TEXT_NODE:
          {
            const content = $sourceElement.textContent;
            const chunks = content.split(this.splitChunkRegex);

            if(chunks.length === 1){
              domFn(document.createTextNode($sourceElement.textContent));
              break;
            }

            let range = getRange($targetElement, 'textContent');
            const updateFn = () => {
              const processedChunks = this.processTextNodeChunks(chunks);
              const $processedChunksFragment = this.copyTextNodeChunks(processedChunks);
              this.loop($processedChunksFragment, range);
            }
            this.updates.push(updateFn);
            updateFn();
            offset += range.childNodes.length + 1;
            break;
          }
        case NODE_TYPES.COMMENT_NODE:
          domFn(document.createComment(this.replaceTokens($sourceElement.textContent)));
          break;
        case NODE_TYPES.ELEMENT_NODE:
          const newChild = document.createElement($sourceElement.tagName.toLowerCase().replace(this.sanitizeNodePrefix, ''));

          this.loop($sourceElement, newChild);
          domFn(newChild);

          const updates = this.copyAttributes(newChild, $sourceElement);
          this.updates = this.updates.concat(updates);

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
            range.update();
            $sourceElement.futureResult.then((response) => {
              range.update();
              const $frag = this.copyTextNodeChunks(response);
              this.loop($frag, range);
              return $frag;
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
            } else if(range.childNodes[0] !== $sourceElement.element){
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
    if(same($sourceElement, $targetElement, this.sanitizeNodePrefix)){
      ($targetElement.nodeStopper !== stopNodeValue) && this.loop($sourceElement, $targetElement);

      const updates = this.copyAttributes($targetElement, $sourceElement);
      this.updates = this.updates.concat(updates);
      continue;
    }
  }
  return $target;
};

Template.prototype.render = function(target = document.createDocumentFragment()){
  const cached = containersMap.get(target);
  if((cached || {}).templateId === this.templateId){
    cached.update(this.values);
    return;
  }
  stopNode(target);
  containersMap.set(target, {
    templateId: this.templateId,
    update: this.update.bind(this),
  });
  return this.loop(this.container, target);
};

Template.prototype.update = function(newData){
  this.prevValues = this.values;
  this.values = newData;
  this.updates.forEach(u => u());
};

Template.prototype.generateContainer = function(markup){
  return this.parser.parseFromString(markup, "text/html").body;
};



Template.prototype.sanitize = function(str){
  return str.replace(sanitizeTagsRegex, `<$1${this.sanitizeNodePrefix}$2`);
};

Template.prototype.prepareLiterals = function([firstChunk, ...restChunks]){
  return restChunks.reduce((acc, chunk, index) => {
    const keyName = this.generateTokenName(index);
    return acc.concat(keyName).concat(chunk);
  }, firstChunk);
};

Template.prototype.generateTokenName = function(index){
  return `${this.PREFIX}${index}${this.POSTFIX}`;
};

Template.prototype.replaceTokens = function(text, dataMap = this.values){
  return text.replace(this.replaceChunkRegex, (token, _, index) => {
    return this.getChunkById(index, dataMap) || '';
  });
};

Template.prototype.getTokenRegExp = function(groupMatches){
  const indexRegex = `${groupMatches ? '(' : ''}\\d+${groupMatches ? ')' : ''}`;
  return `(${regExpEscape(this.PREFIX)}${indexRegex}${regExpEscape(this.POSTFIX)})`;
};


export const html = (...args) => (new Template({})).parse(...args);

export const render = (template, target) => template.render(target);
export const r = (...args) => render(html(...args));




//@TODO think about collecting new nodes to append into fragment and appending the whole fragment later
