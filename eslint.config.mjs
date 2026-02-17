import markdown from 'eslint-plugin-markdown';
import asyncAwait from 'eslint-plugin-async-await';
import globals from 'globals';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['website/'],
  },
  ...compat.extends('eslint:recommended', 'plugin:prettier/recommended'),
  {
    plugins: {
      markdown,
      'async-await': asyncAwait,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'commonjs',
    },
    rules: {
      'template-curly-spacing': ['error', 'never'],
      'prefer-template': 'error',
      'no-useless-call': 'error',
      'no-lonely-if': 'error',
      'no-else-return': [
        'error',
        {
          allowElseIf: false,
        },
      ],
      eqeqeq: 'error',
      'no-invalid-this': 'error',
      'consistent-this': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-var': 'error',
      'no-use-before-define': 'error',
      strict: ['error', 'global'],
    },
  },
  ...compat.extends('plugin:@typescript-eslint/recommended').map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'arrow-parens': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ImportDeclaration[source.value=/^\\./][source.value!=/\\.(js)$/]',
          message: 'Local imports must have the explicit extension',
        },
      ],
    },
  },
  ...compat.extends('plugin:@typescript-eslint/recommended').map((config) => ({
    ...config,
    files: ['**/*.mts'],
  })),
  {
    files: ['**/*.mts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      strict: 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ImportDeclaration[source.value=/^\\./][source.value!=/\\.(mjs)$/]',
          message: 'Local imports must have the explicit .mjs extension',
        },
      ],
    },
  },
  {
    files: ['**/*.md'],
    processor: 'markdown/markdown',
  },
  {
    files: ['**/*.md/*js', '**/*.md/*ts'],
    processor: 'markdown/markdown',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'no-unused-labels': 'off',
      strict: 'off',
      'prefer-arrow-callback': 'off',
    },
  },
  {
    files: ['**/**/*.test.*'],
    rules: {
      'arrow-parens': ['error', 'always'],
    },
  },
  {
    files: ['**/**/*.test.ts', '**/**/*.test.mts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'arrow-parens': ['error', 'always'],
    },
  },
  {
    files: ['**/*.mjs', '**/*.mts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
];
