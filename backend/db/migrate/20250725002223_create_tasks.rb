# db/migrate/20250725002223_create_tasks.rb
class CreateTasks < ActiveRecord::Migration[8.0]
  def change
    create_table :tasks do |t|
      t.string   :title
      t.text     :description
      t.integer  :status, default: 0, null: false
      t.datetime :deadline

      # 参照は必ず bigint 明示
      t.references :user,   null: false, foreign_key: true,           type: :bigint
      t.references :parent, null: true,  foreign_key: { to_table: :tasks }, type: :bigint

      t.timestamps
    end
  end
end
