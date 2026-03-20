# Language
japanese = Language.find_or_create_by!(code: "ja") do |l|
  l.name = "Japanese"
  l.native_name = "日本語"
  l.active = true
end

# Level 1
level1 = CurriculumLevel.find_or_create_by!(language: japanese, position: 1) do |l|
  l.title = "Level 1 — Hiragana"
  l.mext_grade = "Grade 1 (first half)"
  l.jlpt_approx = "Pre-N5"
  l.description = "Learn all 46 hiragana characters, basic greetings, numbers 1-10, and self-introduction."
end

unit1 = CurriculumUnit.find_or_create_by!(curriculum_level: level1, position: 1) do |u|
  u.title = "Unit 1 — Vowels (あいうえお)"
  u.description = "Learn the five vowel characters."
  u.target_items = { characters: ["あ", "い", "う", "え", "お"] }
end

lesson1 = Lesson.find_or_create_by!(curriculum_unit: unit1, position: 1) do |l|
  l.title = "Lesson 1 — あ (a)"
  l.skill_type = "character_intro"
  l.objectives = ["Recognize あ by sight", "Hear あ in words", "Trace あ"]
  l.content_status = "ready"
end

lesson2 = Lesson.find_or_create_by!(curriculum_unit: unit1, position: 2) do |l|
  l.title = "Lesson 2 — い (i)"
  l.skill_type = "character_intro"
  l.objectives = ["Recognize い by sight", "Hear い in words", "Trace い"]
  l.content_status = "ready"
end

Exercise.find_or_create_by!(lesson: lesson1, position: 1) do |e|
  e.exercise_type = "multiple_choice"
  e.content = {
    "prompt" => "あ",
    "options" => ["あ", "い", "う", "え"],
    "correct_answer" => "あ",
    "illustration_specs" => [],
    "audio_scripts" => [{ "key" => "hiragana_a", "text" => "あ", "speed" => "slow" }],
    "hints" => ["This is the first hiragana character"],
    "srs_key" => "あ",
    "srs_type" => "vocabulary"
  }
  e.difficulty = "easy"
  e.qa_status = "passed"
end

# Level 2
level2 = CurriculumLevel.find_or_create_by!(language: japanese, position: 2) do |l|
  l.title = "Level 2 — Katakana & Grade 1 Kanji"
  l.mext_grade = "Grade 1 (second half)"
  l.jlpt_approx = "N5"
  l.description = "Learn all 46 katakana, 80 Grade-1 kanji, simple sentences, and counters."
end

# Level 8
level8 = CurriculumLevel.find_or_create_by!(language: japanese, position: 8) do |l|
  l.title = "Level 8 — Academic Foundations & 漢文"
  l.mext_grade = "Junior High 1 (Grade 7)"
  l.jlpt_approx = "N2"
  l.description = "Transition to academic Japanese, complex sentence patterns, 漢文 introduction, essay writing, news comprehension."
end

unit8 = CurriculumUnit.find_or_create_by!(curriculum_level: level8, position: 1) do |u|
  u.title = "Unit 1 — 意見文 (Opinion Writing)"
  u.description = "Learn to write and read opinion essays."
  u.target_items = { grammar: ["〜と思う", "〜によると"], vocabulary: ["意見", "賛成", "反対"] }
end

writing_lesson = Lesson.find_or_create_by!(curriculum_unit: unit8, position: 1) do |l|
  l.title = "Lesson 1 — 意見を書く"
  l.skill_type = "writing"
  l.objectives = ["Write a short opinion paragraph"]
  l.content_status = "ready"
end

Exercise.find_or_create_by!(lesson: writing_lesson, position: 1) do |e|
  e.exercise_type = "writing"
  e.content = { "prompt" => "日本の学校について、あなたの意見を書いてください。", "hints" => ["〜と思います を使いましょう"] }
  e.difficulty = "normal"
  e.qa_status = "passed"
end

speaking_lesson = Lesson.find_or_create_by!(curriculum_unit: unit8, position: 2) do |l|
  l.title = "Lesson 2 — 意見を話す"
  l.skill_type = "speaking"
  l.objectives = ["Express opinions verbally"]
  l.content_status = "ready"
end

Exercise.find_or_create_by!(lesson: speaking_lesson, position: 1) do |e|
  e.exercise_type = "speaking"
  e.content = { "prompt" => "自己紹介をしてください", "target_text" => "はじめまして。", "hints" => [] }
  e.difficulty = "normal"
  e.qa_status = "passed"
end

authentic_lesson = Lesson.find_or_create_by!(curriculum_unit: unit8, position: 3) do |l|
  l.title = "Lesson 3 — ニュースを読む"
  l.skill_type = "authentic_reading"
  l.objectives = ["Read a simplified news article"]
  l.content_status = "ready"
end

AuthenticSource.find_or_create_by!(lesson: authentic_lesson, title: "日本の学校給食について") do |s|
  s.source_type = "news"
  s.body_text = "日本の小学校では、毎日給食があります。"
  s.attribution = "NHK News Web Easy (adapted)"
  s.license = "fair_use"
  s.scaffolding = { "glosses" => [{ "word" => "給食", "reading" => "きゅうしょく", "definition_ja" => "学校で出る食事" }], "comprehension_questions" => [] }
  s.difficulty_level = 8
end

# Level 11
CurriculumLevel.find_or_create_by!(language: japanese, position: 11) do |l|
  l.title = "Level 11 — Academic Writing & Classical Japanese"
  l.mext_grade = "High School 2"
  l.jlpt_approx = "N1"
  l.description = "Classical Japanese fluency, academic writing."
end

# Pragmatic scenario
pragmatics_lesson = Lesson.find_or_create_by!(curriculum_unit: unit8, position: 4) do |l|
  l.title = "Lesson 4 — 断り方"
  l.skill_type = "pragmatics"
  l.objectives = ["Understand indirect refusal"]
  l.content_status = "ready"
end

PragmaticScenario.find_or_create_by!(lesson: pragmatics_lesson, title: "上司の誘い") do |s|
  s.situation_ja = "上司があなたを飲み会に誘いました。"
  s.dialogue = [{ "speaker" => "上司", "text" => "飲みに行かない？" }]
  s.choices = [{ "response" => "ちょっと今日は...", "score" => 100 }]
  s.analysis = { "rule" => "断るときは言葉を濁します" }
  s.cultural_topic = "refusal"
  s.difficulty_level = 8
end

# Contrastive grammar
grammar_lesson = Lesson.find_or_create_by!(curriculum_unit: unit8, position: 5) do |l|
  l.title = "Lesson 5 — 似ている文法の比較"
  l.skill_type = "contrastive_grammar"
  l.objectives = ["Distinguish 〜ても from 〜のに"]
  l.content_status = "ready"
end

ContrastiveGrammarSet.find_or_create_by!(lesson: grammar_lesson, cluster_name: "〜ても vs 〜のに") do |s|
  s.patterns = [{ "pattern" => "〜ても", "usage_ja" => "仮定的にも使える" }]
  s.exercises = [{ "context" => "早く起きた___遅刻した", "correct" => "のに" }]
  s.confusion_notes = { "explanation" => "「ても」は仮定でも事実でも使える" }
  s.difficulty_level = 8
end

# Real audio
unit8b = CurriculumUnit.find_or_create_by!(curriculum_level: level8, position: 2) do |u|
  u.title = "Unit 2 — 実際の日本語を聞く"
  u.description = "Listen to real Japanese speech."
  u.target_items = { skills: ["listening"] }
end

audio_lesson = Lesson.find_or_create_by!(curriculum_unit: unit8b, position: 1) do |l|
  l.title = "Lesson 1 — 駅のアナウンス"
  l.skill_type = "listening"
  l.objectives = ["Understand a station announcement"]
  l.content_status = "ready"
end

RealAudioClip.find_or_create_by!(lesson: audio_lesson, title: "東京駅ホームアナウンス") do |c|
  c.audio_url = "/audio/real/tokyo_station.mp3"
  c.duration_seconds = 45
  c.transcription = "まもなく、3番線に、東海道線が参ります。"
  c.speaker_count = 1
  c.formality = "formal"
  c.speed = "natural"
  c.has_background_noise = true
  c.attribution = "Commissioned recording"
  c.license = "cc_by"
  c.scaffolding = { "glosses" => [], "comprehension_questions" => [] }
  c.difficulty_level = 8
end

# Learner
learner = Learner.find_or_create_by!(email: "test@example.com") do |l|
  l.display_name = "Test Learner"
  l.password = "testpassword123"
  l.auth_token = "test-token-123"
  l.active_language_code = "ja"
  l.notifications_enabled = true
  l.timezone = "Asia/Tokyo"
end

LearnerProgress.find_or_create_by!(learner: learner, lesson: lesson1) do |p|
  p.status = "completed"
  p.score = 95
  p.completed_at = 1.day.ago
end

LearnerProgress.find_or_create_by!(learner: learner, lesson: lesson2) do |p|
  p.status = "available"
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

# Library items
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

momotaro = LibraryItem.find_by!(title: "桃太郎（ももたろう）")
ReadingSession.find_or_create_by!(learner: learner, library_item: momotaro) do |s|
  s.session_type = "reading"
  s.duration_seconds = 900
  s.words_read = 400
  s.progress_pct = 0.5
  s.new_srs_cards = []
end

ContentPackVersion.find_or_create_by!(language: japanese, version: 1) do |v|
  v.status = "ready"
  v.lesson_count = 12
  v.asset_count = 40
  v.published_at = Time.current
end

puts "Seed data loaded successfully."
