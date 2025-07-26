class Task < ApplicationRecord

  # アソシエーション(関連付け)
  belongs_to :user 

  # 自己結合アソシエーション
  belongs_to :parent, class_name: "Task", optional:true
  has_many :children, class_name: "Task", foreign_key: "parent_id", dependent: :destroy

  # 進捗ステータス(0:未着手, 1:進行中, 2:完了)
  enum :status, { not_started: 0, in_progress: 1, completed: 2 }, prefix: true

  # バリデーション
  validates :title, presence: true
  validates :status, presence: true
  validate :depth_limit

  # 新規作成時のみ、保村前に自動でdepthを計算
  before_validation :set_depth, on: :create

  private

  # 子タスク作成時にdepthを自動設定
  def set_depth
    self.depth = parent.present? ? parent.depth + 1 : 1
  end

  # 4階層までに制限
  def depth_limit
    if depth.present? && depth > 4
      errors.add(:depth, "は4回送までしか作成できません")
    end
  end
end
