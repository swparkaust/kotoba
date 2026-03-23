class ExerciseGenerator
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

    parse_exercises(response.text, lesson)
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
