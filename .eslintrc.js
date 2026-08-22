module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*', 'backend/**'],
  overrides: [
    {
      files: ['scripts/**/*.js'],
      env: {
        node: true,
      },
    },
  ],
};
