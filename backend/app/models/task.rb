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
  # 親（= parent_id が nil）のときだけ site 必須
  validates :site, presence: true, if: -> { parent_id.nil? }
  validate :depth_limit

  # 新規作成時のみ、保存前に自動でdepthを計算
  before_validation :set_depth, on: :create

  # 子のprogress変更 / 親付け替え / 削除 を拾う
  after_save    :update_parent_progress_if_needed
  after_destroy :update_parent_progress

  scope :priority_order, -> {
    where.not(status: :completed)
      .order(Arel.sql("CASE WHEN deadline IS NULL THEN 1 ELSE 0 END"), :deadline, :progress)
      .limit(5)
  }

   # ---------- ロールアップ（確定後に実行） ----------
   after_commit :recalc_new_parent, on: [:create, :update]
   after_commit :recalc_old_parent, on: :update, if: -> { saved_change_to_parent_id? }
   after_commit :recalc_parent_on_destroy, on: :destroy
 
   def recalc_new_parent
     parent&.recalc_from_children!
   end
 
   def recalc_old_parent
     old_id = parent_id_before_last_save # Rails 7+ でOK（8も可）
     Task.find_by(id: old_id)&.recalc_from_children! if old_id.present?
   end
 
   def recalc_parent_on_destroy
     Task.find_by(id: parent_id)&.recalc_from_children!
   end
 
   # 親自身を子のprogress平均で更新し、祖先へ伝播
   def recalc_from_children!
     if children.exists?
       avg = children.average(:progress)
       update_columns(progress: (avg ? avg.to_f.round : 0))
     else
       update_columns(progress: 0)
     end
     parent&.recalc_from_children!
   end
   # -----------------------------------------------

    # 階層ツリーをJSON化（子を再帰）
    def as_tree
      {
        id:, title:, status:, progress:, depth:, deadline:, description:, site:,
        children: children.map(&:as_tree)
      }
    end

  # 親のprogressを「子のprogressの平均」で更新（再帰）
  def update_parent_progress
    return unless parent

    if parent.children.exists?
      avg = parent.children.average(:progress).to_f
      parent.update_column(:progress, avg.round)  # 整数で良ければ .round(0)
    else
      parent.update_column(:progress, 0)
    end

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

  # progress/parent_id/status の変更で発火
  #    親付け替え時は旧親も再計算
  def update_parent_progress_if_needed
    if saved_change_to_progress? || saved_change_to_parent_id? || saved_change_to_status?
      if saved_change_to_parent_id?
        old_parent_id, _new_parent_id = saved_change_to_parent_id
        Task.find_by(id: old_parent_id)&.update_parent_progress if old_parent_id.present?
      end
      parent&.update_parent_progress
    end
  end
end

  # ===== 絞り込み・並び替え =====
  scope :for_user, ->(user) { where(user_id: user.id) } # 認証前提なら

  scope :by_site, ->(site) {
    site.present? ? where(site: site) : all
  }

  # status は "not_started"/"in_progress"/"completed" か、0/1/2 のどちらでも受け付ける
  scope :by_status, ->(statuses) {
    return all if statuses.blank?
    names = Array(statuses).map(&:to_s)
    normalized = names.map { |s|
      if statuses().key?(s)           # enum名
        s
      elsif Integer(s, exception: false).is_a?(Integer) && statuses().invert.key?(s.to_i) # 数値
        statuses().invert[s.to_i]
      end
    }.compact.uniq
    normalized.present? ? where(status: normalized) : none
  }

  scope :by_progress_min, ->(min) {
    min.present? ? where('progress >= ?', min.to_i) : all
  }

  scope :by_progress_max, ->(max) {
    max.present? ? where('progress <= ?', max.to_i) : all
  }

  # 親だけ表示（親=site必須、子はsite任意なので親ビュー用に便利）
  scope :root_only, ->(flag) {
    flag.to_s == '1' ? where(parent_id: nil) : all
  }

  # 並び替えはホワイトリストで防御
  ORDERABLE_COLUMNS = {
    "deadline"   => :deadline,
    "progress"   => :progress,
    "created_at" => :created_at
  }.freeze

  scope :order_by_param, ->(order_by, dir = 'asc') {
    column = ORDERABLE_COLUMNS[order_by.to_s] || :deadline
    direction = %w[asc desc].include?(dir.to_s) ? dir : 'asc'
    order(column => direction)
  }

  def self.filter_sort(p, user:)
    for_user(user)
      .root_only(p[:parents_only])
      .by_site(p[:site])
      .by_status(p[:status])
      .by_progress_min(p[:progress_min])
      .by_progress_max(p[:progress_max])
      .order_by_param(p[:order_by], p[:dir])
  end
end
