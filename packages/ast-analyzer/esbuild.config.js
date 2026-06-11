// packages/ast-analyzer/esbuild.config.js
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

// Список пакетов, которые нужно оставить как external (не бандлить)
const externalPackages = [
  // Node.js built-ins
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
  'assert',
  'buffer',

  // Основные зависимости (не бандлим, чтобы избежать проблем с динамическими require)
  '@typescript-eslint/parser',
  'estree-walker',
  '@hpcc-js/wasm-graphviz',

  // Зависимости @vue/compiler-sfc (будут загружены из node_modules)
  '@vue/compiler-core',
  '@vue/compiler-dom',
  '@vue/compiler-sfc',
  '@vue/compiler-ssr',
  '@vue/shared',
  '@vue/reactivity-transform',
  'postcss',
  'source-map-js',
  'magic-string',
  'estree-walker',
];

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
  // Настройка для правильной обработки модулей
  packages: 'external',
  // Настройка для mainFields
  mainFields: ['module', 'main'],
  loader: {
    '.ts': 'ts',
    '.js': 'js',
  },
  tsconfig: './tsconfig.json',
  logLevel: 'info',
  // Подавляем предупреждения
  logOverride: {
    'unresolved-import': 'warning',
  },
  // Плагин для обработки динамических require
  plugins: [
    {
      name: 'dynamic-require-polyfill',
      setup(build) {
        // Заменяем динамический require на import()
        build.onLoad({ filter: /\.js$/ }, async args => {
          const fs = await import('fs');
          let contents = await fs.promises.readFile(args.path, 'utf8');

          // Заменяем require() на import() для динамических загрузок
          contents = contents.replace(/require\(['"]([^'"]+)['"]\)/g, (match, pkg) => {
            // Если пакет в external, оставляем как есть
            if (
              externalPackages.includes(pkg) ||
              externalPackages.some(ext => pkg.startsWith(ext))
            ) {
              return match;
            }
            // Иначе заменяем на динамический import
            return `import('${pkg}')`;
          });

          return { contents, loader: 'js' };
        });
      },
    },
  ],
};

if (isProduction) {
  console.log('🏭 Production build: minifying...');
}

esbuild.build(buildOptions).catch(() => process.exit(1));
