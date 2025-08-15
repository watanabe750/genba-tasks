module ApiHelpers
    def json_headers
      { 'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json' }
    end

    def auth_headers_for(user)
      user.create_new_auth_token
    end
  end