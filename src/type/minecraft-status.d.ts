declare module "minecraft-status" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export const MinecraftServerListPing: {
        ping: (
            protocol: number,
            host: string,
            port?: number,
            timeout?: number
        ) => Promise<{ players?: { online?: unknown; max?: unknown } }>;
    };
}
