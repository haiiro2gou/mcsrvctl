import assert from "node:assert/strict";
import { test } from "node:test";
import { next } from "./idle.js";

const hour = 60 * 60 * 1000;
const empty = { online: true, players: 0, max: 20 } as const;
const busy = { online: true, players: 2, max: 20 } as const;
const down = { online: false, error: "ECONNREFUSED" } as const;

void test("an empty server is stopped after an hour, not before", () => {
    const first = next({}, empty, 0);
    assert.deepEqual(first, {
        state: { last: empty, idleSince: 0 },
        stop: false,
    });
    const later = next(first.state, empty, hour - 1);
    assert.equal(later.stop, false);
    assert.equal(later.state.idleSince, 0);
    assert.equal(next(later.state, empty, hour).stop, true);
});

void test("players reset the idle timer", () => {
    const idle = next({}, empty, 0).state;
    const after = next(idle, busy, hour);
    assert.deepEqual(after, { state: { last: busy }, stop: false });
    assert.equal(next(after.state, empty, 2 * hour - 1).stop, false);
});

void test("an offline or failed ping never stops and clears the timer", () => {
    const idle = next({}, empty, 0).state;
    const after = next(idle, down, 2 * hour);
    assert.deepEqual(after, { state: { last: down }, stop: false });
    assert.equal(next(after.state, empty, 3 * hour).stop, false);
});
