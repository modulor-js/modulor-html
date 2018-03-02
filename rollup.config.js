import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/html.js',
  output: {
    file: 'build/html.js',
    format: 'umd',
    name: 'MHTML'
  },
  plugins: [
    babel({
      babelrc: false,
      presets: [
        ['es2015', { modules: false }],
      ],
    }),
    uglify()
  ]
};
