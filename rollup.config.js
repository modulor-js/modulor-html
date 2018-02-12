import uglify from 'rollup-plugin-uglify';

export default {
  input: 'src/html.js',
  output: {
    file: 'build/html.js',
    format: 'umd',
    name: 'MHTML'
  },
  plugins: [
    uglify()
  ]
};
