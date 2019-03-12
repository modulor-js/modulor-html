const baseConfig = require('./jest.config');

module.exports = Object.assign({}, baseConfig, {
  moduleNameMapper: Object.assign({}, baseConfig.moduleNameMapper, {
    '^@modulor-js/html/directives$': '<rootDir>/build/directives.js',
    '^@modulor-js/html/element': '<rootDir>/build/element.js',
    '^@modulor-js/(.*)$': '<rootDir>/build/$1',
  }),
});
