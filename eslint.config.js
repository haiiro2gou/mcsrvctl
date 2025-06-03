import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { essentials, node, typescript } from "@haiiro2gou/eslint-config";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    ...compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier"
    ),
    ...essentials,
    ...node,
    ...typescript,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parser: tsParser,
            ecmaVersion: 2019,
            sourceType: "module",
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
                project: ["./tsconfig.eslint.json"],
            },
        },
        ignores: ["eslint.config.js"],
    },
];
