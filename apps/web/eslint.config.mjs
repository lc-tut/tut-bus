// eslint.config.mjs
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

export default [
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
]
