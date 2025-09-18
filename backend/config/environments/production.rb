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
  config.active_storage.service = :local

  # Assume all access to the app is happening through a SSL-terminating reverse proxy.
  config.assume_ssl = true
  config.force_ssl  = true
  # ヘルスチェック /up への 80→443 リダイレクトを避けたい場合は以下を有効化
  # config.ssl_options = { redirect: { exclude: ->(req) { req.path == "/up" } } }

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

  # Mailer（必要に応じて設定）
  # config.action_mailer.raise_delivery_errors = false
  config.action_mailer.default_url_options = { host: "example.com" }
  # config.action_mailer.smtp_settings = { ... }

  # I18n fallbacks
  config.i18n.fallbacks = true

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Only use :id for inspections in production.
  config.active_record.attributes_for_inspect = [:id]

  # Host header protection（必要に応じて許可ホストを設定）
  # config.hosts = ["example.com", /.*\.example\.com/]
  # config.host_authorization = { exclude: ->(req) { req.path == "/up" } }
end
