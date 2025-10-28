import antfu from "@antfu/eslint-config";

// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

// TODO: add tailwindcss plugin

export default withNuxt(antfu({
  type: "app",
  vue: true,
  typescript: true,
  formatters: true,
  stylistic: {
    indent: 2,
    semi: true,
    quotes: "double",
  },
  ignores: [".pnpm-store/**", "**/migrations/*", "**/components/ui/*", "CLAUDE.md"],
}, {
  rules: {
    "vue/max-attributes-per-line": ["error", {
      singleline: {
        max: 2,
      },
      multiline: {
        max: 1,
      },
    }],
    "ts/no-redeclare": "off",
    "ts/consistent-type-definitions": ["error", "type"],
    "no-console": ["warn", { allow: ["warn", "error", "log"] }],
    "no-alert": "off",
    "antfu/no-top-level-await": ["off"],
    "node/prefer-global/process": ["off"],
    "node/no-process-env": ["off"],
    "perfectionist/sort-imports": ["error", {
      tsconfigRootDir: ".",
    }],
    "unicorn/filename-case": ["error", {
      cases: {
        camelCase: true,
        pascalCase: true,
        kebabCase: true,
      },
      ignore: ["README.md", "CLAUDE.md"],
    }],
  },
}));
