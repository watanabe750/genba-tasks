# spec/support/sqlite_tuning.rb
RSpec.configure do |config|
    config.before(:suite) do
      next unless ActiveRecord::Base.connection.adapter_name =~ /SQLite/i
  
      conn = ActiveRecord::Base.connection
      # 取得できるまで待つ
      conn.execute("PRAGMA busy_timeout = 5000")
      # 併用すると read/write が詰まりにくい
      conn.execute("PRAGMA journal_mode = WAL")
      conn.execute("PRAGMA synchronous = NORMAL")
    end
  end
  