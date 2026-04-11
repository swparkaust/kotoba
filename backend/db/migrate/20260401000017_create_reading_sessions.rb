class CreateReadingSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :reading_sessions do |t|
      t.references :learner, null: false, foreign_key: true
      t.references :library_item, null: false, foreign_key: true
      t.string :session_type, null: false
      t.integer :duration_seconds, null: false
      t.integer :words_read, default: 0
      t.float :progress_pct, default: 0.0
      t.jsonb :new_srs_cards, null: false, default: []
      t.timestamps
    end
    add_index :reading_sessions, [ :learner_id, :library_item_id ]
  end
end
