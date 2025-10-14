module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "import"],
    extends: ["next/core-web-vitals","plugin:@typescript-eslint/recommended","plugin:import/recommended"],
    rules: {
      "no-console": ["error", { allow: ["warn","error"] }],
      "import/no-restricted-paths": ["error", {
        zones: [
          { target: "./", from: "**", except: ["@ui/layout/", "@ui/design/"] }
        ]
      }],
      "import/no-restricted-imports": ["error", {
        patterns: ["@ui", "@ui/*"]
      }],
      "@typescript-eslint/explicit-module-boundary-types": "off"
    },
    settings: { "import/resolver": { typescript: {} } }
  };
  