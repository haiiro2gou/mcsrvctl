import {
    ApiException,
    AppsV1Api,
    KubeConfig,
    PatchStrategy,
    setHeaderOptions,
} from "@kubernetes/client-node";
import { NotFoundError, type Backend, type Target } from "./type.js";

const kc = new KubeConfig();
kc.loadFromDefault();
const apps = kc.makeApiClient(AppsV1Api);

const namespaceOf = (guildId: string): string =>
    `${process.env.KUBE_NAMESPACE ?? ""}-${guildId}`;

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
    } catch (e) {
        if (e instanceof ApiException && e.code === 404)
            throw new NotFoundError(name);
        throw e;
    }
};

export const k8s: Backend = {
    start: t => scale(t, 1),
    stop: t => scale(t, 0),
    exists: async ({ guildId, name }) => {
        try {
            await apps.readNamespacedDeploymentScale({
                name,
                namespace: namespaceOf(guildId),
            });
            return true;
        } catch (e) {
            // 403 means the namespace has no RoleBinding
            if (e instanceof ApiException && (e.code === 404 || e.code === 403))
                return false;
            throw e;
        }
    },
    host: ({ guildId, name }) => `${name}.${namespaceOf(guildId)}`,
};
