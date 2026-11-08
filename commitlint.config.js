export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      ['auth', 'landing', 'dashboard', 'driver', 'tracking', 'map', 'api', 'ui', 'ci', 'deps'],
    ],
  },
};
