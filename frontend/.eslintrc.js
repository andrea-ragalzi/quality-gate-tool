module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Disable all formatting-related rules to avoid conflicts with Prettier (or future formatter)
    // These are often handled by 'eslint-config-prettier' but we explicitly disable common ones here
    indent: "off",
    quotes: "off",
    semi: "off",
    "comma-dangle": "off",
    "max-len": "off",
    "object-curly-spacing": "off",
    "arrow-parens": "off",
    "linebreak-style": "off",

    // Ensure we focus on quality/logic errors
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-unused-vars": "off", // Handled by TypeScript compiler
    "@typescript-eslint/no-unused-vars": ["error"],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
};
