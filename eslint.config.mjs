import typescriptEslint from "@typescript-eslint/eslint-plugin";
import stylystic from "@stylistic/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "@stylistic": stylystic
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2019,
      sourceType: "module",

      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.eslint.json"]
      },
    },

    ignores: [
      "eslint.config.mjs",
    ],

    rules: {
        "@typescript-eslint/naming-convention": "warn",
        "@stylistic/semi": "warn",
        "no-case-declarations": "off",
        "curly": [
            "warn",
            "multi-or-nest",
            "consistent"
        ],
        "eqeqeq": "warn",
        "no-floating-decimal": "warn",
        "no-multi-spaces": "warn",
        "yoda": [
            "warn",
            "never",
            {
                "exceptRange": true
            }
        ],
        "array-bracket-newline": [
            "warn",
            "consistent"
        ],
        "brace-style": [
            "warn",
            "1tbs"
        ],
        "comma-spacing": [
            "warn",
            {
                "before": false,
                "after": true
            }
        ],
        "max-depth": [
            "warn",
            4
        ],
        "no-nested-ternary": "warn",
        "no-unneeded-ternary": "warn",
        "quotes": [
            "warn",
            "double",
            {
                "avoidEscape": true
            }
        ],
        "space-before-function-paren": [
            "warn",
            {
                "anonymous": "ignore",
                "named": "never",
                "asyncArrow": "always"
            }
        ],
        "space-in-parens": [
            "warn",
            "never"
        ],
        "space-unary-ops": [
            "warn",
            {
                "words": true,
                "nonwords": false
            }
        ],
        "spaced-comment": [
            "warn",
            "always"
        ],
        "switch-colon-spacing": [
            "error",
            {
                "before": false,
                "after": true
            }
        ],
        "arrow-body-style": [
            "warn",
            "as-needed"
        ],
        "arrow-parens": [
            "warn",
            "as-needed"
        ],
        "array-bracket-spacing": "warn",
        "no-duplicate-imports": "warn",
        "no-var": "error",
        "prefer-const": "error",
        "prefer-spread": "warn",
        "template-curly-spacing": [
            "warn",
            "never"
        ],
        "no-empty-function": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-non-null-assertion": "off"
    },
  },
];
