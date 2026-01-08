# config/initializers/security_headers.rb

Rails.application.config.action_dispatch.default_headers.merge!(
  {
    # クリックジャッキング防止: iframe内での表示を完全に禁止
    # DENY: すべてのサイトでのframing禁止
    # SAMEORIGIN: 同じオリジンのみ許可する場合
    'X-Frame-Options' => 'DENY',

    # MIMEタイプスニッフィング防止
    # ブラウザがContent-Typeを無視してファイルの内容から推測することを防ぐ
    # XSS攻撃の一種を防止
    'X-Content-Type-Options' => 'nosniff',

    # XSS Protection（レガシーブラウザ向け）
    # 最新ブラウザはCSPを優先するが、古いブラウザのために残す
    # mode=block: XSSを検知した場合ページレンダリングをブロック
    'X-XSS-Protection' => '1; mode=block',

    # Referrer Policy: リファラー情報の送信を制限
    # strict-origin-when-cross-origin:
    #   - 同一オリジン: フルURLを送信
    #   - HTTPS→HTTPS: オリジンのみ送信
    #   - HTTPS→HTTP: リファラー送信しない（セキュアダウングレード防止）
    'Referrer-Policy' => 'strict-origin-when-cross-origin',

    # Permissions Policy（旧Feature Policy）
    # デバイスAPIへのアクセスを制限
    # (): すべてのオリジンでアクセス不可
    'Permissions-Policy' => [
      'geolocation=()',      # 位置情報
      'microphone=()',       # マイク
      'camera=()',           # カメラ
      'payment=()',          # 決済API
      'usb=()',              # USB
      'magnetometer=()',     # 磁力計
      'gyroscope=()',        # ジャイロスコープ
      'accelerometer=()'     # 加速度計
    ].join(', ')
  }
)

# Content Security Policy（CSP）の設定
# 注意: api_only=trueの場合、CSPは主にAPI経由で提供されるリソースに適用される
Rails.application.config.content_security_policy do |policy|
  # デフォルトソース: 自分自身のみ許可
  policy.default_src :self

  # フォント: 自分自身、HTTPS、data: スキーム（インラインフォント）
  policy.font_src    :self, :https, :data

  # 画像: 自分自身、HTTPS、data:、blob:（ActiveStorageの画像用）
  policy.img_src     :self, :https, :data, :blob

  # オブジェクト（Flash、Java Applet等）: 完全禁止
  policy.object_src  :none

  # スクリプト: 自分自身とHTTPS
  # 注意: インラインスクリプトが必要な場合は :unsafe_inline を追加
  # セキュリティ向上のため、可能な限り外部ファイル化を推奨
  policy.script_src  :self, :https

  # スタイルシート: 自分自身とHTTPS
  # Tailwind CSS等のインラインスタイルが必要な場合は :unsafe_inline を追加
  policy.style_src   :self, :https

  # 接続先（fetch, XHR, WebSocket等）: 自分自身とHTTPS
  # フロントエンドからのAPI呼び出しを許可
  policy.connect_src :self, :https

  # メディア（audio, video）: 自分自身とHTTPS
  policy.media_src   :self, :https

  # フレーム: 自分自身のみ
  # 外部サイトをiframe内に埋め込む必要がある場合は許可ドメインを追加
  policy.frame_src   :self

  # ベースURI: 自分自身のみ
  # <base> タグによるURL改ざんを防止
  policy.base_uri    :self

  # フォーム送信先: 自分自身のみ
  # フォームの action 属性を制限
  policy.form_action :self

  # 本番環境でのみHTTPSへのアップグレードを強制
  # HTTP経由のリソース読み込みを自動的にHTTPSにアップグレード
  if Rails.env.production?
    policy.upgrade_insecure_requests true
  end

  # CSP違反レポートの送信先（オプション）
  # 違反を検知してログ記録・分析したい場合に設定
  # policy.report_uri "/csp-violation-report"
end

# CSP違反をブラウザのコンソールにのみ報告する設定（開発・テスト用）
# 本番環境ではブロックモードで動作
Rails.application.config.content_security_policy_report_only = Rails.env.development?

# nonceベースのCSP（より厳格なセキュリティ）を使用する場合
# script-src と style-src に nonce を自動追加
# Rails.application.config.content_security_policy_nonce_generator = ->(request) { SecureRandom.base64(16) }
# Rails.application.config.content_security_policy_nonce_directives = %w[script-src style-src]

# セッションストアにnonceを保存（必要に応じて）
# Rails.application.config.content_security_policy_nonce_store = ->(request) {
#   request.session
# }
