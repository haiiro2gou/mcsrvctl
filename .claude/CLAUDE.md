# mcsrvctl

## ブランチ

- 作業中の本流は `remake` (TypeScript 版)。`master` は旧 JavaScript 版で、コミット形式も違う (`master` は gitmoji、`remake` は Conventional Commits の英語)。
- `EnterWorktree` は `origin/master` から切るので、このリポジトリでは使わない。
- `git-guard.sh` は新しいブランチの起点を `master` に限るため、`remake` からの作業ブランチはユーザーが `!git switch -c worktree-<topic> remake` で切る。dotfiles 側の対応は haiiro2gou/obsidian-claude#79。

## 開発環境

- build・lint・依存の更新は devcontainer (`.devcontainer/`、Node 22) の中で行う。VS Code を使わないときは `npx @devcontainers/cli up --workspace-folder .` で起動し、`npx @devcontainers/cli exec --workspace-folder . <command>` で実行する。
- host には Node も `node_modules` も置かない。container の `node_modules` は named volume なので、`npm ci` は container の中でだけ行う。
- pre-commit (husky + lint-staged) は、host で動くと `docker compose -p mcsrvctl_devcontainer exec` で container の中に処理を渡す。コミットの前に container を起動しておく。container の中かどうかは、`compose.yaml` で設定した `IN_DEVCONTAINER` で判定する。
- `npm run dev` は `tsx watch` で `src/index.ts` を動かす。`.env` があれば読む。

## 過去に起きた問題

- `npm ci` が、追跡していた `node_modules/.gitignore` を毎回消していた。追跡をやめ、ルートの `.gitignore` で `node_modules/` を除外した。
- TypeScript 6 と ESLint 10 への更新では、古い lockfile が ESLint 9 を固定していて `npm install` が ERESOLVE で失敗した。lockfile を作り直して解決した。
- 相対 import に `.js` が無く、NodeNext の解決で TS2835 になっていた。lint の `no-unsafe-*` 15 件も、同じ原因で型が解決できなかったためだった。

## graph

- `graphify-out/` は `.git/info/exclude` で除外してある。コードを変えたら `graphify update .` を実行する。
