class AddQaRetryCountToLessons < ActiveRecord::Migration[7.2]
  def change
    add_column :lessons, :qa_retry_count, :integer, null: false, default: 0
  end
end
