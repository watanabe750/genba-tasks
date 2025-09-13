# db/migrate/20250726182426_add_parent_id_and_depth_and_progress_to_tasks.rb
class AddParentIdAndDepthAndProgressToTasks < ActiveRecord::Migration[8.0]
  def change
    # 親系は触らない！！（add_column / change_column / add_index / add_foreign_key すべて削除）

    add_column :tasks, :depth,    :integer, default: 1,   null: false unless column_exists?(:tasks, :depth)
    add_column :tasks, :progress, :float,   default: 0.0, null: false unless column_exists?(:tasks, :progress)
  end
end
