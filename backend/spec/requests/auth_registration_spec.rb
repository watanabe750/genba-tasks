require "rails_helper"

RSpec.describe "Auth registration", type: :request do
  describe "POST /api/auth" do
    let(:valid_params) do
      {
        name: "Test User",
        email: "newuser@example.com",
        password: "password123",
        password_confirmation: "password123"
      }
    end

    context "有効なパラメータの場合" do
      it "201 Created を返す" do
        post "/api/auth", params: valid_params.to_json, headers: json_headers

        expect(response).to have_http_status(:created)
      end

      it "認証トークンヘッダを返す" do
        post "/api/auth", params: valid_params.to_json, headers: json_headers

        %w[access-token client uid].each do |key|
          expect(response.headers[key]).to be_present
        end
      end

      it "ユーザーが作成される" do
        expect {
          post "/api/auth", params: valid_params.to_json, headers: json_headers
        }.to change(User, :count).by(1)

        user = User.last
        expect(user.email).to eq("newuser@example.com")
        expect(user.name).to eq("Test User")
      end

      it "レスポンスにユーザー情報が含まれる" do
        post "/api/auth", params: valid_params.to_json, headers: json_headers

        json = JSON.parse(response.body)
        expect(json["data"]["email"]).to eq("newuser@example.com")
        expect(json["data"]["name"]).to eq("Test User")
      end
    end

    context "メールアドレスが既に使用されている場合" do
      before do
        User.create!(
          name: "Existing User",
          email: "newuser@example.com",
          password: "password123"
        )
      end

      it "422 Unprocessable Entity を返す" do
        post "/api/auth", params: valid_params.to_json, headers: json_headers

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "エラーメッセージを返す" do
        post "/api/auth", params: valid_params.to_json, headers: json_headers

        json = JSON.parse(response.body)
        expect(json["errors"]["full_messages"]).to include(/Email.*taken/i)
      end
    end

    context "パスワードが一致しない場合" do
      it "422 Unprocessable Entity を返す" do
        invalid_params = valid_params.merge(password_confirmation: "different123")
        post "/api/auth", params: invalid_params.to_json, headers: json_headers

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "エラーメッセージを返す" do
        invalid_params = valid_params.merge(password_confirmation: "different123")
        post "/api/auth", params: invalid_params.to_json, headers: json_headers

        json = JSON.parse(response.body)
        expect(json["errors"]["full_messages"]).to include(/Password confirmation.*match/i)
      end
    end

    context "メールアドレスが不正な形式の場合" do
      it "422 Unprocessable Entity を返す" do
        invalid_params = valid_params.merge(email: "invalid-email")
        post "/api/auth", params: invalid_params.to_json, headers: json_headers

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "エラーメッセージを返す" do
        invalid_params = valid_params.merge(email: "invalid-email")
        post "/api/auth", params: invalid_params.to_json, headers: json_headers

        json = JSON.parse(response.body)
        expect(json["errors"]["full_messages"]).to include(/Email.*invalid/i)
      end
    end

    context "パスワードが短すぎる場合" do
      it "422 Unprocessable Entity を返す" do
        invalid_params = valid_params.merge(
          password: "12345",
          password_confirmation: "12345"
        )
        post "/api/auth", params: invalid_params.to_json, headers: json_headers

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "エラーメッセージを返す" do
        invalid_params = valid_params.merge(
          password: "12345",
          password_confirmation: "12345"
        )
        post "/api/auth", params: invalid_params.to_json, headers: json_headers

        json = JSON.parse(response.body)
        expect(json["errors"]["full_messages"]).to include(/Password.*too short/i)
      end
    end

    context "必須パラメータが欠けている場合" do
      it "メールなしで422を返す" do
        invalid_params = valid_params.except(:email)
        post "/api/auth", params: invalid_params.to_json, headers: json_headers

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "パスワードなしで422を返す" do
        invalid_params = valid_params.except(:password)
        post "/api/auth", params: invalid_params.to_json, headers: json_headers

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
