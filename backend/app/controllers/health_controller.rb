class HealthController < ApplicationController
    skip_before_action :authenticate_user!, raise: false
  
    def show
      payload = {
        status: "ok",
        app: ENV.fetch("APP_NAME", "genba-task-api"),
        sha: ENV.fetch("GIT_SHA", "unknown"),
        rails_env: Rails.env,
        time: Time.now.utc.iso8601,
        db: db_alive?
      }
      response.set_header("Cache-Control", "no-store")
      render json: payload, status: :ok
    end
  
    private
  
    def db_alive?
      ActiveRecord::Base.connection.execute("SELECT 1")
      true
    rescue
      false
    end
  end
  