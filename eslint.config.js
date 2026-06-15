// eslint.config.js (корневой)
import eslintConfig from "@repo/eslint-config";

export default [
  // Глобальные игнорируемые паттерны
  eslintConfig.ignores,

  // Базовая конфигурация для JavaScript
  eslintConfig.base,

  // TypeScript конфигурация
  eslintConfig.typescript,

  // React/JSX конфигурация (если есть JSX/TSX файлы)
  ...(process.env.USE_REACT === "true" ? [eslintConfig.react] : []),

  // Vue конфигурация (если есть Vue файлы)
  ...(process.env.USE_VUE === "true" ? [eslintConfig.vue] : []),

  // JSON конфигурация
  eslintConfig.json,

  // YAML конфигурация
  eslintConfig.yaml,

  // Markdown конфигурация
  eslintConfig.markdown,

  // Переопределения для специфичных путей
  {
    name: "local-overrides",
    files: ["**/__tests__/**/*.{js,ts}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  {
    name: "scripts-overrides",
    files: ["scripts/**/*.{js,mjs}"],
    rules: {
      "no-console": "off",
    },
  },
];
