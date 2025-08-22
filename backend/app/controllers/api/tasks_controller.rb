module Api
  class TasksController < Api::BaseController
    before_action :set_task, only: [:show, :update, :destroy]
    before_action :_debug_params, only: [:create, :update]  # デバッグ（通ったら消してOK）

    def index
      tasks = current_user.tasks
      render json: tasks.select(:id, :title, :status, :progress, :deadline, :parent_id, :depth, :description, :site)  
    end

    def priority
      tasks = current_user.tasks.priority_order
      render json: tasks.select(:id, :title, :status, :progress, :deadline, :parent_id, :depth, :description, :site) 
    end

    def show
      render json: @task
    end

    def create
      task = current_user.tasks.new(task_params)
      if task.save
        render json: task, status: :created
      else
        Rails.logger.warn("[Task#create] validation failed: #{task.errors.full_messages.inspect}")
        render json: { errors: task.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ActionController::ParameterMissing => e
      Rails.logger.error("[Task#create] ParameterMissing: #{e.message}; params=#{params.to_unsafe_h.inspect}; request_parameters=#{request.request_parameters.inspect}")
      render json: { errors: [e.message] }, status: :bad_request
    end

    def update
      if @task.update(task_params)
        render json: @task
      else
        Rails.logger.warn("[Task#update] validation failed: #{ @task.errors.full_messages.inspect }")
        render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ActionController::ParameterMissing => e
      Rails.logger.error("[Task#update] ParameterMissing: #{e.message}; params=#{params.to_unsafe_h.inspect}; request_parameters=#{request.request_parameters.inspect}")
      render json: { errors: [e.message] }, status: :bad_request
    end

    def destroy
      @task.destroy
      head :no_content
    end

    private

    def _debug_params
      Rails.logger.info("[Params] content_type=#{request.content_type.inspect}")
      Rails.logger.info("[Params] keys=#{params.keys.inspect}")
      Rails.logger.info("[Params] request_parameters=#{request.request_parameters.inspect}")
      raw = request.raw_post
      Rails.logger.info("[Params] raw_post(200B)=#{raw ? raw[0,200] : nil}")
    end

    def set_task
      @task = current_user.tasks.find_by(id: params[:id])
      render(json: { errors: ["Task not found"] }, status: :not_found) and return unless @task
    end

    # ネスト / フラット / JSON文字列キー ぜんぶ対応
    def task_params
      raw = request.request_parameters # Hash だが、キーが JSON 文字列のことがある

      src =
        if raw.present?
          if raw.key?("task") || raw.key?(:task)
            raw["task"] || raw[:task]
          elsif raw.size == 1 && raw.keys.first.to_s.strip.start_with?("{")
            # 例: { "{\"task\":{\"title\":\"...\"}}" => nil }
            begin
              parsed = ActiveSupport::JSON.decode(raw.keys.first) # => {"task"=>{...}} or {...}
              parsed.is_a?(Hash) ? (parsed["task"] || parsed) : {}
            rescue StandardError
              {}
            end
          else
            raw
          end
        elsif params[:task].is_a?(ActionController::Parameters)
          params[:task]
        else
          params
        end

      ActionController::Parameters.new(src)
        .permit(:title, :status, :progress, :deadline, :parent_id, :depth, :description, :site)
    end
  end
end