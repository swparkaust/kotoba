module Studio
  class ContentBuildJob
    include Sidekiq::Job

    sidekiq_options queue: :content, retry: 3

    def perform(lesson_id, language_code)
      router = AiProviders.build_router
      language_config = LanguageConfig.load(language_code: language_code)
      lesson = Lesson.find(lesson_id)
      return if lesson.content_status == "ready"

      generator = LessonContentGenerator.new(router: router, language_config: language_config)
      generator.generate(lesson: lesson)

      level = lesson.curriculum_unit.curriculum_level.position

      case lesson.skill_type
      when "pragmatics"
        build_pragmatic_scenario(router, language_config, lesson, level)
      when "contrastive_grammar"
        build_contrastive_grammar(router, language_config, lesson, level)
      when "authentic_reading"
        Studio::AuthenticContentBuildJob.perform_async(
          lesson_id, nil, lesson.title, "literature", language_code
        )
      end

      Studio::AudioGenerationJob.perform_async(lesson_id, language_code)
    rescue StandardError => e
      Lesson.find_by(id: lesson_id)&.update!(content_status: "failed")
      raise e
    end

    private

    def build_pragmatic_scenario(router, language_config, lesson, level)
      topic = lesson.curriculum_unit.target_items&.dig("cultural_topic") || "refusal"
      gen = PragmaticScenarioGenerator.new(router: router, language_config: language_config)
      scenario = gen.generate(level: level, theme: topic, situation: lesson.title)
      raise "PragmaticScenarioGenerator returned nil" unless scenario
      raise "Pragmatic scenario has no context" if scenario.context.to_s.strip.empty?

      dialogue = (scenario.dialogue || []).map { |d|
        raise "Dialogue entry missing text" if d["text"].to_s.strip.empty?
        { "speaker" => d["speaker"], "text" => d["text"], "implied_meaning" => d["notes"], "tone" => d["register"] }
      }
      raise "Pragmatic scenario has no dialogue" if dialogue.empty?

      choices = (scenario.variations || []).map { |v|
        raise "Variation missing dialogue_change" if v["dialogue_change"].to_s.strip.empty? && v["context"].to_s.strip.empty?
        { "response" => v["dialogue_change"] || v["context"], "consequence" => v["context"], "score" => 50 }
      }
      raise "Pragmatic scenario has no choices — generator must produce variations" if choices.empty?

      PragmaticScenario.find_or_create_by!(lesson: lesson, title: scenario.title || lesson.title) do |ps|
        ps.situation_ja = scenario.context
        ps.dialogue = dialogue
        ps.choices = choices
        ps.analysis = { "rule" => scenario.cultural_notes, "grammar_focus" => scenario.grammar_focus }
        ps.cultural_topic = topic
        ps.difficulty_level = level
      end
    end

    def build_contrastive_grammar(router, language_config, lesson, level)
      patterns = lesson.curriculum_unit.target_items&.dig("grammar") || []
      raise "Contrastive grammar lesson needs at least 2 grammar patterns, got #{patterns.length}" if patterns.length < 2

      pattern_a_name = patterns[0]
      pattern_b_name = patterns[1]
      gen = ContrastiveGrammarGenerator.new(router: router, language_config: language_config)
      grammar_set = gen.generate(pattern_a: pattern_a_name, pattern_b: pattern_b_name, level: level)
      raise "ContrastiveGrammarGenerator returned nil" unless grammar_set
      raise "ContrastiveGrammarGenerator missing contrast_explanation" if grammar_set.contrast_explanation.to_s.strip.empty?

      pa = grammar_set.pattern_a || {}
      pb = grammar_set.pattern_b || {}

      raise "No exercises generated for contrastive grammar" if (grammar_set.exercises || []).empty?

      ContrastiveGrammarSet.find_or_create_by!(lesson: lesson, cluster_name: "#{pattern_a_name} vs #{pattern_b_name}") do |cg|
        cg.patterns = [
          { "pattern" => pa["name"] || pattern_a_name, "usage_ja" => pa["usage_context"] || pa["meaning"], "example_sentences" => (grammar_set.examples || []).select { |e| e["pattern"] == "a" }.map { |e| e["text"] } },
          { "pattern" => pb["name"] || pattern_b_name, "usage_ja" => pb["usage_context"] || pb["meaning"], "example_sentences" => (grammar_set.examples || []).select { |e| e["pattern"] == "b" }.map { |e| e["text"] } }
        ]
        cg.exercises = grammar_set.exercises.map { |e|
          raise "Exercise missing context or correct answer" if e["text"].to_s.strip.empty? && e["sentence"].to_s.strip.empty?
          { "context" => e["text"] || e["sentence"], "correct" => e["answer"] || e["correct"], "options" => e["options"] || [pattern_a_name, pattern_b_name] }
        }
        cg.confusion_notes = { "explanation" => grammar_set.contrast_explanation, "common_errors" => grammar_set.common_errors }
        cg.difficulty_level = level
      end
    end
  end
end
