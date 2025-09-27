module Api
  class TasksController < Api::BaseController
    before_action :set_task, only: [:show, :update, :destroy, :reorder]
    before_action :_debug_params, only: [:create, :update, :reorder], if: -> { ENV["E2E_DEBUG_PARAMS"] == "1" }

    SELECT_FIELDS = %i[id title status progress deadline parent_id depth description site].freeze

    # GET /api/tasks
    def index
      raw_filters = filter_params

      # filter_sort に渡す許可キーだけ抽出（nil は除外）
      allowed_keys = %i[site status progress_min progress_max order_by dir parents_only]
      filters      = raw_filters.slice(*allowed_keys).compact

      Rails.logger.info("[Tasks#index] filters(normalized)=#{filters.inspect}")

      # ------- ベーススコープの決定（必ず成功させる） -------
      scope = nil
      if Task.respond_to?(:filter_sort)
        begin
          # ① Ruby 3 キーワード引数版
          scope = Task.filter_sort(**filters, user: current_user)
        rescue ArgumentError => e
          Rails.logger.warn("[Tasks#index] filter_sort kwarg failed (fallback to hash): #{e.class}: #{e.message}")
          # ② Hash 引数版
          scope = Task.filter_sort(filters, user: current_user)
        rescue => e
          Rails.logger.warn("[Tasks#index] filter_sort failed -> fallback to current_user.tasks: #{e.class}: #{e.message}")
          scope = current_user.tasks
        end
      else
        scope = current_user.tasks
      end

      # ------- 並び順最終調整（DB 方言 + NULL 安全） -------
      allowed_order = %w[deadline progress created_at title site]
      ob  = allowed_order.include?(filters[:order_by].to_s) ? filters[:order_by].to_s : "deadline"
      dir = %w[asc desc ASC DESC].include?(filters[:dir].to_s) ? filters[:dir].to_s.upcase : "ASC"

      if ob == "site"
        adapter = ActiveRecord::Base.connection.adapter_name.to_s
        sql =
          if adapter =~ /postgre/i
            <<~SQL.squish
              (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC,
              (CASE WHEN deadline IS NULL THEN 1 ELSE 0 END) ASC,
              LOWER(site) #{dir} NULLS LAST,
              CASE WHEN deadline IS NULL THEN NULL ELSE deadline END ASC,
              parent_id ASC,
              position ASC,
              id ASC
            SQL
          else
            <<~SQL.squish
              (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC,
              CASE WHEN deadline IS NULL THEN 1 ELSE 0 END ASC,
              CASE WHEN LOWER(site) IS NULL THEN 1 ELSE 0 END ASC, LOWER(site) #{dir},
              deadline ASC,
              parent_id ASC,
              position ASC,
              id ASC
            SQL
          end
        scope = scope.reorder(Arel.sql(sql))
        Rails.logger.info("[Tasks#index] order(site)=#{sql}")
        return render json: scope.with_attached_image.as_json(only: SELECT_FIELDS, methods: [:image_url])
      end

      primary =
        case ob
        when "progress"   then "progress"
        when "created_at" then "created_at"
        when "title"      then "LOWER(title)"
        else                    "deadline"
        end

      adapter = ActiveRecord::Base.connection.adapter_name.to_s
      parts =
        if adapter =~ /postgre/i
          [
            "(CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC",
            "#{primary} #{dir} NULLS LAST",
            "parent_id ASC",
            "position ASC",
            "id ASC"
          ]
        else
          [
            "(CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC",
            "CASE WHEN #{primary} IS NULL THEN 1 ELSE 0 END ASC",
            "#{primary} #{dir}",
            "parent_id ASC",
            "position ASC",
            "id ASC"
          ]
        end

      scope = scope.reorder(Arel.sql(parts.join(", ")))

      render json: scope.with_attached_image.as_json(only: SELECT_FIELDS, methods: [:image_url])
    rescue => e
      # ここで 422 を返さず、常に 200 フォールバック（UI 止めない）
      Rails.logger.error("[Tasks#index] fatal -> soft-fallback: #{e.class}: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}")
      safe = current_user.tasks.order(Arel.sql("(CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC, id ASC"))
      render json: safe.with_attached_image.as_json(only: SELECT_FIELDS, methods: [:image_url])
    end

    # GET /api/tasks/priority
    def priority
      tasks = current_user.tasks.priority_order
      render json: tasks.as_json(only: SELECT_FIELDS)
    end

    # GET /api/tasks/:id
    def show
      t = @task
      img_urls = { image_url: t.image_url, image_thumb_url: nil }

      kids = current_user.tasks
               .where(parent_id: t.id)
               .select(:id, :title, :status, :progress, :deadline, :parent_id)
               .order(Arel.sql("CASE WHEN deadline IS NULL THEN 1 ELSE 0 END ASC, deadline ASC, id ASC"))
               .limit(4)
               .to_a

      children_count      = current_user.tasks.where(parent_id: t.id).count
      children_done_count = current_user.tasks.where(parent_id: t.id, status: "completed").count
      grandkids_count     =
        if children_count.zero?
          0
        else
          child_ids = current_user.tasks.where(parent_id: t.id).select(:id)
          current_user.tasks.where(parent_id: child_ids).count
        end

      progress_percent = (t.respond_to?(:progress_percent) ? t.progress_percent : t.progress).to_i

      render json: {
        id: t.id,
        title: t.title,
        status: t.status,
        site: t.site,
        deadline: t.deadline&.iso8601,
        progress_percent: progress_percent,
        children_count: children_count,
        children_done_count: children_done_count,
        grandchildren_count: grandkids_count,
        children_preview: kids.map { |c|
          {
            id: c.id,
            title: c.title,
            status: c.status,
            progress_percent: c.progress.to_i,
            deadline: c.deadline&.iso8601
          }
        },
        created_by_name: (t.try(:user)&.try(:name) || t.try(:user)&.try(:email) || "—"),
        created_at: t.created_at.iso8601,
        updated_at: t.updated_at.iso8601,
      }.merge(img_urls)
    end

    # POST /api/tasks
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

    # PATCH/PUT /api/tasks/:id
    def update
      attrs = task_params
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
    rescue ArgumentError => e
      Rails.logger.warn("[Task#update] ArgumentError: #{e.message}")
      render json: { errors: ["Invalid parameter: #{e.message}"] }, status: :unprocessable_entity
    end

    # DELETE /api/tasks/:id
    def destroy
      @task.destroy
      head :no_content
    end

    # GET /api/tasks/sites
    def sites
      names = current_user.tasks
                .where(parent_id: nil)
                .where.not(site: [nil, ""])
                .distinct
                .order(Arel.sql("LOWER(site) ASC"))
                .pluck(:site)
      render json: names
    end

    # PATCH /api/tasks/:id/reorder
    def reorder
      after_id = params[:after_id].presence

      if after_id
        sib = current_user.tasks.find_by(id: after_id)
        if sib && sib.parent_id != @task.parent_id
          return render json: { errors: ["親をまたぐ移動は不可です"] }, status: :unprocessable_entity
        end
      end

      reorder_within_parent!(@task, after_id)
      head :no_content
    rescue ActiveRecord::RecordNotFound
      render json: { errors: ["Task not found"] }, status: :not_found
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: [e.message] }, status: :unprocessable_entity
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
      @task = current_user.tasks.with_attached_image.find_by(id: params[:id])
      render(json: { errors: ["Task not found"] }, status: :not_found) and return unless @task
    end

    # 旧/新どちらのクエリも受ける互換版（未指定は nil のまま）
    def filter_params
      cast_bool = ->(v) { ActiveModel::Type::Boolean.new.cast(v) }
      parents_only_specified = params.key?(:parents_only) || params.key?(:only_parent)

      {
        site:          params[:site],
        status:        (params[:status].is_a?(String) ? params[:status].split(",") : Array(params[:status])).presence,
        progress_min:  (params[:progress_min].presence || params[:min].presence),
        progress_max:  (params[:progress_max].presence || params[:max].presence),
        order_by:      (params[:order_by].presence   || params[:sort].presence),
        dir:           (params[:dir].presence        || params[:order].presence),
        parents_only:  (parents_only_specified ? cast_bool.call(params[:parents_only].presence || params[:only_parent].presence) : nil)
      }
    end

    # JSON ラッパー/生 JSON/フォームをすべて許容する堅牢な取り出し
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

    # 同一 parent 内で position を付け替える
    def reorder_within_parent!(task, after_id_param)
      after_id = after_id_param.present? ? after_id_param.to_i : nil

      Task.transaction do
        target_pos =
          if after_id.nil?
            1
          else
            sib = current_user.tasks.find(after_id)
            raise ActiveRecord::RecordInvalid, "Cannot move across parents" if sib.parent_id != task.parent_id
            (sib.position || 0) + 1
          end

        scope = current_user.tasks.where(parent_id: task.parent_id).order(:position).lock

        removed_pos = task.position
        scope.where("position > ?", removed_pos).update_all("position = position - 1")

        scope.reload.where("position >= ?", target_pos).update_all("position = position + 1")

        task.update!(position: target_pos)

        pos = 1
        scope.reload.each do |t|
          t.update_columns(position: pos) unless t.position == pos
          pos += 1
        end
      end
    end
  end
end
