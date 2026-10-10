import { NotFoundError, type Backend, type Target } from "./type.js";

const containerOf = ({ guildId, name }: Target): string =>
    `mc-${guildId}-${name}`;

const post = async (
    container: string,
    action: "start" | "stop"
): Promise<void> => {
    const res = await fetch(
        `${process.env.DOCKER_HOST ?? ""}/v1.47/containers/${container}/${action}`,
        { method: "POST" }
    );
    if (res.status === 404) throw new NotFoundError(container);
    if (res.status !== 204 && res.status !== 304)
        throw new Error(`docker ${action} ${container}: ${res.status}`);
};

export const docker: Backend = {
    start: t => post(containerOf(t), "start"),
    stop: t => post(containerOf(t), "stop"),
    exists: async t => {
        try {
            await post(containerOf(t), "stop");
            return true;
        } catch (e) {
            if (e instanceof NotFoundError) return false;
            throw e;
        }
    },
    host: containerOf,
};
