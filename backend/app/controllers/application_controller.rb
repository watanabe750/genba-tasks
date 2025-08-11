class ApplicationController < ActionController::API
    # トークンからユーザーを特定
    include DeviseTokenAuth::Concerns::SetUserByToken    
    # ← これが無いと current_user / user_signed_in? / authenticate_user! が使えない
    include Devise::Controllers::Helpers
    # 未ログイン時はリダイレクトではなく401を返すように設定
    # before_action :configure_permitted_parameters, if: :devise_controller?
    # protected def configure_permitted_parameters; end
end