module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ["eslint:recommended"],
  rules: {
    "no-undef": "error",
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-console": "warn",
    "eqeqeq": "error",
  },
};