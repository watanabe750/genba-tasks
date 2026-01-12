# app/controllers/api/task_images_controller.rb
module Api
    class TaskImagesController < Api::BaseController
      before_action :set_task
  
      # POST /api/tasks/:id/image
      def create
        file = params[:image] || params[:file] || params.dig(:task, :image)
      return render(json: { errors: ["画像ファイルが選択されていません。ファイルを選択してもう一度お試しください。"] }, status: :bad_request) if file.nil?

      # Tempfile実体の取り出し（複数型に対応）
      tempfile =
        if file.respond_to?(:tempfile) then file.tempfile
        elsif file.is_a?(Tempfile)    then file
        elsif file.respond_to?(:path) && File.exist?(file.path) then file
        else nil
        end
      return render(json: { errors: ["画像ファイルが正しく読み込めませんでした。もう一度お試しください。"] }, status: :bad_request) if tempfile.nil?
  
        # 上位のみ許可
        unless @task.parent_id.nil?
          return render(json: { errors: ["画像は親タスクにのみ添付できます。子タスクには画像を添付できません。"] }, status: :unprocessable_entity)
        end
  
        # サイズ上限 5MB
        if file.size.to_i > 5.megabytes
          file_size_mb = (file.size.to_f / 1.megabyte).round(2)
          return render(json: { errors: ["ファイルサイズが大きすぎます（現在: #{file_size_mb}MB）。5MB以下のファイルをお選びください。"] }, status: :unprocessable_entity)
        end
  
        # コンテンツタイプ厳格判定
        orig_name = (file.respond_to?(:original_filename) && file.original_filename.present?) ? file.original_filename : "upload"
        content_type = Marcel::MimeType.for(tempfile, name: orig_name)
        allowed = %w[image/jpeg image/png image/webp image/gif]
        unless allowed.include?(content_type)
          return render(json: { errors: ["対応していないファイル形式です。JPEG、PNG、WebP、GIF形式のファイルをお選びください。"] }, status: :unprocessable_entity)
        end
  
        # 置換（has_one_attached のため同名 attach で入れ替わる）
        @task.image.attach(
            io: tempfile,
            filename: orig_name,
          content_type: content_type
        )
  
        render json: image_payload(@task), status: :ok
      end
  
      # DELETE /api/tasks/:id/image
      def destroy
        @task.image.purge if @task.image.attached?
        render json: { image_url: nil, image_thumb_url: nil }, status: :ok
      end
  
      private
  
      def set_task
        @task = current_user.tasks.find_by(id: params[:id])
        render(json: { errors: ["タスクが見つかりませんでした。ページを更新してもう一度お試しください。"] }, status: :not_found) and return unless @task
      end
  
      def image_payload(task)
        return { image_url: nil, image_thumb_url: nil } unless task.image.attached?
        begin
                    {
                      image_url: url_for(task.image),
                      # 遅延生成（.processed は付けない）
                      image_thumb_url: url_for(task.image.variant(resize_to_fill: [200, 200]))
                    }
                  rescue => e
                    Rails.logger.warn("[TaskImages#image_payload] variant url build failed: #{e.class}: #{e.message}")
                    { image_url: url_for(task.image), image_thumb_url: nil }
                  end
      end
    end
  end
  