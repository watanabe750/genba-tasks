module Api
    class UsersController < Api::BaseController
      # devise_token_auth（namespace: api）なのでこれでOK
      before_action :authenticate_api_user!
  
      def me
        render json: current_api_user.slice(:id, :email, :name)
      end
    end
  end
  