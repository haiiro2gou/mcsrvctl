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
    addBuild,
    clearNotify,
    findBuild,
    getNotify,
    listBuilds,
    load,
    maxBuilds,
    removeBuild,
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
        assert.deepEqual(listBuilds("guildA"), []);
        assert.equal(getNotify("guildA"), undefined);
    });
});

void test("addBuild writes the file and the state survives a reload", () => {
    withState((_dir, file) => {
        load(file);
        assert.equal(
            addBuild("guildA", { name: "vanilla", alias: "Vanilla" }),
            true
        );
        assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), {
            guildA: { builds: [{ name: "vanilla", alias: "Vanilla" }] },
        });
        load(file);
        assert.deepEqual(findBuild("guildA", "vanilla"), {
            name: "vanilla",
            alias: "Vanilla",
        });
    });
});

void test("builds are scoped to their guild", () => {
    withState((_dir, file) => {
        load(file);
        addBuild("guildA", { name: "vanilla", alias: "Vanilla" });
        assert.deepEqual(listBuilds("guildB"), []);
        assert.equal(findBuild("guildB", "vanilla"), undefined);
    });
});

void test("a duplicate name is rejected and nothing is written", () => {
    withState((_dir, file) => {
        load(file);
        addBuild("guildA", { name: "vanilla", alias: "Vanilla" });
        assert.equal(
            addBuild("guildA", { name: "vanilla", alias: "Other" }),
            false
        );
        assert.equal(listBuilds("guildA").length, 1);
    });
});

void test("the guild is capped at maxBuilds", () => {
    withState((_dir, file) => {
        load(file);
        Array.from({ length: maxBuilds }, (_, i) => i).forEach(i => {
            assert.equal(
                addBuild("guildA", { name: `b${i}`, alias: `B${i}` }),
                true
            );
        });
        assert.equal(
            addBuild("guildA", { name: "extra", alias: "Extra" }),
            false
        );
        assert.equal(listBuilds("guildA").length, maxBuilds);
    });
});

void test("removeBuild removes a build and reports a missing one", () => {
    withState((_dir, file) => {
        load(file);
        addBuild("guildA", { name: "vanilla", alias: "Vanilla" });
        assert.equal(removeBuild("guildA", "vanilla"), true);
        assert.deepEqual(listBuilds("guildA"), []);
        assert.equal(removeBuild("guildA", "vanilla"), false);
        assert.equal(removeBuild("guildB", "vanilla"), false);
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
            guildA: { builds: [] },
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
        addBuild("guildA", { name: "vanilla", alias: "Vanilla" });
        assert.deepEqual(readdirSync(dir), ["state.json"]);
    });
});
