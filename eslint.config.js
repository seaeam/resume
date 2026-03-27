import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  ignores: ['node_modules', 'dist', 'build', 'coverage', 'src/components/ui/**', '**/tiptap-*/**', '.trae/**', '.vscode/**', 'skills/**', '.agents/**'],
  rules: {
    'react-hooks-extra/no-direct-set-state-in-use-effect': 'off',
    'react-hooks/set-state-in-effect': 'off',
    'unused-imports/no-unused-vars': 'warn',
    'no-unused-vars': 'warn',
    'no-void': 'error',
    'no-console': 'warn',
    'no-undef': 'error',
    'react-hooks/incompatible-library': 'off',
  },
})
