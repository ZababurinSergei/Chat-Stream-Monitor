import esbuild from "esbuild";
import cssModulesPlugin from "esbuild-css-modules-plugin";
import { polyfillNode } from "esbuild-plugin-polyfill-node";
import aliasPlugin from 'esbuild-plugin-path-alias';
import path from 'path';
import * as dotenv from 'dotenv'
import copyStaticFiles from "esbuild-copy-static-files";
import {sassPlugin} from 'esbuild-sass-plugin'
import inlineImage from "esbuild-plugin-inline-image";
import svgrPlugin from 'esbuild-plugin-svgr'

dotenv.config()
const __dirname = path.join(path.dirname(process.argv[1]), './');

let define = {}

function template(variables, { tpl }) {
  return tpl`
    ${variables.imports};
    ${variables.interfaces};
    const ${variables.componentName} = (${variables.props}) => (
      ${variables.jsx}
    ); 
    ${variables.exports};
    export const ReactComponent = ${variables.componentName};
  `;
};

const cyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

for (const k in process.env) {
  if (k.startsWith('REACT_APP_') || k.startsWith('PUBLIC_URL') || k.startsWith('PORT')) {
    define[`process.env.${k}`] = JSON.stringify(process.env[k]);
  }
}

/**
 * ESBuild Params
 * @link https://esbuild.github.io/api/#build-api
 */
const buildParams = {
  entryPoints: ["src/main.js"],
  outfile: './docs/index.mjs',
  format: "esm",
  loader: { '.svg': 'file',".js": "jsx", ".json": "json", ".png": "file", ".jpeg": "file", ".jpg": "file", ".woff": "file" },
  color: true,
  minify: true,
  bundle: true,
  metafile: true,
  sourcemap: true,
  mainFields : [ 'module' , 'main' ],
  define,
  logLevel: "error",
  plugins: [
    cssModulesPlugin({
      inject: 'body',
      force: true,
      dashedIndents: false,
      emitDeclarationFile: false,
      localsConvention: 'camelCase',
      pattern: '[name]-[hash]-[local]'
    }),
    aliasPlugin({
      '@src': path.resolve(__dirname, './src'),
      '@react-hook': path.resolve(__dirname, './src/hooks')
    }),
    svgrPlugin({ template }),
    polyfillNode({
      process: true,
      buffer: true,
      define
    }),
    inlineImage(),
    copyStaticFiles({
      src: './src/index.html',
      dest: './docs/index.html',
      dereference: true,
      errorOnExist: false,
      preserveTimestamps: true,
      recursive: true,
    }),
    copyStaticFiles({
      src: './src/this/',
      dest: './docs/this/',
      dereference: true,
      errorOnExist: false,
      preserveTimestamps: true,
      recursive: true,
    }),
    sassPlugin(),
  ]
};

console.time("⚡ [esbuild] Done");
esbuild.build(buildParams).catch((e) => {
  console.error('ERROR ESBUILD', e)
  process.exit(1)
});
console.timeEnd("⚡ [esbuild] Done")
