module Studio
  class QualityReviewJob
    include Sidekiq::Job

    sidekiq_options queue: :qa, retry: 1

    def perform(lesson_id, language_code)
      router = AiProviders.build_router
      language_config = LanguageConfig.load(language_code: language_code)
      lesson = Lesson.find(lesson_id)

      unless lesson.content_status == "qa_review"
        log_info("Skipping QA for lesson #{lesson_id} (status: #{lesson.content_status})")
        return
      end

      reviewer = Studio::QA::ContentQualityReviewer.new(
        router: router, language_config: language_config
      )

      result = reviewer.review(lesson: lesson)

      if result.passed?
        log_info("QA passed for lesson #{lesson_id} (score: #{result.score})")
      else
        log_warn("QA failed for lesson #{lesson_id}: #{result.issues.join('; ')}")
      end
    rescue StandardError => e
      log_error("QualityReviewJob failed for lesson #{lesson_id}: #{e.message}")
      raise e
    end

    private

    def log_info(msg)
      defined?(Rails) ? Rails.logger.info(msg) : puts(msg)
    end

    def log_warn(msg)
      defined?(Rails) ? Rails.logger.warn(msg) : warn(msg)
    end

    def log_error(msg)
      defined?(Rails) ? Rails.logger.error(msg) : warn(msg)
    end
  end
end
