module Api
    class BaseController < ActionController::API
      include DeviseTokenAuth::Concerns::SetUserByToken
      include Devise::Controllers::Helpers
      include ActionController::ParamsWrapper
      wrap_parameters format: [:json]

      # devise_token_auth を current_user / authenticate_user! に寄せる
      def authenticate_user!; authenticate_api_user!; end
      def current_user; current_api_user; end

      before_action :authenticate_user!
    end
  end