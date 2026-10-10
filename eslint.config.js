import js from "@eslint/js";
import { essentials, node, typescript } from "@haiiro2gou/eslint-config";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    { ignores: ["eslint.config.js"] },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    prettier,
    ...essentials,
    ...node,
    ...typescript,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
            ecmaVersion: 2023,
            sourceType: "module",
            parserOptions: {
                projectService: { allowDefaultProject: ["drizzle.config.ts"] },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ["**/*.ts"],
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_" },
            ],
        },
    },
];
