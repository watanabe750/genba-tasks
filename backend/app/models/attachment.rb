class Attachment < ApplicationRecord
  belongs_to :task
  has_one_attached :file

  validates :file_type, presence: true, inclusion: { in: %w[photo document] }
  validates :file, presence: true
  validate :file_size_validation

  scope :photos, -> { where(file_type: 'photo') }
  scope :documents, -> { where(file_type: 'document') }
  scope :ordered, -> { order(:display_order, :created_at) }

  def image?
    file.attached? && file.content_type.start_with?('image/')
  end

  def pdf?
    file.attached? && file.content_type == 'application/pdf'
  end

  private

  def file_size_validation
    if file.attached? && file.blob.byte_size > 10.megabytes
      errors.add(:file, 'は10MB以下にしてください')
    end
  end
end
