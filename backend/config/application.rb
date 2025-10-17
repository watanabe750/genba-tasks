# config/application.rb
require_relative "boot"

# まず Rails 本体（railties）を読み込む
# 迷ったら rails/all でOK（api_only=true なら中間ウェアは最小化されます）
require "rails/all"
# --- もし必要最小限にしたい場合は上を消して下を個別 require に ---
# require "rails"
# require "active_model/railtie"
# require "active_job/railtie"
# require "active_record/railtie"
# require "action_controller/railtie"
# # APIだけで使わないならコメントアウト可↓
# # require "action_mailer/railtie"
# # require "action_view/railtie"
# # require "action_cable/engine"
# # require "sprockets/railtie"

Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    config.load_defaults 8.0
    config.api_only = true

    # === Rack::Attack (Rate Limiting) ===
    # Configuration is in config/initializers/rack_attack.rb

    # === Cookie セッション（クロスサイト対応） ===
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore,
      key: "_backend_session",
      domain: ".genba-tasks.com", # app./api. で共有
      same_site: :none,           # クロスサイト送信には :none
      secure: true                # HTTPS 前提
  end
end
