# セキュリティポリシー

[English](#security-policy)

## 脆弱性の報告

脆弱性を見つけたときは、公開の Issue には書かず、GitHub の非公開の報告機能を使ってください。このリポジトリの [Security タブ](https://github.com/haiiro2gou/mcsrvctl/security) で「Report a vulnerability」を押すと報告できます。

報告には、再現の手順と影響する範囲を書いてください。対象は最新のバージョンだけです。

## 対象

- bot のコード (`src/`)
- 配布している image
- `compose.example.yml` と `deploy/` の例

次のものは対象外です。

- Minecraft サーバー自体と、その image の脆弱性
- bot を動かす機械や cluster の管理者権限を持つ人による操作
- 例を書き換えて使った構成に固有の問題

## 既知の制限

次の 3 つは設計上の制限で、脆弱性としては扱いません。

- Docker で動かすとき、bot は同じ機械のどの container も起動・停止できます。対象を名前で絞る仕組みが無いためです。
- Docker で動かすとき、`/server add` は対象の container を一度止めます。container があるかどうかを、停止の要求への応答で調べているためです。
- Kubernetes で動かすとき、bot は RoleBinding を置いた namespace のどの Deployment も scale できます。

---

# Security Policy

## Reporting a vulnerability

Please do not report a vulnerability in a public issue. Use GitHub's private reporting instead: press "Report a vulnerability" on the [Security tab](https://github.com/haiiro2gou/mcsrvctl/security) of this repository.

Include the steps to reproduce it and what it affects. Only the latest version is supported.

## Scope

- The bot's code (`src/`)
- The published image
- The examples in `compose.example.yml` and `deploy/`

The following are out of scope.

- The Minecraft server itself and vulnerabilities of its image
- Actions by someone who has administrator rights on the machine or the cluster that runs the bot
- Problems specific to a setup that changed the examples

## Known limitations

These three are limits of the design and are not treated as vulnerabilities.

- With Docker, the bot can start and stop every container on the same machine, because nothing restricts the target by name.
- With Docker, `/server add` stops the target container once, because the bot finds out whether the container exists from the answer to a stop request.
- With Kubernetes, the bot can scale every Deployment in a namespace that holds its RoleBinding.
