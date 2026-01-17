class CreateTaskDependencies < ActiveRecord::Migration[8.0]
  def change
    create_table :task_dependencies do |t|
      t.bigint :predecessor_id, null: false
      t.bigint :successor_id, null: false

      t.timestamps
    end

    add_index :task_dependencies, :predecessor_id
    add_index :task_dependencies, :successor_id
    add_index :task_dependencies, [:predecessor_id, :successor_id], unique: true, name: 'index_task_deps_on_pred_and_succ'

    add_foreign_key :task_dependencies, :tasks, column: :predecessor_id
    add_foreign_key :task_dependencies, :tasks, column: :successor_id
  end
end
