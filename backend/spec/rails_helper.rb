# spec/rails_helper.rb
require 'spec_helper'

ENV['RAILS_ENV'] ||= 'test'

# 1) Rails本体を先に読み込む
require File.expand_path('../config/environment', __dir__)
abort("The Rails environment is running in production mode!") if Rails.env.production?

# 2) RSpec Railsを読み込む（ここでRailsが前提になる）
require 'rspec/rails'

# 3) support配下は Rails が読まれた“後”に読み込む
Rails.root.glob('spec/support/**/*.rb').sort_by(&:to_s).each { |f| require f }

# 4) DBスキーマをテスト環境と同期
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  # フィクスチャを使うなら（使わないなら消してOK）
  config.fixture_paths = [Rails.root.join('spec/fixtures')]

  # トランザクションで囲む（System SpecでJS使う場合は後でDB Cleaner検討）
  config.use_transactional_fixtures = true

  # specの場所から自動で type を推論（request/modelなど）
  config.infer_spec_type_from_file_location!

  # ノイズ削減
  config.filter_rails_from_backtrace!

  # Deviseの sign_in ヘルパ（request用）
  config.include ApiAuthHelpers,        type: :request  # ← 上で作ったやつ
  config.include RequestJsonHelpers,    type: :request  # ← 上で作ったやつ
  config.include Devise::Test::IntegrationHelpers, type: :request
end