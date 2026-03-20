class CreateWritingSubmissions < ActiveRecord::Migration[7.2]
  def change
    create_table :writing_submissions do |t|
      t.references :learner, null: false, foreign_key: true
      t.references :exercise, null: false, foreign_key: true
      t.text :submitted_text, null: false
      t.jsonb :evaluation, null: false, default: {}
      t.integer :score
      t.timestamps
    end
  end
end
