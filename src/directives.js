const { html, render, emptyNode, NodesRange } = require('./html');

export const r = (...args) => render(html(...args));

export const until = (promise, defaultContent) => (range) => {
  render(defaultContent, range);
  render(promise, range);
};

export const unsafeHtml = (content) => html([].concat(content));

export const asyncReplace = (iterator) => (range) => {
  iterateAsync(iterator, (value) => render(value, range));
};

export const asyncAppend = (iterator) => (range) => {
  emptyNode(range);
  iterateAsync(iterator, (value) => {
    const chunkRange = new NodesRange();
    range.appendChild(chunkRange.extractContents());
    render(value, chunkRange);
  });
};

function iterateAsync(iterator, cbk){
  iterator.next().then(({ done, value }) => {
    if(!done){
      cbk(value);
      iterateAsync(iterator, cbk);
    }
  });
}
