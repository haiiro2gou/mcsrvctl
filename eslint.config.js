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
    { ignores: ["eslint.config.js"] },
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
    },
    {
        files: ["**/*.ts"],
        rules: {
            "no-undef": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_" },
            ],
        },
    },
];
