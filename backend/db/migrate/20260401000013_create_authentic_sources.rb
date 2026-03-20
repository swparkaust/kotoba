class CreateAuthenticSources < ActiveRecord::Migration[7.2]
  def change
    create_table :authentic_sources do |t|
      t.references :lesson, null: false, foreign_key: true
      t.string :source_type, null: false
      t.string :title, null: false
      t.text :body_text, null: false
      t.string :attribution, null: false
      t.string :license, null: false
      t.jsonb :scaffolding, null: false, default: {}
      t.integer :difficulty_level, null: false
      t.timestamps
    end
    add_index :authentic_sources, :difficulty_level
  end
end
