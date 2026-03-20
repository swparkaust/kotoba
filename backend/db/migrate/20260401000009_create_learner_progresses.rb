class CreateLearnerProgresses < ActiveRecord::Migration[7.2]
  def change
    create_table :learner_progresses do |t|
      t.references :learner, null: false, foreign_key: true
      t.references :lesson, null: false, foreign_key: true
      t.string :status, null: false, default: "locked"
      t.integer :score
      t.integer :attempts_count, null: false, default: 0
      t.datetime :completed_at
      t.jsonb :exercise_results, null: false, default: []
      t.timestamps
    end
    add_index :learner_progresses, [:learner_id, :lesson_id], unique: true
  end
end
