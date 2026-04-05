class ExerciseGenerator
  include KanjiConstraint

  Exercise = Struct.new(:exercise_type, :skill_type, :prompt, :target_text,
                        :choices, :correct_answer, :audio_cue, :image_cue,
                        :metadata, :position, keyword_init: true)

  def initialize(router:, language_config:)
    @router = router
    @lang = language_config
  end

  def generate(lesson:)
    skill_types = @lang.skill_type_map.fetch(lesson.skill_type, %w[multiple_choice fill_blank])

    response = @router.call(
      task: :lesson_content_generation,
      system: system_prompt(lesson),
      prompt: build_prompt(lesson, skill_types)
    )

    if response.text.nil? || response.text.strip.empty?
      raise "AI provider returned empty response for lesson #{lesson.id} (provider: #{response.provider}, model: #{response.model})"
    end

    exercises = parse_exercises(response.text, lesson)
    correct_kanji_violations(exercises, lesson)
  end

  private

  def system_prompt(lesson)
    lang = @lang
    <<~PROMPT
      You are a #{lang.name} language curriculum designer creating exercises for learners.
      Language: #{lang.name} (#{lang.native_name})
      Script systems: #{lang.script_systems.join(", ")}
      #{lang.no_english_rule ? "IMPORTANT: Do not use English in exercises. Use only #{lang.name}." : ""}
      Art direction: #{lang.art_direction.to_json}

      Generate exercises that are pedagogically sound, culturally authentic, and age-appropriate.
      Return valid JSON only.
    PROMPT
  end

  def build_prompt(lesson, skill_types)
    unit = lesson.curriculum_unit
    level = unit&.curriculum_level
    target_items = unit&.target_items || {}
    kanji_constraint = kanji_constraint_for_level(level&.position)

    <<~PROMPT
      Generate #{skill_types.length * 2} exercises for this lesson:

      Level: #{level&.position}
      Grade: #{level&.mext_grade}
      JLPT: #{level&.jlpt_approx}
      Unit: #{unit&.title}
      Lesson title: #{lesson.title}
      Skill type: #{lesson.skill_type}
      Objectives: #{lesson.objectives&.join(", ")}
      Target vocabulary: #{(target_items["vocabulary"] || []).join(", ")}
      Target grammar: #{(target_items["grammar"] || []).join(", ")}
      Target characters: #{(target_items["characters"] || []).join(", ")}

      Exercise types to include: #{skill_types.join(", ")}

      #{kanji_constraint}
      NOTE: The target vocabulary above may contain kanji not yet taught at this level.
      You MUST rewrite any word containing untaught kanji using hiragana instead,
      exactly as MEXT Kokugo textbooks do at this grade. For example, if 飲 is not
      in the permitted list, write のむ instead of 飲む.

      Return JSON array:
      [
        {
          "exercise_type": "multiple_choice|fill_blank|listening|picture_match|trace|reorder|writing|speaking",
          "skill_type": "vocabulary|grammar|reading|listening|writing|speaking|character_intro|review",
          "prompt": "instruction text",
          "target_text": "the target language text being practiced",
          "choices": ["option1", "option2", "option3", "option4"],
          "correct_answer": "correct option",
          "audio_cue": "text to be spoken aloud or null",
          "image_cue": "description for illustration or null",
          "metadata": { "difficulty": 1-5, "tags": [] }
        }
      ]
    PROMPT
  end

  def correct_kanji_violations(exercises, lesson)
    level_pos = lesson.curriculum_unit&.curriculum_level&.position
    return exercises unless level_pos && level_pos <= 7

    grade_chars = @lang.grade_characters || {}
    max_grade = case level_pos
                when 1 then 0
                when 2 then 1
                when 3..4 then 2
                when 5 then 3
                when 6 then 4
                when 7 then 6
                else return exercises
                end

    permitted = Set.new
    (1..max_grade).each { |g| permitted.merge(grade_chars[g] || []) }

    text_fields = %w[prompt target_text correct_answer audio_cue]
    exercises.each do |ex|
      all_kanji = text_fields.flat_map { |f| ex.send(f).to_s.scan(/\p{Han}/) }.uniq
      bad_kanji = all_kanji.reject { |k| permitted.include?(k) }
      next if bad_kanji.empty?

      choices_kanji = (ex.choices || []).join.scan(/\p{Han}/).uniq
      bad_in_choices = choices_kanji.reject { |k| permitted.include?(k) }
      bad_kanji = (bad_kanji + bad_in_choices).uniq

      response = @router.call(
        task: :exercise_variation,
        system: "You rewrite Japanese text to replace specific kanji with hiragana readings. Return valid JSON only.",
        prompt: <<~PROMPT
          Rewrite this exercise replacing these untaught kanji with their hiragana readings: #{bad_kanji.join(', ')}

          Current exercise:
          #{JSON.generate({ prompt: ex.prompt, target_text: ex.target_text, choices: ex.choices, correct_answer: ex.correct_answer, audio_cue: ex.audio_cue })}

          Return the corrected exercise as JSON with the same keys. Only replace the listed kanji — keep all other text unchanged.
        PROMPT
      )

      next if response.text.nil? || response.text.strip.empty?
      begin
        json_match = response.text.match(/\{[\s\S]*\}/)
        next unless json_match
        fix = JSON.parse(json_match[0])
        ex.prompt = fix["prompt"] if fix["prompt"]
        ex.target_text = fix["target_text"] if fix["target_text"]
        ex.choices = fix["choices"] if fix["choices"]
        ex.correct_answer = fix["correct_answer"] if fix["correct_answer"]
        ex.audio_cue = fix["audio_cue"] if fix["audio_cue"]
      rescue JSON::ParserError
        next
      end
    end

    exercises
  end

  def parse_exercises(text, lesson)
    return [] if text.nil? || text.strip.empty?

    json_match = text.match(/\[[\s\S]*\]/)
    return [] unless json_match

    data = JSON.parse(json_match[0])
    data.each_with_index.map do |ex, idx|
      Exercise.new(
        exercise_type: ex["exercise_type"],
        skill_type: ex["skill_type"],
        prompt: ex["prompt"],
        target_text: ex["target_text"],
        choices: ex["choices"] || [],
        correct_answer: ex["correct_answer"],
        audio_cue: ex["audio_cue"],
        image_cue: ex["image_cue"],
        metadata: ex["metadata"] || {},
        position: idx + 1
      )
    end
  rescue JSON::ParserError
    []
  end
end
