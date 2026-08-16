import esbuild from "esbuild";
import cssModulesPlugin from "esbuild-css-modules-plugin";
import { polyfillNode } from "esbuild-plugin-polyfill-node";
import aliasPlugin from 'esbuild-plugin-path-alias';
import path from 'path';
import * as dotenv from 'dotenv'
import { copy } from 'esbuild-plugin-copy';
dotenv.config()
const __dirname = path.join(path.dirname(process.argv[1]), './');

let define = {}

const buildPath = 'this'
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
  entryPoints: ["./main.mjs"],
  outfile: '../this/main.mjs',
  format: "esm",
  target: "es2022",
  loader: {  '.css': 'copy', '.data': 'base64' , ".js": "jsx",".ttf":"base64", ".json": "copy", ".png": "file", ".jpeg": "file", ".jpg": "file", ".svg": "dataurl", ".woff": "file" },
  color: true,
  minify: true,
  bundle: true,
  sourcemap: true,
  mainFields : [ 'module' , 'main' ],
  define,
  logLevel: "error",
  external: ["*.gif"],
  plugins: [
    aliasPlugin({
      '@src': path.resolve(__dirname, './')
    }),
    polyfillNode({
      process: true,
      buffer: true,
      define
    }),
    cssModulesPlugin({
      localsConvention: "dashes",
      inject: true,
      generateScopedName: (name, filename, css) => {
        let prefix = path.dirname(filename).split('/')
        prefix = prefix[prefix.length - 1]
        return `${prefix}_${name}__${cyrb53(css, 2)}`
      },
      generateTsFile: true
    }),
    copy({
      resolveFrom: 'cwd',
      assets: [{
        from: ['./component/**/*.css', './component/**/*.wasm', './component/**/*.js', './component/index.html', './component/**/*.png'],
        to: [`../${buildPath}/component`],
      },{
        from: ['./index.html'],
        to: [`../${buildPath}/index.html`],
      },{
        from: ['./this/**'],
        to: [`../${buildPath}/this`],
      }],
      watch: true,
    }),
  ]
};

console.time("⚡ [esbuild] Done");
esbuild.build(buildParams).catch((e) => {
  console.error('ERROR ESBUILD', e)
  process.exit(1)
});
console.timeEnd("⚡ [esbuild] Done")
