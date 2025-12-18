# app/controllers/api/attachments_controller.rb
class Api::AttachmentsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_task
  before_action :set_attachment, only: [:show, :destroy]

  def index
    @attachments = @task.attachments.ordered.with_attached_file
    render json: @attachments.map { |a| attachment_json(a) }
  end

  def show
    render json: attachment_json(@attachment)
  end

  def create
    @attachment = @task.attachments.build(attachment_params)

    if @attachment.save
      render json: attachment_json(@attachment), status: :created
    else
      render json: { errors: @attachment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @attachment.destroy
    head :no_content
  end

  private

  def set_task
    @task = current_user.tasks.find(params[:task_id])
  end

  def set_attachment
    @attachment = @task.attachments.find(params[:id])
  end

  def attachment_params
    params.require(:attachment).permit(:file, :file_type, :title, :description, :category, :display_order, :photo_tag, :captured_at, :note)
  end

  def attachment_json(attachment)
    {
      id: attachment.id,
      task_id: attachment.task_id,
      file_type: attachment.file_type,
      title: attachment.title,
      description: attachment.description,
      category: attachment.category,
      display_order: attachment.display_order,
      photo_tag: attachment.photo_tag,
      captured_at: attachment.captured_at,
      note: attachment.note,
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
