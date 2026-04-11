class CreateLibraryItems < ActiveRecord::Migration[7.2]
  def change
    create_table :library_items do |t|
      t.references :language, null: false, foreign_key: true
      t.string :item_type, null: false
      t.string :title, null: false
      t.text :body_text
      t.string :audio_url
      t.integer :audio_duration_seconds
      t.string :attribution, null: false
      t.string :license, null: false
      t.integer :difficulty_level, null: false
      t.integer :word_count
      t.jsonb :glosses, null: false, default: []
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :library_items, [ :language_id, :difficulty_level ]
    add_index :library_items, :item_type
  end
end
