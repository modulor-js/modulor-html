const baseConfig = require('./jest.config');

module.exports = Object.assign({}, baseConfig, {
  modulePathIgnorePatterns: ['(html|element|integration)\\.test\\.js$'],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/.jest/setup_ssr.js'],
});
