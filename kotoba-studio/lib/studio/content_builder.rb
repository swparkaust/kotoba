require "yaml"
require "json"

LanguageConfig = Struct.new(
  :code, :name, :native_name, :script_systems, :official_curriculum,
  :equivalence_test, :teaching_bands, :grade_characters, :art_direction,
  :voice_profiles, :skill_type_map, :no_english_rule, :classical_variant,
  keyword_init: true
) do
  STUDIO_ROOT = File.expand_path("../..", __dir__)

  def self.load(language_code:, curricula_dir: File.join(STUDIO_ROOT, "curricula"), config_dir: File.join(STUDIO_ROOT, "config"))
    curriculum = YAML.load_file("#{curricula_dir}/#{language_code}/curriculum.yml")
    art = YAML.load_file("#{config_dir}/art_direction.yml")
    voices = YAML.load_file("#{config_dir}/voice_profiles.yml")

    new(
      code: curriculum.dig("language", "code"),
      name: curriculum.dig("language", "name"),
      native_name: curriculum.dig("language", "native_name"),
      script_systems: curriculum.dig("language", "script_systems") || [],
      official_curriculum: curriculum.dig("language", "official_curriculum"),
      equivalence_test: curriculum.dig("language", "equivalence_test"),
      teaching_bands: { beginner: 1..4, intermediate: 5..8, advanced: 9..12 },
      grade_characters: load_grade_characters(language_code, curricula_dir),
      art_direction: (art[language_code] || {}).merge(art["default"] || {}),
      voice_profiles: voices[language_code] || voices["default"],
      skill_type_map: curriculum.dig("language", "skill_type_map") || default_skill_type_map,
      no_english_rule: curriculum.dig("language", "no_english_rule") != false,
      classical_variant: curriculum.dig("language", "classical_variant")
    )
  end

  private_class_method def self.load_grade_characters(code, dir)
    path = "#{dir}/#{code}/kanji_grades.yml"
    File.exist?(path) ? YAML.load_file(path) : {}
  end

  private_class_method def self.default_skill_type_map
    {
      "character_intro" => %w[trace multiple_choice picture_match listening],
      "drill" => %w[multiple_choice fill_blank listening picture_match],
      "kanji_intro" => %w[trace multiple_choice picture_match],
      "grammar_intro" => %w[fill_blank reorder multiple_choice listening],
      "vocabulary" => %w[picture_match multiple_choice fill_blank listening],
      "grammar" => %w[fill_blank reorder multiple_choice],
      "reading" => %w[multiple_choice fill_blank],
      "listening" => %w[listening multiple_choice],
      "writing" => %w[writing fill_blank],
      "speaking" => %w[speaking listening],
      "review" => %w[multiple_choice fill_blank listening picture_match],
      "authentic_reading" => %w[multiple_choice fill_blank],
      "pragmatics" => %w[multiple_choice fill_blank speaking],
      "contrastive_grammar" => %w[fill_blank reorder multiple_choice],
      "classical_japanese" => %w[multiple_choice fill_blank reading]
    }
  end
end

class LessonContentGenerator
  def initialize(router:, language_config:)
    @router = router
    @language_config = language_config
    @exercise_generator = ExerciseGenerator.new(router: router, language_config: language_config)
    @illustration_generator = IllustrationGenerator.new(router: router, language_config: language_config)
    @audio_generator = AudioGenerator.new(language_config: language_config)
  end

  def generate(lesson:)
    lesson.update!(content_status: "building")
    lesson.exercises.destroy_all
    lesson.content_assets.destroy_all

    exercises = @exercise_generator.generate(lesson: lesson)

    if exercises.empty?
      raise "No exercises generated for lesson #{lesson.id} — cannot proceed with content build"
    end

    illustrations = @illustration_generator.generate(lesson: lesson, exercises: exercises)
    audio_clips = @audio_generator.generate(lesson: lesson, exercises: exercises)

    ActiveRecord::Base.transaction do
      exercises.each do |ex|
        lesson.exercises.create!(
          exercise_type: ex.exercise_type || "multiple_choice",
          position: ex.position,
          content: {
            "prompt" => ex.prompt,
            "target_text" => ex.target_text,
            "options" => ex.choices,
            "correct_answer" => ex.correct_answer,
            "audio_cue" => ex.audio_cue,
            "image_cue" => ex.image_cue,
            "hints" => [],
            "illustration_specs" => ex.image_cue ? [{ "key" => "ex_#{ex.position}", "description" => ex.image_cue }] : [],
            "audio_scripts" => ex.audio_cue ? [{ "key" => "audio_#{ex.position}", "text" => ex.audio_cue }] : [],
            "srs_key" => ex.target_text,
            "srs_type" => "vocabulary"
          },
          difficulty: ex.metadata&.dig("difficulty")&.to_i&.then { |d| d <= 2 ? "easy" : d >= 4 ? "challenge" : "normal" } || "normal",
          qa_status: "pending"
        )
      end
      illustrations.each_with_index do |ill, idx|
        lesson.content_assets.create!(
          asset_type: "illustration_png",
          asset_key: "illustration_#{idx + 1}",
          url: ill.url,
          qa_status: "pending"
        )
      end
      audio_clips.each_with_index do |clip, idx|
        lesson.content_assets.create!(
          asset_type: "audio_mp3",
          asset_key: "audio_#{idx + 1}",
          url: clip.url,
          qa_status: "pending"
        )
      end
      lesson.update!(content_status: "qa_review")
    end

    Studio::QualityReviewJob.perform_async(lesson.id, @language_config.code)

    LessonContent.new(
      exercises: exercises,
      illustrations: illustrations,
      audio_scripts: audio_clips,
      raw_response: nil
    )
  rescue StandardError => e
    lesson.update!(content_status: "failed")
    raise e
  end
end
