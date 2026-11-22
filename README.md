# MC Server Controller

[English](README.en.md)

Discord から Minecraft サーバーを起動・停止できる bot です。

[![stars](https://img.shields.io/github/stars/haiiro2gou/mcsrvctl?logo=github)](https://github.com/haiiro2gou/mcsrvctl/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-%23F7DF1E?logo=mit&logoColor=black)](LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

## 機能

- Discord のコマンドで、Minecraft サーバーを起動・停止する。
- サーバーごとの状態と参加人数を、指定したチャンネルの 1 つのメッセージに表示し続ける。
- プレイヤーが 0 人のまま 1 時間たったサーバーを、自動で止める。

Minecraft サーバーを自動で作成する機能は実装していません。

## コマンド

| コマンド                                 | 内容                                                      | 必要な権限   |
| ---------------------------------------- | --------------------------------------------------------- | ------------ |
| `/start server:<サーバー>`               | サーバーを起動する                                        | サーバー管理 |
| `/stop server:<サーバー> [force:True]`   | サーバーを停止する。プレイヤーがいるときは `force` が要る | サーバー管理 |
| `/server add name:<名前> alias:<表示名>` | サーバーを登録する                                        | 管理者       |
| `/server remove server:<サーバー>`       | 登録を解除する（サーバー自体は削除されない）              | 管理者       |
| `/notify set channel:<チャンネル>`       | サーバー状態を表示するチャンネルを設定する                | 管理者       |
| `/notify remove`                         | サーバー状態の表示をやめる                                | 管理者       |

- 使える人は Discord の「サーバー設定 → 連携サービス」でコマンドごとに変えられます。
- `/start` と `/stop` は同じサーバーに対して合わせて 1 分に 1 回までです。
- 1 つの guild (Discord のサーバー) に登録できるのは 10 件までです。

状態の表示は次のようになります。

```
Server Status
🟢 `バニラ` 3/20
⚫ `MOD` 停止中
更新: 1 分前
```

## 動かし方

動かす場所は 2 つから選べます。どちらでも、先に Discord の bot を用意します。

- Docker だけで動かす: この README の続き
- k3s (Kubernetes) で動かす: [deploy/README.md](deploy/README.md)

### 1. Discord の bot を用意する

1. [Discord Developer Portal](https://discord.com/developers/home) で新たなアプリケーションを作成して、トークンを取得します。
2. OAuth2 のページの URL Generator で、「scope の `bot` と `applications.commands`」および「Bot Permissions の View Channels と Send Messages」を有効化してリンクを生成します。
3. 生成された URL から bot を自分の Discord のサーバーに追加します。

### 2. Docker で動かす

Docker と Docker Compose が入った Linux の機械を 1 台使います。

1. リポジトリを取得し、設定ファイルを写します。

    ```sh
    git clone https://github.com/haiiro2gou/mcsrvctl.git
    cd mcsrvctl
    cp .env.example .env
    cp compose.example.yml compose.yml
    ```

2. `.env` の `DISCORD_TOKEN` に、控えたトークンを入れます。ほかの行はそのままで構いません。

3. `compose.yml` の `<guildId>` を、自分の Discord のサーバーの ID に置き換えます。ID は、Discord の設定で開発者モードを有効にし、サーバーのアイコンを右クリックして「サーバー ID をコピー」で取れます。

4. bot を起動し、Minecraft の container を作ります。container は作るだけで、起動は bot に任せます。

    ```sh
    docker compose up -d docker-proxy bot
    docker compose create mc-vanilla
    ```

5. bot の起動を確かめます。`Ready as <bot の名前> in <数> guilds` と出れば動いています。

    ```sh
    docker compose logs bot
    ```

6. Discord で Minecraft サーバーを登録して、起動します。

    ```
    /server add name:vanilla alias:バニラ
    /notify set channel:#minecraft
    /start server:バニラ
    ```

### Docker で動かすときの注意

- `/server add` は止まっているサーバーに対して実行してください。Docker では、登録のときに対象の container が一度止まります。
- サーバーを足すときは、`compose.yml` に service を足して `docker compose create <service>` を実行してから、`/server add` します。`container_name` は `mc-<guildId>-<name>` の形にします。`name` に使えるのは小文字の英数字と `-` です。
- サーバー同士のポート番号は重複しないように設定してください。
- 対象を名前で絞る仕組みが無いため、bot は同じ機械のどの container も起動・停止できます。ほかの用途の container と同じ機械に置くときは、この点を踏まえてください。

## 環境変数

| 変数             | 内容                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| `DISCORD_TOKEN`  | bot の token。必須                                                    |
| `STATE_DIR`      | 登録内容を保存するディレクトリ。必須                                  |
| `BACKEND`        | `docker` なら Docker、それ以外は Kubernetes を使う                    |
| `DOCKER_HOST`    | Docker のとき必須。Docker の API の URL                               |
| `KUBE_NAMESPACE` | Kubernetes のとき必須。guild ごとの namespace の接頭辞                |
| `BACKUP_URL`     | 入れると、登録内容を 1 日ごとにこの URL へ PUT する。空なら何もしない |

## 開発について

開発の約束は [docs/development.md](docs/development.md) にあります。

このリポジトリのドキュメントと一部のコミットは、[Claude Code](https://claude.com/claude-code) を使って作成しています。

## License

このリポジトリでは [MIT License](LICENSE) が適用されます。

## Contact

**Discord: haiiro2gou**  
**X(Twitter): [@blanoir3298](https://x.com/blanoir3298)**  
**Youtube: [はいいろ](https://www.youtube.com/@haiiro2gou)**
