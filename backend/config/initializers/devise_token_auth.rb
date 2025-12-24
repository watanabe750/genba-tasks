# config/initializers/devise_token_auth.rb
DeviseTokenAuth.setup do |config|
  # Cookie認証を有効化（XSS攻撃対策）
  config.cookie_enabled = true
  config.cookie_name = 'genba_auth_token'

  # HttpOnly, Secure, SameSite設定
  config.cookie_attributes = {
    httponly: true,           # JavaScriptからアクセス不可（XSS対策）
    secure: Rails.env.production?,  # 本番環境ではHTTPSのみ
    same_site: :lax,          # CSRF対策
    expires: 2.weeks
  }

  if Rails.env.development? || Rails.env.test?
    config.change_headers_on_each_request = false
    config.batch_request_buffer_throttle = 60.seconds
    config.max_number_of_devices = 100
  else
    # 本番は明示ON（将来のデフォルト変更に備える）
    config.change_headers_on_each_request = true
  end
end

