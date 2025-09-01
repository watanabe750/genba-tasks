module Api
  class TasksController < Api::BaseController
    before_action :set_task, only: [:show, :update, :destroy]
    before_action :_debug_params, only: [:create, :update]

    SELECT_FIELDS = %i[id title status progress deadline parent_id depth description site].freeze

    def index
      filters = filter_params
      scope   = Task.filter_sort(filters, user: current_user)

      # ---- 並び順を「明示的に」確定（親を常に先頭 / primary でソート / 兄弟は position）----
      dir = %w[asc desc].include?(filters[:dir].to_s.downcase) ? filters[:dir].to_s.upcase : "ASC"
      ob  = (filters[:order_by].presence || "deadline").to_s

      primary =
        case ob
        when "progress"   then "progress"
        when "created_at" then "created_at"
        else                    "deadline"
        end

      adapter = ActiveRecord::Base.connection.adapter_name.to_s

      parents_first_sql =
        if adapter =~ /postgre/i
          # PostgreSQL: NULLS LAST が素直に使える
          <<~SQL.squish
            (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC,
            #{primary} #{dir} NULLS LAST,
            parent_id ASC,
            position ASC
          SQL
        else
          # SQLite / MySQL: NULLS LAST 相当を CASE で表現
          <<~SQL.squish
            (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC,
            CASE WHEN #{primary} IS NULL THEN 1 ELSE 0 END ASC,
            #{primary} #{dir},
            parent_id ASC,
            position ASC
          SQL
        end

      # 重要：reorder で既存 ORDER を丸ごと置き換える
      scope = scope.reorder(Arel.sql(parents_first_sql))

      Rails.logger.info("[Tasks#index] order=#{parents_first_sql} filters=#{filters.inspect}")

      render json: scope.as_json(only: SELECT_FIELDS)
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
    rescue ArgumentError => e
      Rails.logger.warn("[Task#create] ArgumentError: #{e.message}")
      render json: { errors: ["Invalid parameter: #{e.message}"] }, status: :unprocessable_entity
    end

    def update
      attrs = task_params

      # ---- 親またぎ禁止の防御（UI壊れてもDBを守る）----
      if attrs.key?(:parent_id)
        if attrs[:parent_id] != @task.parent_id
          render json: { errors: ["親をまたぐ移動は不可です"] }, status: :unprocessable_entity and return
        end
      end

      if @task.update(attrs)
        render json: @task
      else
        Rails.logger.warn("[Task#update] validation failed: #{ @task.errors.full_messages.inspect }")
        render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ActionController::ParameterMissing => e
      Rails.logger.error("[Task#update] ParameterMissing: #{e.message}; params=#{params.to_unsafe_h.inspect}; request_parameters=#{request.request_parameters.inspect}")
      render json: { errors: [e.message] }, status: :bad_request
    rescue ArgumentError => e  # ← enum無効値など
      Rails.logger.warn("[Task#update] ArgumentError: #{e.message}")
      render json: { errors: ["Invalid parameter: #{e.message}"] }, status: :unprocessable_entity
    end

    def destroy
      @task.destroy
      head :no_content
    end

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

    # === 並び替え（同一親内）===
    def reorder_within_parent!(task, after_id_param)
      after_id = after_id_param.present? ? after_id_param.to_i : nil

      Task.transaction do
        # after_id が nil のときは先頭に移動
        target_pos =
          if after_id.nil?
            1
          else
            sib = current_user.tasks.find(after_id)
            raise ActiveRecord::RecordInvalid, "Cannot move across parents" if sib.parent_id != task.parent_id
            (sib.position || 0) + 1
          end

        # 同一親の兄弟を lock して詰め直し
        scope = current_user.tasks.where(parent_id: task.parent_id).order(:position).lock

        # まず対象の行を抜いて隙間を詰める
        removed_pos = task.position
        scope.where("position > ?", removed_pos).update_all("position = position - 1")

        # target_pos 以降を空ける
        scope.reload.where("position >= ?", target_pos).update_all("position = position + 1")

        # 自分を target_pos に
        task.update!(position: target_pos)

        # 念のため 1..N を再採番
        pos = 1
        scope.reload.each do |t|
          t.update_columns(position: pos) unless t.position == pos
          pos += 1
        end
      end
    end
  end
end
