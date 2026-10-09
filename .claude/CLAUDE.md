# mcsrvctl

## ブランチ

- 作業中の本流は `remake` (TypeScript 版)。`master` は旧 JavaScript 版で、コミット形式も違う (`master` は gitmoji、`remake` は Conventional Commits の英語)。
- `remake` から作業ブランチを切るには、ユーザーが `git config claude.baseBranches remake` を設定する (`git-guard.sh` が起点として認める)。エージェントはこの設定を入れない。
- `EnterWorktree` を使うときは、`.claude/settings.local.json` に `{"worktree": {"baseRef": "head"}}` を置き (`.git/info/exclude` に追加)、メインのチェックアウトを `remake` にして pull してから呼ぶ。既定のままだと `origin/master` から切られる。

## 開発環境

- build・lint・依存の更新は devcontainer (`.devcontainer/`、Node 24) の中で行う。VS Code を使わないときは `npx @devcontainers/cli up --workspace-folder .` で起動し、`npx @devcontainers/cli exec --workspace-folder . <command>` で実行する。
- host には Node も `node_modules` も置かない。container の `node_modules` は named volume なので、`npm ci` は container の中でだけ行う。
- pre-commit (husky + lint-staged) は、host で動くと `docker compose -p mcsrvctl_devcontainer exec` で container の中に処理を渡す。コミットの前に container を起動しておく。container の中かどうかは、`compose.yaml` で設定した `IN_DEVCONTAINER` で判定する。
- `npm run dev` は `tsx watch` で `src/index.ts` を動かす。`.env` があれば読む。
- 追跡する `postCreate.sh` と `compose.yaml` には、誰の環境でも要るものだけを書く。Codex や plugin など dotfiles に依存する準備は、追跡しない `*.local.*` (`claude-devcontainer-local` が生成) に任せる。
- Node の major は devcontainer の feature・`Dockerfile` の `node:24.x-alpine`・`@types/node`・`engines` の 4 か所でそろえる。

## 依存の版

- アプリなので、`dependencies` も `devDependencies` も exact で固定する (`.npmrc` の `save-exact=true`、`"private": true`)。更新は Dependabot (`.github/dependabot.yml`) の PR で受ける。
- Dependabot は default branch (`master`) の設定しか読まないので、`remake` が default になるまで動かない。

## 過去に起きた問題

- `npm ci` が、追跡していた `node_modules/.gitignore` を毎回消していた。追跡をやめ、ルートの `.gitignore` で `node_modules/` を除外した。
- TypeScript 6 と ESLint 10 への更新では、古い lockfile が ESLint 9 を固定していて `npm install` が ERESOLVE で失敗した。lockfile を作り直して解決した。
- 相対 import に `.js` が無く、NodeNext の解決で TS2835 になっていた。lint の `no-unsafe-*` 15 件も、同じ原因で型が解決できなかったためだった。
- `Dockerfile` の runtime stage が通らなかった。`npm cache clean` の行に継続の `\` が無く parse error になり、直すと今度は `prepare` の husky が `--omit=dev` で無いため exit 127 になった。cache mount 下で無意味な `npm cache clean` を消し、`npm ci` に `--ignore-scripts` を付けた。
- container の `~/.docker/config.json` が VS Code の credential helper を指していて、VS Code を使わない起動では `docker pull` が失敗する。`DOCKER_CONFIG=<空のディレクトリ>` で回避できる。

## graph

- `graphify-out/` は `.git/info/exclude` で除外してある。コードを変えたら `graphify update .` を実行する。
