import tseslint from "typescript-eslint";
import globals from "globals";

export default {
  name: "@repo/eslint-config/typescript",

  files: ["**/*.{ts,tsx,mts,cts}"],

  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
      project: true,
      tsconfigRootDir: process.cwd(),
    },
    globals: {
      ...globals.node,
      ...globals.browser,
      ...globals.es2024,
    },
  },

  plugins: {
    "@typescript-eslint": tseslint.plugin,
  },

  rules: {
    // TypeScript специфичные правила
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-empty-interface": "warn",
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/no-inferrable-types": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/consistent-type-assertions": [
      "warn",
      {
        assertionStyle: "as",
        objectLiteralTypeAssertions: "never",
      },
    ],

    // Производительность
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-misused-promises": "error",

    // Стиль
    "@typescript-eslint/array-type": ["error", { default: "array" }],
    "@typescript-eslint/parameter-properties": [
      "error",
      { prefer: "parameter-property" },
    ],
    "@typescript-eslint/member-ordering": [
      "warn",
      {
        default: [
          "signature",
          "public-static-field",
          "protected-static-field",
          "private-static-field",
          "public-instance-field",
          "protected-instance-field",
          "private-instance-field",
          "public-constructor",
          "protected-constructor",
          "private-constructor",
          "public-instance-method",
          "protected-instance-method",
          "private-instance-method",
        ],
      },
    ],

    // Оverride базовых правил
    "no-unused-vars": "off",
    "no-use-before-define": "off",
  },
};
