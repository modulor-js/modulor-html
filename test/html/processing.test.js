import { createHtml } from '../../src/html';

const customInstance = createHtml({
  PREFIX: '{modulor_html_chunk:',
  POSTFIX: '}',
  SANITIZE_NODE_PREFIX: 'sanitize:',
});

it('is a function', () => {
  expect(typeof customInstance.html).toBe('function');
});

describe('processing', () => {

  const value1 = 1;
  const value2 = 2;

  const valueArray = [value1, value2];

  const testSets = [
    {
      parsedString: customInstance.prepareLiterals`baz ${value1}`,
      expectedPreparedLiterals: 'baz {modulor_html_chunk:0}',
      expectedReplacedTokens: 'baz 1'
    },
    {
      parsedString: customInstance.prepareLiterals`${value1} foo`,
      expectedPreparedLiterals: '{modulor_html_chunk:0} foo',
      expectedReplacedTokens: '1 foo',
    },
    {
      parsedString: customInstance.prepareLiterals`foo`,
      expectedPreparedLiterals: 'foo',
      expectedReplacedTokens: 'foo',
    },
    {
      parsedString: customInstance.prepareLiterals`foo ${value1} bar ${value2} baz`,
      expectedPreparedLiterals: 'foo {modulor_html_chunk:0} bar {modulor_html_chunk:1} baz',
      expectedReplacedTokens: 'foo 1 bar 2 baz',
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
        //const container = customInstance.generateContainer(str);
        //expect(container).toBeInstanceOf(HTMLElement);
        //expect(container.innerHTML).toBe(str);
      //});

      testSet.expectedReplacedTokens && it('replaces tokens correctly', () => {
        const prepared = customInstance.replaceTokens(str, valueArray);
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
  ]
  testSets.forEach((testSet, index) => {
    it(`set #${index}`, () => {
      expect(customInstance.sanitize(testSet.input)).toBe(testSet.expectation);
    });
  })
});

