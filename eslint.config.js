export default [
  { ignores: ['node_modules/**', 'dist/**', 'data/**'] },
  { files: ['server/**/*.js', 'test/**/*.js', 'vite.config.js'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { console: 'readonly', fetch: 'readonly', process: 'readonly', URL: 'readonly' } }, rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], 'no-undef': 'error' } }
];
