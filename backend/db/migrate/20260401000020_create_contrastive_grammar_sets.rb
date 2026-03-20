class CreateContrastiveGrammarSets < ActiveRecord::Migration[7.2]
  def change
    create_table :contrastive_grammar_sets do |t|
      t.references :lesson, null: false, foreign_key: true
      t.string :cluster_name, null: false
      t.jsonb :patterns, null: false
      t.jsonb :exercises, null: false
      t.jsonb :confusion_notes, null: false
      t.integer :difficulty_level, null: false
      t.timestamps
    end
    add_index :contrastive_grammar_sets, :cluster_name
  end
end
