module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        exclude: ['@babel/plugin-transform-typeof-symbol']
      },
    ],
  ],
  env: {
    test: {
      plugins: ['@babel/plugin-transform-runtime'],
    },
    production: {
      plugins: ['transform-node-env-inline'],
    },
  },
};
