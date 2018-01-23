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
