module Studio
  class QualityReviewJob
    include Sidekiq::Job
    include Studio::Logging

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
        lesson.update!(qa_retry_count: 0)
        log_info("QA passed for lesson #{lesson_id} (score: #{result.score})")
      else
        if lesson.qa_retry_count < Studio::QA::ContentQualityReviewer::MAX_RETRIES
          lesson.update!(content_status: "building", qa_retry_count: lesson.qa_retry_count + 1)
          Studio::ContentBuildJob.perform_async(lesson_id, language_code)
          log_warn("QA failed for lesson #{lesson_id}, retry #{lesson.qa_retry_count}")
        else
          log_error("QA permanently failed for lesson #{lesson_id} after #{lesson.qa_retry_count} retries")
        end
      end
    rescue StandardError => e
      log_error("QualityReviewJob failed for lesson #{lesson_id}: #{e.message}")
      raise e
    end

  end
end
