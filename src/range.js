import { getDocument, createTextNode, createDocumentFragment } from './config';

export function NodesRange(startNode = createTextNode(''), stopNode = createTextNode('')){

  //@TODO: should be better here
  this.childNodes = [];
  this.firstChild = null;
  this.lastChild = null;

  this.startNode = startNode;
  this.stopNode = stopNode;

  if(!startNode || !stopNode){
    return this;
  }

  if(startNode.parentNode !== stopNode.parentNode){
    return this;
  }

  this.update();
  return this;
}

NodesRange.prototype.appendChild = function($el){
  this.stopNode.parentNode.insertBefore($el, this.stopNode);
  this.update();
};

NodesRange.prototype.removeChild = function($el){
  this.stopNode.parentNode.removeChild($el);
  this.update();
};

NodesRange.prototype.replaceChild = function($newElement, $oldElement){
  $oldElement.parentNode.replaceChild($newElement, $oldElement);
  this.update();
};

NodesRange.prototype.extractContents = function(){
  const $fragment = createDocumentFragment();
  $fragment.appendChild(this.startNode);
  this.childNodes.reduce(($fragment, node) => {
    $fragment.appendChild(node);
    return $fragment;
  }, $fragment);
  $fragment.appendChild(this.stopNode);
  //copy nodes here
  return $fragment;
};

NodesRange.prototype.update = function(){
  this.childNodes = [];
  for(let node = this.startNode.nextSibling; node && node !== this.stopNode; node = node.nextSibling){
    this.childNodes.push(node);
  }

  this.firstChild = this.childNodes[0];
  this.lastChild = this.childNodes[this.childNodes.length - 1];
}

