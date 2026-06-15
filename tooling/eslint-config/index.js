/**
 * @repo/eslint-config - Централизованная конфигурация ESLint для монорепозитория
 *
 * Использование в корневом eslint.config.js:
 * import eslintConfig from '@repo/eslint-config';
 *
 * export default [
 *   ...eslintConfig.base,
 *   ...eslintConfig.typescript,
 *   ...eslintConfig.json,
 *   ...eslintConfig.yaml,
 *   ...eslintConfig.markdown,
 * ];
 */

import base from "./base.js";
import typescript from "./typescript.js";
import react from "./react.js";
import vue from "./vue.js";
import json from "./json.js";
import yaml from "./yaml.js";
import markdown from "./markdown.js";

// Базовая конфигурация с игнорируемыми паттернами
const ignores = {
  name: "@repo/eslint-config/ignores",
  ignores: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/.turbo/**",
    "**/.next/**",
    "**/out/**",
    "**/.nuxt/**",
    "**/.output/**",
    "**/.vercel/**",
    "**/*.log",
    "**/*.tmp",
    "**/*.swp",
    "**/*.backup.*",
    "**/pnpm-lock.yaml",
    "**/package-lock.json",
    "**/yarn.lock",
    "**/.DS_Store",
    "**/Thumbs.db",
    "Directory/10/**",
    "Directory/11/**",
    "Directory/12/**",
    "Directory/13/**",
    "Directory/typescript-sdk/**",
    "**/ai-*.md",
    "**/ai-*.txt",
    "**/output.json",
    "**/output.dot",
    "**/output.svg",
    "**/report.html",
    "**/vue-analysis.json",
    "**/module-analysis.json",
    "**/fs/fs.json",
    "**/logs/**",
    "**/verification-reports/**",
    "**/cicd-reports/**",
    "**/semantic-reports/**",
  ],
};

// Экспорт готовых конфигураций
export default {
  ignores,
  base,
  typescript,
  react,
  vue,
  json,
  yaml,
  markdown,
};

// Экспорт отдельных конфигураций для гибкости
export { base, typescript, react, vue, json, yaml, markdown, ignores };
