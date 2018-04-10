import { createRenderers } from '../../benchmark/renderers';

const $container = document.querySelector('#container');

const rowsCount = 30;
const colsCount = 30;
const tpl = (scope, html) => html`
  <table border="1">
  ${scope.matrix.map(row => html`
    <tr>
      ${row.map(col => html`
        <td>${col}</td>
      `)}
    </tr>
  `)}
  </table>
`;

//```

const renderers = createRenderers(tpl).reduce((acc, item) => {
  return Object.assign(acc, {
    [item.name]: item.fn
  });
}, {});


let timer;
function schedule(fn){
  timer = window.requestAnimationFrame(fn);
  //timer = setTimeout(fn, 1000 / 60);
}

function stop(){
  window.cancelAnimationFrame(timer);
  //window.clearTimeout(timer);
}


function runRenderer(render){
  let trigger = true;

  function paint(){
    schedule(() => {
      let rowsCount = Math.floor(trigger ? 1 : 10);
      let colsCount = Math.floor(trigger ? 1 : 10);
      const matrix = [];
      for(let i = 0; i < rowsCount; i++){
        matrix.push([]);
        for(let j = 0; j < colsCount; j++){
          matrix[i].push(Math.floor(Math.random() * 100000));
        }
      }
      trigger = !trigger;
      render({ matrix }, $container);
      paint();
    });
  }
  paint();
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


