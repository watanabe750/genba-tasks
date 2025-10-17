# GitHub Actions ワークフロー設定ガイド

## 概要

このリポジトリには以下の自動化ワークフローが設定されています：

### Backend（Rails API）

1. **CI/CD**
   - `ci.yml` - テスト・Lint・セキュリティスキャン（PR & main push時）
   - `deploy-backend.yml` - ECS Fargateへの自動デプロイ（main push時）

### Frontend（React SPA）

1. **deploy-front.yml** - S3 + CloudFrontへの自動デプロイ（main push時）

### その他

1. **deploy-demo-api.yml** - Lambda Demo APIのデプロイ
2. **aws-oidc-check.yml** - AWS OIDC接続確認

---

## Backend自動デプロイの設定方法

### 前提条件

- AWS ECS Fargate クラスタが既に作成されている
- ECR リポジトリが作成されている
- タスク定義が作成されている
- OIDC による AWS 認証が設定されている

### 必要な GitHub Secrets

以下のSecretsをGitHubリポジトリに設定してください：

**Settings → Secrets and variables → Actions → Secrets**

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `AWS_ROLE_ARN` | OIDC認証用のIAMロールARN | `arn:aws:iam::123456789012:role/GitHubActionsRole` |

### 必要な GitHub Variables

以下のVariablesをGitHubリポジトリに設定してください：

**Settings → Secrets and variables → Actions → Variables**

| Variable名 | 説明 | デフォルト値 |
|-----------|------|-----------|
| (なし) | 現在はハードコード | - |

### ワークフロー内のハードコード値（要確認・変更）

`deploy-backend.yml`内で以下の値を環境に合わせて変更してください：

```yaml
env:
  AWS_REGION: ap-northeast-1              # AWSリージョン
  ECR_REPOSITORY: genba-tasks-backend     # ECRリポジトリ名
  ECS_CLUSTER: genba-tasks-cluster        # ECSクラスタ名
  ECS_SERVICE: genba-tasks-backend-service # ECSサービス名
  CONTAINER_NAME: backend                 # コンテナ名（タスク定義と一致させる）
```

### IAMロールに必要な権限

OIDC認証用のIAMロールには以下の権限が必要です：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole"
    }
  ]
}
```

### デプロイフロー

1. **トリガー**: `backend/**` 配下のファイルが変更されmainブランチにpushされる
2. **ビルド**: Dockerイメージをビルド（コミットSHA付き）
3. **プッシュ**: ECRにイメージをプッシュ（タグ: `latest` と `<commit-sha>`）
4. **タスク定義更新**: 現在のタスク定義をダウンロードし、新しいイメージIDで更新
5. **デプロイ**: ECSサービスを新しいタスク定義で更新
6. **待機**: サービスが安定するまで待機（デフロイ完了を確認）

### トラブルシューティング

#### デプロイが失敗する場合

1. **ECRログイン失敗**
   - IAMロールに`ecr:GetAuthorizationToken`権限があるか確認
   - AWS_ROLE_ARNが正しいか確認

2. **タスク定義が見つからない**
   - `ECS_SERVICE`の名前がタスク定義名と一致しているか確認
   - タスク定義が実際に存在するか確認（AWS Console）

3. **サービス更新失敗**
   - ECSクラスタ名、サービス名が正しいか確認
   - IAMロールに`ecs:UpdateService`権限があるか確認

4. **PassRole エラー**
   - IAMロールに`iam:PassRole`権限があるか確認
   - 対象のecsTaskExecutionRole ARNが正しいか確認

#### ログの確認方法

GitHub Actions の実行ログ:
```
Actions → Deploy Backend (ECS Fargate) → 最新の実行
```

ECSタスクのログ（CloudWatch Logs）:
```
AWS Console → CloudWatch → Logs → /ecs/genba-tasks-backend
```

---

## Frontend自動デプロイの設定

既存の`deploy-front.yml`が正常に動作しています。詳細は別途ドキュメント参照。

---

## ローカルでのテスト

### Dockerイメージのビルドテスト

```bash
cd backend
docker build -t genba-tasks-backend:test --build-arg GIT_SHA=test .
docker run -p 3000:3000 genba-tasks-backend:test
```

### ワークフロー構文チェック

```bash
# actionlint をインストール
brew install actionlint

# ワークフローファイルをチェック
actionlint .github/workflows/deploy-backend.yml
```

---

## 参考リンク

- [GitHub Actions for AWS](https://github.com/aws-actions)
- [ECS Deploy Task Definition Action](https://github.com/aws-actions/amazon-ecs-deploy-task-definition)
- [AWS OIDC設定ガイド](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
