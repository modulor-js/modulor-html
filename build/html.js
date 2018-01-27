'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.r = exports.render = exports.html = exports.stopNode = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.Template = Template;

var _range2 = require('./range');

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var templatesCache = {};

var NODE_TYPES = {
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

var ITERATIONS_THRESHOLD = 1000;

function same(nodeA, nodeB) {
  if (!nodeA || !nodeB) {
    return false;
  }
  if (nodeA.nodeType !== nodeB.nodeType) {
    return false;
  }
  if (nodeA.tagName && nodeB.tagName && nodeA.tagName === nodeB.tagName) {
    return true;
  }
  return nodeA.isEqualNode(nodeB);
};

function isSameTextNode(nodeA, nodeB) {
  if (nodeA.nodeType === NODE_TYPES.TEXT_NODE && nodeA.nodeType === NODE_TYPES.TEXT_NODE && nodeA.textContent === nodeB.textContent) {
    return true;
  }
  return false;
};

//hash function taken from https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
  var hash = 5381,
      i = str.length;
  while (i) {
    hash = hash * 33 ^ str.charCodeAt(--i);
  }
  return hash >>> 0;
};

function regExpEscape(literalString) {
  return literalString.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
};

function getChunkType(chunk) {
  if (chunk instanceof Node) {
    return 'element';
  } else if (chunk instanceof Promise) {
    return 'futureResult';
  } else if (chunk instanceof Template) {
    return 'template';
  }
  return 'text';
}

var stopNode = exports.stopNode = 'modulor_stop_node_' + +new Date();
var DEFAULT_PREFIX = '{modulor_html_chunk_' + +new Date() + ':';
var DEFAULT_POSTFIX = '}';
var DEFAULT_PARSER = new DOMParser();

function Template(options) {
  this.PREFIX = options.PREFIX || DEFAULT_PREFIX;
  this.POSTFIX = options.POSTFIX || DEFAULT_POSTFIX;

  this.parser = options.parser || DEFAULT_PARSER;

  this.replaceChunkRegex = new RegExp(this.getTokenRegExp(), 'ig');
  this.matchChunkRegex = new RegExp('^' + this.getTokenRegExp(true) + '$');
  return this;
};

Template.prototype.parse = function () {
  var _prepareLiterals = this.prepareLiterals.apply(this, arguments);

  var _prepareLiterals2 = _slicedToArray(_prepareLiterals, 2);

  this.template = _prepareLiterals2[0];
  this.dataMap = _prepareLiterals2[1];


  this.templateId = hash(this.template);
  var cached = templatesCache[this.templateId];

  if (typeof cached === 'undefined') {
    this.container = this.generateContainer(this.template);
    templatesCache[this.templateId] = this.container;
  } else {
    this.container = cached;
  }
  return this;
};

Template.prototype.processTextNodeChunks = function (chunks) {
  var _this = this;

  var dataMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.dataMap;

  return chunks.reduce(function (acc, chunk) {
    if (!('' + chunk).length) {
      return acc;
    }
    var match = chunk.match(_this.matchChunkRegex);
    var value = match ? dataMap[chunk] : chunk;
    if (typeof value === 'undefined') {
      return acc;
    }
    var chunkType = getChunkType(value);
    if (chunkType !== 'text') {
      var $el = document.createComment('');
      $el.isSpecialChunk = true;
      $el[chunkType] = value;
      $el.chunkType = chunkType;
      $el.templateId = _this.templateId;
      $el.chunkId = match[2];
      return acc.concat($el);
    }
    return acc.concat(value);
  }, []);
};

Template.prototype.copyTextNodeChunks = function (chunks) {
  var _this2 = this;

  var dataMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.dataMap;
  var container = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document.createDocumentFragment();

  return [].concat(chunks).reduce(function (container, chunk) {
    if (chunk.isSpecialChunk) {
      container.appendChild(chunk);
      return container;
    }
    var chunkType = getChunkType(chunk);
    if (chunkType === 'text') {
      container.appendChild(document.createTextNode(chunk));
    } else {
      var $el = document.createComment('');
      $el[chunkType] = chunk;
      $el.isSpecialChunk = true;
      $el.chunkType = chunkType;
      $el.templateId = _this2.templateId;
      container.appendChild($el);
    }
    return container;
  }, container);
};

//@TODO support promise in attributes
Template.prototype.copyAttributes = function (target, source) {
  var dataMap = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.dataMap;

  var newAttrs = [];
  var attrs = source.attributes;
  if (!attrs.length) {
    return;
  }
  for (var i = 0; i < attrs.length; i++) {
    var _attrs$i = attrs[i],
        name = _attrs$i.name,
        value = _attrs$i.value;

    var preparedName = this.replaceTokens(name);
    var preparedValue = this.matchChunkRegex.test(value) ? dataMap[value] : this.replaceTokens(value);
    if (preparedName === '') {
      return;
    }
    if (preparedName === stopNode) {
      target.nodeStopper = stopNode;
      return;
    }
    newAttrs.push(preparedName);
    if (value !== '' && preparedName in target) {
      target[preparedName] = preparedValue;
      continue;
    }
    target.setAttribute(preparedName, preparedValue);
  }

  //@TODO refactor here
  var targetAttrs = target.attributes;
  for (var j = 0; j < targetAttrs.length; j++) {
    var attrName = targetAttrs[j].name;
    if (!~newAttrs.indexOf(attrName)) {
      target.removeAttribute(attrName);
    }
  }
};

Template.prototype.loop = function ($source, $target, debug) {
  var _this3 = this;

  for (var i = 0, offset = 0;; i++) {

    if (i > ITERATIONS_THRESHOLD) {
      console.log('too much recursion');
      break;
    }

    var $sourceElement = $source.childNodes[i];
    var $targetElement = $target.childNodes[i + offset]; //probably offset is not needed

    //no further elements, end of loop
    if (!$sourceElement && !$targetElement) {
      break;
    }

    //element doesn't exist anymore
    if (!$sourceElement) {
      $target.removeChild($targetElement);
      i--;
      continue;
    }

    if (!$targetElement || !same($sourceElement, $targetElement)) {
      var _ret = function () {
        //@TODO strange behaviour here, have to make it a closure
        var fn = function fn($target, $targetElement) {
          return function ($el) {
            if (!$targetElement) {
              //element should be newly created
              return $target.appendChild($el);
            }
            //replace old node with new one
            return $target.replaceChild($el, $targetElement);
          };
        };
        var domFn = fn($target, $targetElement);
        var getRange = function getRange($targetElement, replacementType) {

          if ($targetElement && $targetElement.range && $targetElement.replacementType === replacementType && $targetElement.templateId === _this3.templateId) {
            return $targetElement.range;
          } else {
            var range = new _range2.NodesRange(document.createTextNode(''), document.createTextNode(''));
            var startNode = range.startNode;

            startNode.range = range;
            startNode.replacementType = replacementType;
            startNode.templateId = _this3.templateId;
            domFn(range.extractContents());
            return range;
          }
        };
        switch ($sourceElement.nodeType) {
          case NODE_TYPES.TEXT_NODE:
            var content = $sourceElement.textContent;
            var chunks = content.split(_this3.replaceChunkRegex);

            if (chunks.length === 1) {
              domFn(document.createTextNode($sourceElement.textContent));
              break;
            }

            var range = getRange($targetElement, 'textContent');
            var processedChunks = _this3.processTextNodeChunks(chunks);
            var $processedChunksFragment = _this3.copyTextNodeChunks(processedChunks);
            _this3.loop($processedChunksFragment, range);
            offset += range.childNodes.length + 1;
            break;
          case NODE_TYPES.COMMENT_NODE:
            if ($sourceElement.isSpecialChunk) {
              var type = $sourceElement.chunkType;
              var _range = getRange($targetElement, type);

              if (type === 'futureResult') {
                $sourceElement.futureResult.then(function (response) {
                  var $frag = _this3.copyTextNodeChunks(response);
                  _this3.loop($frag, _range);
                  //update range for future promise resolves
                  //@TODO write better explanation
                  _range.update();
                  return $frag;
                });
                offset += _range.childNodes.length + 1;

                break;
              }
              if (type === 'template') {
                $sourceElement.template.render(_range);
                offset += _range.childNodes.length + 1;

                break;
              }
              if (type === 'element') {
                var $frag = document.createDocumentFragment();
                $frag.appendChild($sourceElement.element);

                //@TODO probably better to simply replace elements in range with ones from $frag
                _this3.loop($frag, _range);
                offset += _range.childNodes.length + 1;

                break;
              }
            }
            domFn(document.createComment(_this3.replaceTokens($sourceElement.textContent)));
            break;
          case NODE_TYPES.ELEMENT_NODE:
            var newChild = document.createElement($sourceElement.tagName.toLowerCase());

            _this3.loop($sourceElement, newChild);
            domFn(newChild);

            //set attributes after whole subtree has build,
            //because node content might be needed before setter being executed
            _this3.copyAttributes(newChild, $sourceElement);
            break;
        }
        return 'continue';
      }();

      if (_ret === 'continue') continue;
    }

    //at this point we are sure both elements exist

    //same text
    if (isSameTextNode($sourceElement, $targetElement)) {
      continue;
    }

    //same node
    if (same($sourceElement, $targetElement)) {
      $targetElement.nodeStopper !== stopNode && this.loop($sourceElement, $targetElement);
      this.copyAttributes($targetElement, $sourceElement);
      continue;
    }
  }
  return $target;
};

Template.prototype.render = function () {
  var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.createDocumentFragment();

  target.nodeStopper = stopNode;
  return this.loop(this.container, target);
};

Template.prototype.generateContainer = function (markup) {
  return this.parser.parseFromString(markup, "text/html").body;
};

Template.prototype.prepareLiterals = function (_ref) {
  var _this4 = this;

  for (var _len = arguments.length, interpolations = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    interpolations[_key - 1] = arguments[_key];
  }

  var _ref2 = _toArray(_ref),
      firstChunk = _ref2[0],
      restChunks = _ref2.slice(1);

  return restChunks.reduce(function (_ref3, chunk, index) {
    var _ref4 = _slicedToArray(_ref3, 2),
        acc = _ref4[0],
        dataMap = _ref4[1];

    var keyName = _this4.generateTokenName(index);
    dataMap[keyName] = interpolations[index];
    return [acc.concat(keyName).concat(chunk), dataMap];
  }, [firstChunk, {}]);
};

Template.prototype.generateTokenName = function (index) {
  return '' + this.PREFIX + index + this.POSTFIX;
};

Template.prototype.replaceTokens = function (text) {
  var dataMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.dataMap;

  return text.replace(this.replaceChunkRegex, function (token, index) {
    return dataMap[token];
  });
};

Template.prototype.getTokenRegExp = function (groupMatches) {
  var indexRegex = (groupMatches ? '(' : '') + '\\d+' + (groupMatches ? ')' : '');
  return '(' + regExpEscape(this.PREFIX) + indexRegex + regExpEscape(this.POSTFIX) + ')';
};

var html = exports.html = function html() {
  var _ref5;

  return (_ref5 = new Template({})).parse.apply(_ref5, arguments);
};

var render = exports.render = function render(template, target) {
  return template.render(target);
};
var r = exports.r = function r() {
  return render(html.apply(undefined, arguments));
};

//@TODO think about collecting new nodes to append into fragment and appending the whole fragment later
//@TODO maybe converting special nodes to comment and then replacing it is not good idea?