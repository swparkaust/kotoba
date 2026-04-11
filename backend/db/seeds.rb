# Test infrastructure only — content comes from the content pack

learner = Learner.find_or_create_by!(email: "test@example.com") do |l|
  l.display_name = "Test Learner"
  l.password = "testpassword123"
  l.auth_token = "test-token-123"
  l.active_language_code = "ja"
  l.notifications_enabled = true
  l.timezone = "Asia/Tokyo"
end

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

puts "Seed data loaded successfully."
