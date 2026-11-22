import { env } from "../env.js";
import { NotFoundError, type Backend, type Target } from "./type.js";

const containerOf = ({ guildId, name }: Target): string =>
    `mc-${guildId}-${name}`;

const post = async (
    container: string,
    action: "start" | "stop"
): Promise<void> => {
    const res = await fetch(
        `${env.dockerHost}/v1.47/containers/${container}/${action}`,
        { method: "POST" }
    );
    if (res.status === 404) throw new NotFoundError(container);
    if (res.status !== 204 && res.status !== 304)
        throw new Error(`Docker ${action} ${container}: ${res.status}`);
};

export const docker: Backend = {
    start: target => post(containerOf(target), "start"),
    stop: target => post(containerOf(target), "stop"),
    exists: async target => {
        try {
            await post(containerOf(target), "stop");
            return true;
        } catch (err) {
            if (err instanceof NotFoundError) return false;
            throw err;
        }
    },
    host: containerOf,
};
