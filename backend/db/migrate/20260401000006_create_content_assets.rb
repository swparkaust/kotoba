class CreateContentAssets < ActiveRecord::Migration[7.2]
  def change
    create_table :content_assets do |t|
      t.references :lesson, null: false, foreign_key: true
      t.string :asset_type, null: false
      t.string :asset_key, null: false
      t.binary :data
      t.string :url
      t.integer :file_size
      t.string :qa_status, null: false, default: "pending"
      t.text :qa_notes
      t.timestamps
    end
    add_index :content_assets, [ :lesson_id, :asset_key ], unique: true
  end
end
