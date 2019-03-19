const baseConfig = require('./config');

module.exports = Object.assign({}, baseConfig, {
  testRegex: '.+\\.benchmark\\.js$',
  transformIgnorePatterns: [],
});
