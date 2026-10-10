const required = (name: string): string => {
    const value = process.env[name];
    if (value === undefined || value === "")
        throw new Error(`${name} is not set`);

    return value;
};

const backend = process.env.BACKEND === "docker" ? "docker" : "k8s";

export const env = {
    discordToken: required("DISCORD_TOKEN"),
    stateDir: required("STATE_DIR"),
    backend,
    kubeNamespace: backend === "k8s" ? required("KUBE_NAMESPACE") : "",
    dockerHost: backend === "docker" ? required("DOCKER_HOST") : "",
    backupUrl: process.env.BACKUP_URL,
} as const;
