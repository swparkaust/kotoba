class PragmaticScenarioGenerator
  include KanjiConstraint

  Scenario = Struct.new(:title, :context, :dialogue, :vocabulary, :grammar_focus,
                        :cultural_notes, :variations, :metadata, keyword_init: true)

  def initialize(router:, language_config:)
    @router = router
    @lang = language_config
  end

  def generate(level:, theme:, situation:)
    response = @router.call(
      task: :pragmatic_scenario_generation,
      system: system_prompt(level),
      prompt: build_prompt(level, theme, situation)
    )

    parse_scenario(response.text)
  end

  private

  def system_prompt(level)
    lang = @lang
    <<~PROMPT
      You are a #{lang.name} language pragmatics expert creating real-world communication scenarios.
      Language: #{lang.name} (#{lang.native_name})
      Script systems: #{lang.script_systems.join(", ")}
      Target level: #{level}
      #{lang.no_english_rule ? "All dialogue must be exclusively in #{lang.name}." : ""}

      Focus on authentic, culturally appropriate communication patterns.
      Include speech register variations (formal/informal/honorific) as appropriate.
      Return valid JSON only.
    PROMPT
  end

  def build_prompt(level, theme, situation)
    <<~PROMPT
      Create a pragmatic language scenario for level #{level} learners:

      Theme: #{theme}
      Situation: #{situation}

      #{kanji_constraint_for_level(level)}

      Return JSON:
      {
        "title": "scenario title in #{@lang.name}",
        "context": "scene-setting description",
        "dialogue": [
          {
            "speaker": "speaker name/role",
            "text": "dialogue line in #{@lang.name}",
            "reading": "furigana/romanization if applicable",
            "translation": "translation",
            "register": "formal|informal|honorific|casual",
            "notes": "pragmatic notes"
          }
        ],
        "vocabulary": [
          { "word": "word", "reading": "reading", "meaning": "meaning", "register": "register" }
        ],
        "grammar_focus": ["grammar point 1", "grammar point 2"],
        "cultural_notes": "cultural context and pragmatic norms",
        "variations": [
          { "context": "variation context", "dialogue_change": "how dialogue changes" }
        ],
        "metadata": {
          "difficulty": 1-5,
          "register": "primary register",
          "situation_type": "shopping|restaurant|school|work|social|etc"
        }
      }
    PROMPT
  end

  def parse_scenario(text)
    json_match = text.match(/\{[\s\S]*\}/)
    return nil unless json_match

    data = JSON.parse(json_match[0])
    Scenario.new(
      title: data["title"],
      context: data["context"],
      dialogue: data["dialogue"] || [],
      vocabulary: data["vocabulary"] || [],
      grammar_focus: data["grammar_focus"] || [],
      cultural_notes: data["cultural_notes"],
      variations: data["variations"] || [],
      metadata: data["metadata"] || {}
    )
  rescue JSON::ParserError
    nil
  end
end
