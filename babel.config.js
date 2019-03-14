module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
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
