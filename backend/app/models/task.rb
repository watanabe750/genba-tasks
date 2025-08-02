class Task < ApplicationRecord
  belongs_to :user

  belongs_to :parent, class_name: 'Task', optional: true
  has_many :children, class_name: 'Task', foreign_key: 'parent_id', dependent: :destroy

  # 進捗ステータス(0:未着手, 1:進行中, 2:完了)
  enum :status, { not_started: 0, in_progress: 1, completed: 2 }, prefix: true

  validates :title, presence: true
  validates :status, presence: true

  after_update :update_progress_if_needed

  def update_parent_progress
    return unless children.exists?
  
    completed_count = children.status_completed.count
    total_count = children.count
    new_progress = (completed_count.to_f / total_count * 100).round(1)
  
    update!(progress: new_progress)
  end
  

  private

  def update_progress_if_needed
    if saved_change_to_status? || saved_change_to_parent_id?
      parent&.update_parent_progress
    end
  end
end