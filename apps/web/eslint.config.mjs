// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import unusedImports from 'eslint-plugin-unused-imports'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

const config = [
  ...compat.config({
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'next',
      'next/core-web-vitals',
      'next/typescript',
      'prettier',
    ],
    settings: { react: { version: 'detect' } },
  }),
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]

export default config
