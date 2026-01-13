class AddPerformanceIndexesToTasks < ActiveRecord::Migration[8.0]
  def change
    # deadline カラムにインデックス追加（優先タスク検索、締め切りソートで使用）
    add_index :tasks, :deadline, if_not_exists: true

    # status カラムにインデックス追加（ステータスフィルタリングで使用）
    add_index :tasks, :status, if_not_exists: true

    # user_id と deadline の複合インデックス（ユーザーごとの締め切り検索で使用）
    add_index :tasks, [:user_id, :deadline], if_not_exists: true

    # site カラムにインデックス追加（現場フィルタリングで使用）
    add_index :tasks, :site, if_not_exists: true
  end
end
