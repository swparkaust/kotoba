class CreateCurriculumLevels < ActiveRecord::Migration[7.2]
  def change
    create_table :curriculum_levels do |t|
      t.references :language, null: false, foreign_key: true
      t.integer :position, null: false
      t.string :title, null: false
      t.string :mext_grade, null: false
      t.string :jlpt_approx, null: false
      t.text :description, null: false
      t.timestamps
    end
    add_index :curriculum_levels, [:language_id, :position], unique: true
  end
end
