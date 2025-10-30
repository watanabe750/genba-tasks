# frozen_string_literal: true

# タスクの進捗計算を一元管理するサービス
# 重複していた進捗計算ロジックをここに集約
class TaskProgressService
  # 子タスクから親の進捗を計算
  # @param task [Task] 進捗を計算する親タスク
  # @return [Integer] 計算された進捗（0-100）
  def self.calculate_from_children(task)
    return 0 unless task.children.exists?

    task.children.average(:progress).to_f.round
  end

  # 全ての子タスクが完了しているかチェック
  # @param task [Task] チェックする親タスク
  # @return [Boolean] 全子が完了ならtrue
  def self.all_children_completed?(task)
    return false unless task.children.exists?

    !task.children.where.not(status: :completed).exists?
  end

  # 親タスクの進捗とステータスを子から再計算し、祖先へ伝播
  # @param task [Task] 再計算する親タスク
  # @param visited_ids [Array<Integer>] 循環参照防止用の訪問済みID（内部使用）
  # @return [void]
  def self.recalculate_with_propagation!(task, visited_ids: [])
    # 循環参照チェック（無限ループ防止）
    return if visited_ids.include?(task.id)
    # 深さ制限（安全装置: 通常は4階層まで）
    return if visited_ids.size > 10

    new_visited_ids = visited_ids + [task.id]

    if task.children.exists?
      # 子がいる場合: 進捗を平均値で更新
      new_progress = calculate_from_children(task)
      all_done = all_children_completed?(task)

      updates = { progress: new_progress }

      # ステータスの自動更新
      if all_done
        # 全子完了 → 親も完了
        updates[:status] = :completed unless task.status == "completed"
      else
        # 未完了の子がある → 親は進行中
        updates[:status] = :in_progress if task.status == "completed"
      end

      task.update_columns(updates) unless updates.empty?
    else
      # 子がいない場合: progressを0に（ステータスはユーザー操作優先）
      task.update_columns(progress: 0) if (task.progress || 0) != 0
    end

    # 祖先へ再帰的に伝播
    task.parent&.then do |parent_task|
      recalculate_with_propagation!(parent_task, visited_ids: new_visited_ids)
    end
  end
end
