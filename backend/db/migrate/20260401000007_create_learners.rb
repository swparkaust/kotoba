class CreateLearners < ActiveRecord::Migration[7.2]
  def change
    create_table :learners do |t|
      t.string :display_name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :auth_token
      t.string :active_language_code, null: false, default: "ja"
      t.string :device_locale, default: "en"
      t.boolean :notifications_enabled, null: false, default: false
      t.string :notification_time, default: "09:00"
      t.string :timezone, default: "UTC"
      t.timestamps
    end
    add_index :learners, :email, unique: true
    add_index :learners, :auth_token, unique: true
  end
end
