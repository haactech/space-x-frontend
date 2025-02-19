module.exports = {
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/prettier'
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    'prettier/prettier': ['error']
  }
}