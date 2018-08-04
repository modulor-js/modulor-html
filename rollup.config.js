import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';

const plugins = [
  babel({
    babelrc: false,
    presets: [
      ['es2015', { modules: false }],
    ],
    plugins: ['transform-node-env-inline']
  }),
  uglify()
];

export default [{
  input: 'src/html.js',
  output: {
    file: 'build/html.js',
    format: 'umd',
    name: 'MHTML'
  },
  plugins
}, {
  input: 'src/directives.js',
  output: {
    file: 'build/directives.js',
    format: 'cjs',
  },
  plugins
}];
