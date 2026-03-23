class ContrastiveGrammarGenerator
  GrammarSet = Struct.new(:pattern_a, :pattern_b, :contrast_explanation,
                          :examples, :common_errors, :exercises, :metadata,
                          keyword_init: true)

  def initialize(router:, language_config:)
    @router = router
    @lang = language_config
  end

  def generate(pattern_a:, pattern_b:, level:)
    response = @router.call(
      task: :contrastive_grammar_generation,
      system: system_prompt(level),
      prompt: build_prompt(pattern_a, pattern_b, level)
    )

    parse_grammar_set(response.text, pattern_a, pattern_b)
  end

  private

  def system_prompt(level)
    lang = @lang
    <<~PROMPT
      You are a #{lang.name} linguistics expert specializing in contrastive grammar analysis.
      Language: #{lang.name} (#{lang.native_name})
      Script systems: #{lang.script_systems.join(", ")}
      Target level: #{level}

      Create contrastive grammar materials that help learners distinguish between
      commonly confused grammar patterns. Focus on nuanced semantic and pragmatic differences.
      Return valid JSON only.
    PROMPT
  end

  def build_prompt(pattern_a, pattern_b, level)
    <<~PROMPT
      Create a contrastive grammar set for level #{level} learners comparing:

      Pattern A: #{pattern_a}
      Pattern B: #{pattern_b}

      Return JSON:
      {
        "pattern_a": {
          "name": "pattern name",
          "structure": "grammatical structure",
          "meaning": "core meaning",
          "usage_context": "when to use"
        },
        "pattern_b": {
          "name": "pattern name",
          "structure": "grammatical structure",
          "meaning": "core meaning",
          "usage_context": "when to use"
        },
        "contrast_explanation": "detailed explanation of differences",
        "examples": [
          {
            "pattern": "a|b",
            "text": "example sentence in #{@lang.name}",
            "reading": "reading if applicable",
            "translation": "translation",
            "explanation": "why this pattern is used here"
          }
        ],
        "common_errors": [
          {
            "error": "common mistake",
            "correction": "correct form",
            "explanation": "why it's wrong"
          }
        ],
        "exercises": [
          {
            "type": "choose_correct|fill_blank|transform",
            "prompt": "exercise prompt",
            "options": ["option1", "option2"],
            "answer": "correct answer",
            "explanation": "explanation"
          }
        ],
        "metadata": {
          "difficulty": 1-5,
          "jlpt_level": "N5-N1",
          "frequency": "high|medium|low"
        }
      }
    PROMPT
  end

  def parse_grammar_set(text, pattern_a, pattern_b)
    json_match = text.match(/\{[\s\S]*\}/)
    return nil unless json_match

    data = JSON.parse(json_match[0])
    GrammarSet.new(
      pattern_a: data["pattern_a"] || { "name" => pattern_a },
      pattern_b: data["pattern_b"] || { "name" => pattern_b },
      contrast_explanation: data["contrast_explanation"],
      examples: data["examples"] || [],
      common_errors: data["common_errors"] || [],
      exercises: data["exercises"] || [],
      metadata: data["metadata"] || {}
    )
  rescue JSON::ParserError
    nil
  end
end
