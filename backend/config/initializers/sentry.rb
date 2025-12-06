# config/initializers/sentry.rb
if ENV['SENTRY_DSN'].present?
  Sentry.init do |config|
    config.dsn = ENV['SENTRY_DSN']
    config.breadcrumbs_logger = [:active_support_logger, :http_logger]

    # Rails環境を設定
    config.environment = Rails.env

    # サンプリングレート（本番では0.1-0.3推奨）
    config.traces_sample_rate = Rails.env.production? ? 0.1 : 1.0

    # 本番環境のみプロファイリングを有効化
    config.profiles_sample_rate = Rails.env.production? ? 0.1 : 0.0

    # リリース情報（Git SHA等）
    config.release = ENV['APP_VERSION'] || 'unknown'

    # 環境変数をフィルタリング（機密情報を除外）
    config.send_default_pii = false
    config.before_send = lambda do |event, hint|
      # パスワードやトークンなどの機密情報を除外
      if event.request
        event.request.data&.delete_if { |k, _| k.to_s =~ /password|token|secret/i }
      end
      event
    end
  end
end
