const baseConfig = require('./jest.config');

module.exports = Object.assign({}, baseConfig, {
  moduleNameMapper: Object.assign({}, baseConfig.moduleNameMapper, {
    '^web-components-polyfill$': 'document-register-element/pony',
  }),
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/.jest/setup_ssr.js'],
});
