Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # 環境変数から許可オリジンを取得
    allowed_origins = [
      ENV.fetch("FRONTEND_URL", "https://app.genba-tasks.com")
    ]

    # 開発環境では追加のオリジンを許可
    if Rails.env.development?
      allowed_origins += [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
      ]
    end

    # ステージング環境などの追加オリジン（オプション）
    if ENV["STAGING_FRONTEND_URL"].present?
      allowed_origins << ENV["STAGING_FRONTEND_URL"]
    end

    origins allowed_origins

    resource '*',
      headers: :any,
      methods: %i[get post put patch delete options head],
      expose: %w[access-token client uid expiry token-type authorization],
      max_age: 86400,
      credentials: false
  end
end
