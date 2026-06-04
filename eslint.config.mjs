// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "src/lib/database.types.ts",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "property",
          format: null,
        },
        {
          selector: "objectLiteralProperty",
          format: null,
        },
      ],

      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["src/app/**/route.{ts,tsx}"],
    rules: {
      "@typescript-eslint/naming-convention": "off",
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}", "src/app/api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]);
