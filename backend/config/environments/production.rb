# config/environments/production.rb
require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.enable_reloading = false

  # Eager load code on boot for better performance and memory savings (ignored by Rake tasks).
  config.eager_load = true

  # Full error reports are disabled.
  config.consider_all_requests_local = false

  # Cache assets for far-future expiry since they are all digest stamped.
  config.public_file_server.headers = { "cache-control" => "public, max-age=#{1.year.to_i}" }

  # Store uploaded files on the local file system (see config/storage.yml for options).
  config.active_storage.service = :amazon

  # Assume all access to the app is happening through a SSL-terminating reverse proxy.
  config.assume_ssl = true
  config.force_ssl  = true
  # ヘルスチェックパスだけSSLリダイレクトから除外
  config.ssl_options = { redirect: { exclude: ->(req) { req.path == "/up" } } }

  # Log to STDOUT with the current request id as a default log tag.
  config.log_tags = [:request_id]
  config.logger   = ActiveSupport::TaggedLogging.logger(STDOUT)
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  # Prevent health checks from clogging up the logs.
  config.silence_healthcheck_path = "/up"

  # Don't log any deprecations.
  config.active_support.report_deprecations = false

  # ==== Solid 系は使わない（単一DB運用）==============================

  # Solid Cache を無効化（DBを追加しないため）。必要なら Redis 等に変更可。
  config.cache_store = :memory_store

  # Solid Queue を使わない
  # config.active_job.queue_adapter = :solid_queue
  # config.solid_queue.connects_to = { database: { writing: :queue, reading: :queue } }

  # Solid Cable を使わない（Action Cable を使わない/別アダプタにする場合は何もしない）
  # config.action_cable.adapter = :solid_cable

  # ===============================================================

  # Mailer設定
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.default_url_options = {
    host: ENV.fetch("APP_HOST", "app.genba-tasks.com"),
    protocol: 'https'
  }

  # SMTP設定（Amazon SES推奨）
  config.action_mailer.smtp_settings = {
    address: ENV.fetch("SMTP_ADDRESS", "email-smtp.ap-northeast-1.amazonaws.com"),
    port: ENV.fetch("SMTP_PORT", 587).to_i,
    domain: ENV.fetch("SMTP_DOMAIN", "genba-tasks.com"),
    user_name: ENV["SMTP_USERNAME"],
    password: ENV["SMTP_PASSWORD"],
    authentication: :login,
    enable_starttls_auto: true
  }

  # メール送信元
  config.action_mailer.default_options = {
    from: ENV.fetch("MAIL_FROM", "noreply@genba-tasks.com")
  }

  # I18n fallbacks
  config.i18n.fallbacks = true

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Only use :id for inspections in production.
  config.active_record.attributes_for_inspect = [:id]

  # Host header protection - Host Headerインジェクション攻撃を防止
  config.hosts = [
    ENV.fetch("APP_HOST", "app.genba-tasks.com"),
    /.*\.genba-tasks\.com/  # サブドメインも許可 (例: staging.genba-tasks.com)
  ]
  # ヘルスチェックエンドポイントは例外（ロードバランサーからのアクセスを許可）
  config.host_authorization = { exclude: ->(req) { req.path == "/up" } }

  # セキュリティヘッダーの追加
  config.action_dispatch.default_headers.merge!(
    # X-Frame-Options: クリックジャッキング攻撃対策
    # 同じドメインからのみiframeでの埋め込みを許可
    'X-Frame-Options' => 'SAMEORIGIN',

    # X-Content-Type-Options: MIMEスニッフィング攻撃対策
    # ブラウザにContent-Typeを厳密に守らせ、推測による実行を防止
    'X-Content-Type-Options' => 'nosniff',

    # X-XSS-Protection: 旧ブラウザ向けXSS対策
    # ブラウザのXSSフィルタを有効化（最新ブラウザではCSPが優先される）
    'X-XSS-Protection' => '1; mode=block',

    # Referrer-Policy: リファラー情報の制御
    # 同一サイト内ではフルURL、外部サイトにはオリジンのみ送信
    # URLパラメータの機密情報漏洩を防止
    'Referrer-Policy' => 'strict-origin-when-cross-origin',

    # Permissions-Policy: 不要なブラウザ機能を無効化
    # カメラ、マイク、位置情報、決済機能など、アプリで使用しない機能を明示的に無効化
    'Permissions-Policy' => 'camera=(), microphone=(), geolocation=(), payment=()',

    # Content-Security-Policy: XSS攻撃に対する最強の防御
    # React + Vite + Tailwind CSS に最適化した設定
    'Content-Security-Policy' => [
      # デフォルト: 自サイトのみ
      "default-src 'self'",

      # スクリプト: Vite + React で必要（'unsafe-inline'はViteの動的インポートで必要）
      "script-src 'self' 'unsafe-inline'",

      # スタイル: Tailwind CSS のインラインスタイルで必要
      "style-src 'self' 'unsafe-inline'",

      # 画像: 自サイト + data: + https: + blob:（Active Storage / S3等の外部ストレージ対応）
      "img-src 'self' data: https: blob:",

      # フォント: 自サイト + data:
      "font-src 'self' data:",

      # API接続: 自サイトのみ
      "connect-src 'self'",

      # iframe埋め込み: 自サイトのみ（X-Frame-Optionsの代替）
      "frame-ancestors 'self'",

      # フォーム送信先: 自サイトのみ
      "form-action 'self'",

      # base要素の制限
      "base-uri 'self'",

      # Flash等のプラグインを禁止
      "object-src 'none'",

      # HTTPをHTTPSに自動アップグレード
      "upgrade-insecure-requests"
    ].join('; ')
  )
end
