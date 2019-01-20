import { uglify } from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';

const plugins = [
  babel(),
  uglify(),
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
}, {
  input: 'src/element.js',
  output: {
    file: 'build/element.js',
    format: 'cjs',
  },
  plugins
}];
