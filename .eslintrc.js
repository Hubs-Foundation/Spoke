module.exports = {
  parser: "babel-eslint",
  env: {
    browser: true,
    es6: true,
    node: true,
    mocha: true
  },
  plugins: ["prettier", "react", "react-hooks"],
  rules: {
    "prettier/prettier": "error",
    "prefer-const": "error",
    "no-use-before-define": ["error", { functions: false, classes: false, variables: true }],
    "no-var": "error",
    "no-throw-literal": "error",
    // Light console usage is useful but remove debug logs before merging to master.
    "no-console": "off",
    "lines-between-class-members": 2,
    "padding-line-between-statements": [
      "error",
      { blankLine: "always", prev: "function", next: "function" },
      { blankLine: "always", prev: "function", next: "class" },
      { blankLine: "always", prev: "class", next: "function" },
      { blankLine: "always", prev: "class", next: "export" },
      { blankLine: "always", prev: "export", next: "function" },
      { blankLine: "always", prev: "export", next: "class" },
      { blankLine: "always", prev: "export", next: "export" },
      { blankLine: "always", prev: "import", next: "function" },
      { blankLine: "always", prev: "import", next: "class" }
    ],
    "no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_", ignoreRestSiblings: true }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "require-atomic-updates": "off",
    "no-prototype-builtins": "warn",
    "guard-for-in": "warn"
  },
  extends: ["prettier", "plugin:react/recommended", "eslint:recommended"],
  settings: {
    react: {
      createClass: "createReactClass", // Regex for Component Factory to use,
      // default to "createReactClass"
      pragma: "React", // Pragma to use, default to "React"
      version: "detect", // React version. "detect" automatically picks the version you have installed.
      // You can also use `16.0`, `16.3`, etc, if you want to override the detected value.
      // default to latest and warns if missing
      // It will default to "detect" in the future
      flowVersion: "0.53" // Flow version
    },
    propWrapperFunctions: [
      // The names of any function used to wrap propTypes, e.g. `forbidExtraProps`. If this isn't set, any propTypes wrapped in a function will be skipped.
    ],
    linkComponents: [
      // Components used as alternatives to <a> for linking, eg. <Link to={ url } />
      { name: "Link", linkAttribute: "to" }
    ]
  }
};
