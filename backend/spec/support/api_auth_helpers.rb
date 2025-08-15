# spec/support/api_auth_helpers.rb
module ApiAuthHelpers
    # devise_token_auth のトークンだけ返す。
    # ※ ここで Content-Type を入れないこと！
    def auth_headers_for(user)
      user.create_new_auth_token.slice('uid', 'client', 'access-token', 'token-type')
    end
end

RSpec.configure do |c|
    c.include ApiAuthHelpers, type: :request
end
