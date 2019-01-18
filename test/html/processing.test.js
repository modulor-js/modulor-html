import {
  html, prepareLiterals, replaceTokens,
  setPrefix, setPostfix, updateChunkRegexes, setSpecialTagName, setSpecialAttributeName, setCapitalisePrefix, preprocess
} from '../../src/html';

setPrefix('{modulor_html_chunk:');
setPostfix('}');
setSpecialTagName('modulor-dynamic-tag');
setSpecialAttributeName('modulor-chunk');
setCapitalisePrefix('{modulor_capitalize:');
updateChunkRegexes();

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
      expectation: '<modulor-dynamic-tag modulor-chunk="table" attr-one="1"></modulor-dynamic-tag>'
    },
    {
      input: `<table attr-one="1"
      foo=bar bla baz="ok"
      ></table>`,
      expectation: `<modulor-dynamic-tag modulor-chunk="table" attr-one="1"
      foo=bar bla baz="ok"></modulor-dynamic-tag>`
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
      expectation: '<my-component foo="blah"></my-component>'
    },
    {
      input: '<my-component disabled foo="blah />"/>',
      expectation: '<my-component disabled foo="blah />"></my-component>'
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
          <my-component disabled foo="blah />"></my-component>
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
      expectation: '<modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}" foo="bar"></modulor-dynamic-tag>'
    },
    {
      input: '<x-{modulor_html_chunk:1}></x-{modulor_html_chunk:2}>',
      expectation: '<modulor-dynamic-tag modulor-chunk="x-{modulor_html_chunk:1}"></modulor-dynamic-tag>'
    },
    {
      input: '<{modulor_html_chunk:1}-test foo="bar"></{modulor_html_chunk:2}>',
      expectation: '<modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:1}-test" foo="bar"></modulor-dynamic-tag>'
    },
    {
      input: '<x-{modulor_html_chunk:1}-test foo="bar"></x-{modulor_html_chunk:2}>',
      expectation: '<modulor-dynamic-tag modulor-chunk="x-{modulor_html_chunk:1}-test" foo="bar"></modulor-dynamic-tag>'
    },
    {
      input: '<x-{modulor_html_chunk:1}-test-{modulor_html_chunk:2} foo="bar"></x-{modulor_html_chunk:3}>',
      expectation: '<modulor-dynamic-tag modulor-chunk="x-{modulor_html_chunk:1}-test-{modulor_html_chunk:2}" foo="bar"></modulor-dynamic-tag>'
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
        <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}" foo="{modulor_html_chunk:1}" {modulor_html_chunk:1}="{modulor_html_chunk:2}">
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:3}"            bla="test">
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
        <modulor-dynamic-tag modulor-chunk="x-{modulor_html_chunk:0}-y" foo="{modulor_html_chunk:1}" {modulor_html_chunk:1}="{modulor_html_chunk:2}">
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:3}-foo"            bla="test">
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
        <span id="component-b">
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}" foo={modulor_html_chunk:1}>
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
        <x-foo value={modulor_html_chunk:0}></x-foo>
      `
    },
  ]
  testSets.forEach((testSet, index) => {
    it(`set #${index}`, () => {
      expect(preprocess(testSet.input)).toBe(testSet.expectation);
    });
  })
});

describe('capitalize', () => {

  const testSets = [
    {
      input: '<div fooBar="12" foo barBaz bla-Ok=234></div>',
      expectation: '<div foo{modulor_capitalize:B}ar="12" foo bar{modulor_capitalize:B}az bla-{modulor_capitalize:O}k=234></div>'
    },
  ];

  testSets.forEach((testSet, index) => {
    it(`set #${index}`, () => {
      expect(preprocess(testSet.input)).toBe(testSet.expectation);
    });
  })
});
