import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default {
  name: "@repo/eslint-config/react",

  files: ["**/*.{jsx,tsx}"],

  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
    },
  },

  plugins: {
    react,
    "react-hooks": reactHooks,
  },

  settings: {
    react: {
      version: "detect",
    },
  },

  rules: {
    // React специфичные правила
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-vars": "error",
    "react/jsx-key": ["error", { checkFragmentShorthand: true }],
    "react/jsx-no-duplicate-props": "error",
    "react/jsx-no-undef": "error",
    "react/jsx-pascal-case": ["error", { allowAllCaps: true }],
    "react/jsx-no-target-blank": ["warn", { enforceDynamicLinks: false }],

    // JSX стиль
    "react/self-closing-comp": [
      "error",
      {
        component: true,
        html: false,
      },
    ],
    "react/jsx-boolean-value": ["error", "never"],
    "react/jsx-curly-brace-presence": [
      "error",
      {
        props: "never",
        children: "never",
      },
    ],
    "react/jsx-tag-spacing": [
      "error",
      {
        closingSlash: "never",
        beforeSelfClosing: "always",
        afterOpening: "never",
        beforeClosing: "never",
      },
    ],
    "react/jsx-wrap-multilines": [
      "error",
      {
        declaration: "parens-new-line",
        assignment: "parens-new-line",
        return: "parens-new-line",
        arrow: "parens-new-line",
        condition: "parens-new-line",
        logical: "parens-new-line",
        prop: "ignore",
      },
    ],
    "react/jsx-indent": ["error", 2],
    "react/jsx-indent-props": ["error", 2],
    "react/jsx-max-props-per-line": ["warn", { maximum: 1, when: "multiline" }],
    "react/jsx-first-prop-new-line": ["error", "multiprop"],
    "react/jsx-closing-bracket-location": ["error", "line-aligned"],
    "react/jsx-curly-spacing": ["error", { when: "never", children: true }],
    "react/jsx-equals-spacing": ["error", "never"],

    // React Hooks
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // Функциональные компоненты
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      },
    ],
    "react/destructuring-assignment": ["warn", "always"],
    "react/no-array-index-key": "warn",
    "react/no-unused-prop-types": "warn",
    "react/no-unused-state": "warn",
    "react/prefer-stateless-function": "warn",
    "react/require-default-props": "off", // Для TypeScript проектов
  },
};
