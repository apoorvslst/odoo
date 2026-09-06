import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Fetch-on-mount sets loading/data state from an effect on purpose
      // (no react-query in this project); the compiler lint flags every such loader.
      'react-hooks/set-state-in-effect': 'off',
      // ui.jsx exports the shared usePagedSearch hook next to tiny presentational components.
      'react-refresh/only-export-components': 'off',
    },
  },
])
