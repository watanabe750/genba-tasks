require "rails_helper"

RSpec.describe "Auth sign in", type: :request do
  let(:user) { User.create!(email: "valid@example.com", password: "password") }

  it "正しい認証で200 & DTAヘッダ" do
    post "/api/auth/sign_in",
         params: { email: user.email, password: "password" }.to_json,
         headers: json_headers

    expect(response).to have_http_status(:ok)
    %w[access-token client uid].each { |k| expect(response.headers[k]).to be_present }
  end

  it "誤パスワードで401" do
    post "/api/auth/sign_in",
         params: { email: user.email, password: "WRONG" }.to_json,
         headers: json_headers

    expect(response).to have_http_status(:unauthorized)
  end
end