class AddParentIdAndDepthAndProgressToTasks < ActiveRecord::Migration[8.0]
  def change
    add_column :tasks, :parent_id, :integer
    add_column :tasks, :depth, :integer, default: 1, null: false
    add_column :tasks, :progress, :float, default: 0.0, null:false # 進捗管理

    add_index :tasks, :parent_id
    add_foreign_key :tasks, :tasks, column: :parent_id  # 自己結合
  end
end
