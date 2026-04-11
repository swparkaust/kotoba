class CreateSrsCards < ActiveRecord::Migration[7.2]
  def change
    create_table :srs_cards do |t|
      t.references :learner, null: false, foreign_key: true
      t.string :card_type, null: false
      t.string :card_key, null: false
      t.jsonb :card_data, null: false, default: {}
      t.integer :interval_days, null: false, default: 1
      t.float :ease_factor, null: false, default: 2.5
      t.integer :repetitions, null: false, default: 0
      t.boolean :burned, null: false, default: false
      t.datetime :next_review_at, null: false
      t.datetime :last_reviewed_at
      t.timestamps
    end
    add_index :srs_cards, [ :learner_id, :card_type, :card_key ], unique: true
    add_index :srs_cards, [ :learner_id, :next_review_at ]
  end
end
