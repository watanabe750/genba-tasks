class CreateAttachments < ActiveRecord::Migration[8.0]
  def change
    create_table :attachments do |t|
      t.references :task, null: false, foreign_key: true
      t.string :file_type, null: false
      t.string :title
      t.text :description
      t.string :category
      t.integer :display_order, default: 0

      t.timestamps
    end

    add_index :attachments, [:task_id, :display_order]
  end
end
