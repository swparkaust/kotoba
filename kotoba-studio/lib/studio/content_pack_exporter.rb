module Studio
  class ContentPackExporter
    include Studio::Logging
    def initialize(language_config:, curriculum_parser: nil)
      @lang = language_config
      @parser = curriculum_parser
    end

    def export(output_path)
      FileUtils.mkdir_p(output_path)
      FileUtils.mkdir_p("#{output_path}/assets")

      export_manifest(output_path)
      export_curriculum(output_path)
      export_exercises(output_path)
      export_library(output_path)
      export_assets(output_path)

      log_info "Content pack exported to #{output_path}"
      { path: output_path, lessons: lesson_count, assets: asset_count }
    end

    private

    def export_manifest(path)
      manifest = {
        format_version: 1,
        language_code: @lang.code,
        language_name: @lang.name,
        content_version: next_version,
        generated_at: Time.now.iso8601,
        lesson_count: lesson_count,
        asset_count: asset_count
      }
      File.write("#{path}/manifest.json", JSON.pretty_generate(manifest))
    end

    def export_curriculum(path)
      levels = CurriculumLevel.where(language: language).order(:position).includes(
        curriculum_units: { lessons: :exercises }
      )

      curriculum_data = {
        native_name: @lang.native_name,
        levels: levels.map { |level| serialize_level(level) }
      }

      File.write("#{path}/curriculum.json", JSON.pretty_generate(curriculum_data))
    end

    def export_exercises(path)
      exercises = Exercise.joins(lesson: { curriculum_unit: { curriculum_level: :language } })
                          .where(languages: { code: @lang.code })
                          .where(qa_status: "passed")
                          .includes(lesson: { curriculum_unit: :curriculum_level })

      exercises_data = exercises.map do |ex|
        level = ex.lesson.curriculum_unit.curriculum_level
        unit = ex.lesson.curriculum_unit
        {
          level_position: level.position,
          unit_position: unit.position,
          lesson_position: ex.lesson.position,
          position: ex.position,
          exercise_type: ex.exercise_type,
          content: ex.content,
          difficulty: ex.difficulty
        }
      end

      File.write("#{path}/exercises.json", JSON.pretty_generate(exercises_data))
    end

    def export_library(path)
      items = LibraryItem.where(language: language, active: true)

      library_data = items.map do |item|
        {
          item_type: item.item_type,
          title: item.title,
          body_text: item.body_text,
          audio_url: item.audio_url,
          attribution: item.attribution,
          license: item.license,
          difficulty_level: item.difficulty_level,
          word_count: item.word_count,
          glosses: item.glosses
        }
      end

      File.write("#{path}/library.json", JSON.pretty_generate(library_data))
    end

    def export_assets(path)
      assets = ContentAsset.joins(lesson: { curriculum_unit: { curriculum_level: :language } })
                           .where(languages: { code: @lang.code })
                           .to_a

      assets.each do |asset|
        next unless asset.url.present? || asset.data.present?

        filename = "#{asset.asset_key || asset.id}.#{extension_for(asset.asset_type)}"
        target = "#{path}/assets/#{filename}"

        if asset.data.present?
          File.binwrite(target, asset.data)
        elsif asset.url.present? && File.exist?(asset.url)
          FileUtils.cp(asset.url, target)
        end
      end

      asset_index = assets.map do |a|
        { id: a.id, lesson_id: a.lesson_id, type: a.asset_type, key: a.asset_key }
      end
      File.write("#{path}/assets/index.json", JSON.pretty_generate(asset_index))
    end

    def serialize_level(level)
      {
        position: level.position,
        title: level.title,
        grade_equivalent: level.mext_grade,
        test_equivalent: level.jlpt_approx,
        description: level.description,
        units: level.curriculum_units.order(:position).map { |u| serialize_unit(u) }
      }
    end

    def serialize_unit(unit)
      {
        position: unit.position,
        title: unit.title,
        description: unit.description,
        target_items: unit.target_items,
        lessons: unit.lessons.order(:position).map { |l| serialize_lesson(l) }
      }
    end

    def serialize_lesson(lesson)
      {
        position: lesson.position,
        title: lesson.title,
        skill_type: lesson.skill_type,
        objectives: lesson.objectives,
        content_status: lesson.content_status
      }
    end

    def language
      @language ||= Language.find_by!(code: @lang.code)
    end

    def lesson_count
      @lesson_count ||= Lesson.joins(curriculum_unit: { curriculum_level: :language })
                               .where(languages: { code: @lang.code }, content_status: "ready")
                               .count
    end

    def asset_count
      @asset_count ||= ContentAsset.joins(lesson: { curriculum_unit: { curriculum_level: :language } })
                                    .where(languages: { code: @lang.code })
                                    .count
    end

    def next_version
      latest = ContentPackVersion.where(language: language).maximum(:version) || 0
      latest + 1
    end

    def extension_for(asset_type)
      case asset_type
      when "audio_mp3" then "mp3"
      when "audio_ogg" then "ogg"
      when "audio_wav" then "wav"
      when "illustration_png", "character_sheet_png" then "png"
      when "illustration_webp", "scene_webp" then "webp"
      when "illustration_svg" then "svg"
      else "bin"
      end
    end
  end
end
