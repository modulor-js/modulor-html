module.exports = {
  rootDir: '../',
  testURL: 'http://localhost',
  moduleNameMapper: {
    '^web-components-polyfill$': 'document-register-element',
    '^@modulor-js/html/directives$': '<rootDir>/src/directives.js',
    '^@modulor-js/html/element': '<rootDir>/src/element.js',
    '^@modulor-js/(.*)$': '<rootDir>/src/$1',
  },
};
