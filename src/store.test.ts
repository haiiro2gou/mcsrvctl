import assert from "node:assert/strict";
import {
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
    addServer,
    clearNotify,
    findServer,
    getNotify,
    listServers,
    load,
    maxServers,
    removeServer,
    setNotify,
} from "./store.js";

// Each test gets its own directory and state file
const withState = (run: (dir: string, file: string) => void): void => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcsrvctl-store-"));
    try {
        run(dir, path.join(dir, "state.json"));
    } finally {
        rmSync(dir, { recursive: true });
    }
};

void test("a missing file loads as an empty state", () => {
    withState((_dir, file) => {
        load(file);
        assert.deepEqual(listServers("guildA"), []);
        assert.equal(getNotify("guildA"), undefined);
    });
});

void test("addServer writes the file and the state survives a reload", () => {
    withState((_dir, file) => {
        load(file);
        assert.equal(
            addServer("guildA", { name: "vanilla", alias: "Vanilla" }),
            true
        );
        assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), {
            guildA: { servers: [{ name: "vanilla", alias: "Vanilla" }] },
        });
        load(file);
        assert.deepEqual(findServer("guildA", "vanilla"), {
            name: "vanilla",
            alias: "Vanilla",
        });
    });
});

void test("servers are scoped to their guild", () => {
    withState((_dir, file) => {
        load(file);
        addServer("guildA", { name: "vanilla", alias: "Vanilla" });
        assert.deepEqual(listServers("guildB"), []);
        assert.equal(findServer("guildB", "vanilla"), undefined);
    });
});

void test("a duplicate name is rejected and nothing is written", () => {
    withState((_dir, file) => {
        load(file);
        addServer("guildA", { name: "vanilla", alias: "Vanilla" });
        assert.equal(
            addServer("guildA", { name: "vanilla", alias: "Other" }),
            false
        );
        assert.equal(listServers("guildA").length, 1);
    });
});

void test("the guild is capped at maxServers", () => {
    withState((_dir, file) => {
        load(file);
        Array.from({ length: maxServers }, (_, i) => i).forEach(i => {
            assert.equal(
                addServer("guildA", { name: `b${i}`, alias: `B${i}` }),
                true
            );
        });
        assert.equal(
            addServer("guildA", { name: "extra", alias: "Extra" }),
            false
        );
        assert.equal(listServers("guildA").length, maxServers);
    });
});

void test("removeServer removes a server and reports a missing one", () => {
    withState((_dir, file) => {
        load(file);
        addServer("guildA", { name: "vanilla", alias: "Vanilla" });
        assert.equal(removeServer("guildA", "vanilla"), true);
        assert.deepEqual(listServers("guildA"), []);
        assert.equal(removeServer("guildA", "vanilla"), false);
        assert.equal(removeServer("guildB", "vanilla"), false);
    });
});

void test("setNotify and clearNotify round-trip through the file", () => {
    withState((_dir, file) => {
        load(file);
        setNotify("guildA", { channelId: "10", messageId: "20" });
        load(file);
        assert.deepEqual(getNotify("guildA"), {
            channelId: "10",
            messageId: "20",
        });
        clearNotify("guildA");
        load(file);
        assert.equal(getNotify("guildA"), undefined);
        assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), {
            guildA: { servers: [] },
        });
    });
});

void test("a broken file stops load, and a write leaves no .tmp behind", () => {
    withState((dir, file) => {
        writeFileSync(file, "{");
        assert.throws(() => {
            load(file);
        }, SyntaxError);
        writeFileSync(file, "[]");
        assert.throws(() => {
            load(file);
        }, /not an object/);
        rmSync(file);
        load(file);
        addServer("guildA", { name: "vanilla", alias: "Vanilla" });
        assert.deepEqual(readdirSync(dir), ["state.json"]);
    });
});
