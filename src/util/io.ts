import fs from "fs";
import path from "path";

export const getAllFiles = (
    directory: string,
    foldersOnly = false
): string[] => {
    const files = fs.readdirSync(directory, { withFileTypes: true });
    return files
        .filter(file => (foldersOnly ? file.isDirectory() : file.isFile()))
        .map(file => path.join(directory, file.name));
};
