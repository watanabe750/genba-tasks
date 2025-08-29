class AddPositionToTasks < ActiveRecord::Migration[7.1]
    def up
      add_column :tasks, :position, :integer
      add_index  :tasks, [:user_id, :parent_id, :position]
  
      say_with_time "Backfill tasks.position" do
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
  
      change_column_null :tasks, :position, false
    end
  
    def down
      remove_index  :tasks, [:user_id, :parent_id, :position]
      remove_column :tasks, :position
    end
  end