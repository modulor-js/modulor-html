const baseConfig = require('./config');

module.exports = Object.assign({}, baseConfig, {
  moduleNameMapper: Object.assign({}, baseConfig.moduleNameMapper, {
    '^web-components-polyfill$': 'custom-elements-jest',
  }),
});
