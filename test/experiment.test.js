import { html, render, r, stopNode, Template, containersMap } from '@modulor-js/html';


describe('experiment', () => {

  it('bla', async () => {

    const container = document.createElement('div');
    //const container2 = document.createElement('div');
    const comp = ({ props, children }) => {
      console.log(props);
      //return children;
      return html`
        <div>${props.foo}</div>
      `;
    };

    const tpl = (scope) => html`
      <${comp} foo="${scope.a[0]}">
        <div>${scope.a[0]}</div>
      </${comp}>
    `;

    //const tpl2 = (scope) => html`
      //<span bla="${scope.a}">${scope.b}</div>
    //`;

    //const rr = tpl2({ a: 1});

    render(tpl({ a: [1,6,3] }), container);
    render(tpl({ a: [2,6,3] }), container);
    render(tpl({ a: [3,7,3] }), container);
    //render(tpl({ a: [1,2,3] }), container);
    console.log(container.innerHTML);
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
