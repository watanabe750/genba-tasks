# spec/support/request_json_helpers.rb
module RequestJsonHelpers
    # Rack の env 変数名で指定すること（大文字、ハイフン不可）
    def json_headers
      { 'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json' }
    end
end

RSpec.configure do |c|
    c.include RequestJsonHelpers, type: :request
end