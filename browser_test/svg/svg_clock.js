import { createRenderers } from '../../benchmark/renderers';

const $container = document.querySelector('#container');

const rowsCount = 30;
const colsCount = 30;
const tpl = (date, html) => html`
  <div id="clock-container">
    <svg id="clock" viewBox="0 0 100 100">
      <circle id="face" cx="50" cy="50" r="45"/>
      <g id="hands">
        <rect id="hour" x="47.5" y="12.5" width="5" height="40" rx="2.5" ry="2.55" transform="rotate(${30 * (date.getHours() % 12) + date.getMinutes() / 2} 50 50)" />
        <rect id="min" x="48.5" y="12.5" width="3" height="40" rx="2" ry="2" transform="rotate(${date.getMinutes() * 6} 50 50)" />
        <line id="sec" x1="50" y1="50" x2="50" y2="16" transform="rotate(${date.getSeconds() * 6} 50 50)" />
      </g>
    </svg>
  </div>
`;

//```

const renderers = createRenderers(tpl).reduce((acc, item) => {
  return Object.assign(acc, {
    [item.name]: item.fn
  });
}, {});

let timer;
function schedule(fn){
  timer = setInterval(fn, 1000);
}

function stop(){
  window.clearInterval(timer);
}


function runRenderer(render){
  schedule(() => {
    render(new Date(), $container);
  });
}

const $select = document.querySelector('#engine-selector');

Object.keys(renderers).forEach((key, index) => {
  const $option = document.createElement('option');
  $option.innerHTML =key;
  $option.value = key;
  $select.appendChild($option);
});

document.querySelector('#stop').addEventListener('click', stop);
document.querySelector('#start').addEventListener('click', () => {
  const renderer = renderers[$select.value];
  console.log(renderer);
  runRenderer(renderer);
});

const params = location.search.slice(1).split('&').reduce((acc, part) => {
  const [name, value] = part.split('=');
  if(!name){
    return acc;
  }
  return Object.assign(acc, {
    [name]: value
  })
}, {});

if(params.engine){
  $select.value = params.engine;
}

if(params.autostart === 'true'){
  const renderer = renderers[$select.value];
  console.log(renderer);
  runRenderer(renderer);
}


