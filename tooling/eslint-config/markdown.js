import markdown from "@eslint/markdown";

export default {
  name: "@repo/eslint-config/markdown",

  files: ["**/*.md"],

  plugins: {
    markdown,
  },

  processor: "markdown/markdown",

  rules: {
    // Базовые правила для Markdown
    "markdown/no-html": "warn",
    "markdown/no-missing-label-refs": "error",

    // Стиль
    "spaced-comment": ["warn", "always"],
    "no-irregular-whitespace": "error",
    "no-trailing-spaces": "error",
    "eol-last": ["error", "always"],
  },

  overrides: [
    {
      // Правила для кода внутри Markdown
      files: ["**/*.md/*.js", "**/*.md/*.ts"],
      rules: {
        "no-console": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-undef": "off",
      },
    },
    {
      // Специальные правила для примеров кода
      files: ["**/*.md/*.example.js", "**/*.md/*.example.ts"],
      rules: {
        "no-unused-expressions": "off",
        "no-const-assign": "off",
      },
    },
  ],
};
