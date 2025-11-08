# app/controllers/guest_controller.rb
class GuestController < ApplicationController
  def login
    # ゲストユーザーを検索または作成
    guest_user = User.find_or_create_by!(email: "guest@example.com") do |user|
      user.password = SecureRandom.hex(16)
      user.name = "ゲストユーザー"
    end

    # トークンを生成
    token = guest_user.create_new_auth_token

    render json: {
      data: guest_user.as_json(only: [:id, :email, :name]),
      headers: token
    }, status: :ok
  end
end
