class CreateLessons < ActiveRecord::Migration[7.2]
  def change
    create_table :lessons do |t|
      t.references :curriculum_unit, null: false, foreign_key: true
      t.integer :position, null: false
      t.string :title, null: false
      t.string :skill_type, null: false
      t.jsonb :objectives, null: false, default: []
      t.string :content_status, null: false, default: "pending"
      t.integer :content_version, null: false, default: 0
      t.timestamps
    end
    add_index :lessons, [:curriculum_unit_id, :position], unique: true
    add_index :lessons, :content_status
  end
end
