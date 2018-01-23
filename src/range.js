export function NodesRange(startNode, stopNode, startOffset = 0, stopOffset = 0){

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
  const index = this.childNodes.indexOf($el);
  if(!~index){
    return;
  }
  this.update();
};

NodesRange.prototype.replaceChild = function($newElement, $oldElement){
  const index = this.childNodes.indexOf($oldElement);
  if(!~index){
    return;
  }
  $oldElement.parentNode.replaceChild($newElement, $oldElement);
  this.update();
};

NodesRange.prototype.extractContents = function(){
  const $fragment = document.createDocumentFragment();
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

NodesRange.prototype.getByIndex = function(index){};

