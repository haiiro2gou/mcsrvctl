# k3s で動かす

[English](README.en.md)

mcsrvctl を k3s (Kubernetes) の上で動かすための manifest の例です。Docker だけで動かす場合は、[リポジトリの README](../README.md) を見てください。

ここにあるのは汎用の例です。bot の token や guild ID などの実際の値は、このリポジトリに入れないでください。

## 仕組み

- bot は Minecraft サーバーを作りません。管理者が Deployment を `replicas: 0` で用意し、bot はそれを 0 と 1 の間で scale します。
- guild (Discord のサーバー) ごとに namespace を 1 つ使います。名前は `mc-<guildId>` です。
- bot が scale できるのは、RoleBinding を置いた namespace の Deployment だけです。`bot/clusterrole.yaml` は権限の定義で、それだけでは何も許可しません。

| ディレクトリ | 内容                                                                            | apply する時期   |
| ------------ | ------------------------------------------------------------------------------- | ---------------- |
| `bot/`       | bot 本体 (namespace、ServiceAccount、ClusterRole、Secret の例、PVC、Deployment) | cluster に 1 回  |
| `tenant/`    | guild 1 つ分 (namespace、RoleBinding、ResourceQuota、Minecraft の例)            | guild を足すたび |

## 必要なもの

- k3s などの Kubernetes cluster と `kubectl`。PVC を使うので、既定の StorageClass が要ります (k3s には最初から入っています)。
- Discord の bot の token。作り方は[リポジトリの README](../README.md) にあります。
- bot の image。`bot/deployment.yaml` の `image` を、使う版の tag に合わせます。

## bot を置く

1. namespace を作ります。

    ```sh
    kubectl apply -f bot/namespace.yaml
    ```

2. `bot/secret.example.yaml` をリポジトリの外に写し、`DISCORD_TOKEN` に実際の token を入れて apply します。

    ```sh
    kubectl apply -f /path/to/secret.yaml
    ```

3. 残りを apply します。`kubectl apply -f bot/` は使わないでください。Secret が例の値で上書きされます。

    ```sh
    kubectl apply -f bot/serviceaccount.yaml -f bot/clusterrole.yaml -f bot/pvc.yaml -f bot/deployment.yaml
    ```

4. 起動を確かめます。`Ready as <bot の名前> in <数> guilds` と出れば動いています。

    ```sh
    kubectl -n mcsrvctl logs deploy/mcsrvctl
    ```

## guild を足す

guild ID は、Discord の設定で開発者モードを有効にし、サーバーのアイコンを右クリックして「サーバー ID をコピー」で取れます。

1. `tenant/` の `<guildId>` を置き換えて、順に apply します。

    ```sh
    GUILD=123456789012345678
    for f in namespace rolebinding resourcequota minecraft.example; do
        sed "s/<guildId>/$GUILD/" "tenant/$f.yaml" | kubectl apply -f -
    done
    ```

2. Discord で登録します。`name` は Deployment の名前と同じにします。

    ```
    /server add name:vanilla alias:バニラ
    /notify set channel:#minecraft
    /start server:バニラ
    ```

`/server add` が「そのサーバーは見つかりません」と返すときは、namespace の名前、RoleBinding、Deployment の名前のどれかが合っていません。

## Minecraft サーバーを足す

`tenant/minecraft.example.yaml` を写し、`vanilla` をすべて新しい名前に置き換えて apply します。Deployment と Service は同じ名前にしてください。bot は `<名前>.mc-<guildId>` の 25565 番に接続して人数を調べます。

- 名前に使えるのは小文字の英数字と `-` で、63 文字までです。
- 1 つの guild に登録できるのは 10 件までです。
- 同時に動かせる数と量は `tenant/resourcequota.yaml` で決まります。例の値は pod 2 つ、CPU 4、メモリ 4Gi です。上限を超えた分は `/start` しても起動しません。

## 決まりごと

- tenant の namespace には、その guild の Minecraft の Deployment 以外を置かないでください。bot はその namespace のどの Deployment も scale できます。
- bot の pod は 1 つだけにしてください (`replicas: 1`、`Recreate`)。2 つの pod が同じ設定ファイルを書くと壊れます。
- Service は cluster の中にだけ公開されます。プレイヤーが外から入る経路 (NodePort や LoadBalancer) は、環境に合わせて足してください。
- プレイヤーが 0 人のまま 1 時間たつと、bot がサーバーを止めます。
- bot が guild から外されると、その guild のサーバーをすべて止めます。登録は残ります。

## 更新する

`bot/deployment.yaml` の `image` の tag を変えて apply します。古い pod が止まってから新しい pod が始まるので、その間 bot は応答しません。設定は PVC に残ります。

## guild を外す

Discord で `/server remove` を実行してから、namespace を消します。ワールドのデータも一緒に消えるので、要るものは先に取り出してください。

```sh
kubectl delete namespace mc-123456789012345678
```

## バックアップ

Secret の `BACKUP_URL` に PUT を受け付ける URL (末尾は `/`) を入れると、bot は起動時と 1 日ごとに設定ファイルを `mcsrvctl-<日時>.json` という名前で送ります。空のままなら何もしません。ワールドのデータは対象外です。

## 運用で足すとよいもの

- k3s の `--secrets-encryption` で、Secret を暗号化して保存する。
- NetworkPolicy で、bot と Minecraft から外へ出る通信を絞る。
- image を private の registry に置くときは、`imagePullSecrets` を足す。
