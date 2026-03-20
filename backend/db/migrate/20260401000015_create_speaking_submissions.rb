class CreateSpeakingSubmissions < ActiveRecord::Migration[7.2]
  def change
    create_table :speaking_submissions do |t|
      t.references :learner, null: false, foreign_key: true
      t.references :exercise, null: false, foreign_key: true
      t.text :transcription, null: false
      t.text :target_text, null: false
      t.jsonb :evaluation, null: false, default: {}
      t.integer :accuracy_score
      t.timestamps
    end
  end
end
