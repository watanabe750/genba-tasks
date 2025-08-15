// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  // ここでビルド成果物を無視
  globalIgnores(['node_modules/**','dist/**', '.vite/**']),

  {
    files: ['**/*.{ts,tsx}'],
    // 旧形式の "parserOptions" を含む extends を避ける
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,        // 配列なのでスプレッドが安全
      reactHooks.configs['recommended-latest']
      // ※ jsx-a11y は extends しない（旧形式のことがあるため）
      // ※ reactRefresh.configs.vite も使わず、下で rules を直書き
    ],
    plugins: {
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // react-refresh の推奨相当
      'react-refresh/only-export-components': 'warn',

      // 必要な a11y ルールだけ使う（例）
      'jsx-a11y/anchor-has-content': 'error',
      // 他にも入れたければここに追記
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
