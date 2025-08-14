class Task < ApplicationRecord
  # アソシエーション(関連付け)
  belongs_to :user 

  # 自己結合アソシエーション
  belongs_to :parent, class_name: "Task", optional:true
  has_many :children, class_name: "Task", foreign_key: "parent_id", dependent: :destroy

  # 進捗ステータス(0:未着手, 1:進行中, 2:完了)
  enum :status, { not_started: 0, in_progress: 1, completed: 2 }


  # バリデーション
  validates :title, presence: true
  validates :status, presence: true
  validate :depth_limit

  # 新規作成時のみ、保存前に自動でdepthを計算
  before_validation :set_depth, on: :create
  after_update :update_parent_progress_if_needed

  scope :priority_order, -> {
    where.not(status: :completed)
      .order(Arel.sql("CASE WHEN deadline IS NULL THEN 1 ELSE 0 END"), :deadline, :progress)
      .limit(5)
  }

    # 階層ツリーをJSON化（子を再帰）
    def as_tree
      {
        id: id,
        title: title,
        status: status,
        progress: progress,
        depth: depth,
        deadline: deadline,
        description: description,
        children: children.map(&:as_tree)
      }
    end

  # 親の進捗を子の状態から再計算して反映（再帰で祖先まで）
  def update_parent_progress
    return unless parent

    total = parent.children.count
    return if total.zero?

    progress_sum = parent.children.sum do |child|
      case child.status
      when "completed" then 100
      when "in_progress" then 50
      else 0
      end
    end

    parent.update!(progress: (progress_sum.to_f / total).round(1))
    parent.update_parent_progress if parent.parent.present?
  end

  private

  def set_depth
    self.depth = parent.present? ? parent.depth + 1 : 1
  end

  def depth_limit
    if depth.present? && depth > 4
      errors.add(:depth, "は4階層までしか作成できません")
    end
  end

  def update_parent_progress_if_needed
    if saved_change_to_status? || saved_change_to_parent_id?
      parent&.update_parent_progress
    end
  end

end