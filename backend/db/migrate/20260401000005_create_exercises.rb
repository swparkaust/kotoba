class CreateExercises < ActiveRecord::Migration[7.2]
  def change
    create_table :exercises do |t|
      t.references :lesson, null: false, foreign_key: true
      t.string :exercise_type, null: false
      t.integer :position, null: false
      t.jsonb :content, null: false
      t.string :difficulty, null: false, default: "normal"
      t.string :qa_status, null: false, default: "pending"
      t.text :qa_notes
      t.timestamps
    end
    add_index :exercises, [:lesson_id, :position]
  end
end
