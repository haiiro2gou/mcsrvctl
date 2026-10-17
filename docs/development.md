# 開発の手引き

人と AI エージェントの両方が読む前提の、このリポジトリで常に効く約束。設計の経緯や一時的な判断は書かない。

## ブランチ

- 作業中の本流は `remake` (TypeScript 版)。`master` は旧 JavaScript 版で、コミット形式も違う (`master` は gitmoji、`remake` は Conventional Commits の英語)。

## 開発環境

- build・lint・依存の更新は devcontainer (`.devcontainer/`、Node 24) の中で行う。VS Code を使わないときは `npx @devcontainers/cli up --workspace-folder .` で起動し、`npx @devcontainers/cli exec --workspace-folder . <command>` で実行する。
- host には Node も `node_modules` も置かない。container の `node_modules` は named volume なので、`npm ci` は container の中でだけ行う。
- pre-commit (husky + lint-staged) は、host で動くと `docker compose -p mcsrvctl_devcontainer exec` で container の中に処理を渡す。コミットの前に container を起動しておく。container の中かどうかは、`compose.yaml` で設定した `IN_DEVCONTAINER` で判定する。
- `npm run dev` は `tsx watch` で `src/index.ts` を動かす。`.env` があれば読む。
- 追跡する `postCreate.sh` と `compose.yaml` には、誰の環境でも要るものだけを書く。個人のツールに依存する準備は、追跡しない `*.local.*` に任せる。
- Node の major は devcontainer の feature・`Dockerfile` の `node:24.x-alpine`・`@types/node`・`engines` の 4 か所でそろえる。

## 依存の版

- アプリなので、`dependencies` も `devDependencies` も exact で固定する (`.npmrc` の `save-exact=true`、`"private": true`)。更新は Dependabot (`.github/dependabot.yml`) の PR で受ける。
- Dependabot は default branch (`master`) の設定しか読まないので、`remake` が default になるまで動かない。
- npm の `allowScripts` は全件 `false` にし、依存の install script を開発機でも走らせない。`npm audit --omit=dev` を 0 件に保つ。`npm audit fix --force` は使わない。

## 検証

- 変更のたびに `npm run lint` (eslint + `tsc --noEmit`)、`npm run build`、`npm test` を通す。
- テストは `node:test` + `node:assert/strict` で `src/**/*.test.ts` に置き、`npm test` (`tsx --test`) で走らせる。`tsconfig.build.json` が除外するので `dist/` には入らない。

## コードの書き方 (共有 ESLint 設定 `@haiiro2gou/eslint-config` に合わせる)

- 関数は `const name = (...) => {...}` の式で書く (`prefer-arrow-functions`、`func-style`)。`export default function` だけは例外で通るが、新しく書くときは使わない。
- import は `node:fs` のように `node:` を付け、相対 import には `.js` を付ける (NodeNext)。型だけの import は `import { type X }` のインライン指定。
- `as` は警告になるので使わない。`unknown` は型ガード (`v is State`) や `e instanceof Error && "code" in e && e.code === "ENOENT"` で絞る。
- `functional/immutable-data` があるので、変えるものは `const state = { current: ... }` に持ち、`state.current` への代入で更新する。配列や Map の破壊的な変更はしない。
- 型は `interface` で宣言する (`consistent-type-definitions`)。条件は `strict-boolean-expressions` に合わせて `x === undefined || x === ""` のように書く。文字列の連結はテンプレートリテラル。
- `curly` は複数行のときだけ波括弧。`no-floating-promises` は `void fn()` で満たす。`process.exit` は使わず throw する。
- export する関数には `src/util/log.ts` と同じ JSDoc (`@param`、`@returns`、throw するなら `@throws`) を付ける。
- ログは英語、Discord に出す文言は日本語。状態が変わるたびに 1 行ログを出す。

## コミット

- 1 目的 1 コミット。メッセージは Conventional Commits の英語 (`feat:`、`fix:`、`build:`、`docs:` など)。件名だけで何が変わるか分かるように書き、会話の中の番号や略称は使わない。

## 過去に起きた問題

- `npm ci` が、追跡していた `node_modules/.gitignore` を毎回消していた。追跡をやめ、ルートの `.gitignore` で `node_modules/` を除外した。
- TypeScript 6 と ESLint 10 への更新では、古い lockfile が ESLint 9 を固定していて `npm install` が ERESOLVE で失敗した。lockfile を作り直して解決した。
- 相対 import に `.js` が無く、NodeNext の解決で TS2835 になっていた。lint の `no-unsafe-*` 15 件も、同じ原因で型が解決できなかったためだった。
- `Dockerfile` の runtime stage が通らなかった。`npm cache clean` の行に継続の `\` が無く parse error になり、直すと今度は `prepare` の husky が `--omit=dev` で無いため exit 127 になった。cache mount 下で無意味な `npm cache clean` を消し、`npm ci` に `--ignore-scripts` を付けた。
- container の `~/.docker/config.json` が VS Code の credential helper を指していて、VS Code を使わない起動では `docker pull` が失敗する。`DOCKER_CONFIG=<空のディレクトリ>` で回避できる。
