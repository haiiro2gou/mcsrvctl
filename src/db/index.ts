import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema.js";
import log from "../util/log.js";

// initialize the migrations folder path
const migrationsFolder = fileURLToPath(
    new URL("../../drizzle", import.meta.url)
);

export const openDb = (file: string) => {
    const client = new Database(file);
    client.pragma("journal_mode = WAL");
    const db = drizzle({ client, schema });
    migrate(db, { migrationsFolder });
    return db;
};
export type Db = ReturnType<typeof openDb>;

export const backup = async (
    db: Db,
    stateDir: string,
    url?: string
): Promise<void> => {
    const buf = db.$client.serialize();
    writeFileSync(path.join(stateDir, "backup.db"), buf);

    log("backup saved");
    if (url === undefined || url === "") return;
    const stamp = new Date().toISOString().replace(/[-:T]|\.\d+Z$/g, "");
    try {
        const res = await fetch(`${url}mcsrvctl-${stamp}.db`, {
            method: "PUT",
            body: buf,
        });
        if (res.ok) log("backup uploaded");
        else log(`backup upload failed: ${res.status}`, "Warn");
    } catch (e) {
        log(
            `backup upload failed: ${e instanceof Error ? e.message : String(e)}`,
            "Warn"
        );
    }
};
