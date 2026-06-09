import esbuild from 'esbuild';
import { readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';

// Находим все entry points рекурсивно
function findEntryPoints(dir, baseDir = dir) {
  const entries = [];
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = resolve(dir, file.name);
    if (file.isDirectory()) {
      entries.push(...findEntryPoints(fullPath, baseDir));
    } else if (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts')) {
      // Только файлы, которые являются точками входа (не все .ts файлы)
      if (
        file.name === 'cli.ts' ||
        file.name === 'index.ts' ||
        fullPath.includes('/modes/') ||
        fullPath.includes('/core/') ||
        fullPath.includes('/reporters/')
      ) {
        const relativePath = resolve(fullPath);
        entries.push(relativePath);
      }
    }
  }

  return entries;
}

const entryPoints = findEntryPoints(resolve(__dirname, 'src'));

console.log(`📦 Building ${entryPoints.length} entry points...`);

const buildOptions = {
  entryPoints,
  bundle: true, // Изменено с false на true
  outdir: 'dist',
  platform: 'node',
  target: 'node18',
  format: 'esm',
  sourcemap: isProduction ? false : true,
  minify: isProduction,
  keepNames: true,
  treeShaking: true,
  external: [
    'fs',
    'path',
    'url',
    'util',
    'crypto',
    'stream',
    'events',
    'child_process',
    'os',
    'http',
    'https',
    'zlib',
    '@typescript-eslint/parser',
    'estree-walker',
    '@hpcc-js/wasm-graphviz',
  ],
  loader: {
    '.ts': 'ts',
    '.js': 'js',
  },
  tsconfig: './tsconfig.json',
  logLevel: 'info',
};

if (isProduction) {
  console.log('🏭 Production build: minifying...');
}

esbuild.build(buildOptions).catch(() => process.exit(1));
