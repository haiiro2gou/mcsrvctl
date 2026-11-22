import { env } from "../env.js";
import { listServers } from "../store.js";
import errorMessage from "../util/error.js";
import log from "../util/log.js";
import { docker } from "./docker.js";
import { k8s } from "./k8s.js";
import { type Backend } from "./type.js";

export { NotFoundError, type Backend, type Target } from "./type.js";

export const backend: Backend = env.backend === "docker" ? docker : k8s;

/**
 * Stops every registered server of a guild, e.g. after the bot was removed from it.
 * Failures are logged per server and never thrown; the settings stay for a re-invite.
 * @param guildId Discord guild ID
 */
export const stopAll = async (guildId: string): Promise<void> => {
    const servers = listServers(guildId);
    log(`Guild ${guildId} has left; stopping ${servers.length} servers`);
    for (const { name } of servers) {
        await backend.stop({ guildId, name }).catch((err: unknown) => {
            log(
                `Stop ${guildId}/${name} after guild delete failed: ${errorMessage(err)}`,
                "Warn"
            );
        });
    }
};
