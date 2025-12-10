# app/controllers/api/tasks_controller.rb
module Api
  class TasksController < Api::BaseController
    before_action :set_task, only: %i[show update destroy reorder]
    before_action :_debug_params, only: %i[create update reorder], if: -> { ENV["E2E_DEBUG_PARAMS"] == "1" }

    SELECT_FIELDS = %i[id title status progress deadline parent_id depth description site].freeze

    # GET /api/tasks
    def index
      raw_filters  = filter_params
      allowed_keys = %i[site status progress_min progress_max order_by dir parents_only search]
      filters      = raw_filters.slice(*allowed_keys).compact

      Rails.logger.info("[Tasks#index] filters(normalized)=#{filters.inspect}")

      # ------- ベーススコープ（必ず成功させる） -------
      scope =
        if Task.respond_to?(:filter_sort)
          begin
            Task.filter_sort(**filters, user: current_user)
          rescue ArgumentError => e
            Rails.logger.warn("[Tasks#index] filter_sort kwarg failed, fallback to hash: #{e.message}")
            Task.filter_sort(filters, user: current_user)
          rescue => e
            Rails.logger.warn("[Tasks#index] filter_sort failed, fallback to current_user.tasks: #{e.message}")
            current_user.tasks
          end
        else
          current_user.tasks
        end

      # ------- 並び順最終調整 -------
      allowed_order = %w[position deadline progress created_at title site]
      ob  = allowed_order.include?(filters[:order_by].to_s) ? filters[:order_by].to_s : "deadline"
      dir = %w[asc desc ASC DESC].include?(filters[:dir].to_s) ? filters[:dir].to_s.upcase : "ASC"
      adapter = ActiveRecord::Base.connection.adapter_name.to_s

      # ---- 手動順（DnD）のときだけ position を主キーにする ----
      if ob == "position"
        parts =
          if adapter =~ /postgre/i
            [
              "(CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC", # 親→子
              "parent_id ASC",                                       # 親で固める
              "position #{dir} NULLS LAST",                          # 親内の手動順
              "id ASC"
            ]
          else
            [
              "(CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC",
              "parent_id ASC",
              "CASE WHEN position IS NULL THEN 1 ELSE 0 END ASC",
              "position #{dir}",
              "id ASC"
            ]
          end
        scope = scope.reorder(Arel.sql(parts.join(", ")))
        return render json: scope.with_attached_image.as_json(only: SELECT_FIELDS, methods: [:image_url])
      end

      # ---- site 指定：親→position を優先しつつ site をキーに ----
if ob == "site"
  sql =
    if adapter =~ /postgre/i
      <<~SQL.squish
        (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC,
        parent_id ASC,
        LOWER(site) #{dir} NULLS LAST,
        position ASC,
        CASE WHEN deadline IS NULL THEN NULL ELSE deadline END ASC,
        id ASC
      SQL
    else
      <<~SQL.squish
        (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC,
        parent_id ASC,
        CASE WHEN LOWER(site) IS NULL THEN 1 ELSE 0 END ASC, LOWER(site) #{dir},
        position ASC,
        deadline ASC,
        id ASC
      SQL
    end
  scope = scope.reorder(Arel.sql(sql))
  return render json: scope.with_attached_image.as_json(only: SELECT_FIELDS, methods: [:image_url])
end


# ---- それ以外（deadline/progress/created_at/title） ----
primary =
  case ob
  when "progress"   then "progress"
  when "created_at" then "created_at"
  when "title"      then "LOWER(title)"
  else                    "deadline"
  end

parts =
  if adapter =~ /postgre/i
    [
      "(CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC",
      "parent_id ASC",
      "#{primary} #{dir} NULLS LAST",   # ← primary を先に
      "position ASC",                    # ← position はタイブレーク用に後ろ
      "id ASC"
    ]
  else
    [
      "(CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC",
      "parent_id ASC",
      "CASE WHEN #{primary} IS NULL THEN 1 ELSE 0 END ASC",
      "#{primary} #{dir}",               # ← primary を先に
      "position ASC",                    # ← position は後ろ
      "id ASC"
    ]
  end

scope = scope.reorder(Arel.sql(parts.join(", ")))

render json: scope.with_attached_image.as_json(only: SELECT_FIELDS, methods: [:image_url])

    rescue => e
      Rails.logger.error("[Tasks#index] fatal -> soft-fallback: #{e.class}: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}")
      safe = current_user.tasks.order(Arel.sql("(CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC, parent_id ASC, position ASC, id ASC"))
      render json: safe.with_attached_image.as_json(only: SELECT_FIELDS, methods: [:image_url])
    end

    # GET /api/tasks/priority
    def priority
      limit = (params[:limit] || 5).to_i
      limit = [[limit, 1].max, 50].min # 1-50の範囲に制限
      tasks = current_user.tasks.priority_order(limit: limit)
      render json: tasks.as_json(only: SELECT_FIELDS)
    end

    # GET /api/tasks/:id
    def show
      t = @task
      img_urls = { image_url: t.image_url, image_thumb_url: nil }

      kids = current_user.tasks
               .where(parent_id: t.id)
               .select(:id, :title, :status, :progress, :deadline, :parent_id)
               .order(Arel.sql("position ASC, CASE WHEN deadline IS NULL THEN 1 ELSE 0 END ASC, deadline ASC, id ASC"))
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
        description: t.description,
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
      if attrs.key?(:parent_id) && attrs[:parent_id] != @task.parent_id
        render json: { errors: ["親をまたぐ移動は不可です"] }, status: :unprocessable_entity and return
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

    # 旧/新どちらのクエリも受ける互換版
    def filter_params
      cast_bool = ->(v) { ActiveModel::Type::Boolean.new.cast(v) }
      parents_only_specified = params.key?(:parents_only) || params.key?(:only_parent)

      {
        site:         params[:site],
        status:       (params[:status].is_a?(String) ? params[:status].split(",") : Array(params[:status])).presence,
        progress_min: (params[:progress_min].presence || params[:min].presence),
        progress_max: (params[:progress_max].presence || params[:max].presence),
        order_by:     (params[:order_by].presence   || params[:sort].presence),
        dir:          (params[:dir].presence        || params[:order].presence),
        parents_only: (parents_only_specified ? cast_bool.call(params[:parents_only].presence || params[:only_parent].presence) : nil),
        search:       params[:search].presence
      }
    end

    # JSON / 生 JSON / フォームを許容
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
