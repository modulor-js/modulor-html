import {
  html, prepareLiterals, replaceTokens, sanitize, openSelfClosingTags, replaceDynamicTags,
  setPrefix, setPostfix, setSanitizeNodePrefix, updateChunkRegexes, setSpecialTagName, setSpecialAttributeName
} from '../../src/html';

setPrefix('{modulor_html_chunk:');
setPostfix('}');
setSanitizeNodePrefix('sanitize:');
setSpecialTagName('modulor-dynamic-tag');
setSpecialAttributeName('modulor-chunk');
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
      expectation: '<sanitize:table attr-one="1"></sanitize:table>'
    },
    {
      input: `<table attr-one="1"
      foo=bar bla baz="ok"
      ></table>`,
      expectation: `<sanitize:table attr-one="1"
      foo=bar bla baz="ok"
      ></sanitize:table>`
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
        <sanitize:table>
          <sanitize:tr>
            <sanitize:td>foo</sanitize:td>
            <sanitize:td></sanitize:td>
          </sanitize:tr>
          <sanitize:tr>
            <sanitize:td><div></div></sanitize:td>
          </sanitize:tr>
        </sanitize:table>
      `
    },
    {
      input: `
        <style>
          .foo > .bar {  }
        </style>
      `,
      expectation: `
        <sanitize:style>
          .foo > .bar {  }
        </sanitize:style>
      `
    },
  ]
  testSets.forEach((testSet, index) => {
    it(`set #${index}`, () => {
      expect(sanitize(testSet.input)).toBe(testSet.expectation);
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
      expectation: '<input   ></input>'
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
      expect(openSelfClosingTags(testSet.input)).toBe(testSet.expectation);
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
      expectation: '<modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}"/>'
    },
    {
      input: '<{modulor_html_chunk:0} foo="bar"/>',
      expectation: '<modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:0}" foo="bar"/>'
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
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:3}"
            bla="test">
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
          <modulor-dynamic-tag modulor-chunk="{modulor_html_chunk:3}-foo"
            bla="test">
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
  ]
  testSets.forEach((testSet, index) => {
    it(`set #${index}`, () => {
      expect(replaceDynamicTags(testSet.input)).toBe(testSet.expectation);
    });
  })
});

