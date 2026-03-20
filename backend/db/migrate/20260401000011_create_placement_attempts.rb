class CreatePlacementAttempts < ActiveRecord::Migration[7.2]
  def change
    create_table :placement_attempts do |t|
      t.references :learner, null: false, foreign_key: true
      t.references :language, null: false, foreign_key: true
      t.integer :recommended_level, null: false
      t.integer :chosen_level
      t.jsonb :responses, null: false, default: []
      t.float :overall_score, null: false
      t.timestamps
    end
  end
end
