import assert from "node:assert/strict";
import { test } from "node:test";
import { renderStatus } from "./status.js";

void test("renderStatus names the empty board and stamps the update time", () => {
    const lines = renderStatus([]).split("\n");
    assert.deepEqual(lines.slice(0, 2), [
        "**Server Status**",
        "登録されたサーバーはありません",
    ]);
    assert.match(lines[2] ?? "", /^更新: <t:\d+:R>$/);
});

void test("renderStatus shows one marked line per server", () => {
    const lines = renderStatus([
        { alias: "Vanilla", status: { online: true, players: 3, max: 20 } },
        { alias: "Modded", status: { online: false, error: "timeout" } },
        { alias: "New", status: undefined },
    ]).split("\n");
    assert.deepEqual(lines.slice(1, 4), [
        "🟢 `Vanilla` 3/20",
        "⚫ `Modded` 停止中",
        "⚪ `New` 確認中",
    ]);
});
