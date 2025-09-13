# db/migrate/20250829_add_position_to_tasks.rb
class AddPositionToTasks < ActiveRecord::Migration[8.0]
  def up
    # 途中で落ちても再実行できるように idempotent に
    add_column :tasks, :position, :integer unless column_exists?(:tasks, :position)
    add_index  :tasks, %i[user_id parent_id position] unless index_exists?(:tasks, %i[user_id parent_id position])

    adapter = ActiveRecord::Base.connection.adapter_name

    case adapter
    when "Mysql2"
      # MySQL は UPDATE ... FROM がないので JOIN で書く
      execute <<~SQL
        UPDATE tasks
        JOIN (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY user_id, parent_id ORDER BY created_at ASC) AS rn
          FROM tasks
        ) AS ranked
        ON tasks.id = ranked.id
        SET tasks.position = ranked.rn;
      SQL
    else # PostgreSQL など
      execute <<~SQL
        WITH ranked AS (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY user_id, parent_id ORDER BY created_at ASC) AS rn
          FROM tasks
        )
        UPDATE tasks
           SET position = ranked.rn
          FROM ranked
         WHERE tasks.id = ranked.id;
      SQL
    end
  end

  def down
    remove_index  :tasks, %i[user_id parent_id position] if index_exists?(:tasks, %i[user_id parent_id position])
    remove_column :tasks, :position if column_exists?(:tasks, :position)
  end
end
