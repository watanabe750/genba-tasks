
# infra(ecs): Fargate最小構成(ARM64, Desired=1)+ALB(HTTP)+awslogs+SSM(master key)

## 概要
最小コストで Rails API を ECS(Fargate/ARM64)+ALB(HTTP) にデプロイ。

## 変更内容
- ECR に linux/arm64 イメージ(:min) を push
- SSM に RAILS_MASTER_KEY を登録（SecureString）
- ECS タスク定義（awslogs, secrets 経由）
- ALB/TG 設定（HTTP:80 → 3000, /up ヘルスチェック）

## 動作確認
- `http://<ALB-DNS>/up` が 200（curl -i/スクショ）
- CloudWatch Logs にアプリログ出力

## 影響範囲/リスク
- 初回デプロイ時に数分のヘルス待ち

## ロールバック
- 一つ前のタスク定義/サービスへ戻す
