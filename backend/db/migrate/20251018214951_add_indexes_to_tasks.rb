class AddIndexesToTasks < ActiveRecord::Migration[8.0]
  def change
    # user_id で絞り込むクエリが多いため
    add_index :tasks, :user_id unless index_exists?(:tasks, :user_id)

    # 階層構造のクエリで parent_id を頻繁に使用
    add_index :tasks, :parent_id unless index_exists?(:tasks, :parent_id)

    # 並び替えで使用（parent_id と組み合わせて兄弟の順序を取得）
    add_index :tasks, [:parent_id, :position] unless index_exists?(:tasks, [:parent_id, :position])

    # deadline での並び替えとフィルタリング
    add_index :tasks, :deadline unless index_exists?(:tasks, :deadline)

    # 複合インデックス: user_id + status でのフィルタリング
    add_index :tasks, [:user_id, :status] unless index_exists?(:tasks, [:user_id, :status])
  end
end
