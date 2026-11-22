import {
    ApiException,
    AppsV1Api,
    KubeConfig,
    PatchStrategy,
    setHeaderOptions,
} from "@kubernetes/client-node";

import { env } from "../env.js";
import { NotFoundError, type Backend, type Target } from "./type.js";

const kc = new KubeConfig();
kc.loadFromDefault();
const apps = kc.makeApiClient(AppsV1Api);

const namespaceOf = (guildId: string): string =>
    `${env.kubeNamespace}-${guildId}`;

const scale = async (
    { guildId, name }: Target,
    replicas: 0 | 1
): Promise<void> => {
    try {
        await apps.patchNamespacedDeploymentScale(
            {
                name,
                namespace: namespaceOf(guildId),
                body: { spec: { replicas } },
            },
            setHeaderOptions("Content-Type", PatchStrategy.MergePatch)
        );
    } catch (err) {
        if (err instanceof ApiException && err.code === 404)
            throw new NotFoundError(name);
        throw err;
    }
};

export const k8s: Backend = {
    start: target => scale(target, 1),
    stop: target => scale(target, 0),
    exists: async ({ guildId, name }) => {
        try {
            await apps.readNamespacedDeploymentScale({
                name,
                namespace: namespaceOf(guildId),
            });
            return true;
        } catch (err) {
            if (
                err instanceof ApiException &&
                (err.code === 404 || err.code === 403)
            )
                return false;
            throw err;
        }
    },
    host: ({ guildId, name }) => `${name}.${namespaceOf(guildId)}`,
};
