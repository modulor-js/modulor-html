const $statContainer = document.querySelector('#stat-container');

const write = (message) => {
  const $el = document.createElement('div');
  $el.innerHTML = message;
  $statContainer.appendChild($el);
};

window.expect = () => ({
  toBe: () => {}
});

window.it = (label) => {
  write(`${label}`);
};

window.describe = (label, fn) => {
  write(`<b>${label}</b>`);
  fn();
};

require('../benchmark/initial_rendering.benchmark');
require('../benchmark/update.benchmark');
require('../benchmark/update/classes.benchmark');
require('../benchmark/update/attributes.benchmark');
