# MC Server Controller

[日本語](README.md)

A Discord bot that starts and stops Minecraft servers.

[![version](https://img.shields.io/github/v/tag/haiiro2gou/mcsrvctl?sort=semver&label=version)](https://github.com/haiiro2gou/mcsrvctl/tags)
[![build](https://img.shields.io/github/actions/workflow/status/haiiro2gou/mcsrvctl/build.yml)](https://github.com/haiiro2gou/mcsrvctl/actions/workflows/build.yml)
[![stars](https://img.shields.io/github/stars/haiiro2gou/mcsrvctl?logo=github)](https://github.com/haiiro2gou/mcsrvctl/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-%23F7DF1E?logo=mit&logoColor=black)](LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

## Features

- Starts and stops Minecraft servers from Discord commands.
- Keeps one message in a channel of your choice showing each server's state and player count.
- Stops a server by itself after it has had no players for one hour.

Creating Minecraft servers automatically is not implemented.

The command descriptions and the bot's replies are in Japanese.

## Commands

| Command                                        | What it does                                           | Required permission                |
| ---------------------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| `/start server:<server>`                       | Starts a server                                        | Manage Server                      |
| `/stop server:<server> [force:True]`           | Stops a server. Needs `force` while players are online | None (`force` needs Manage Server) |
| `/server add name:<name> alias:<display name>` | Registers a server                                     | Administrator                      |
| `/server remove server:<server>`               | Removes the registration (the server is not deleted)   | Administrator                      |
| `/notify set channel:<channel>`                | Sets the channel that shows the server status          | Administrator                      |
| `/notify remove`                               | Stops showing the server status                        | Administrator                      |

- You can change who may use each command under Server Settings → Integrations in Discord, except the permission `/stop` needs for `force`.
- `/start` and `/stop` together are limited to once a minute per server.
- A guild (Discord server) can register up to 10 servers.

The status message looks like this:

```
Server Status
🟢 `Vanilla` 3/20
⚫ `Modded` 停止中
更新: 1 分前
```

## Running it

There are two places to run it. Either way, prepare the Discord bot first.

- With Docker alone: the rest of this README
- On k3s (Kubernetes): [deploy/README.en.md](deploy/README.en.md)

### 1. Prepare the Discord bot

1. Create a new application in the [Discord Developer Portal](https://discord.com/developers/home) and get its token.
2. In the URL Generator on the OAuth2 page, enable the scopes `bot` and `applications.commands` and the bot permissions View Channels and Send Messages, then generate the link.
3. Add the bot to your Discord server through the generated URL.

### 2. Run it with Docker

You need one Linux machine with Docker and Docker Compose.

1. Get the repository and copy the configuration files.

    ```sh
    git clone https://github.com/haiiro2gou/mcsrvctl.git
    cd mcsrvctl
    cp .env.example .env
    cp compose.example.yml compose.yml
    ```

2. Put the bot token into `DISCORD_TOKEN` in `.env`. Leave the other lines as they are.

3. Replace `<guildId>` in `compose.yml` with the ID of your Discord server. To get it, enable Developer Mode in the Discord settings, right-click the server icon and choose "Copy Server ID".

4. Start the bot and create the Minecraft container. Only create it: starting it is the bot's job.

    ```sh
    docker compose up -d docker-proxy bot
    docker compose create mc-vanilla
    ```

5. Check that the bot started. It is running when the log shows `Ready as <bot name> in <count> guilds`.

    ```sh
    docker compose logs bot
    ```

6. Register the Minecraft server in Discord and start it.

    ```
    /server add name:vanilla alias:Vanilla
    /notify set channel:#minecraft
    /start server:Vanilla
    ```

### Notes for Docker

- Run `/server add` on a server that is stopped. With Docker, registering stops the target container once.
- To add a server, add a service to `compose.yml`, run `docker compose create <service>`, then `/server add`. Its `container_name` must have the form `mc-<guildId>-<name>`. A `name` may contain lowercase letters, digits and `-`.
- Give each server its own port number so that they do not collide.
- Nothing restricts the target by name, so the bot can start and stop every container on the same machine. Keep that in mind when the machine runs containers for other purposes.

## Environment variables

| Variable         | Meaning                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| `DISCORD_TOKEN`  | The bot token. Required                                                       |
| `STATE_DIR`      | Directory where the registrations are stored. Required                        |
| `BACKEND`        | `docker` selects Docker; anything else selects Kubernetes                     |
| `DOCKER_HOST`    | Required with Docker. URL of the Docker API                                   |
| `KUBE_NAMESPACE` | Required with Kubernetes. Prefix of the per-guild namespaces                  |
| `BACKUP_URL`     | When set, the registrations are PUT to this URL once a day. Empty disables it |

## Development

The development rules are in [docs/development.md](docs/development.md) (Japanese).

The documentation and some of the commits in this repository were written with [Claude Code](https://claude.com/claude-code).

## License

This repository is licensed under the [MIT License](LICENSE).

## Contact

**Discord: haiiro2gou**  
**X(Twitter): [@blanoir3298](https://x.com/blanoir3298)**  
**Youtube: [はいいろ](https://www.youtube.com/@haiiro2gou)**
