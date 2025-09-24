# Genba Task (SPA) – ポートフォリオ

> 主にスキル向上を目的に、カンバン型のタスク管理アプリ **Genba Task** を作成しました。  
> フロントは **TypeScript / React (Vite)**、バックエンドは **Ruby on Rails 8**、インフラは **AWS (ECS Fargate / ALB / CloudFront / Route53 / RDS / S3)** で構築しています。

- アプリケーション: https://app.genba-tasks.com/
- API: https://api.genba-tasks.com/
- デモユーザー: `demo@example.com / demo-password`  
  （※必要に応じて変更・無効化します）

## 目次
- [Genba Task (SPA) – ポートフォリオ](#genba-task-spa--ポートフォリオ)
  - [目次](#目次)
  - [機能](#機能)
    - [認証](#認証)
    - [タスク管理](#タスク管理)
  - [開発環境 (フロントエンド)](#開発環境-フロントエンド)
  - [開発環境 (バックエンド)](#開発環境-バックエンド)
  - [本番環境](#本番環境)
    - [CORS](#cors)
  - [インフラ構成図](#インフラ構成図)
  - [ER図](#er図)
  - [画面 (スクリーンショット/GIF)](#画面-スクリーンショットgif)
  - [ローカル開発手順](#ローカル開発手順)
    - [1) Backend (Rails)](#1-backend-rails)
    - [2) Frontend (Vite+React)](#2-frontend-vitereact)
  - [最短デプロイ手順 (要AWS権限)](#最短デプロイ手順-要aws権限)
    - [0) 前提](#0-前提)
    - [1) API（Rails）ビルド \& プッシュ](#1-apirailsビルド--プッシュ)
    - [2) タスク定義を新イメージに更新 → サービス反映](#2-タスク定義を新イメージに更新--サービス反映)
    - [3) 動作確認](#3-動作確認)
  - [環境変数](#環境変数)
    - [Frontend (`frontend/.env.production`)](#frontend-frontendenvproduction)
    - [Backend（代表例）](#backend代表例)
  - [運用・監視](#運用監視)
  - [使用技術](#使用技術)
    - [フロントエンド](#フロントエンド)
    - [バックエンド](#バックエンド)
    - [インフラ・その他](#インフラその他)
  - [各種リンク](#各種リンク)
  - [ライセンス](#ライセンス)

---

## 機能
### 認証
- ログイン / ログアウト（トークン認証: `devise_token_auth`）
- ユーザー登録 / 表示 / 更新 / 削除
- パスワードリセット（メール送信は本番ではSES/Smtp等に切替可能）
- ゲストログイン（デモユーザー）

### タスク管理
- カード（タスク）CRUD
- リスト（タスクのグルーピング）CRUD
- ボード（リストのグルーピング）CRUD
- 絞り込み / 並び替え（昇順・降順 / ドラッグ&ドロップ）
- 検索 / ページネーション
- 画像添付（Active Storage + S3）

---

## 開発環境 (フロントエンド)
- TypeScript
- React
- Vite
- React Router
- Axios
- UI（任意）：Radix / shadcn/ui / MUI ほか

ローカルでの実行は `pnpm dev` で、API先は `.env` で切り替えます（後述）。

---

## 開発環境 (バックエンド)
- Ruby 3.2 / Rails 8
- Puma
- devise / devise_token_auth
- rack-cors
- Active Storage（S3）
- RSpec / factory_bot_rails（任意）

ローカルは `bin/rails s`（または `docker compose up` を整備予定）で起動。DBは MySQL を想定。

---

## 本番環境
- **フロント**: CloudFront（`app.genba-tasks.com`）
- **API**: ALB＋ECS Fargate（`api.genba-tasks.com`）
- **DB**: Amazon RDS (MySQL)
- **オブジェクトストレージ**: Amazon S3（Active Storage）
- **DNS**: Route53
- **証明書**: ACM（CF用は us-east-1 / ALB用は ap-northeast-1）

### CORS
- 許可オリジン: `https://app.genba-tasks.com`（および CFのドメイン）
- `rack-cors` で `Access-Control-Allow-Origin` / `Expose-Headers`（`access-token, client, uid, expiry`）を設定。

---

## インフラ構成図
ユーザー → **CloudFront(app)** → SPA  
SPA → **ALB(api)** → ECS(Fargate, Rails) → **RDS(MySQL)** / **S3(Active Storage)**  
DNSは Route53、証明書は ACM。  
（※図は `docs/infra.png` へ後日差し替え）

---

## ER図
- `users` と `task_boards` / `task_lists` / `task_cards` のリレーション。  
（※ER図は `docs/er.png` へ後日差し替え）

---

## 画面 (スクリーンショット/GIF)
- `assets/signin.gif`（サインイン）
- `assets/tasks.gif`（CRUD）
- `assets/upload.gif`（画像添付）
> GIFは後追いで追加予定。撮影は macOSなら **QuickTime Player** で画面収録 → **Gifski** 等でGIF化が手軽。

---

## ローカル開発手順

### 1) Backend (Rails)
```bash
cd backend
cp .env.example .env # 必要に応じて編集（DB, S3など）
bundle install
bin/rails db:setup
bin/rails s # http://localhost:3000
````

### 2) Frontend (Vite+React)

```bash
cd frontend
cp .env.local.example .env.local
pnpm install
pnpm dev # http://localhost:5173
```

---

## 最短デプロイ手順 (要AWS権限)

### 0) 前提

* ECRリポジトリ（例: `genba-task-api`）
* ECS クラスター/サービス（例: `genba-task-cluster` / `genba-task-svc`）
* ALB + TargetGroup（ヘルスチェック `/up`）
* Route53 で `app.genba-tasks.com`（CFへ）/ `api.genba-tasks.com`（ALBへ）設定済み

### 1) API（Rails）ビルド & プッシュ

```bash
# 例: イメージタグ発行
NEW_TAG=fix-$(date +%Y%m%d-%H%M%S)
REGION=ap-northeast-1
REPO=genba-task-api
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO"

docker build -t "$REPO:$NEW_TAG" ./backend
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
docker tag "$REPO:$NEW_TAG" "$REPO_URI:$NEW_TAG"
docker push "$REPO_URI:$NEW_TAG"
```

### 2) タスク定義を新イメージに更新 → サービス反映

```bash
CLUSTER=genba-task-cluster
SERVICE=genba-task-svc

NEW_DIGEST=$(aws ecr describe-images \
  --repository-name "$REPO" --region "$REGION" \
  --image-ids imageTag="$NEW_TAG" \
  --query 'imageDetails[0].imageDigest' --output text)

NEW_IMAGE="$REPO_URI@$NEW_DIGEST"
# td-full.json をベースに image を NEW_IMAGE へ更新して register
# register後の TD ARN をサービスに適用
aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" \
  --task-definition arn:aws:ecs:ap-northeast-1:...:task-definition/genba-task-td:<NEW>
aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"
```

### 3) 動作確認

```bash
# CORSプリフライト
curl -i -X OPTIONS 'https://api.genba-tasks.com/api/auth/sign_in' \
  -H 'Origin: https://app.genba-tasks.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'

# ヘルスチェック
curl -i 'https://api.genba-tasks.com/up'

# ブラウザから https://app.genba-tasks.com ログイン～CRUD
```

---

## 環境変数

### Frontend (`frontend/.env.production`)

```
VITE_API_BASE_URL=https://api.genba-tasks.com
```

### Backend（代表例）

```
RAILS_ENV=production
DATABASE_URL=...
S3_BUCKET=...
AWS_REGION=ap-northeast-1
DEVISE_TOKEN_AUTH_CHANGE_HEADERS_ON_EACH_REQUEST=true
CORS_ALLOWED_ORIGINS=https://app.genba-tasks.com,https://*.cloudfront.net
```

> 本番の秘匿値は SSM Parameter Store / Secrets Manager / タスク定義の環境変数 などで安全に注入。

---

## 運用・監視

* **CloudWatch Logs**
  `/aws/ecs/genba-task-cluster/genba-task-svc` → 最新 Log stream を開き **Start tailing**
  時間範囲は右上で `Last 5 minutes/1 hour` に変更可能
* **ALB ターゲットヘルス**
  `aws elbv2 describe-target-health --target-group-arn <TG_ARN>`
* **ヘルスチェック**
  `GET https://api.genba-tasks.com/up` が `200`

---

## 使用技術

### フロントエンド

* TypeScript / React / Vite
* React Router
* Axios
* （任意）UI: MUI / shadcn/ui / Radix

### バックエンド

* Ruby on Rails 8 / Puma
* devise / devise\_token\_auth / rack-cors
* Active Storage（S3）
* RSpec / factory\_bot\_rails

### インフラ・その他

* AWS: ECS Fargate / ALB / RDS(MySQL) / S3 / CloudFront / Route53 / ACM / CloudWatch
* Docker / ECR
* GitHub Actions（CI/CD 検討）

> （任意・品質UP）**画像配信のCloudFront+OAC化**
> S3直アクセス遮断＆キャッシュ最適化のため、将来的に OAC 構成を導入予定。

---

## 各種リンク

* アプリケーション: [https://app.genba-tasks.com/](https://app.genba-tasks.com/)
* API: [https://api.genba-tasks.com/](https://api.genba-tasks.com/)
* CloudWatch Logs: `/aws/ecs/genba-task-cluster/genba-task-svc`

---

## ライセンス

このリポジトリのコードは、特記無き場合は MIT ライセンスのもとで公開します。
