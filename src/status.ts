import { MinecraftServerListPing } from "minecraft-status";

/** Result of one ping: player counts when the server answered, else why not. */
export type Status =
    | { online: true; players: number; max: number }
    | { online: false; error: string };

/** Accepts only a non-negative integer, so a hostile server cannot inject other values. */
const count = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isInteger(value) && value >= 0
        ? value
        : undefined;

/**
 * Pings a server on port 25565. Never throws, and always settles within the timeout.
 * @param host host name from backend.host
 * @param timeoutMs how long to wait for the answer
 * @returns online with the player counts, or offline with the error message
 */
export const ping = async (host: string, timeoutMs = 5000): Promise<Status> => {
    try {
        // The library never settles when the server closes the connection without answering.
        const res = await Promise.race([
            MinecraftServerListPing.ping(4, host, 25565, timeoutMs),
            new Promise<never>((_resolve, reject) =>
                setTimeout(() => {
                    reject(new Error("no response"));
                }, timeoutMs).unref()
            ),
        ]);
        const players = count(res.players?.online);
        const max = count(res.players?.max);
        if (players === undefined || max === undefined)
            return { online: false, error: "invalid response" };
        return { online: true, players, max };
    } catch (err) {
        return {
            online: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
};

/** One line of the status board; status is undefined before the first ping. */
export interface StatusRow {
    alias: string;
    status: Status | undefined;
}

const line = ({ alias, status }: StatusRow): string => {
    if (status === undefined) return `⚪ \`${alias}\` 確認中`;
    if (status.online) return `🟢 \`${alias}\` ${status.players}/${status.max}`;
    return `⚫ \`${alias}\` 停止中`;
};

/**
 * Renders the status board. Aliases sit in code spans and the caller sends it with no mentions allowed.
 * @param rows one entry per registered build
 */
export const renderStatus = (rows: readonly StatusRow[]): string => {
    const body =
        rows.length === 0
            ? "登録されたサーバーはありません"
            : rows.map(line).join("\n");
    return `**Server Status**\n${body}\n更新: <t:${Math.floor(Date.now() / 1000)}:R>`;
};
