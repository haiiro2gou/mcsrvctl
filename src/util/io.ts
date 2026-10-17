import { readFileSync, renameSync, writeFileSync } from "node:fs";

/**
 * Reads and parses a JSON file.
 * @param file path of the file to read
 * @returns the parsed value, or undefined when the file does not exist
 * @throws when the file cannot be read for another reason or is not valid JSON
 */
export const readJson = (file: string): unknown => {
    try {
        const json = readFileSync(file, "utf-8");
        return JSON.parse(json);
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "ENOENT")
            return undefined;
        throw err;
    }
};

/**
 * Writes a value as JSON, replacing the file atomically.
 * Writes to <file>.tmp first and renames it, so a crash never leaves a half-written file.
 * @param file path of the file to replace
 * @param data value to serialize
 */
export const writeJson = (file: string, data: unknown): void => {
    const tempFile = `${file}.tmp`;
    writeFileSync(tempFile, JSON.stringify(data, null, 4), "utf-8");
    renameSync(tempFile, file);
};
