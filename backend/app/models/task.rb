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

  # 新規作成時のみ、保存前に自動でdepthを計算
  before_validation :set_depth, on: :create
  after_update :update_parent_progress

  def update_parent_progress
    return unless parent # 親タスクが存在しない(最上位タスクの場合は何もしない)

    total = parent.children.count # 親タスクが持つ「子タスクの総数」を取得
    return if total.zero? # 子タスクが0件なら計算不要なので終了

    # 子タスクを全て走査して、進捗率を数値化して合計
    progress_sum = parent.children.sum do |child|
      case child.status
      when "completed" then 100 # 完了100%
      when "in_progress" then 50 # 進捗中50%
      else 0 # 未着手0%
      end
    end
    
    # 子タスクの平均進捗率を計算して親タスクのprogressカラムに保存
    parent.update!(progress: (progress_sum.to_f / total).round(1)) 
      # to_f → 少数計算用、 round(1) → 少数第１位まで丸める

    # 親タスクがさらに上位タスクの場合、再帰的に更新
    parent.update_parent_progress if parent.parent.present?
  end

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