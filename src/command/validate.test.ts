import assert from "node:assert/strict";
import { test } from "node:test";
import { accept } from "./cooldown.js";
import { isAlias, isName } from "./validate.js";

void test("isName accepts DNS labels only", () => {
    for (const ok of ["vanilla", "mc-1", "a", "x".repeat(63)])
        assert.equal(isName(ok), true, ok);
    for (const ng of [
        "",
        "Vanilla",
        "-mc",
        "mc-",
        "mc_1",
        "mc.1",
        "x".repeat(64),
        "a b",
    ])
        assert.equal(isName(ng), false, ng);
});

void test("isAlias rejects mentions, line breaks, padding and long names", () => {
    for (const ok of ["Vanilla", "バニラ 1.21", "x".repeat(32), "a-b_c"])
        assert.equal(isAlias(ok), true, ok);
    for (const ng of [
        "",
        "@everyone",
        "<@123>",
        "#general",
        "a\nb",
        "a\r",
        " pad",
        "pad ",
        "x".repeat(33),
    ])
        assert.equal(isAlias(ng), false, JSON.stringify(ng));
});

void test("accept allows one operation per build per minute", () => {
    assert.equal(accept("g", "a", 1_000), true);
    assert.equal(accept("g", "a", 30_000), false);
    assert.equal(accept("g", "b", 30_000), true); // other build
    assert.equal(accept("h", "a", 30_000), true); // other guild
    assert.equal(accept("g", "a", 61_000), true);
});
