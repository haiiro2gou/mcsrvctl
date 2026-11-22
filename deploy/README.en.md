# Running on k3s

[日本語](README.md)

Example manifests for running mcsrvctl on k3s (Kubernetes). To run it with Docker alone, see the [repository README](../README.en.md).

These are generic examples. Keep real values such as the bot token and guild IDs out of this repository.

## How it works

- The bot does not create Minecraft servers. An administrator prepares a Deployment with `replicas: 0`, and the bot scales it between 0 and 1.
- Each guild (Discord server) gets one namespace, named `mc-<guildId>`.
- The bot can scale Deployments only in namespaces that hold a RoleBinding. `bot/clusterrole.yaml` defines the permission and grants nothing by itself.

| Directory | Contents                                                                                 | When to apply           |
| --------- | ---------------------------------------------------------------------------------------- | ----------------------- |
| `bot/`    | The bot itself (namespace, ServiceAccount, ClusterRole, example Secret, PVC, Deployment) | Once per cluster        |
| `tenant/` | One guild (namespace, RoleBinding, ResourceQuota, example Minecraft server)              | For every guild you add |

## Requirements

- A Kubernetes cluster such as k3s, and `kubectl`. The PVCs need a default StorageClass (k3s ships with one).
- A Discord bot token. The [repository README](../README.en.md) explains how to get one.
- The bot image. Set `image` in `bot/deployment.yaml` to the tag of the version you run.

## Deploying the bot

1. Create the namespace.

    ```sh
    kubectl apply -f bot/namespace.yaml
    ```

2. Copy `bot/secret.example.yaml` to a place outside the repository, put the real token in `DISCORD_TOKEN`, and apply it.

    ```sh
    kubectl apply -f /path/to/secret.yaml
    ```

3. Apply the rest. Do not use `kubectl apply -f bot/`: it overwrites the Secret with the example values.

    ```sh
    kubectl apply -f bot/serviceaccount.yaml -f bot/clusterrole.yaml -f bot/pvc.yaml -f bot/deployment.yaml
    ```

4. Check that it started. The bot is running when the log shows `Ready as <bot name> in <count> guilds`.

    ```sh
    kubectl -n mcsrvctl logs deploy/mcsrvctl
    ```

## Adding a guild

To get the guild ID, enable Developer Mode in the Discord settings, right-click the server icon and choose "Copy Server ID".

1. Replace `<guildId>` in `tenant/` and apply the files in order.

    ```sh
    GUILD=123456789012345678
    for f in namespace rolebinding resourcequota minecraft.example; do
        sed "s/<guildId>/$GUILD/" "tenant/$f.yaml" | kubectl apply -f -
    done
    ```

2. Register the server in Discord. `name` must equal the name of the Deployment.

    ```
    /server add name:vanilla alias:Vanilla
    /notify set channel:#minecraft
    /start server:Vanilla
    ```

When `/server add` answers that the server was not found ("そのサーバーは見つかりません"), the namespace name, the RoleBinding or the Deployment name does not match.

## Adding a Minecraft server

Copy `tenant/minecraft.example.yaml`, replace every `vanilla` with the new name, and apply it. Give the Deployment and the Service the same name: the bot connects to `<name>.mc-<guildId>` on port 25565 to read the player count.

- A name may contain lowercase letters, digits and `-`, up to 63 characters.
- A guild can register up to 10 servers.
- `tenant/resourcequota.yaml` decides how many servers run at once and how much they may use. The example allows 2 pods, 4 CPUs and 4Gi of memory. A server beyond the quota does not start even after `/start`.

## Rules

- Keep nothing but that guild's Minecraft Deployments in a tenant namespace. The bot can scale every Deployment in it.
- Run exactly one bot pod (`replicas: 1`, `Recreate`). Two pods writing the same settings file corrupt it.
- The Service is reachable only inside the cluster. Add the route for players (NodePort or LoadBalancer) to suit your environment.
- The bot stops a server that has had no players for one hour.
- When the bot is removed from a guild, it stops all servers of that guild. The registrations stay.

## Updating

Change the tag of `image` in `bot/deployment.yaml` and apply it. The old pod stops before the new one starts, so the bot does not answer in between. The settings stay on the PVC.

## Removing a guild

Run `/server remove` in Discord, then delete the namespace. This deletes the world data too, so take out what you need first.

```sh
kubectl delete namespace mc-123456789012345678
```

## Backups

When `BACKUP_URL` in the Secret holds a URL that accepts PUT (ending with `/`), the bot uploads the settings file as `mcsrvctl-<timestamp>.json` at startup and once a day. It does nothing while the value is empty. World data is not included.

## Recommended hardening

- Encrypt Secrets at rest with the k3s option `--secrets-encryption`.
- Restrict outbound traffic from the bot and the Minecraft servers with a NetworkPolicy.
- Add `imagePullSecrets` when the image lives in a private registry.
