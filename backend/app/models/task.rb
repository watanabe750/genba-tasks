class Task < ApplicationRecord
  # アソシエーション
  belongs_to :user
  belongs_to :parent, class_name: "Task", optional: true
  has_many   :children, class_name: "Task", foreign_key: "parent_id", dependent: :destroy

  # ステータス
  enum :status, { not_started: 0, in_progress: 1, completed: 2 }

  # バリデーション
  validates :title, presence: true
  validates :status, presence: true
  validates :site,   presence: true, if: -> { parent_id.nil? } # 親のみsite必須
  validate  :depth_limit

  # depthは作成時に自動計算
  before_validation :set_depth, on: :create

  # 子のprogress変更 / 親付け替え / 削除 を拾う
  after_save    :update_parent_progress_if_needed
  after_destroy :update_parent_progress

  # ---------- ロールアップ（確定後に実行） ----------
  after_commit :recalc_new_parent,        on: [:create, :update]
  after_commit :recalc_old_parent,        on: :update, if: -> { saved_change_to_parent_id? }
  after_commit :recalc_parent_on_destroy, on: :destroy

  def recalc_new_parent
    parent&.recalc_from_children!
  end

  def recalc_old_parent
    old_id = parent_id_before_last_save
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

  # 優先タスク（未完了/期限→進捗）
  scope :priority_order, -> {
    where.not(status: :completed)
      .order(Arel.sql("CASE WHEN deadline IS NULL THEN 1 ELSE 0 END ASC"))
      .order(:deadline, :progress)
      .limit(5)
  }

  # ===== 絞り込み・並び替え =====
  scope :for_user, ->(user) { where(user_id: user.id) }

  scope :by_site, ->(site) {
    site.present? ? where(site: site) : all
  }

  # "not_started"/"in_progress"/"completed" または "0/1/2" を受け付ける
  scope :by_status, ->(statuses_param) {
    vals = Array(statuses_param).map(&:to_s)
    next all if vals.blank?

    normalized = vals.map { |s|
      if statuses.key?(s) # enum名
        s
      elsif (i = Integer(s, exception: false)).is_a?(Integer) && statuses.invert.key?(i) # 数値
        statuses.invert[i]
      end
    }.compact.uniq
    normalized.present? ? where(status: normalized) : none
  }

  scope :by_progress_min, ->(min) {
    min.present? ? where("COALESCE(progress,0) >= ?", min.to_i) : all
  }

  scope :by_progress_max, ->(max) {
    max.present? ? where("COALESCE(progress,0) <= ?", max.to_i) : all
  }

  # 親だけ表示（親=site必須、子はsite任意）
  scope :parents_only, ->(flag) {
    flag.to_s == "1" ? where(parent_id: nil) : all
  }

  ORDERABLE_COLUMNS = %w[deadline progress created_at].freeze

  # エントリポイント
  def self.filter_sort(p, user:)
    rel = for_user(user)
            .parents_only(p[:parents_only])
            .by_site(p[:site])
            .by_status(p[:status])
            .by_progress_min(p[:progress_min])
            .by_progress_max(p[:progress_max])

    order_by = ORDERABLE_COLUMNS.include?(p[:order_by].to_s) ? p[:order_by].to_s : "deadline"
    dir      = %w[asc desc].include?(p[:dir].to_s.downcase) ? p[:dir].to_s.upcase : "ASC"

    case order_by
    when "deadline"
      # NULLS LAST 相当（SQLiteでも効く）
      rel.order(Arel.sql("CASE WHEN deadline IS NULL THEN 1 ELSE 0 END ASC"))
         .order("deadline #{dir}")
    when "progress"
      rel.order(Arel.sql("COALESCE(progress,0) #{dir}"))
    else
      rel.order("created_at #{dir}")
    end
  end

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
      parent.update_column(:progress, avg.round)
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

  # progress/parent_id/status の変更で発火（親付け替え時は旧親も再計算）
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
