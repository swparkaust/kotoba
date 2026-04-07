module Studio
  class AudioGenerationJob
    include Sidekiq::Job
    include Studio::Logging

    sidekiq_options queue: :audio, retry: 2

    def perform(lesson_id, language_code)
      language_config = LanguageConfig.load(language_code: language_code)
      lesson = Lesson.find(lesson_id)
      generator = AudioGenerator.new(language_config: language_config)
      exercises = lesson.exercises.where.not(content: nil)

      exercises.each do |exercise|
        scripts = exercise.content.fetch("audio_scripts", [])
        next if scripts.empty?

        # Wrap AR exercise as a struct the generator expects
        ex_struct = OpenStruct.new(
          audio_cue: exercise.content["audio_cue"],
          target_text: exercise.content["target_text"],
          exercise_type: exercise.exercise_type,
          image_cue: exercise.content["image_cue"]
        )
        clips = generator.generate(lesson: lesson, exercises: [ex_struct])

        clips.each do |clip|
          asset_key = clip.metadata&.dig(:asset_key) || "audio_#{exercise.id}_#{SecureRandom.hex(4)}"
          next if ContentAsset.exists?(lesson: lesson, asset_key: asset_key)

          ContentAsset.create!(
            lesson: lesson,
            asset_type: "audio_mp3",
            asset_key: asset_key,
            url: clip.url || clip.local_path,
            file_size: clip.local_path && File.exist?(clip.local_path) ? File.size(clip.local_path) : 0,
            qa_status: "pending"
          )
        end
      end
    rescue StandardError => e
      log_error("AudioGenerationJob failed for lesson #{lesson_id}: #{e.message}")
      raise e
    end
  end
end
