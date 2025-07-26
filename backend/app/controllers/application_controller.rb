class ApplicationController < ActionController::API
    include ActionController::MimeResponds # APIモード用のコントローラ

    # 未ログイン時はリダイレクトではなく401を返すように設定
    before_action :configure_permitted_parameters, if: :devise_controller?

    protected

    # 未ログイン時の共通処理
    def authenticate_user!(opts = {})
        unless user_signed_in? # Deviseが提供するヘルパー。ログインしているか確認
            # ログインしていなければ401エラーを返す(API用)
            render json: { errors: ["You need to sign in or sign up before continuing."] },
                   status: :unauthorized and return
        end
        super # ログイン済みなら、Devise標準のauthenticate_user!を実行
    end
end