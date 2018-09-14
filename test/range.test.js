import { NodesRange } from '../src/range';

describe('Range', () => {

  const container = document.createElement('div');
  container.innerHTML = `
    <div id="a1"></div>
    <div id="a2"></div>
    <div id="a3"></div>
    <div id="a4"></div>
    <div id="a5"></div>
  `;

  const startNode = container.querySelector('#a1');
  const stopNode = container.querySelector('#a4');

  const range = new NodesRange(startNode, stopNode);

  it('with both ranges', () => {
    expect(range.firstChild === startNode.nextSibling).toBe(true);
    expect(range.lastChild === stopNode.previousSibling).toBe(true);
  });

  it('appends child correctly', () => {
    const newElement = document.createElement('div');
    range.appendChild(newElement);
    expect(stopNode.previousSibling === newElement).toBe(true);
    expect(range.lastChild === newElement).toBe(true);
  });

});

describe('Instance methods', () => {

  const container = document.createElement('div');
  const range = new NodesRange();

  it('has DOM node methods', () => {
    const range = new NodesRange();
    expect(typeof range.appendChild).toBe('function');
    expect(typeof range.removeChild).toBe('function');
    expect(typeof range.replaceChild).toBe('function');
  });

  it('extractContents works correctly', () => {
    const range = new NodesRange();
    const { startNode, stopNode } = range;
    const result = range.extractContents();
    expect(result instanceof DocumentFragment).toBe(true);
    expect(result.firstChild).toBe(startNode);
    expect(result.lastChild).toBe(stopNode);
  });

});
