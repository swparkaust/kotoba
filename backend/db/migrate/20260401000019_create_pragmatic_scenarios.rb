class CreatePragmaticScenarios < ActiveRecord::Migration[7.2]
  def change
    create_table :pragmatic_scenarios do |t|
      t.references :lesson, null: false, foreign_key: true
      t.string :title, null: false
      t.text :situation_ja, null: false
      t.jsonb :dialogue, null: false
      t.jsonb :choices, null: false
      t.jsonb :analysis, null: false
      t.string :cultural_topic, null: false
      t.integer :difficulty_level, null: false
      t.timestamps
    end
    add_index :pragmatic_scenarios, :cultural_topic
  end
end
