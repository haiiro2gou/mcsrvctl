import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { backup, openDb } from "./index.js";
import { build, notifyChannel } from "./schema.js";

// Drizzle wraps driver errors; the SQLite code sits on the cause
const sqliteCode = (e: unknown): string | undefined => {
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause : e;
    return cause instanceof Error &&
        "code" in cause &&
        typeof cause.code === "string"
        ? cause.code
        : undefined;
};

void test("migrate creates the tables in a fresh database", () => {
    const db = openDb(":memory:");
    const tables = db.$client
        .prepare<[], { name: string }>(
            "select name from sqlite_master where type = 'table' order by name"
        )
        .all();
    assert.deepEqual(
        tables.map(t => t.name),
        ["__drizzle_migrations", "build", "notify_channel"]
    );
    db.$client.close();
});

void test("build rows are scoped to their guild", () => {
    const db = openDb(":memory:");
    db.insert(build)
        .values([
            { guildId: "1", name: "vanilla", alias: "Vanilla" },
            { guildId: "2", name: "vanilla", alias: "Vanilla" },
        ])
        .run();
    const rows = db.select().from(build).where(eq(build.guildId, "1")).all();
    assert.deepEqual(rows, [
        { guildId: "1", name: "vanilla", alias: "Vanilla" },
    ]);
    db.delete(build).where(eq(build.guildId, "1")).run();
    assert.equal(
        db.select().from(build).where(eq(build.guildId, "1")).all().length,
        0
    );
    assert.equal(db.select().from(build).all().length, 1);
    db.$client.close();
});

void test("alias is unique within a guild", () => {
    const db = openDb(":memory:");
    db.insert(build)
        .values({ guildId: "1", name: "vanilla", alias: "main" })
        .run();
    assert.throws(
        () =>
            db
                .insert(build)
                .values({ guildId: "1", name: "modded", alias: "main" })
                .run(),
        (e: unknown) => sqliteCode(e) === "SQLITE_CONSTRAINT_UNIQUE"
    );
    // the same alias in another guild is fine
    db.insert(build)
        .values({ guildId: "2", name: "modded", alias: "main" })
        .run();
    db.$client.close();
});

void test("notify_channel keeps one row per guild", () => {
    const db = openDb(":memory:");
    db.insert(notifyChannel)
        .values({ guildId: "1", channelId: "10", messageId: "100" })
        .run();
    db.insert(notifyChannel)
        .values({ guildId: "1", channelId: "11", messageId: "101" })
        .onConflictDoUpdate({
            target: notifyChannel.guildId,
            set: { channelId: "11", messageId: "101" },
        })
        .run();
    assert.deepEqual(db.select().from(notifyChannel).all(), [
        { guildId: "1", channelId: "11", messageId: "101" },
    ]);
    db.$client.close();
});

void test("backup writes a readable copy without a URL", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcsrvctl-"));
    try {
        const db = openDb(":memory:");
        db.insert(build)
            .values({ guildId: "1", name: "vanilla", alias: "Vanilla" })
            .run();
        await backup(db, dir);
        db.$client.close();
        const copy = new Database(path.join(dir, "backup.db"), {
            readonly: true,
        });
        const row = copy
            .prepare<[], { n: number }>("select count(*) as n from build")
            .get();
        assert.equal(row?.n, 1);
        copy.close();
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
