# app/controllers/api/task_images_controller.rb
module Api
    class TaskImagesController < Api::BaseController
      before_action :set_task
  
      # POST /api/tasks/:id/image
      def create
        file = params[:image]
        return render(json: { errors: ["画像ファイルを指定してください"] }, status: :bad_request) unless file.respond_to?(:tempfile)
  
        # 上位のみ許可
        unless @task.parent_id.nil?
          return render(json: { errors: ["上位タスクにのみ画像を添付できます"] }, status: :unprocessable_entity)
        end
  
        # サイズ上限 5MB
        if file.size.to_i > 5.megabytes
          return render(json: { errors: ["ファイルサイズは5MB以下にしてください"] }, status: :unprocessable_entity)
        end
  
        # コンテンツタイプ厳格判定
        content_type = Marcel::MimeType.for(file.tempfile, name: file.original_filename)
        allowed = %w[image/jpeg image/png image/webp image/gif]
        unless allowed.include?(content_type)
          return render(json: { errors: ["無効なファイル形式（許可: jpeg/png/webp/gif）"] }, status: :unprocessable_entity)
        end
  
        # 置換（has_one_attached のため同名 attach で入れ替わる）
        @task.image.attach(
          io: file.tempfile.open,
          filename: file.original_filename,
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
        render(json: { errors: ["Task not found"] }, status: :not_found) and return unless @task
      end
  
      def image_payload(task)
        return { image_url: nil, image_thumb_url: nil } unless task.image.attached?
        {
          image_url: url_for(task.image),
          image_thumb_url: url_for(task.image.variant(resize_to_fill: [200, 200]).processed)
        }
      end
    end
  end
  