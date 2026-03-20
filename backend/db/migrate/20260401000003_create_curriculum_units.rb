class CreateCurriculumUnits < ActiveRecord::Migration[7.2]
  def change
    create_table :curriculum_units do |t|
      t.references :curriculum_level, null: false, foreign_key: true
      t.integer :position, null: false
      t.string :title, null: false
      t.text :description, null: false
      t.jsonb :target_items, null: false, default: {}
      t.timestamps
    end
    add_index :curriculum_units, [:curriculum_level_id, :position], unique: true
  end
end
