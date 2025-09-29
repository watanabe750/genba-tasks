# frozen_string_literal: true
class BackfillTaskPositions < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def up
    adapter = ActiveRecord::Base.connection.adapter_name.to_s.downcase

    say_with_time "backfilling tasks.position per (user_id, parent_id)" do
      if adapter.include?("mysql")
        # MySQL: NULLS FIRST が無いので (col IS NULL), col で制御
        sql = <<~SQL.squish
          WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                     PARTITION BY user_id, parent_id
                     ORDER BY (position IS NULL) ASC, position ASC,
                              (deadline IS NULL) ASC, deadline ASC, id ASC
                   ) AS rn
            FROM tasks
          )
          UPDATE tasks
          JOIN ranked ON tasks.id = ranked.id
             SET tasks.position = ranked.rn
        SQL
      else
        # PostgreSQL
        sql = <<~SQL.squish
          WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                     PARTITION BY user_id, parent_id
                     ORDER BY position NULLS FIRST, deadline NULLS FIRST, id
                   ) AS rn
            FROM tasks
          )
          UPDATE tasks
             SET position = ranked.rn
            FROM ranked
           WHERE tasks.id = ranked.id
        SQL
      end

      ActiveRecord::Base.connection.execute(sql)
    end

    # インデックス（PGのみ concurrently）
    if adapter.include?("postgres")
      add_index :tasks, [:user_id, :parent_id, :position],
                algorithm: :concurrently,
                name: "index_tasks_on_user_parent_position" unless index_exists?(:tasks, [:user_id, :parent_id, :position], name: "index_tasks_on_user_parent_position")
    else
      add_index :tasks, [:user_id, :parent_id, :position],
                name: "index_tasks_on_user_parent_position" unless index_exists?(:tasks, [:user_id, :parent_id, :position], name: "index_tasks_on_user_parent_position")
    end
  end

  def down
    remove_index :tasks, name: "index_tasks_on_user_parent_position" if index_exists?(:tasks, name: "index_tasks_on_user_parent_position")
  end
end
