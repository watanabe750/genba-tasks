# app/controllers/api/gallery_controller.rb
class Api::GalleryController < ApplicationController
  before_action :authenticate_user!

  # GET /api/gallery
  # 全タスクの写真を一覧取得（フィルタ対応）
  def index
    # ユーザーのタスクIDを取得
    task_ids = current_user.tasks.pluck(:id)

    # 写真一覧を取得
    attachments = Attachment.where(task_id: task_ids)
                            .where(file_type: 'photo')
                            .includes(:task)
                            .order(display_order: :asc, created_at: :desc)

    # 現場フィルタ
    if params[:site].present?
      task_ids_with_site = current_user.tasks.where(site: params[:site]).pluck(:id)
      attachments = attachments.where(task_id: task_ids_with_site)
    end

    # カテゴリフィルタ
    if params[:category].present?
      attachments = attachments.where(category: params[:category])
    end

    # 日付範囲フィルタ
    if params[:date_from].present?
      attachments = attachments.where('attachments.created_at >= ?', params[:date_from])
    end

    if params[:date_to].present?
      attachments = attachments.where('attachments.created_at <= ?', params[:date_to])
    end

    # 全件数を取得
    total_count = attachments.count

    # ページネーション
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 50
    per_page = [per_page, 100].min # 最大100件

    attachments = attachments.limit(per_page).offset((page - 1) * per_page)

    # レスポンス
    render json: {
      attachments: attachments.map { |a| attachment_json(a) },
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count
      }
    }
  end

  private

  def attachment_json(attachment)
    {
      id: attachment.id,
      task_id: attachment.task_id,
      task_title: attachment.task&.title,
      task_site: attachment.task&.site,
      file_type: attachment.file_type,
      title: attachment.title,
      description: attachment.description,
      category: attachment.category,
      display_order: attachment.display_order,
      url: attachment.file.attached? ? url_for(attachment.file) : nil,
      thumbnail_url: attachment.image? && attachment.file.attached? ?
        url_for(attachment.file.variant(resize_to_limit: [400, 400])) : nil,
      content_type: attachment.file.attached? ? attachment.file.content_type : nil,
      size: attachment.file.attached? ? attachment.file.byte_size : nil,
      filename: attachment.file.attached? ? attachment.file.filename.to_s : nil,
      created_at: attachment.created_at
    }
  end
end
