# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_04_01_000020) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "authentic_sources", force: :cascade do |t|
    t.bigint "lesson_id", null: false
    t.string "source_type", null: false
    t.string "title", null: false
    t.text "body_text", null: false
    t.string "attribution", null: false
    t.string "license", null: false
    t.jsonb "scaffolding", default: {}, null: false
    t.integer "difficulty_level", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["difficulty_level"], name: "index_authentic_sources_on_difficulty_level"
    t.index ["lesson_id"], name: "index_authentic_sources_on_lesson_id"
  end

  create_table "content_assets", force: :cascade do |t|
    t.bigint "lesson_id", null: false
    t.string "asset_type", null: false
    t.string "asset_key", null: false
    t.binary "data"
    t.string "url"
    t.integer "file_size"
    t.string "qa_status", default: "pending", null: false
    t.text "qa_notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["lesson_id", "asset_key"], name: "index_content_assets_on_lesson_id_and_asset_key", unique: true
    t.index ["lesson_id"], name: "index_content_assets_on_lesson_id"
  end

  create_table "content_pack_versions", force: :cascade do |t|
    t.bigint "language_id", null: false
    t.integer "version", null: false
    t.string "status", default: "building", null: false
    t.integer "lesson_count", default: 0, null: false
    t.integer "asset_count", default: 0, null: false
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["language_id", "version"], name: "index_content_pack_versions_on_language_id_and_version", unique: true
    t.index ["language_id"], name: "index_content_pack_versions_on_language_id"
  end

  create_table "contrastive_grammar_sets", force: :cascade do |t|
    t.bigint "lesson_id", null: false
    t.string "cluster_name", null: false
    t.jsonb "patterns", null: false
    t.jsonb "exercises", null: false
    t.jsonb "confusion_notes", null: false
    t.integer "difficulty_level", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cluster_name"], name: "index_contrastive_grammar_sets_on_cluster_name"
    t.index ["lesson_id"], name: "index_contrastive_grammar_sets_on_lesson_id"
  end

  create_table "curriculum_levels", force: :cascade do |t|
    t.bigint "language_id", null: false
    t.integer "position", null: false
    t.string "title", null: false
    t.string "mext_grade", null: false
    t.string "jlpt_approx", null: false
    t.text "description", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["language_id", "position"], name: "index_curriculum_levels_on_language_id_and_position", unique: true
    t.index ["language_id"], name: "index_curriculum_levels_on_language_id"
  end

  create_table "curriculum_units", force: :cascade do |t|
    t.bigint "curriculum_level_id", null: false
    t.integer "position", null: false
    t.string "title", null: false
    t.text "description", null: false
    t.jsonb "target_items", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["curriculum_level_id", "position"], name: "index_curriculum_units_on_curriculum_level_id_and_position", unique: true
    t.index ["curriculum_level_id"], name: "index_curriculum_units_on_curriculum_level_id"
  end

  create_table "exercises", force: :cascade do |t|
    t.bigint "lesson_id", null: false
    t.string "exercise_type", null: false
    t.integer "position", null: false
    t.jsonb "content", null: false
    t.string "difficulty", default: "normal", null: false
    t.string "qa_status", default: "pending", null: false
    t.text "qa_notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["lesson_id", "position"], name: "index_exercises_on_lesson_id_and_position"
    t.index ["lesson_id"], name: "index_exercises_on_lesson_id"
  end

  create_table "languages", force: :cascade do |t|
    t.string "code", null: false
    t.string "name", null: false
    t.string "native_name", null: false
    t.boolean "active", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_languages_on_code", unique: true
  end

  create_table "learner_progresses", force: :cascade do |t|
    t.bigint "learner_id", null: false
    t.bigint "lesson_id", null: false
    t.string "status", default: "locked", null: false
    t.integer "score"
    t.integer "attempts_count", default: 0, null: false
    t.datetime "completed_at"
    t.jsonb "exercise_results", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["learner_id", "lesson_id"], name: "index_learner_progresses_on_learner_id_and_lesson_id", unique: true
    t.index ["learner_id"], name: "index_learner_progresses_on_learner_id"
    t.index ["lesson_id"], name: "index_learner_progresses_on_lesson_id"
  end

  create_table "learners", force: :cascade do |t|
    t.string "display_name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "auth_token"
    t.string "active_language_code", default: "ja", null: false
    t.string "device_locale", default: "en"
    t.boolean "notifications_enabled", default: false, null: false
    t.string "notification_time", default: "09:00"
    t.string "timezone", default: "UTC"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["auth_token"], name: "index_learners_on_auth_token", unique: true
    t.index ["email"], name: "index_learners_on_email", unique: true
  end

  create_table "lessons", force: :cascade do |t|
    t.bigint "curriculum_unit_id", null: false
    t.integer "position", null: false
    t.string "title", null: false
    t.string "skill_type", null: false
    t.jsonb "objectives", default: [], null: false
    t.string "content_status", default: "pending", null: false
    t.integer "content_version", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["content_status"], name: "index_lessons_on_content_status"
    t.index ["curriculum_unit_id", "position"], name: "index_lessons_on_curriculum_unit_id_and_position", unique: true
    t.index ["curriculum_unit_id"], name: "index_lessons_on_curriculum_unit_id"
  end

  create_table "library_items", force: :cascade do |t|
    t.bigint "language_id", null: false
    t.string "item_type", null: false
    t.string "title", null: false
    t.text "body_text"
    t.string "audio_url"
    t.integer "audio_duration_seconds"
    t.string "attribution", null: false
    t.string "license", null: false
    t.integer "difficulty_level", null: false
    t.integer "word_count"
    t.jsonb "glosses", default: [], null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["item_type"], name: "index_library_items_on_item_type"
    t.index ["language_id", "difficulty_level"], name: "index_library_items_on_language_id_and_difficulty_level"
    t.index ["language_id"], name: "index_library_items_on_language_id"
  end

  create_table "placement_attempts", force: :cascade do |t|
    t.bigint "learner_id", null: false
    t.bigint "language_id", null: false
    t.integer "recommended_level", null: false
    t.integer "chosen_level"
    t.jsonb "responses", default: [], null: false
    t.float "overall_score", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["language_id"], name: "index_placement_attempts_on_language_id"
    t.index ["learner_id"], name: "index_placement_attempts_on_learner_id"
  end

  create_table "pragmatic_scenarios", force: :cascade do |t|
    t.bigint "lesson_id", null: false
    t.string "title", null: false
    t.text "situation_ja", null: false
    t.jsonb "dialogue", null: false
    t.jsonb "choices", null: false
    t.jsonb "analysis", null: false
    t.string "cultural_topic", null: false
    t.integer "difficulty_level", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cultural_topic"], name: "index_pragmatic_scenarios_on_cultural_topic"
    t.index ["lesson_id"], name: "index_pragmatic_scenarios_on_lesson_id"
  end

  create_table "push_subscriptions", force: :cascade do |t|
    t.bigint "learner_id"
    t.string "endpoint", null: false
    t.string "p256dh_key", null: false
    t.string "auth_key", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["endpoint"], name: "index_push_subscriptions_on_endpoint", unique: true
    t.index ["learner_id"], name: "index_push_subscriptions_on_learner_id"
  end

  create_table "reading_sessions", force: :cascade do |t|
    t.bigint "learner_id", null: false
    t.bigint "library_item_id", null: false
    t.string "session_type", null: false
    t.integer "duration_seconds", null: false
    t.integer "words_read", default: 0
    t.float "progress_pct", default: 0.0
    t.jsonb "new_srs_cards", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["learner_id", "library_item_id"], name: "index_reading_sessions_on_learner_id_and_library_item_id"
    t.index ["learner_id"], name: "index_reading_sessions_on_learner_id"
    t.index ["library_item_id"], name: "index_reading_sessions_on_library_item_id"
  end

  create_table "real_audio_clips", force: :cascade do |t|
    t.bigint "lesson_id", null: false
    t.string "title", null: false
    t.string "audio_url", null: false
    t.integer "duration_seconds", null: false
    t.text "transcription", null: false
    t.integer "speaker_count", default: 1, null: false
    t.string "formality", null: false
    t.string "speed", null: false
    t.boolean "has_background_noise", default: false, null: false
    t.string "attribution", null: false
    t.string "license", null: false
    t.jsonb "scaffolding", default: {}, null: false
    t.integer "difficulty_level", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["difficulty_level"], name: "index_real_audio_clips_on_difficulty_level"
    t.index ["lesson_id"], name: "index_real_audio_clips_on_lesson_id"
  end

  create_table "speaking_submissions", force: :cascade do |t|
    t.bigint "learner_id", null: false
    t.bigint "exercise_id", null: false
    t.text "transcription", null: false
    t.text "target_text", null: false
    t.jsonb "evaluation", default: {}, null: false
    t.integer "accuracy_score"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["exercise_id"], name: "index_speaking_submissions_on_exercise_id"
    t.index ["learner_id"], name: "index_speaking_submissions_on_learner_id"
  end

  create_table "srs_cards", force: :cascade do |t|
    t.bigint "learner_id", null: false
    t.string "card_type", null: false
    t.string "card_key", null: false
    t.jsonb "card_data", default: {}, null: false
    t.integer "interval_days", default: 1, null: false
    t.float "ease_factor", default: 2.5, null: false
    t.integer "repetitions", default: 0, null: false
    t.boolean "burned", default: false, null: false
    t.datetime "next_review_at", null: false
    t.datetime "last_reviewed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["learner_id", "card_type", "card_key"], name: "index_srs_cards_on_learner_id_and_card_type_and_card_key", unique: true
    t.index ["learner_id", "next_review_at"], name: "index_srs_cards_on_learner_id_and_next_review_at"
    t.index ["learner_id"], name: "index_srs_cards_on_learner_id"
  end

  create_table "writing_submissions", force: :cascade do |t|
    t.bigint "learner_id", null: false
    t.bigint "exercise_id", null: false
    t.text "submitted_text", null: false
    t.jsonb "evaluation", default: {}, null: false
    t.integer "score"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["exercise_id"], name: "index_writing_submissions_on_exercise_id"
    t.index ["learner_id"], name: "index_writing_submissions_on_learner_id"
  end

  add_foreign_key "authentic_sources", "lessons"
  add_foreign_key "content_assets", "lessons"
  add_foreign_key "content_pack_versions", "languages"
  add_foreign_key "contrastive_grammar_sets", "lessons"
  add_foreign_key "curriculum_levels", "languages"
  add_foreign_key "curriculum_units", "curriculum_levels"
  add_foreign_key "exercises", "lessons"
  add_foreign_key "learner_progresses", "learners"
  add_foreign_key "learner_progresses", "lessons"
  add_foreign_key "lessons", "curriculum_units"
  add_foreign_key "library_items", "languages"
  add_foreign_key "placement_attempts", "languages"
  add_foreign_key "placement_attempts", "learners"
  add_foreign_key "pragmatic_scenarios", "lessons"
  add_foreign_key "reading_sessions", "learners"
  add_foreign_key "reading_sessions", "library_items"
  add_foreign_key "real_audio_clips", "lessons"
  add_foreign_key "speaking_submissions", "exercises"
  add_foreign_key "speaking_submissions", "learners"
  add_foreign_key "srs_cards", "learners"
  add_foreign_key "writing_submissions", "exercises"
  add_foreign_key "writing_submissions", "learners"
end
