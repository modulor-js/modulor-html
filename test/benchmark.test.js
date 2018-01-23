import { html, render, r, Template } from '../src/html';

describe('benchmark', () => {

  const container = document.createElement('div');

  const setupData = [{
    name: 'toFragment',
    fn: (scope) => r`
      <div></div>
    `
  }, {
    name: 'toFragmentSetArg',
    fn: (scope) => r`
      <div attr=${scope}></div>
    `
  }, {
    name: 'toContainer',
    fn: (scope) => render(html`
      <div></div>
    `, container)
  }, {
    name: 'toContainerSetArg',
    fn: (scope) => render(html`
      <div attr=${scope}></div>
    `, container)
  }];

  setupData.forEach(item => {
    it(`${item.name} time: ${bench(item.fn, 100).timeS} sec`, () => expect(true).toBe(true));
  });
});

function bench(fn = () => {}, times = 0){
  const startTime = +(new Date());

  for(let i = 0; i < times; i++){
    fn(i);
  }

  const duration = +(new Date()) - startTime;

  return {
    time: duration,
    timeS: duration / 1000
  };
}
