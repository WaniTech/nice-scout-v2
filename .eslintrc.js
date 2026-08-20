module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  overrides: [
    {
      files: ['backend/**/*.js', 'scripts/**/*.js'],
      env: {
        node: true,
      },
    },
  ],
};
