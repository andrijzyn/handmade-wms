import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const baseNamingConvention = [
  "error",
  { selector: "default", format: ["camelCase"] },
  {
    selector: "variable",
    format: ["camelCase", "UPPER_CASE"],
    leadingUnderscore: "allow",
    trailingUnderscore: "allow",
  },
  {
    selector: "parameter",
    format: ["camelCase"],
    leadingUnderscore: "allow",
  },
  {
    selector: "typeLike",
    format: ["PascalCase"],
  },
  {
    selector: "property",
    format: ["camelCase"],
    leadingUnderscore: "allow",
  },
  {
    selector: "objectLiteralProperty",
    format: ["camelCase"],
  },
  {
    selector: "property",
    modifiers: ["requiresQuotes"],
    format: null,
  },
  {
    selector: "objectLiteralProperty",
    modifiers: ["requiresQuotes"],
    format: null,
  },
]

const apiNamingConvention = [
  "error",
  { selector: "default", format: ["camelCase"] },
  {
    selector: "variable",
    format: ["camelCase", "UPPER_CASE"],
    leadingUnderscore: "allow",
    trailingUnderscore: "allow",
  },
  {
    selector: "parameter",
    format: ["camelCase"],
    leadingUnderscore: "allow",
  },
  {
    selector: "typeLike",
    format: ["PascalCase"],
  },
  {
    selector: "property",
    format: ["camelCase", "snake_case"],
    leadingUnderscore: "allow",
  },
  {
    selector: "objectLiteralProperty",
    format: ["camelCase", "snake_case"],
  },
  {
    selector: "property",
    modifiers: ["requiresQuotes"],
    format: null,
  },
  {
    selector: "objectLiteralProperty",
    modifiers: ["requiresQuotes"],
    format: null,
  },
]

const configFileNamingConvention = [
  "error",
  { selector: "default", format: ["camelCase"] },
  {
    selector: "variable",
    format: ["camelCase", "UPPER_CASE"],
    leadingUnderscore: "allow",
    trailingUnderscore: "allow",
  },
  {
    selector: "parameter",
    format: ["camelCase"],
    leadingUnderscore: "allow",
  },
  {
    selector: "typeLike",
    format: ["PascalCase"],
  },
  {
    selector: "property",
    format: ["camelCase", "snake_case", "UPPER_CASE"],
    leadingUnderscore: "allow",
  },
  {
    selector: "objectLiteralProperty",
    format: ["camelCase", "snake_case", "UPPER_CASE"],
  },
  {
    selector: "property",
    modifiers: ["requiresQuotes"],
    format: null,
  },
  {
    selector: "objectLiteralProperty",
    modifiers: ["requiresQuotes"],
    format: null,
  },
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/naming-convention": baseNamingConvention,
    },
  },

  {
    files: [
      "src/**/*.dto.ts",
      "src/**/routes/**/*.{ts,tsx}",
      "src/**/schemas/**/*.{ts,tsx}",
      "src/**/contracts/**/*.{ts,tsx}",
      "src/**/queries/**/*.{ts,tsx}",
      "src/**/api/**/*.{ts,tsx}",
    ],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/naming-convention": apiNamingConvention,
    },
  },

  {
    files: [
      "**/tailwind.config.{js,ts,mjs,cjs}",
      "**/postcss.config.{js,ts,mjs,cjs}",
      "**/next.config.{js,ts,mjs,cjs}",
      "**/eslint.config.{js,ts,mjs,cjs}",
      "**/prettier.config.{js,ts,mjs,cjs}",
    ],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/naming-convention": configFileNamingConvention,
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
