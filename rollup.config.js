import { terser } from "rollup-plugin-terser";

export default [
  {
    input: 'lib/media-pool.js',
    output: {
      file: 'lib/pool.js',
      format: 'esm'
    },
    plugins: [terser({
      output: {
        comments: false
      }
    })]
  }
];