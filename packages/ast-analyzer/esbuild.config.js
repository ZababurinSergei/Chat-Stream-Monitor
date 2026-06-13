// packages/ast-analyzer/esbuild.config.js
import esbuild from 'esbuild';
import { readdirSync, existsSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';

// Находим все entry points рекурсивно
function findEntryPoints(dir, baseDir = dir) {
  const entries = [];

  if (!existsSync(dir)) {
    console.warn(`⚠️ Directory does not exist: ${dir}`);
    return entries;
  }

  try {
    const files = readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = resolve(dir, file.name);

      try {
        if (file.isDirectory()) {
          entries.push(...findEntryPoints(fullPath, baseDir));
        } else if (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts')) {
          if (
            file.name === 'cli.ts' ||
            file.name === 'cli-refactor.ts' ||
            file.name === 'cli-cicd.ts' ||
            file.name === 'cli-ts-validator.ts' ||
            file.name === 'index.ts' ||
            fullPath.includes('/modes/') ||
            fullPath.includes('/core/') ||
            fullPath.includes('/reporters/') ||
            fullPath.includes('/refactor/') ||
            fullPath.includes('/semantic/') ||
            fullPath.includes('/formal/') ||
            fullPath.includes('/ci-cd/')
          ) {
            entries.push(resolve(fullPath));
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error accessing ${fullPath}:`, error.message);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Error reading directory ${dir}:`, error.message);
  }

  return entries;
}

const srcDir = resolve(__dirname, 'src');
const entryPoints = findEntryPoints(srcDir);

console.log(`📦 Building ${entryPoints.length} entry points...`);

// Оптимизированный список external packages - оставляем только то,
// что действительно должно оставаться внешним
const externalPackages = [
  // Node.js built-ins
  'fs',
  'fs/promises',
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
  'assert',
  'buffer',
  'tty',
  'readline',
  'string_decoder',

  // Тяжелые зависимости с нативными модулями
  '@hpcc-js/wasm-graphviz', // WebAssembly модуль
  'z3-solver', // Нативный бинарник Z3

  // Должен быть установлен отдельно пользователем
  'typescript',
];

// Пакеты, которые можно безопасно включить в бандл (удалены из external)
// @typescript-eslint/parser, estree-walker, @vue/compiler-sfc,
// ts-morph, commander и другие теперь будут забандлены

const buildOptions = {
  entryPoints,
  bundle: true,
  outdir: 'dist',
  platform: 'node',
  target: 'node18',
  format: 'esm',
  sourcemap: !isProduction,
  minify: isProduction,
  keepNames: true,
  treeShaking: true,
  external: externalPackages,
  packages: 'external',
  mainFields: ['module', 'main'],
  loader: {
    '.ts': 'ts',
    '.js': 'js',
    '.mjs': 'js',
    '.cjs': 'js',
  },
  tsconfig: './tsconfig.json',
  logLevel: 'info',
  logOverride: {
    'unresolved-import': 'warning',
    'missing-explicit-type': 'silent',
  },
  plugins: [
    {
      name: 'resolve-vue-files',
      setup(build) {
        build.onResolve({ filter: /\.vue$/ }, args => {
          return {
            path: args.path,
            namespace: 'vue-file',
          };
        });

        build.onLoad({ filter: /\.vue$/, namespace: 'vue-file' }, async args => {
          const fsModule = await import('fs');
          const content = await fsModule.promises.readFile(args.path, 'utf8');

          const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
          if (scriptMatch && scriptMatch[1]) {
            return {
              contents: scriptMatch[1],
              loader: 'ts',
            };
          }

          return {
            contents: 'export default {};',
            loader: 'js',
          };
        });
      },
    },
    {
      name: 'remove-pnpm-lock-warning',
      setup(build) {
        build.onStart(() => {
          console.log('🚀 Starting build...');
        });
      },
    },
  ],
};

import path from 'path';

if (isProduction) {
  console.log('🏭 Production build: minifying...');
} else {
  console.log('🔧 Development build: sourcemaps enabled...');
}

try {
  const result = await esbuild.build(buildOptions);
  console.log(`\n✅ Build completed successfully!`);
  console.log(`📁 Output directory: ${resolve(__dirname, 'dist')}`);

  if (result.errors.length > 0) {
    console.error(`\n❌ Build errors:`, result.errors);
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn(`\n⚠️ Build warnings:`, result.warnings);
  }

  // Выводим информацию о размере бандла
  const distFiles = readdirSync(resolve(__dirname, 'dist'));
  let totalSize = 0;
  for (const file of distFiles) {
    if (file.endsWith('.js')) {
      const size = statSync(resolve(__dirname, 'dist', file)).size;
      totalSize += size;
      console.log(`   📄 ${file}: ${(size / 1024).toFixed(2)} KB`);
    }
  }
  console.log(`\n📊 Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
