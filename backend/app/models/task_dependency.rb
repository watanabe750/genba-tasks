# frozen_string_literal: true

# TaskDependency - タスク間の依存関係を表すモデル
# predecessor（先行タスク）が完了してから successor（後続タスク）を開始できる
class TaskDependency < ApplicationRecord
  belongs_to :predecessor, class_name: "Task"
  belongs_to :successor, class_name: "Task"

  validates :predecessor_id, presence: true
  validates :successor_id, presence: true
  validates :successor_id, uniqueness: { scope: :predecessor_id, message: "との依存関係はすでに存在します" }

  validate :cannot_depend_on_self
  validate :cannot_create_cycle

  private

  # 自分自身への依存を防ぐ
  def cannot_depend_on_self
    if predecessor_id == successor_id
      errors.add(:base, "タスクは自分自身に依存できません")
    end
  end

  # 循環依存を防ぐ（A→B→C→Aのようなループ）
  def cannot_create_cycle
    return if predecessor_id.blank? || successor_id.blank?
    return if !new_record? && !will_save_change_to_predecessor_id? && !will_save_change_to_successor_id?

    # predecessor から successor への経路がすでに存在するかチェック
    if path_exists?(successor_id, predecessor_id)
      errors.add(:base, "循環依存が発生します")
    end
  end

  # タスクAからタスクBへの経路が存在するか（BFS）
  def path_exists?(from_id, to_id, visited = Set.new)
    return false if from_id == to_id && visited.any?
    return true if from_id == to_id

    visited.add(from_id)

    # from_id を predecessor とする依存関係を取得
    next_ids = TaskDependency
               .where(predecessor_id: from_id)
               .where.not(successor_id: visited.to_a)
               .pluck(:successor_id)

    next_ids.any? { |next_id| path_exists?(next_id, to_id, visited) }
  end
end
