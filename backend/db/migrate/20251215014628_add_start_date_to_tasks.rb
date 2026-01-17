class AddStartDateToTasks < ActiveRecord::Migration[8.0]
  def change
    add_column :tasks, :start_date, :date unless column_exists?(:tasks, :start_date)
  end
end
