FactoryBot.define do
  factory :language do
    sequence(:code) { |n| n == 1 ? "ja" : "lang#{n}" }
    name { "Japanese" }
    native_name { "日本語" }
    active { true }
  end

  factory :curriculum_level do
    language
    sequence(:position) { |n| n }
    title { "Level #{position}" }
    mext_grade { "Grade #{position}" }
    jlpt_approx { "N5" }
    description { "Level #{position} description" }
  end

  factory :curriculum_unit do
    curriculum_level
    sequence(:position) { |n| n }
    title { "Unit #{position}" }
    description { "Unit #{position} description" }
    target_items { { characters: ["あ"] } }
  end

  factory :lesson do
    curriculum_unit
    sequence(:position) { |n| n }
    title { "Lesson #{position}" }
    skill_type { "character_intro" }
    objectives { ["Learn character"] }
    content_status { "ready" }
    content_version { 1 }
  end

  factory :exercise do
    lesson
    exercise_type { "multiple_choice" }
    sequence(:position) { |n| n }
    content { { "prompt" => "あ", "options" => ["あ", "い"], "correct_answer" => "あ", "hints" => ["First hiragana"] } }
    difficulty { "easy" }
    qa_status { "passed" }
  end

  factory :content_asset do
    lesson
    asset_type { "illustration_webp" }
    sequence(:asset_key) { |n| "asset_#{n}" }
    url { "https://example.com/asset.webp" }
    file_size { 50000 }
    qa_status { "passed" }
  end

  factory :learner do
    display_name { "Test Learner" }
    sequence(:email) { |n| "learner#{n}@example.com" }
    password { "password123" }
    auth_token { SecureRandom.hex(32) }
    active_language_code { "ja" }
    notifications_enabled { false }
    timezone { "UTC" }
  end

  factory :learner_progress do
    learner
    lesson
    status { "available" }
    attempts_count { 0 }
    exercise_results { [] }
  end

  factory :srs_card do
    learner
    card_type { "vocabulary" }
    sequence(:card_key) { |n| "card_key_#{n}" }
    card_data { { front: "あ", back: "a" } }
    interval_days { 1 }
    ease_factor { 2.5 }
    repetitions { 0 }
    burned { false }
    next_review_at { 1.hour.ago }
    last_reviewed_at { nil }
  end

  factory :placement_attempt do
    learner
    language
    recommended_level { 1 }
    chosen_level { nil }
    responses { [] }
    overall_score { 0.5 }
  end

  factory :content_pack_version do
    language
    sequence(:version) { |n| n }
    status { "ready" }
    lesson_count { 10 }
    asset_count { 50 }
    published_at { nil }
  end

  factory :authentic_source do
    lesson
    source_type { "news" }
    title { "Test Article" }
    body_text { "日本語のテキスト" }
    attribution { "Test Source" }
    license { "public_domain" }
    scaffolding { { glosses: [], comprehension_questions: [] } }
    difficulty_level { 8 }
  end

  factory :writing_submission do
    learner
    exercise
    submitted_text { "テスト文章" }
    evaluation { {} }
    score { 80 }
  end

  factory :speaking_submission do
    learner
    exercise
    transcription { "おはようございます" }
    target_text { "おはようございます" }
    evaluation { {} }
    accuracy_score { 85 }
  end

  factory :library_item do
    language
    item_type { "graded_reader" }
    title { "Test Reader" }
    body_text { "テストテキスト" }
    attribution { "Test" }
    license { "public_domain" }
    difficulty_level { 5 }
    word_count { 500 }
    glosses { [] }
    active { true }
  end

  factory :reading_session do
    learner
    library_item
    session_type { "reading" }
    duration_seconds { 600 }
    words_read { 200 }
    progress_pct { 0.5 }
    new_srs_cards { [] }
  end

  factory :real_audio_clip do
    lesson
    title { "Test Audio" }
    audio_url { "https://example.com/audio.mp3" }
    duration_seconds { 30 }
    transcription { "テスト音声" }
    speaker_count { 1 }
    formality { "polite" }
    speed { "natural" }
    has_background_noise { false }
    attribution { "Test" }
    license { "cc_by" }
    scaffolding { {} }
    difficulty_level { 8 }
  end

  factory :pragmatic_scenario do
    lesson
    title { "Test Scenario" }
    situation_ja { "テストの状況" }
    dialogue { [{ speaker: "A", text: "テスト" }] }
    choices { [{ response: "はい", score: 100 }] }
    analysis { { rule: "テストルール" } }
    cultural_topic { "refusal" }
    difficulty_level { 8 }
  end

  factory :contrastive_grammar_set do
    lesson
    cluster_name { "〜ても vs 〜のに" }
    patterns { [{ pattern: "〜ても", usage_ja: "テスト" }] }
    exercises { [{ context: "テスト", correct: "ても" }] }
    confusion_notes { { explanation: "テスト説明" } }
    difficulty_level { 8 }
  end

  factory :push_subscription do
    learner { nil }
    sequence(:endpoint) { |n| "https://fcm.googleapis.com/fcm/send/sub#{n}" }
    p256dh_key { "test-p256dh-key" }
    auth_key { "test-auth-key" }
  end
end
