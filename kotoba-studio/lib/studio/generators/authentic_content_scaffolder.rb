class AuthenticContentScaffolder
  include KanjiConstraint

  ScaffoldedContent = Struct.new(:source_text, :translated_text, :vocabulary_notes,
                                 :grammar_notes, :comprehension_questions, :metadata,
                                 keyword_init: true)

  def initialize(router:, language_config:)
    @router = router
    @lang = language_config
  end

  def scaffold(source:, level:)
    @source = source
    response = @router.call(
      task: :authentic_content_scaffolding,
      system: system_prompt(level),
      prompt: build_prompt(source, level)
    )

    parse_scaffolding(response.text, source)
  end

  private

  def system_prompt(level)
    lang = @lang
    if source_provided?
      <<~PROMPT
        You are a #{lang.name} language educator specializing in authentic content scaffolding.
        Language: #{lang.name} (#{lang.native_name})
        Target level: #{level}
        #{lang.no_english_rule ? "All scaffolding must be in #{lang.name}." : ""}

        Your task is to take authentic #{lang.name} content and create pedagogical scaffolding
        appropriate for the target level. Return valid JSON only.
      PROMPT
    else
      <<~PROMPT
        You are a #{lang.name} language educator who creates authentic reading materials.
        Language: #{lang.name} (#{lang.native_name})
        Target level: #{level}
        #{lang.no_english_rule ? "All content and scaffolding must be in #{lang.name}." : ""}

        Generate an authentic #{lang.name} text appropriate for level #{level} learners,
        along with pedagogical scaffolding. Return valid JSON only.
      PROMPT
    end
  end

  def build_prompt(source, level)
    source_text = source.is_a?(String) ? source : source.to_s

    kanji_rule = kanji_constraint_for_level(level)

    if source_text.strip.empty?
      <<~PROMPT
        Generate an authentic #{@lang.name} reading passage for level #{level} learners.
        The text should be appropriate for #{@lang.official_curriculum} grade equivalent.

        #{kanji_rule}

        Return JSON:
        {
          "source_text": "the generated #{@lang.name} text (200-500 characters)",
          "vocabulary_notes": [
            { "word": "word", "reading": "reading", "meaning": "meaning in simple #{@lang.name}", "usage_example": "example" }
          ],
          "grammar_notes": [
            { "pattern": "grammar pattern", "explanation": "explanation for level #{level}", "examples": ["example1"] }
          ],
          "comprehension_questions": [
            { "question": "question in #{@lang.name}", "answer": "expected answer", "difficulty": 1-5 }
          ],
          "metadata": { "difficulty_rating": #{level}, "topic": "topic description" }
        }
      PROMPT
    else
      <<~PROMPT
        Scaffold this authentic #{@lang.name} content for level #{level} learners:

        Source text: #{source_text}

        #{kanji_rule}

        Return JSON:
        {
          "source_text": "original text preserved",
          "vocabulary_notes": [
            { "word": "word", "reading": "reading", "meaning": "meaning in simple #{@lang.name}", "usage_example": "example" }
          ],
          "grammar_notes": [
            { "pattern": "grammar pattern", "explanation": "explanation for level #{level}", "examples": ["example1"] }
          ],
          "comprehension_questions": [
            { "question": "question in #{@lang.name}", "answer": "expected answer", "difficulty": 1-5 }
          ],
          "metadata": { "difficulty_rating": #{level}, "cultural_notes": "any cultural context" }
        }
      PROMPT
    end
  end

  def source_provided?
    @source.is_a?(String) && !@source.strip.empty?
  end

  def parse_scaffolding(text, source)
    return nil if text.nil? || text.strip.empty?

    json_match = text.match(/\{[\s\S]*\}/)
    return nil unless json_match

    data = JSON.parse(json_match[0])
    source_text = source.is_a?(String) && source.strip.empty? ? data["source_text"] : source

    ScaffoldedContent.new(
      source_text: data["source_text"] || source_text,
      translated_text: data["translated_text"],
      vocabulary_notes: data["vocabulary_notes"] || [],
      grammar_notes: data["grammar_notes"] || [],
      comprehension_questions: data["comprehension_questions"] || [],
      metadata: data["metadata"] || {}
    )
  rescue JSON::ParserError
    nil
  end
end
