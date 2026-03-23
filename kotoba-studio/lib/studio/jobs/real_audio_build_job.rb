module Studio
  class RealAudioBuildJob
    include Sidekiq::Job

    sidekiq_options queue: :audio, retry: 2

    MINIMUM_LEVEL = 8

    def perform(lesson_id, audio_url, transcription, title, metadata_json, language_code)
      router = AiProviders.build_router
      language_config = LanguageConfig.load(language_code: language_code)
      lesson = Lesson.find(lesson_id)
      metadata = JSON.parse(metadata_json || "{}").transform_keys(&:to_sym)
      level = lesson.curriculum_unit.curriculum_level.position

      if level < MINIMUM_LEVEL
        log_info("Skipping real audio for lesson #{lesson_id} (level #{level} < #{MINIMUM_LEVEL})")
        return
      end

      scaffolder = RealAudioScaffolder.new(
        router: router, language_config: language_config
      )

      result = scaffolder.scaffold(
        audio_clip: { url: audio_url, transcription: transcription, title: title, metadata: metadata },
        level: level
      )
      raise "RealAudioScaffolder returned nil" unless result

      formality = metadata[:formality] || "polite"
      raise "Invalid formality '#{formality}'" unless %w[casual polite formal mixed].include?(formality)

      RealAudioClip.find_or_create_by!(lesson: lesson, title: title) do |clip|
        clip.audio_url = audio_url
        clip.duration_seconds = metadata[:duration_seconds] || 0
        clip.transcription = transcription
        clip.speaker_count = metadata[:speaker_count] || 1
        clip.formality = formality
        clip.speed = metadata[:speed] || "natural"
        clip.has_background_noise = metadata.fetch(:has_background_noise, false)
        clip.attribution = metadata[:attribution] || "Commissioned recording"
        clip.license = metadata[:license] || "cc_by"
        clip.scaffolding = {
          "glosses" => result.vocabulary || [],
          "listening_tasks" => result.listening_tasks || []
        }
        clip.difficulty_level = level
      end
    rescue StandardError => e
      log_error("RealAudioBuildJob failed for lesson #{lesson_id}: #{e.message}")
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
