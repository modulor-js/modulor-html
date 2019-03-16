import {
  html, prepareLiterals, replaceTokens, preprocess, configure,
} from '../../src/html';

configure({
  prefix: '{modulor_html_chunk:',
  postfix: '}',
  dataAttributeName: 'attrs-data',
  specialAttributeName: `modulor-chunk`,
  specialTagName: `modulor-dynamic-tag`,
});

it('is a function', () => {
  expect(typeof html).toBe('function');
});

describe('processing', () => {

  const value1 = 1;
  const value2 = 2;

  const valueArray = [value1, value2];

  const testSets = [
    {
      parsedString: prepareLiterals`baz ${value1}`,
      expectedPreparedLiterals: 'baz {modulor_html_chunk:0}',
      expectedReplacedTokens: 'baz 1'
    },
    {
      parsedString: prepareLiterals`${value1} foo`,
      expectedPreparedLiterals: '{modulor_html_chunk:0} foo',
      expectedReplacedTokens: '1 foo',
    },
    {
      parsedString: prepareLiterals`foo`,
      expectedPreparedLiterals: 'foo',
      expectedReplacedTokens: 'foo',
    },
    {
      parsedString: prepareLiterals`foo ${value1} bar ${value2} baz`,
      expectedPreparedLiterals: 'foo {modulor_html_chunk:0} bar {modulor_html_chunk:1} baz',
      expectedReplacedTokens: 'foo 1 bar 2 baz',
    },
    {
      parsedString: prepareLiterals`<${'div'}><${'span'}></${'span'}></${'div'}>`,
      expectedPreparedLiterals: '<{modulor_html_chunk:0}><{modulor_html_chunk:1}></{modulor_html_chunk:2}></{modulor_html_chunk:3}>',
    }
  ];

  testSets.forEach((testSet, index) => {
    describe(`set ${index}`, () => {
      const parsedString = testSet.parsedString;
      const str = parsedString;

      it('prepares literals correctly', () => {
        expect(parsedString).toEqual(testSet.expectedPreparedLiterals);
      });

      //it('generates container correctly', () => {
        //const container = generateContainer(str);
        //expect(container).toBeInstanceOf(HTMLElement);
        //expect(container.innerHTML).toBe(str);
      //});

      testSet.expectedReplacedTokens && it('replaces tokens correctly', () => {
        const prepared = replaceTokens(str, valueArray);
        expect(prepared).toBe(testSet.expectedReplacedTokens);
      });
    });
  });
});

describe('sanitize', () => {

  const testSets = [
    {
      input: '<div></div>',
      expectation: '<div></div>'
    },
    {
      input: '<table attr-one="1"></table>',
      expectation: `<modulor-dynamic-tag modulor-chunk="table" attrs-data='[{\"name\":\"attr-one\",\"value\":\"1\"}]'></modulor-dynamic-tag>`
    },
    {
      input: `<table attr-one="1"
      foo=bar bla baz="ok"
      ></table>`,
      expectation: `<modulor-dynamic-tag modulor-chunk="table" attrs-data='[{\"name\":\"attr-one\",\"value\":\"1\"},{\"name\":\"foo\",\"value\":\"bar\"},{\"name\":\"bla\"},{\"name\":\"baz\",\"value\":\"ok\"}]'></modulor-dynamic-tag>`
    },
    {
      input: `
        <table>
          <tr>
            <td>foo</td>
            <td></td>
          </tr>
          <tr>
            <td><div></div></td>
          </tr>
        </table>
      `,
      expectation: `
        <modulor-dynamic-tag modulor-chunk="table">
          <modulor-dynamic-tag modulor-chunk="tr">
            <modulor-dynamic-tag modulor-chunk="td">foo</modulor-dynamic-tag>
            <modulor-dynamic-tag modulor-chunk="td"></modulor-dynamic-tag>
          </modulor-dynamic-tag>
          <modulor-dynamic-tag modulor-chunk="tr">
            <modulor-dynamic-tag modulor-chunk="td"><div></div></modulor-dynamic-tag>
          </modulor-dynamic-tag>
        </modulor-dynamic-tag>
      `
    },
    {
      input: `
        <style>
          .foo > .bar {  }
        </style>
      `,
      expectation: `
        <modulor-dynamic-tag modulor-chunk="style">
          .foo > .bar {  }
        </modulor-dynamic-tag>
      `
    },
  ]
  testSets.forEach((testSet, index) => {
    it(`set #${index}`, () => {
      expect(preprocess(testSet.input)).toBe(testSet.expectation);
    });
  })
});


describe('open self closing tags', () => {

  const testSets = [
    {
      input: '<my-component/>',
      expectation: '<my-component></my-component>'
    },
    {
      input: '<my-component foo="blah"/>',
      expectation: `<my-component attrs-data='[{\"name\":\"foo\",\"value\":\"blah\"}]'></my-component>`
    },
    {
      input: '<my-component disabled foo="blah />"/>',
      expectation: `<my-component attrs-data='[{\"name\":\"disabled\"},{\"name\":\"foo\",\"value\":\"blah />\"}]'></my-component>`
    },
    {
      input: '<input   /  >',
      expectation: '<input></input>'
    },
    {
      input: '<{modulor_html_chunk_234234:123}/>',
      expectation: '<{modulor_html_chunk_234234:123}></{modulor_html_chunk_234234:123}>'
    },
    {
      input: `
        <div>
          <img>
          <span></span>
          <my-component disabled foo="blah />"/>
        </div>
      `,
      expectation: `
        <div>
          <img>
          <span></span>
          <my-component attrs-data='[{\"name\":\"disabled\"},{\"name\":\"foo\",\"value\":\"blah />\"}]'></my-component>
        </div>
      `
    },
  ]
  testSets.forEach((testSet, index) => {
    it(`set #${index}`, () => {
      expect(preprocess(testSet.input)).toBe(testSet.expectation);
    });
  })
});


describe('replaceDynamicTags', () => {

  const testSets = [
    {
      input: '<{modulor_html_chunk:0}></{modulor_html_chunk:1}>',
      expectation: '<modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}"></modulor-dynamic-tag>'
    },
    {
      input: '<{modulor_html_chunk:0}/>',
      expectation: '<modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}"></modulor-dynamic-tag>'
    },
    {
      input: '<{modulor_html_chunk:0} foo="bar"/>',
      expectation: `<modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}" attrs-data='[{\"name\":\"foo\",\"value\":\"bar\"}]'></modulor-dynamic-tag>`
    },
    {
      input: '<x-{modulor_html_chunk:1}></x-{modulor_html_chunk:2}>',
      expectation: '<modulor-dynamic-tag modulor-chunk="x-{modulor_html_chunk:1}"></modulor-dynamic-tag>'
    },
    {
      input: '<{modulor_html_chunk:1}-test foo="bar"></{modulor_html_chunk:2}>',
      expectation: `<modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:1}-test" attrs-data='[{\"name\":\"foo\",\"value\":\"bar\"}]'></modulor-dynamic-tag>`
    },
    {
      input: '<x-{modulor_html_chunk:1}-test foo="bar"></x-{modulor_html_chunk:2}>',
      expectation: `<modulor-dynamic-tag modulor-chunk="x-{modulor_html_chunk:1}-test" attrs-data='[{\"name\":\"foo\",\"value\":\"bar\"}]'></modulor-dynamic-tag>`
    },
    {
      input: '<x-{modulor_html_chunk:1}-test-{modulor_html_chunk:2} foo="bar"></x-{modulor_html_chunk:3}>',
      expectation: `<modulor-dynamic-tag modulor-chunk="x-{modulor_html_chunk:1}-test-{modulor_html_chunk:2}" attrs-data='[{\"name\":\"foo\",\"value\":\"bar\"}]'></modulor-dynamic-tag>`
    },
    {
      input: `
        <{modulor_html_chunk:0}>
          <{modulor_html_chunk:1}>
          </{modulor_html_chunk:2}>
        </{modulor_html_chunk:3}>
      `,
      expectation: `
        <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}">
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:1}">
          </modulor-dynamic-tag>
        </modulor-dynamic-tag>
      `
    },
    {
      input: `
        <{modulor_html_chunk:0} foo="{modulor_html_chunk:1}" {modulor_html_chunk:1}="{modulor_html_chunk:2}">
          <{modulor_html_chunk:3}
            bla="test">
          </{modulor_html_chunk:4}>
        </{modulor_html_chunk:5}>
      `,
      expectation: `
        <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}" attrs-data='[{\"name\":\"foo\",\"value\":\"{modulor_html_chunk:1}\"},{\"name\":\"{modulor_html_chunk:1}\",\"value\":\"{modulor_html_chunk:2}\"}]'>
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:3}" attrs-data='[{\"name\":\"bla\",\"value\":\"test\"}]'>
          </modulor-dynamic-tag>
        </modulor-dynamic-tag>
      `
    },
    {
      input: `
        <x-{modulor_html_chunk:0}-y foo="{modulor_html_chunk:1}" {modulor_html_chunk:1}="{modulor_html_chunk:2}">
          <{modulor_html_chunk:3}-foo
            bla="test">
          </{modulor_html_chunk:4}>
        </x-{modulor_html_chunk:5}-y>
      `,
      expectation: `
        <modulor-dynamic-tag modulor-chunk="x-{modulor_html_chunk:0}-y" attrs-data='[{"name":"foo","value":"{modulor_html_chunk:1}"},{"name":"{modulor_html_chunk:1}","value":"{modulor_html_chunk:2}"}]'>
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:3}-foo" attrs-data='[{\"name\":\"bla\",\"value\":\"test\"}]'>
          </modulor-dynamic-tag>
        </modulor-dynamic-tag>
      `
    },
    {
      input: `
        <{modulor_html_chunk:0}>
          {modulor_html_chunk:1}
          <{modulor_html_chunk:2}>
            {modulor_html_chunk:3}
          </{modulor_html_chunk:4}>
          {modulor_html_chunk:5}
        </{modulor_html_chunk:6}>
        {modulor_html_chunk:7}
      `,
      expectation: `
        <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}">
          {modulor_html_chunk:1}
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:2}">
            {modulor_html_chunk:3}
          </modulor-dynamic-tag>
          {modulor_html_chunk:5}
        </modulor-dynamic-tag>
        {modulor_html_chunk:7}
      `
    },
    {
      input: `
        <span id="component-b">
          <{modulor_html_chunk:0} foo={modulor_html_chunk:1}>
            <p>{modulor_html_chunk:2}</p>
          </{modulor_html_chunk:2}>
        </span>
      `,
      expectation: `
        <span attrs-data='[{"name":"id","value":"component-b"}]'>
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}" attrs-data='[{\"name\":\"foo\",\"value\":\"{modulor_html_chunk:1}\"}]'>
            <p>{modulor_html_chunk:2}</p>
          </modulor-dynamic-tag>
        </span>
      `
    },
    {
      input: `
        <x-foo value={modulor_html_chunk:0}/>
      `,
      expectation: `
        <x-foo attrs-data='[{\"name\":\"value\",\"value\":\"{modulor_html_chunk:0}\"}]'></x-foo>
      `
    },
  ]
  testSets.forEach((testSet, index) => {
    it(`set #${index}`, () => {
      expect(preprocess(testSet.input)).toBe(testSet.expectation);
    });
  })
});

//describe('capitalize', () => {

  //const testSets = [
    //{
      //input: '<div fooBar="12" foo barBaz bla-Ok=234></div>',
      //expectation: '<div foo{modulor_capitalize:B}ar="12" foo bar{modulor_capitalize:B}az bla-{modulor_capitalize:O}k=234></div>'
    //},
    //{
      //input: `
      //<svg width="34" height="34" viewBox="0 0 34 34">
        //<path d="M29.1 26.3L23.8 22.8C22.7 22.1 21.2 22.4 20.5 23.5 19.3 25 17.8 27.5 12.2 21.8 6.6 16.2 9 14.7 10.5 13.5 11.5 12.7 11.8 11.3 11.1 10.2L7.6 4.9C7.2 4.2 6.6 3.1 5.1 3.3 3.7 3.5 0 5.6 0 10.2 0 14.8 3.6 20.4 8.5 25.4 13.5 30.3 19.1 34 23.8 34 28.4 34 30.5 29.9 30.7 28.9 30.9 27.9 29.8 26.8 29.1 26.3Z" fill="#6A3460" />
      //</svg>
      //`,
      //expectation: `
      //<svg width="34" height="34" view{modulor_capitalize:B}ox="0 0 34 34">
        //<path d="M29.1 26.3L23.8 22.8C22.7 22.1 21.2 22.4 20.5 23.5 19.3 25 17.8 27.5 12.2 21.8 6.6 16.2 9 14.7 10.5 13.5 11.5 12.7 11.8 11.3 11.1 10.2L7.6 4.9C7.2 4.2 6.6 3.1 5.1 3.3 3.7 3.5 0 5.6 0 10.2 0 14.8 3.6 20.4 8.5 25.4 13.5 30.3 19.1 34 23.8 34 28.4 34 30.5 29.9 30.7 28.9 30.9 27.9 29.8 26.8 29.1 26.3Z" fill="#6A3460"></path>
      //</svg>
      //`
    //},
  //];

  //testSets.forEach((testSet, index) => {
    //it(`set #${index}`, () => {
      //expect(preprocess(testSet.input)).toBe(testSet.expectation);
    //});
  //})
//});
