class CreateContentPackVersions < ActiveRecord::Migration[7.2]
  def change
    create_table :content_pack_versions do |t|
      t.references :language, null: false, foreign_key: true
      t.integer :version, null: false
      t.string :status, null: false, default: "building"
      t.integer :lesson_count, null: false, default: 0
      t.integer :asset_count, null: false, default: 0
      t.datetime :published_at
      t.timestamps
    end
    add_index :content_pack_versions, [ :language_id, :version ], unique: true
  end
end
