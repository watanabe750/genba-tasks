# frozen_string_literal: true

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # フロントエンドが動くオリジンを列挙（開発＋本番）
    allowed = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://genba-tasks.com',
      'https://www.genba-tasks.com'
    ]

    # CloudFront のディストリビューション ドメインを環境変数で追加したい場合（任意）
    # 例) CLOUDFRONT_FRONTEND_ORIGIN=https://dxxxxxxx.cloudfront.net
    cf = ENV['CLOUDFRONT_FRONTEND_ORIGIN']
    allowed << cf if cf && !cf.empty?

    # 必要なら CloudFront サブドメインの正規表現許可（credentials: true でもOK）
    origins(*allowed, %r{\Ahttps://[a-z0-9-]+\.cloudfront\.net\z})

    resource '*',
             headers: :any,
             expose: %w[access-token client uid expiry token-type Authorization x-auth-start],
             methods: %i[get post put patch delete options head],
             credentials: true
  end
end
