module Api
  class TasksController < Api::BaseController
    before_action :set_task, only: [:show, :update, :destroy]
    before_action :_debug_params, only: [:create, :update]

    SELECT_FIELDS = %i[id title status progress deadline parent_id depth description site].freeze

    def index
      tasks = Task.filter_sort(filter_params, user: current_user)
      render json: tasks.as_json(only: SELECT_FIELDS)
    end

    def priority
      tasks = current_user.tasks.priority_order
      render json: tasks.as_json(only: SELECT_FIELDS)
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
    rescue ArgumentError => e  # ← 追加: enum無効値など
      Rails.logger.warn("[Task#create] ArgumentError: #{e.message}")
      render json: { errors: ["Invalid parameter: #{e.message}"] }, status: :unprocessable_entity
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
    rescue ArgumentError => e  # ← 追加: enum無効値など
      Rails.logger.warn("[Task#update] ArgumentError: #{e.message}")
      render json: { errors: ["Invalid parameter: #{e.message}"] }, status: :unprocessable_entity
    end
    

    def destroy
      @task.destroy
      head :no_content
    end

    # ✅ ここに移動：公開アクション
    # 現場名候補（親タスクからdistinct、null/空白除外）
    def sites
      names = current_user.tasks
                .where(parent_id: nil)
                .where.not(site: [nil, ""])
                .distinct
                .order(Arel.sql("LOWER(site) ASC"))
                .pluck(:site)
      render json: names
    end

    private
    # ---- ここから下はprivate ----
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

    # site/status/progress/deadline/parents_only を受け取る
    def filter_params
      {
        site:          params[:site],
        status:        Array(params[:status]),
        progress_min:  params[:progress_min],
        progress_max:  params[:progress_max],
        order_by:      params[:order_by],
        dir:           params[:dir],
        parents_only:  params[:parents_only]
      }
    end

    # ネスト / フラット / JSON文字列キー ぜんぶ対応
    def task_params
      raw = request.request_parameters
      src =
        if raw.present?
          if raw.key?("task") || raw.key?(:task)
            raw["task"] || raw[:task]
          elsif raw.size == 1 && raw.keys.first.to_s.strip.start_with?("{")
            begin
              parsed = ActiveSupport::JSON.decode(raw.keys.first)
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
        .permit(:title, :status, :progress, :deadline, :parent_id, :description, :site)
    end
  end
end
