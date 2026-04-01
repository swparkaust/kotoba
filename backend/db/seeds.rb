# Test infrastructure only — curriculum content comes from the Content Studio

# Language
japanese = Language.find_or_create_by!(code: "ja") do |l|
  l.name = "Japanese"
  l.native_name = "日本語"
  l.active = true
end

# Test learner
learner = Learner.find_or_create_by!(email: "test@example.com") do |l|
  l.display_name = "Test Learner"
  l.password = "testpassword123"
  l.auth_token = "test-token-123"
  l.active_language_code = "ja"
  l.notifications_enabled = true
  l.timezone = "Asia/Tokyo"
end

# SRS cards for testing review functionality
SrsCard.find_or_create_by!(learner: learner, card_type: "vocabulary", card_key: "あ") do |c|
  c.card_data = { front: "あ", back: "a (first vowel)", source_level: 1 }
  c.interval_days = 1
  c.ease_factor = 2.5
  c.repetitions = 1
  c.next_review_at = 1.hour.ago
  c.last_reviewed_at = 1.day.ago
end

SrsCard.find_or_create_by!(learner: learner, card_type: "vocabulary", card_key: "い") do |c|
  c.card_data = { front: "い", back: "i (second vowel)", source_level: 1 }
  c.interval_days = 3
  c.ease_factor = 2.5
  c.repetitions = 2
  c.next_review_at = 2.days.from_now
  c.last_reviewed_at = 1.day.ago
end

SrsCard.find_or_create_by!(learner: learner, card_type: "kanji", card_key: "一") do |c|
  c.card_data = { front: "一", back: "いち", source_level: 2 }
  c.interval_days = 180
  c.ease_factor = 3.0
  c.repetitions = 12
  c.burned = true
  c.next_review_at = 6.months.from_now
  c.last_reviewed_at = 1.month.ago
end

# Library items for testing reading/listening features
LibraryItem.find_or_create_by!(language: japanese, title: "桃太郎（ももたろう）") do |i|
  i.item_type = "graded_reader"
  i.body_text = "むかしむかし、あるところに、おじいさんとおばあさんがいました。"
  i.attribution = "Japanese folk tale (public domain)"
  i.license = "public_domain"
  i.difficulty_level = 5
  i.word_count = 800
  i.glosses = [{ "word" => "しばかり", "definition_ja" => "山でたきぎを集めること" }]
end

LibraryItem.find_or_create_by!(language: japanese, title: "走れメロス") do |i|
  i.item_type = "novel"
  i.body_text = "メロスは激怒した。"
  i.attribution = "太宰治 — Aozora Bunko (public domain)"
  i.license = "public_domain"
  i.difficulty_level = 10
  i.word_count = 6000
  i.glosses = []
end

# Reading session for testing progress tracking
momotaro = LibraryItem.find_by!(title: "桃太郎（ももたろう）")
ReadingSession.find_or_create_by!(learner: learner, library_item: momotaro) do |s|
  s.session_type = "reading"
  s.duration_seconds = 900
  s.words_read = 400
  s.progress_pct = 0.5
  s.new_srs_cards = []
end

puts "Seed data loaded successfully."
