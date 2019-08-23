//import { html, render, r, stopNode, Template, containersMap } from '@modulor-js/html';

const templatesCache = {};

let callIndex = 0;
const callsMap = [];

//const createHook = () => {
  //let callIndex = 0;
  //const callsMap = [];
  //return {
    //add(values)
  //}
//}
const foobar = new Map();


function html(chunks = [], ...values){

  const templateId = chunks.join('|');
  const cached = templatesCache[templateId];

  let container;
  const foo = () => values;
  callsMap.push(values);
  const getValues = ((v) => () => v)(values)

  const gg = callsMap.length;
  console.log(this);

  if(!cached){
    function rr(range){
      console.log(getValues());
      //const [update, initialRender] = morph(container, target, { useDocFragment: true });
      //update(values);
      //initialRender();
      //update.templateId = templateId;
      //return update;
      
      return () => {
        console.log(666);
      }
    }
    templatesCache[templateId] = rr;
    return rr;
  } else {
    return cached;
  }

}

describe('experiment', () => {

  it('bla', async () => {

    const tpl = (scope) => html`foo ${scope} bar`
    const tpl2 = (scope) => html`bla ${scope.a} bar ${scope.b}`

    //const a = html`foo ${1}`;
    //const b = html`foo ${2}`;


    //console.log(a === b);
    //console.log(a());
    //console.log(b());

    //const c = tpl(1);
    //const d = tpl('sdfsdf');
    const aa = tpl(23);
    const ab = tpl2({ a: 'sdsd', b: 456456 });
    const ac = tpl2({ a: 5, b: false });
    const ad = tpl(true);

    aa();
    ab();
    ac();
    ad();


    console.log(aa === ad);
    console.log(aa === ac);
    console.log(ab === ac);

    //const container = document.createElement('div');
    ////const container2 = document.createElement('div');
    //const comp = (props) => {
      ////console.log(props);
      ////return children;
      //return html`
        //<div test="myel">
          //${props.foo}
          //${props.foo ? props.children : void 0}
        //</div>
      //`;
    //};

    //const tpl = (scope) => html`
      //<${comp} foo="${scope.a[0]}">
        //<div>${scope.a[1]}</div>
      //</${comp}>
    //`;

    ////const tpl2 = (scope) => html`
      ////<span bla="${scope.a}">${scope.b}</div>
    ////`;

    ////const rr = tpl2({ a: 1});

    //render(tpl({ a: [1,6,3] }), container);
    //render(tpl({ a: [2,6,3] }), container);
    //render(tpl({ a: [0,7,3] }), container);
    ////console.log(container.innerHTML);
    //render(tpl({ a: [1,8,3] }), container);
    //console.log(container.innerHTML);
    //render(tpl({ a: [3,4,5] }), container);
    //console.log(container.innerHTML);
    //render(tpl({ a: 1, c: 1 }), container);
    //console.log(container.innerHTML);
    //render(tpl({ a: 1 }), container);
    //console.log(container.innerHTML);
    //render(tpl({ a: 1, c: 1 }), container);
    //console.log(container.innerHTML);
    //render(tpl({ a: 1, b: 1 }), container);
    //container.querySelector('[ref="something"]').classList.add('foo')
    //render(tpl({ a: 10, b: 20, c: 30, d: 40 }), container);
    //render(tpl({ a: 1, b: 2, c: 3, d: 4 }), container);
    //render(tpl({ a: 2, b: 3 }), container);
    //render(rr, container);
    //render(rr, container);
    //render(tpl2({ a: 5, b: 2 }), container);
    //render(tpl2({ a: 5, b: 6 }), container);
    //render(tpl({ a: 1, b: 2 }), container);

    //console.log(container.innerHTML);
    //for (var value of containersMap.values()) {
      //console.log(value);
    //}

    //await new Promise(resolve => setTimeout(resolve, 1));

    //console.log(container.innerHTML);

    //render(html`<div>${Promise.resolve('foo').then((str) => html`wow ${str}`)}</div>`, container);

    //await new Promise(resolve => setTimeout(resolve, 1));

    //console.log(container.innerHTML);

    expect(true).toBe(true);
  });
})
