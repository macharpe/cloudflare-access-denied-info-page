import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: {
        // Cloudflare Workers globals
        addEventListener: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Date: 'readonly',
        JSON: 'readonly',
        Promise: 'readonly',
        Error: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'caughtErrorsIgnorePattern': '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for API responses

      // General rules
      'no-console': 'off', // Allow console for debugging
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead

      // Code style
      'indent': ['error', 2],
      'quotes': ['error', 'double', { 'avoidEscape': true }],
      'semi': ['error', 'always'],

      // Best practices for Cloudflare Workers
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error'
    }
  },
  {
    // Ignore patterns
    ignores: [
      'node_modules/**',
      'dist/**',
      '.wrangler/**',
      'eslint.config.js'
    ]
  }
];