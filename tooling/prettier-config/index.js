/**
 * Prettier Configuration for Monorepo
 *
 * Общая конфигурация Prettier для всех пакетов монорепозитория.
 * Используется автоматически для форматирования кода во всех проектах.
 *
 * @see https://prettier.io/docs/en/configuration.html
 * @see https://prettier.io/docs/en/options.html
 */

export default {
  // Базовая настройка
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',

  // JSX специфичные настройки
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // Запятые
  trailingComma: 'es5',

  // Скобки и пробелы
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // Vue специфичные настройки
  vueIndentScriptAndStyle: true,
  singleAttributePerLine: false,

  // HTML/XML настройки
  htmlWhitespaceSensitivity: 'css',

  // Markdown настройки
  proseWrap: 'preserve',

  // Концевые строки
  endOfLine: 'lf',

  // Встроенные языки
  embeddedLanguageFormatting: 'auto',

  // Атрибуты HTML
  attributeGroups: [
    '^(id|name|data-.*)$',
    '^(class|className)$',
    '^(style|css)$',
    '^on[A-Z]',
    '^(type|href|src|alt)$',
    '^(value|checked|selected|disabled|readonly)$',
    '^(placeholder|title|label)$',
    '^(role|aria-.*)$',
    '^(key|ref|slot)$',
    '^v-.*$',
    '^@.*$',
    '^:.*$',
    '.*',
  ],

  // Сортировка импортов (требует плагин)
  // importOrder: [
  //   '^@newkind/(.*)$',
  //   '^@repo/(.*)$',
  //   '^@/(.*)$',
  //   '^[./]',
  // ],
  // importOrderSeparation: true,
  // importOrderSortSpecifiers: true,

  // Плагины (если нужны)
  plugins: [],

  // Переопределения для разных типов файлов
  overrides: [
    {
      files: ['*.json', '*.jsonc', '*.json5'],
      options: {
        tabWidth: 2,
        useTabs: false,
        trailingComma: 'none',
      },
    },
    {
      files: ['*.yaml', '*.yml'],
      options: {
        tabWidth: 2,
        useTabs: false,
        singleQuote: true,
      },
    },
    {
      files: ['*.md', '*.markdown'],
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
        useTabs: false,
      },
    },
    {
      files: ['*.css', '*.scss', '*.sass', '*.less'],
      options: {
        singleQuote: true,
        tabWidth: 2,
      },
    },
    {
      files: ['*.html', '*.htm', '*.vue'],
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'ignore',
        singleQuote: true,
      },
    },
    {
      files: ['*.ts', '*.tsx', '*.mts', '*.cts'],
      options: {
        parser: 'typescript',
        arrowParens: 'always',
      },
    },
    {
      files: ['*.js', '*.jsx', '*.mjs', '*.cjs'],
      options: {
        parser: 'babel',
      },
    },
    {
      files: ['*.vue'],
      options: {
        parser: 'vue',
        vueIndentScriptAndStyle: true,
        singleAttributePerLine: true,
      },
    },
    {
      files: ['*.graphql', '*.gql'],
      options: {
        parser: 'graphql',
        tabWidth: 2,
      },
    },
    {
      files: ['*.xml', '*.svg', '*.xhtml'],
      options: {
        parser: 'xml',
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: ['*.sql'],
      options: {
        parser: 'sql',
        tabWidth: 2,
        useTabs: false,
      },
    },
    {
      files: ['Dockerfile', '*.dockerfile'],
      options: {
        parser: 'docker',
        tabWidth: 2,
      },
    },
    {
      // Удалено упоминание .eslintrc
      files: ['.prettierrc', '.stylelintrc'],
      options: {
        parser: 'json',
        tabWidth: 2,
      },
    },
    {
      files: ['*.lock', '*.lockb'],
      options: {
        parser: 'yaml',
        printWidth: 200,
        tabWidth: 2,
      },
    },
  ],

  // Игнорируемые файлы (глобальные паттерны)
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/*.backup.*',
    '**/*.log',
    '**/*.tmp',
    '**/*.swp',
    '**/pnpm-lock.yaml',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/__pycache__/**',
    '**/*.pyc',
    '**/*.class',
    '**/*.o',
    '**/*.so',
    '**/*.dll',
    '**/*.exe',
    '**/*.min.js',
    '**/*.min.css',
    '**/output.json',
    '**/output.dot',
    '**/output.svg',
    '**/report.html',
    '**/ai-context.txt',
    '**/ai-prompt-bundle.md',
    '**/ai-split-module-prompt.md',
    '**/ai-project-context.md',
    '**/ai-dead-code-report.md',
    '**/ai-impact-report.md',
    '**/module-analysis.json',
    '**/internal-graph.json',
    '**/vue-analysis.json',
    '**/fs/fs.json',
    '**/logs/**',
    '**/verification-reports/**',
    '**/cicd-reports/**',
    '**/semantic-reports/**',
    'Directory/10/**',
    'Directory/11/**',
    'Directory/12/**',
    'Directory/13/**',
    'Directory/typescript-sdk/**',
  ],
};

// Экспорт конфигурации для использования в других файлах
export const prettierConfig = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
};

// Экспорт конфигурации для JavaScript файлов
export const jsConfig = {
  ...prettierConfig,
  parser: 'babel',
  arrowParens: 'always',
};

// Экспорт конфигурации для TypeScript файлов
export const tsConfig = {
  ...prettierConfig,
  parser: 'typescript',
  arrowParens: 'always',
};

// Экспорт конфигурации для Vue файлов
export const vueConfig = {
  ...prettierConfig,
  parser: 'vue',
  vueIndentScriptAndStyle: true,
  singleAttributePerLine: true,
  printWidth: 120,
};

// Экспорт конфигурации для JSON файлов
export const jsonConfig = {
  ...prettierConfig,
  parser: 'json',
  trailingComma: 'none',
};

// Экспорт конфигурации для Markdown файлов
export const markdownConfig = {
  ...prettierConfig,
  parser: 'markdown',
  printWidth: 80,
  proseWrap: 'always',
};

// Экспорт конфигурации для CSS/SCSS файлов
export const cssConfig = {
  ...prettierConfig,
  parser: 'css',
  singleQuote: true,
  tabWidth: 2,
};

// Экспорт конфигурации для HTML файлов
export const htmlConfig = {
  ...prettierConfig,
  parser: 'html',
  printWidth: 120,
  htmlWhitespaceSensitivity: 'ignore',
  singleQuote: true,
};

// Экспорт конфигурации для YAML файлов
export const yamlConfig = {
  ...prettierConfig,
  parser: 'yaml',
  singleQuote: true,
  tabWidth: 2,
};

// Экспорт конфигурации для GraphQL файлов
export const graphqlConfig = {
  ...prettierConfig,
  parser: 'graphql',
  tabWidth: 2,
};

// Функция для получения конфигурации по типу файла
export function getConfigForFile(filePath) {
  const ext = filePath.split('.').pop();

  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return jsConfig;
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return tsConfig;
    case 'vue':
      return vueConfig;
    case 'json':
    case 'jsonc':
    case 'json5':
      return jsonConfig;
    case 'md':
    case 'markdown':
      return markdownConfig;
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return cssConfig;
    case 'html':
    case 'htm':
      return htmlConfig;
    case 'yaml':
    case 'yml':
      return yamlConfig;
    case 'graphql':
    case 'gql':
      return graphqlConfig;
    default:
      return prettierConfig;
  }
}

// Информация о версии
export const VERSION = '1.0.0';
export const NAME = '@repo/prettier-config';
