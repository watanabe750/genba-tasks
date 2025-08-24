class AddDefaultsToTasks < ActiveRecord::Migration[8.0]
  def up
    execute "UPDATE tasks SET status = 0 WHERE status IS NULL"
    execute "UPDATE tasks SET progress = 0 WHERE progress IS NULL"

    change_column_default :tasks, :status, 0
    change_column_null :tasks, :status, false

    change_column_default :tasks, :progress, 0
    # 任意: progress も NOT NULL にしたいなら次を有効化
    # change_column_null    :tasks, :progress, false
  end

  def down
    change_column_null    :tasks, :status, true
    change_column_default :tasks, :status, nil
    change_column_default :tasks, :progress, nil
    # up で progress に NOT NULL を付けた場合はここで外す
    # change_column_null    :tasks, :progress, true
  end
end