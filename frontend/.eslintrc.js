/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ["next/core-web-vitals"],
  plugins: ["boundaries"],
  settings: {
    // Define FSD layers - order matters (higher index = lower layer in hierarchy)
    "boundaries/elements": [
      // Layer 1: App (entry point, providers, routing)
      { type: "app", pattern: "src/app/*" },
      // Layer 2: Pages (full page compositions)
      { type: "pages", pattern: "src/pages/*" },
      // Layer 3: Widgets (large compositional blocks)
      { type: "widgets", pattern: "src/widgets/*" },
      // Layer 4: Features (user interactions, business logic)
      { type: "features", pattern: "src/features/*" },
      // Layer 5: Entities (domain models, business entities)
      { type: "entities", pattern: "src/entities/*" },
      // Layer 6: Shared (reusable utilities, UI kit, types)
      { type: "shared", pattern: "src/shared/*" },
    ],
    "boundaries/ignore": [
      // Ignore test files for boundary checks
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
    ],
  },
  rules: {
    // ═══════════════════════════════════════════════════════════════════════════
    // RULE 1: LAYER UNIDIRECTIONALITY
    // Higher layers can only import from lower layers (downward dependencies)
    // ═══════════════════════════════════════════════════════════════════════════
    "boundaries/element-types": [
      "error",
      {
        // Default: disallow all cross-layer imports
        default: "disallow",
        rules: [
          // App Layer: can import from all layers below
          {
            from: "app",
            allow: ["pages", "widgets", "features", "entities", "shared"],
          },
          // Pages Layer: can import from widgets, features, entities, shared
          {
            from: "pages",
            allow: ["widgets", "features", "entities", "shared"],
          },
          // Widgets Layer: can import from features, entities, shared
          {
            from: "widgets",
            allow: ["features", "entities", "shared"],
          },
          // Features Layer: can import from entities, shared only
          {
            from: "features",
            allow: ["entities", "shared"],
          },
          // Entities Layer: can only import from shared
          {
            from: "entities",
            allow: ["shared"],
          },
          // Shared Layer: cannot import from any other FSD layer
          // (can only import from itself or external packages)
        ],
      },
    ],

    // ═══════════════════════════════════════════════════════════════════════════
    // RULE 2: PUBLIC API BOUNDARIES (No Deep Imports)
    // All imports must go through the slice's public API (index.ts)
    // ═══════════════════════════════════════════════════════════════════════════
    "boundaries/entry-point": [
      "error",
      {
        default: "disallow",
        rules: [
          // Allow imports only from the slice root (index.ts)
          {
            target: ["pages", "widgets", "features", "entities", "shared"],
            allow: "index.(ts|tsx)",
          },
        ],
      },
    ],
  },
  overrides: [
    // Relax rules for test files
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      rules: {
        "boundaries/element-types": "off",
        "boundaries/entry-point": "off",
      },
    },
    // App layer can have internal structure without index.ts requirement
    {
      files: ["src/app/**/*"],
      rules: {
        "boundaries/entry-point": "off",
      },
    },
  ],
};
