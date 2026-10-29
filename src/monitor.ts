import { type Client, DiscordAPIError } from "discord.js";

import { backend } from "./backend/index.js";
import { next, type IdleState } from "./idle.js";
import { ping, type StatusRow, type Status, renderStatus } from "./status.js";
import {
    clearNotify,
    getNotify,
    listServers,
    type Server,
    setNotify,
} from "./store.js";
import errorMessage from "./util/error.js";
import log from "./util/log.js";
import { noMentions } from "./command/common.js";

const tickMs = 60 * 1000,
    refreshMs = 10 * 60 * 1000;
const goneCodes: readonly (number | string)[] = [10003, 50001, 50013];

const states = { current: new Map<string, IdleState>() };
const lastEdit = { current: new Map<string, number>() };

/**
 * Forgets the idle timer of a server, so a manual start gets a full hour before auto-stop.
 * @param guildId Discord guild ID
 * @param name server name
 */
export const resetIdle = (guildId: string, name: string): void => {
    states.current.delete(`${guildId}/${name}`);
};

const shown = (status: Status | undefined): string => {
    if (status === undefined) return "";
    return status.online ? `${status.players}/${status.max}` : "offline";
};

const observe = async (
    guildId: string,
    server: Server,
    now: number
): Promise<StatusRow & { changed: boolean }> => {
    const key = `${guildId}/${server.name}`;
    const target = { guildId, name: server.name };
    const status = await ping(backend.host(target));
    const before = states.current.get(key) ?? {};
    if (
        !status.online &&
        (before.last === undefined ||
            before.last.online ||
            before.last.error !== status.error)
    )
        log(`Ping ${key}: ${status.error}`, "Warn");
    const { state, stop } = next(before, status, now);
    states.current.set(key, state);
    if (stop) {
        log(`Auto-stop ${key}`);
        await backend.stop(target).catch((err: unknown) => {
            log(`Auto-stop ${key} failed: ${errorMessage(err)}`, "Warn");
        });
    }
    return {
        alias: server.alias,
        status,
        changed: shown(before.last) !== shown(status),
    };
};

const dropNotify = (guildId: string, reason: string): void => {
    clearNotify(guildId);
    log(`Notify ${guildId} dropped: ${reason}`, "Warn");
};

const post = async (
    client: Client<true>,
    guildId: string,
    content: string
): Promise<void> => {
    const board = getNotify(guildId);
    if (board === undefined) return;
    const channel = await client.channels.fetch(board.channelId);
    if (channel?.isSendable() !== true) {
        dropNotify(guildId, "channel not sendable");
        return;
    }
    const payload = { content, allowedMentions: noMentions };
    try {
        await channel.messages.edit(board.messageId, payload);
    } catch (err) {
        // 10008 Unknown Message
        if (!(err instanceof DiscordAPIError) || err.code !== 10008) throw err;
        const sent = await channel.send(payload);
        setNotify(guildId, { channelId: board.channelId, messageId: sent.id });
    }
};

const tickGuild = async (
    client: Client<true>,
    guildId: string,
    now: number
): Promise<void> => {
    const results = await Promise.all(
        listServers(guildId).map(server => observe(guildId, server, now))
    );
    const since = now - (lastEdit.current.get(guildId) ?? 0);
    if (!results.some(result => result.changed) && since < refreshMs) return;
    await post(client, guildId, renderStatus(results));
    lastEdit.current.set(guildId, now);
};

const tick = async (client: Client<true>): Promise<void> => {
    const now = Date.now();
    for (const guildId of client.guilds.cache.keys()) {
        try {
            await tickGuild(client, guildId, now);
        } catch (err) {
            if (err instanceof DiscordAPIError && goneCodes.includes(err.code))
                dropNotify(guildId, String(err.code));
            else log(`Monitor ${guildId}: ${errorMessage(err)}`, "Error");
        }
    }
};

/**
 * Starts the minute loop: ping every registered server, auto-stop idle ones, keep the boards fresh.
 * The timer is unref'd so it never keeps the process alive after client.destroy().
 * @param client logged-in client
 */
export const startMonitor = (client: Client<true>): void => {
    const run = (): void => {
        void tick(client).finally(() => setTimeout(run, tickMs).unref());
    };
    run();
};
