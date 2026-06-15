import vue from "eslint-plugin-vue";
import globals from "globals";

export default {
  name: "@repo/eslint-config/vue",

  files: ["**/*.vue"],

  languageOptions: {
    parser: "vue-eslint-parser",
    parserOptions: {
      parser: "@typescript-eslint/parser",
      ecmaVersion: 2024,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
    },
  },

  plugins: {
    vue,
  },

  rules: {
    // Vue 3 Essential
    "vue/multi-word-component-names": "off",
    "vue/no-v-html": "warn",
    "vue/require-default-prop": "warn",
    "vue/require-prop-types": "error",
    "vue/require-v-for-key": "error",
    "vue/no-unused-vars": ["warn", { ignorePattern: "^_" }],
    "vue/no-parsing-error": "error",
    "vue/valid-v-for": "error",
    "vue/valid-v-bind": "error",
    "vue/valid-v-model": "error",
    "vue/valid-v-if": "error",
    "vue/valid-v-show": "error",

    // Vue Style Guide
    "vue/attribute-hyphenation": ["error", "always"],
    "vue/v-on-event-hyphenation": ["error", "always"],
    "vue/html-indent": ["error", 2],
    "vue/script-indent": ["error", 2],
    "vue/max-attributes-per-line": [
      "warn",
      {
        singleline: { max: 3 },
        multiline: { max: 1 },
      },
    ],
    "vue/html-closing-bracket-newline": [
      "error",
      {
        singleline: "never",
        multiline: "always",
      },
    ],
    "vue/html-closing-bracket-spacing": [
      "error",
      {
        selfClosingTag: "never",
      },
    ],
    "vue/html-self-closing": [
      "error",
      {
        html: { void: "never", normal: "never", component: "always" },
        svg: "always",
        math: "always",
      },
    ],
    "vue/no-multi-spaces": "error",
    "vue/no-spaces-around-equal-signs-in-attribute": "error",
    "vue/this-in-template": ["error", "never"],
    "vue/component-name-in-template-casing": ["error", "PascalCase"],

    // Vue 3 Specific
    "vue/component-api-style": ["warn", ["script-setup"]],
    "vue/define-props-declaration": ["error", "type-based"],
    "vue/define-emits-declaration": ["error", "type-based"],
    "vue/define-macros-order": [
      "error",
      {
        order: ["defineProps", "defineEmits", "defineExpose", "defineOptions"],
      },
    ],
    "vue/require-direct-export": "off",
  },
};
