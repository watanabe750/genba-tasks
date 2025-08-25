# spec/rails_helper.rb
require 'spec_helper'

ENV['RAILS_ENV'] ||= 'test'

# 1) Rails本体を先に読み込む
require File.expand_path('../config/environment', __dir__)
abort("The Rails environment is running in production mode!") if Rails.env.production?

# 2) RSpec Railsを読み込む（ここでRailsが前提になる）
require 'rspec/rails'

# 3) support配下は Rails が読まれた“後”に読み込む
Dir[Rails.root.join('spec/support/**/*.rb')].sort.each { |f| require f }

# 4) DBスキーマをテスト環境と同期
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  # （任意）fixtures を使うなら有効化。使っていなければコメントアウトでOK
  # config.fixture_path = Rails.root.join('spec/fixtures')

  # FactoryBot の DSL（create/build など）をグローバルに使えるように
  config.include FactoryBot::Syntax::Methods

  # トランザクションで囲む（System SpecでJS使う場合は後でDB Cleaner検討）
  config.use_transactional_fixtures = true

  # specの場所から自動で type を推論（request/modelなど）
  config.infer_spec_type_from_file_location!

  # ノイズ削減
  config.filter_rails_from_backtrace!

  # Request 用ヘルパ（自作）
  config.include ApiAuthHelpers,     type: :request
  config.include RequestJsonHelpers, type: :request

  # ← APIはトークン運用なので基本は不要。セッション sign_in を使う場合のみ該当 spec で include
  # config.include Devise::Test::IntegrationHelpers, type: :request
end
