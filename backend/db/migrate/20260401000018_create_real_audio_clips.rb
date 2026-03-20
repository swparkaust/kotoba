class CreateRealAudioClips < ActiveRecord::Migration[7.2]
  def change
    create_table :real_audio_clips do |t|
      t.references :lesson, null: false, foreign_key: true
      t.string :title, null: false
      t.string :audio_url, null: false
      t.integer :duration_seconds, null: false
      t.text :transcription, null: false
      t.integer :speaker_count, null: false, default: 1
      t.string :formality, null: false
      t.string :speed, null: false
      t.boolean :has_background_noise, null: false, default: false
      t.string :attribution, null: false
      t.string :license, null: false
      t.jsonb :scaffolding, null: false, default: {}
      t.integer :difficulty_level, null: false
      t.timestamps
    end
    add_index :real_audio_clips, :difficulty_level
  end
end
