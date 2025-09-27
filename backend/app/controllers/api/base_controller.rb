# app/controllers/api/base_controller.rb
module Api
  class BaseController < ActionController::API
    include DeviseTokenAuth::Concerns::SetUserByToken
    include Devise::Controllers::Helpers
    include ActionController::ParamsWrapper
    include Rails.application.routes.url_helpers

    wrap_parameters format: [:json]

    # devise-token-auth の別名
    alias authenticate_user! authenticate_api_user!
    alias current_user      current_api_user

    before_action :authenticate_user!
    before_action :set_active_storage_url_options

    # JSON パース失敗などを 400 に
    rescue_from ActionDispatch::Http::Parameters::ParseError do |e|
      render json: { errors: [e.message] }, status: :bad_request
    end

    private

    # ActiveStorage が URL を生成できるように、毎回オプションを付与
    def set_active_storage_url_options
      ActiveStorage::Current.url_options = default_url_options
    end

    # url_helpers（rails_blob_url など）用にも同じ既定値を返す
    def default_url_options
      {
        host:     request.host,
        port:     request.optional_port,              # :80/:443 のときは nil が返る
        protocol: request.ssl? ? "https" : "http"
      }
    end
  end
end
