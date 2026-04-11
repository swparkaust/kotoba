class PlacementQuestionGenerator
  QUESTIONS_PER_LEVEL = 3

  def initialize(router:)
    @router = router
  end

  def generate(language:, levels: 1..12)
    questions = []

    levels.each do |level_pos|
      level = CurriculumLevel.find_by(language: language, position: level_pos)
      next unless level

      QUESTIONS_PER_LEVEL.times do |i|
        questions << generate_question(level, i)
      end
    end

    questions
  end

  private

  def generate_question(level, index)
    response = @router.call(
      task: :placement_question_generation,
      system: system_prompt,
      prompt: build_prompt(level, index),
      max_tokens: 1024
    )

    parse_question(response&.text, level.position)
  rescue StandardError => e
    Rails.logger.warn("PlacementQuestionGenerator: failed for L#{level.position}: #{e.message}")
    fallback_question(level.position)
  end

  def system_prompt
    <<~PROMPT
      You generate placement test questions for a Japanese language learning app.
      Each question must:
      1. Test a skill appropriate for the stated MEXT grade level
      2. Have exactly 4 options with 1 correct answer
      3. Be in Japanese (no English in the question or options)
      4. Vary in skill tested: mix vocabulary, grammar, kanji reading, and comprehension

      Return JSON:
      {
        "prompt": "question text",
        "options": ["a", "b", "c", "d"],
        "correct_answer": "the correct option (must match one of the options exactly)",
        "skill_tested": "vocabulary|grammar|kanji|comprehension",
        "level": N
      }
    PROMPT
  end

  def build_prompt(level, index)
    skills = %w[vocabulary grammar kanji comprehension]
    skill = skills[index % skills.length]

    <<~PROMPT
      Generate 1 placement test question for:
      Level: #{level.position} (#{level.jlpt_approx})
      Grade equivalent: #{level.mext_grade}
      Skill to test: #{skill}
      Description: #{level.description}

      The question must be answerable by a student AT this level but NOT by a student one level below.
    PROMPT
  end

  def parse_question(text, level_position)
    return fallback_question(level_position) if text.blank?

    json = JSON.parse(text)
    return fallback_question(level_position) unless json.is_a?(Hash)
    return fallback_question(level_position) unless json["options"]&.length == 4
    return fallback_question(level_position) unless json["options"].include?(json["correct_answer"])

    {
      prompt: json["prompt"],
      options: json["options"],
      correct_answer: json["correct_answer"],
      skill_tested: json["skill_tested"] || "vocabulary",
      level: json["level"] || level_position
    }
  rescue JSON::ParserError
    fallback_question(level_position)
  end

  def fallback_question(level_position)
    # Static fallbacks per level in case AI generation fails
    fallbacks = {
      1 => { prompt: "「あ」はどれですか？", options: [ "あ", "い", "う", "え" ], correct_answer: "あ" },
      2 => { prompt: "「学校」の読み方は？", options: [ "がっこう", "がくこう", "がっこ", "がこう" ], correct_answer: "がっこう" },
      3 => { prompt: "「食べ___」（丁寧形）", options: [ "ます", "る", "て", "た" ], correct_answer: "ます" },
      4 => { prompt: "「友達___会いました。」", options: [ "に", "を", "で", "が" ], correct_answer: "に" },
      5 => { prompt: "「泳ぐ」の可能形は？", options: [ "泳げる", "泳がれる", "泳ぎれる", "泳ごう" ], correct_answer: "泳げる" },
      6 => { prompt: "「先生に叱___。」", options: [ "られた", "れた", "させた", "った" ], correct_answer: "られた" },
      7 => { prompt: "「いらっしゃる」は何語ですか？", options: [ "尊敬語", "謙譲語", "丁寧語", "普通語" ], correct_answer: "尊敬語" },
      8 => { prompt: "「にもかかわらず」の意味は？", options: [ "〜のに", "〜ので", "〜から", "〜まで" ], correct_answer: "〜のに" },
      9 => { prompt: "「であるがゆえに」の意味は？", options: [ "だから", "しかし", "つまり", "けれど" ], correct_answer: "だから" },
      10 => { prompt: "「ご査収ください」はどの場面？", options: [ "ビジネス文書", "友人への手紙", "日記", "SNS" ], correct_answer: "ビジネス文書" },
      11 => { prompt: "「いとをかし」の現代語は？", options: [ "とても趣がある", "とても怖い", "とても悲しい", "とても遠い" ], correct_answer: "とても趣がある" },
      12 => { prompt: "「なまら」はどの地方の方言？", options: [ "北海道", "関西", "九州", "東北" ], correct_answer: "北海道" }
    }

    fb = fallbacks[level_position] || fallbacks[1]
    fb.merge(skill_tested: "vocabulary", level: level_position)
  end
end
