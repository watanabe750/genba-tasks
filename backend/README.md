# genba-task Backend (Rails API)

現場タスク管理システムのバックエンドAPIです。

## 必要環境

- Ruby 3.2.3
- Rails 8.0.2
- MySQL 8.0.43
- AWS S3（画像保存用）

## セットアップ

### 1. 依存関係のインストール

```bash
bundle install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要な値を設定します：

```bash
cp .env.example .env
```

必須の環境変数：

- `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `FRONTEND_URL`

### 3. データベース作成

```bash
rails db:create
rails db:migrate
rails db:seed  # サンプルデータ投入（オプション）
```

### 4. サーバー起動

```bash
rails server
```

## テスト

```bash
bundle exec rspec
```

## エラー監視（Sentry）

本番環境でのエラー監視にSentryを使用しています。

### セットアップ手順

1. [Sentry](https://sentry.io/)でアカウント作成
2. プロジェクトを作成（プラットフォーム: Ruby/Rails）
3. DSNをコピー
4. 環境変数に設定：

   ```bash
   export SENTRY_DSN=https://your-dsn@sentry.io/project-id
   export APP_VERSION=$(git rev-parse --short HEAD)  # オプション
   ```

### 動作確認

Railsコンソールでテストエラーを送信：

```ruby
Sentry.capture_message("Test message from Rails")
```

Sentryダッシュボードでメッセージが表示されることを確認してください。

## API エンドポイント

- `POST /auth` - ユーザー登録
- `POST /auth/sign_in` - ログイン
- `DELETE /auth/sign_out` - ログアウト
- `GET /api/tasks` - タスク一覧取得
- `POST /api/tasks` - タスク作成
- `GET /api/tasks/:id` - タスク詳細取得
- `PATCH /api/tasks/:id` - タスク更新
- `DELETE /api/tasks/:id` - タスク削除
- `POST /api/tasks/:id/image` - タスク画像アップロード
- `DELETE /api/tasks/:id/image` - タスク画像削除
- `GET /api/tasks/sites` - 現場一覧取得
- `GET /api/tasks/priority` - 優先タスク取得
- `GET /api/gallery` - ギャラリー写真一覧取得
- `POST /api/attachments` - ファイルアップロード
- `DELETE /api/attachments/:id` - ファイル削除

詳細は各コントローラーのコメントを参照してください。

## セキュリティ

- **認証**: devise_token_authによるトークンベース認証
- **CORS**: rack-corsで許可オリジンを制限
- **レート制限**: rack-attackでAPI乱用を防止
- **HTTPS**: 本番環境では強制
- **エラー監視**: Sentryで本番エラーをトラッキング

## デプロイ

GitHub Actionsで自動デプロイが設定されています：

- mainブランチへのプッシュで本番環境（AWS ECS Fargate）へデプロイ

## ライセンス

Private
