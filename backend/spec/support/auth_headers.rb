module AuthHeaders
    def auth_headers_for(user, password: "password")
      post "/api/auth/sign_in",
           params: { email: user.email, password: password }.to_json,
           headers: json_headers
      # Devise Token Auth の3兄弟を次のリクエストに付与
      response.headers.slice("access-token", "client", "uid")
    end
end

RSpec.configure { |c| c.include AuthHeaders, type: :request }
