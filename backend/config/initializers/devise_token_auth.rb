# config/initializers/devise_token_auth.rb
DeviseTokenAuth.setup do |config|
  if Rails.env.development? || Rails.env.test?
    config.change_headers_on_each_request = false
    config.batch_request_buffer_throttle = 60.seconds
    config.max_number_of_devices = 100
  else
    # 本番は明示ON（将来のデフォルト変更に備える）
    config.change_headers_on_each_request = true
  end
end

