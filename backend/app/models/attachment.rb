class Attachment < ApplicationRecord
  belongs_to :task
  has_one_attached :file

  PHOTO_TAGS = %w[before during after other].freeze

  validates :file_type, presence: true, inclusion: { in: %w[photo document] }
  validates :file, presence: true
  validates :photo_tag, inclusion: { in: PHOTO_TAGS }, allow_nil: true
  validate :file_size_validation

  scope :photos, -> { where(file_type: 'photo') }
  scope :documents, -> { where(file_type: 'document') }
  scope :ordered, -> { order(:display_order, :created_at) }
  scope :by_photo_tag, ->(tag) { where(photo_tag: tag) }
  scope :tagged_photos, -> { photos.where.not(photo_tag: nil) }

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
