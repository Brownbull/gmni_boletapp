// Security-focused ESLint configuration
// Uses eslint-plugin-security to detect dangerous patterns
// Run with: npx eslint -c eslint.config.security.mjs src/

import pluginSecurity from 'eslint-plugin-security'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default [
  // TypeScript parsing support
  ...tseslint.configs.recommended,
  {
    // Ignore files with react-hooks eslint-disable comments (security lint doesn't have that plugin)
    // ESLint v9 errors on unknown rules in disable comments, even with reportUnusedDisableDirectives: 'off'
    ignores: [
      'src/hooks/useChangeDetection.ts',
      'src/components/celebrations/PersonalRecordBanner.tsx',
      'src/contexts/HistoryFiltersContext.tsx',
      'src/features/history/components/IconCategoryFilter.tsx',
      'src/features/items/views/ItemsView/ItemsView.tsx',
    ]
  },
  {
    files: ['src/**/*.{js,ts,jsx,tsx}'],
    linterOptions: {
      // Don't error when eslint-disable comments reference rules not in this config
      reportUnusedDisableDirectives: 'off'
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      security: pluginSecurity
    },
    rules: {
      // Disable TypeScript rules for this security-only config
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',

      // Block dangerous eval() usage - HIGH priority
      'security/detect-eval-with-expression': 'error',

      // Block exponential regex (ReDoS attacks) - HIGH priority
      'security/detect-unsafe-regex': 'error',

      // Block buffer operations without assertion - HIGH priority
      'security/detect-buffer-noassert': 'error',

      // Warn on object injection (obj[var]) patterns - MEDIUM priority
      // Set to warn as this has many false positives in React apps
      'security/detect-object-injection': 'warn',

      // Warn on non-literal regex - MEDIUM priority
      'security/detect-non-literal-regexp': 'warn',

      // Warn on non-literal require - MEDIUM priority
      'security/detect-non-literal-require': 'warn',

      // Warn on non-literal fs filename - MEDIUM priority
      'security/detect-non-literal-fs-filename': 'warn',

      // Warn on timing attacks in comparisons - MEDIUM priority
      'security/detect-possible-timing-attacks': 'warn',

      // Detect pseudoRandomBytes usage - LOW priority
      'security/detect-pseudoRandomBytes': 'warn',

      // Detect child_process usage - LOW priority
      'security/detect-child-process': 'warn',

      // Disable rules not applicable to browser-only React apps
      'security/detect-no-csrf-before-method-override': 'off', // Express.js specific
      'security/detect-disable-mustache-escape': 'off', // Mustache specific
      'security/detect-new-buffer': 'off', // Node.js specific, not applicable to Vite builds
      'security/detect-bidi-characters': 'warn' // Unicode bidirectional attacks
    }
  }
]
