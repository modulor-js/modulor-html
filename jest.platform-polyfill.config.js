const baseConfig = require('./jest.config');

module.exports = Object.assign({}, baseConfig, {
  moduleNameMapper: Object.assign({}, baseConfig.moduleNameMapper, {
    '^web-components-polyfill$': 'custom-elements-jest',
  }),
});
