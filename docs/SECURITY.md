# セキュリティガイド

このドキュメントでは、Genba Tasksアプリケーションのセキュリティ機能と設定について説明します。

## 目次

1. [セキュリティヘッダー](#セキュリティヘッダー)
2. [認証・認可](#認証認可)
3. [CSRF保護](#csrf保護)
4. [CORS設定](#cors設定)
5. [レート制限](#レート制限)
6. [入力検証](#入力検証)
7. [パスワードセキュリティ](#パスワードセキュリティ)
8. [セキュリティベストプラクティス](#セキュリティベストプラクティス)

---

## セキュリティヘッダー

### 実装されているヘッダー

#### 1. X-Frame-Options: DENY
**目的**: クリックジャッキング攻撃の防止

```ruby
'X-Frame-Options' => 'DENY'
```

このヘッダーにより、アプリケーションがiframe内で表示されることを完全に禁止します。

**効果**:
- クリックジャッキング攻撃を防止
- ユーザーが意図しない操作をさせられることを防ぐ

#### 2. X-Content-Type-Options: nosniff
**目的**: MIMEタイプスニッフィング攻撃の防止

```ruby
'X-Content-Type-Options' => 'nosniff'
```

ブラウザがContent-Typeヘッダーを無視してファイルの内容から MIME タイプを推測することを防ぎます。

**効果**:
- XSS攻撃の一種を防止
- 悪意のあるファイルの実行を防止

#### 3. X-XSS-Protection: 1; mode=block
**目的**: レガシーブラウザでのXSS保護

```ruby
'X-XSS-Protection' => '1; mode=block'
```

**注意**: 最新ブラウザはContent Security Policy（CSP）を使用しますが、古いブラウザのために設定しています。

**効果**:
- XSS攻撃を検知した場合、ページのレンダリングをブロック

#### 4. Referrer-Policy: strict-origin-when-cross-origin
**目的**: リファラー情報の送信を制限

```ruby
'Referrer-Policy' => 'strict-origin-when-cross-origin'
```

**動作**:
- 同一オリジン: フルURLを送信
- HTTPS → HTTPS: オリジンのみ送信
- HTTPS → HTTP: リファラーを送信しない（セキュアダウングレード防止）

**効果**:
- プライバシー保護
- センシティブな情報の漏洩防止

#### 5. Permissions-Policy
**目的**: デバイスAPIへのアクセス制限

```ruby
'Permissions-Policy' => 'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
```

**効果**:
- 位置情報、マイク、カメラ等のアクセスを完全に禁止
- 意図しないデバイスアクセスを防止

### Content Security Policy（CSP）

CSPは、XSS攻撃やデータインジェクション攻撃を防ぐための強力なセキュリティ機能です。

#### 設定内容

```ruby
# デフォルトソース: 自分自身のみ許可
policy.default_src :self

# スクリプト: 自分自身とHTTPS
policy.script_src  :self, :https

# スタイルシート: 自分自身とHTTPS
policy.style_src   :self, :https

# 画像: 自分自身、HTTPS、data:、blob:
policy.img_src     :self, :https, :data, :blob

# オブジェクト: 完全禁止
policy.object_src  :none

# 接続先: 自分自身とHTTPS
policy.connect_src :self, :https

# フレーム: 自分自身のみ
policy.frame_src   :self

# ベースURI: 自分自身のみ
policy.base_uri    :self

# フォーム送信先: 自分自身のみ
policy.form_action :self

# 本番環境: HTTPSへの自動アップグレード
policy.upgrade_insecure_requests true  # 本番環境のみ
```

#### CSP違反の監視

開発環境では、CSP違反をブラウザのコンソールに報告するのみ（Report-Only モード）。
本番環境では、違反時にリソースの読み込みをブロックします。

```ruby
Rails.application.config.content_security_policy_report_only = Rails.env.development?
```

---

## 認証・認可

### 使用技術

- **Devise**: ユーザー認証
- **DeviseTokenAuth**: トークンベースAPI認証

### 認証フロー

1. ユーザーがメールアドレスとパスワードでログイン
2. サーバーが認証トークンを生成
3. トークンをHTTP Headerで返却
4. 以降のリクエストで、クライアントはトークンを付与

### 認証トークンのセキュリティ

```ruby
# Cookie設定
config.cookie_enabled = true
config.cookie_name = 'genba_auth_token'

config.cookie_attributes = {
  httponly: true,           # XSS保護: JavaScriptからアクセス不可
  secure: true,             # HTTPS通信のみ（本番環境）
  same_site: :lax,          # CSRF保護
  expires: 2.weeks          # 有効期限: 2週間
}
```

---

## CSRF保護

### CSRF トークンの生成

```ruby
# ApplicationController
before_action :set_csrf_cookie

def set_csrf_cookie
  cookies['XSRF-TOKEN'] = {
    value: form_authenticity_token,
    httponly: false,        # フロントエンドから読み取り可能
    secure: Rails.env.production?,
    same_site: :lax
  }
end
```

### CSRF保護の動作

1. サーバーがCSRFトークンをCookieで送信
2. フロントエンドがトークンを読み取り、リクエストヘッダーに付与
3. サーバーがトークンを検証
4. トークンが一致しない場合、リクエストを拒否

---

## CORS設定

### 許可されたオリジン

```ruby
# 本番環境
allowed_origins = [ENV.fetch("FRONTEND_URL", "https://app.genba-tasks.com")]

# 開発環境
if Rails.env.development?
  allowed_origins += ["http://localhost:5173", "http://127.0.0.1:5173"]
end
```

### CORS設定の詳細

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins allowed_origins

    resource '*',
      headers: :any,
      methods: %i[get post put patch delete options head],
      expose: %w[access-token client uid expiry token-type authorization],
      max_age: 86400,              # 24時間キャッシュ
      credentials: true            # Cookie認証を許可
  end
end
```

---

## レート制限

### Rack::Attack による多層防御

#### 1. 一般的なリクエスト制限

```ruby
throttle('req/ip', limit: 60, period: 1.minute) do |req|
  req.ip unless req.path == '/health'
end
```

#### 2. ログイン試行の制限

```ruby
# IPアドレス単位
throttle('login/ip', limit: 5, period: 5.minutes) do |req|
  req.ip if req.path == '/api/auth/sign_in' && req.post?
end

# メールアドレス単位
throttle('login/email', limit: 5, period: 5.minutes) do |req|
  req.params['email'] if req.path == '/api/auth/sign_in' && req.post?
end
```

#### 3. パスワードリセットの制限

```ruby
throttle('password/ip', limit: 3, period: 5.minutes) do |req|
  req.ip if req.path == '/api/auth/password' && req.post?
end
```

#### 4. 登録試行の制限

```ruby
throttle('signup/ip', limit: 3, period: 1.hour) do |req|
  req.ip if req.path == '/api/auth' && req.post?
end
```

### レート制限違反時の応答

HTTPステータス: **429 Too Many Requests**

```json
{
  "error": "Too many requests. Please try again later."
}
```

レスポンスヘッダー:
```
RateLimit-Limit: 60
RateLimit-Remaining: 0
RateLimit-Reset: 1234567890
```

---

## 入力検証

### モデルレベルのバリデーション

```ruby
# Task モデル
validates :title, presence: true, length: { maximum: 200 }
validates :status, presence: true, inclusion: { in: %w[not_started in_progress completed] }
validates :progress, numericality: {
  greater_than_or_equal_to: 0,
  less_than_or_equal_to: 100
}, allow_nil: true

# カスタムバリデーション
validate :depth_limit              # 親子関係の深さ制限
validate :children_count_limit     # 子タスク数の制限
```

### SQLインジェクション対策

1. **ORMの使用**: ActiveRecordは自動的にパラメータ化クエリを生成
2. **LIKE クエリのサニタイゼーション**: `sanitize_sql_like()` の使用

```ruby
pattern = "%#{sanitize_sql_like(keyword)}%"
scope.where("LOWER(title) LIKE LOWER(?)", pattern)
```

3. **ホワイトリスト方式**: 許可されたカラム・値のみ受け入れ

```ruby
ALLOWED_SORT_COLUMNS = %w[deadline progress created_at title site position]

def validate_sort_column(column)
  ALLOWED_SORT_COLUMNS.include?(column.to_s)
end
```

---

## パスワードセキュリティ

### パスワードハッシュ化

- **アルゴリズム**: bcrypt
- **ストレッチ回数**: 12（本番環境）/ 1（テスト環境）

```ruby
# config/initializers/devise.rb
config.stretches = Rails.env.test? ? 1 : 12
```

### パスワード要件

```ruby
config.password_length = 6..128
config.email_regexp = /\A[^@\s]+@[^@\s]+\z/
```

### パスワードリセット

- **有効期限**: 6時間

```ruby
config.reset_password_within = 6.hours
```

---

## セキュリティベストプラクティス

### 1. 環境変数の管理

**絶対にコミットしないもの**:
- APIキー
- データベースパスワード
- シークレットキー
- SMTP認証情報

```bash
# .env ファイル（.gitignoreに追加済み）
DATABASE_PASSWORD=xxxxx
SECRET_KEY_BASE=xxxxx
SMTP_PASSWORD=xxxxx
```

### 2. センシティブな情報のログ除外

```ruby
# config/initializers/filter_parameter_logging.rb
Rails.application.config.filter_parameters += [
  :passw, :email, :secret, :token, :_key, :crypt, :salt,
  :certificate, :otp, :ssn, :cvv, :cvc
]
```

### 3. HTTPSの強制（本番環境）

```ruby
# config/environments/production.rb
config.assume_ssl = true
config.force_ssl = true
```

### 4. セキュリティアップデートの適用

定期的な依存関係の更新:

```bash
# Rubyの脆弱性スキャン
bundle audit check --update

# Railsセキュリティスキャン
brakeman --no-pager
```

### 5. エラーハンドリング

本番環境では、詳細なエラー情報を表示しない:

```ruby
config.consider_all_requests_local = false
```

エラー時の応答例:
```json
{
  "errors": ["エラーが発生しました。しばらくしてからお試しください。"]
}
```

---

## セキュリティ監査チェックリスト

定期的に以下を確認してください:

### インフラストラクチャ
- [ ] HTTPSが有効化されている
- [ ] ファイアウォールが適切に設定されている
- [ ] データベースが外部から直接アクセスできない
- [ ] バックアップが定期的に取得されている

### アプリケーション
- [ ] セキュリティヘッダーが正しく設定されている
- [ ] CSRF保護が有効になっている
- [ ] レート制限が機能している
- [ ] 入力検証が適切に実装されている
- [ ] パスワードが安全にハッシュ化されている

### 依存関係
- [ ] Gemfileの依存関係が最新である
- [ ] 既知の脆弱性がない（bundle audit）
- [ ] セキュリティパッチが適用されている

### ログ・監視
- [ ] 異常なアクセスパターンを検知できる
- [ ] エラーログが適切に記録されている
- [ ] センシティブな情報がログに含まれていない

---

## セキュリティインシデント発生時の対応

1. **即座に対応チームに連絡**
2. **影響範囲の特定**
3. **問題の修正**
4. **影響を受けたユーザーへの通知**
5. **再発防止策の実施**

## 連絡先

セキュリティに関する問題を発見した場合:
- Email: security@genba-tasks.com
- 緊急時: [緊急連絡先]

---

**最終更新**: 2026-01-09
**バージョン**: 1.0.0
