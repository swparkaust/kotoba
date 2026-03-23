module Studio
  class AuthenticContentBuildJob
    include Sidekiq::Job

    sidekiq_options queue: :content, retry: 2

    MINIMUM_LEVEL = 7

    def perform(lesson_id, source_text, title, source_type, language_code)
      router = AiProviders.build_router
      language_config = LanguageConfig.load(language_code: language_code)
      lesson = Lesson.find(lesson_id)
      level = lesson.curriculum_unit.curriculum_level.position

      if level < MINIMUM_LEVEL
        log_info("Skipping authentic content for lesson #{lesson_id} (level #{level} < #{MINIMUM_LEVEL})")
        return
      end

      scaffolder = AuthenticContentScaffolder.new(
        router: router, language_config: language_config
      )

      result = scaffolder.scaffold(
        source: source_text || "",
        level: level
      )

      raise "AuthenticContentScaffolder returned nil" unless result
      body = source_text.to_s.strip.empty? ? result.source_text : source_text
      raise "No source text generated" if body.to_s.strip.empty?

      valid_types = %w[news literature editorial academic government]
      safe_type = valid_types.include?(source_type) ? source_type : "literature"

      AuthenticSource.find_or_create_by!(lesson: lesson, title: title) do |source|
        source.source_type = safe_type
        source.body_text = body
        source.attribution = "Generated content"
        source.license = "fair_use"
        source.scaffolding = {
          "glosses" => result.vocabulary_notes || [],
          "grammar_notes" => result.grammar_notes || [],
          "comprehension_questions" => result.comprehension_questions || []
        }
        source.difficulty_level = level
      end
    rescue StandardError => e
      log_error("AuthenticContentBuildJob failed for lesson #{lesson_id}: #{e.message}")
      raise e
    end

    private

    def log_info(msg)
      defined?(Rails) ? Rails.logger.info(msg) : puts(msg)
    end

    def log_error(msg)
      defined?(Rails) ? Rails.logger.error(msg) : warn(msg)
    end
  end
end
