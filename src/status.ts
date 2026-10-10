import { MinecraftServerListPing } from "minecraft-status";

export type Status =
    | { online: true; players: number; max: number }
    | { online: false; error: string };

const count = (v: unknown): number | undefined =>
    typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : undefined;

export const ping = async (host: string): Promise<Status> => {
    try {
        const res = await MinecraftServerListPing.ping(4, host, 25565, 5000);
        const players = count(res.players?.online);
        const max = count(res.players?.max);
        if (players === undefined || max === undefined)
            return { online: false, error: "invalid response" };
        return { online: true, players, max };
    } catch (e) {
        return {
            online: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }
};
