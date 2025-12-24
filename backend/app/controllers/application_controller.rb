class ApplicationController < ActionController::API
  # トークンからユーザーを特定
  include DeviseTokenAuth::Concerns::SetUserByToken
  # ← これが無いと current_user / user_signed_in? / authenticate_user! が使えない
  include Devise::Controllers::Helpers

  # CSRF対策を有効化（API-onlyでもCookie認証時には必要）
  include ActionController::RequestForgeryProtection
  protect_from_forgery with: :exception, unless: -> { request.format.json? && !cookies['genba_auth_token'] }

  # CSRF tokenをCookieに設定（フロントエンドから読み取り可能）
  before_action :set_csrf_cookie

  private

  def set_csrf_cookie
    cookies['XSRF-TOKEN'] = {
      value: form_authenticity_token,
      httponly: false,  # JavaScriptから読み取り可能にする
      secure: Rails.env.production?,
      same_site: :lax
    }
  end

  # 未ログイン時はリダイレクトではなく401を返すように設定
  # before_action :configure_permitted_parameters, if: :devise_controller?
  # protected def configure_permitted_parameters; end
end