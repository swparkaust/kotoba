class ContentPackImporter
  attr_reader :stats

  def initialize(path:)
    @path = Pathname.new(path)
    @manifest = JSON.parse((@path / "manifest.json").read)
    @stats = { levels: 0, lessons: 0, exercises: 0, assets: 0 }
  end

  def validate!
    raise "Invalid format version" unless @manifest["format_version"] == 1
    raise "Missing curriculum.json" unless (@path / "curriculum.json").exist?
  end

  def import!
    curriculum = JSON.parse((@path / "curriculum.json").read)
    language = Language.find_or_create_by!(
      code: @manifest["language_code"]
    ) do |l|
      l.name = @manifest["language_name"]
      l.native_name = curriculum["native_name"]
      l.active = true
    end

    version = ContentPackVersion.create!(
      language: language,
      version: @manifest["content_version"],
      status: "building",
      lesson_count: @manifest["lesson_count"] || 0,
      asset_count: @manifest["asset_count"] || 0
    )

    ActiveRecord::Base.transaction do
      import_curriculum(curriculum, language)
      import_exercises(language) if (@path / "exercises.json").exist?
      import_library(language) if (@path / "library.json").exist?
      version.update!(status: "ready", published_at: Time.current)
    end
  end

  private

  def import_exercises(language)
    levels = CurriculumLevel.where(language: language).index_by(&:position)
    units = CurriculumUnit.where(curriculum_level: levels.values)
                          .index_by { |u| [ u.curriculum_level_id, u.position ] }
    lessons = Lesson.where(curriculum_unit: units.values)
                    .index_by { |l| [ l.curriculum_unit_id, l.position ] }

    exercises = JSON.parse((@path / "exercises.json").read)
    exercises.each do |ex_data|
      level = levels[ex_data["level_position"]]
      next unless level
      unit = units[[ level.id, ex_data["unit_position"] ]]
      next unless unit
      lesson = lessons[[ unit.id, ex_data["lesson_position"] ]]
      next unless lesson

      Exercise.find_or_create_by!(
        lesson: lesson, position: ex_data["position"]
      ) do |e|
        e.exercise_type = ex_data["exercise_type"]
        e.content = ex_data["content"]
        e.difficulty = ex_data["difficulty"] || "normal"
        e.qa_status = "passed"
      end
      @stats[:exercises] += 1
    end
  end

  def import_library(language)
    items = JSON.parse((@path / "library.json").read)
    items.each do |item_data|
      LibraryItem.find_or_create_by!(
        language: language, title: item_data["title"]
      ) do |i|
        i.item_type = item_data["item_type"]
        i.body_text = item_data["body_text"]
        i.audio_url = item_data["audio_url"]
        i.attribution = item_data["attribution"]
        i.license = item_data["license"]
        i.difficulty_level = item_data["difficulty_level"]
        i.word_count = item_data["word_count"]
        i.glosses = item_data["glosses"] || []
      end
    end
  end

  def import_curriculum(curriculum, language)
    (curriculum["levels"] || []).each do |level_data|
      level = CurriculumLevel.find_or_create_by!(
        language: language, position: level_data["position"]
      ) do |l|
        l.title = level_data["title"]
        l.mext_grade = level_data["grade_equivalent"]
        l.jlpt_approx = level_data["test_equivalent"]
        l.description = level_data["description"]
      end
      @stats[:levels] += 1

      (level_data["units"] || []).each do |unit_data|
        unit = CurriculumUnit.find_or_create_by!(
          curriculum_level: level, position: unit_data["position"]
        ) do |u|
          u.title = unit_data["title"]
          u.description = unit_data["description"]
          u.target_items = unit_data["target_items"] || {}
        end

        (unit_data["lessons"] || []).each do |lesson_data|
          Lesson.find_or_create_by!(
            curriculum_unit: unit, position: lesson_data["position"]
          ) do |l|
            l.title = lesson_data["title"]
            l.skill_type = lesson_data["skill_type"]
            l.objectives = lesson_data["objectives"] || []
            l.content_status = "ready"
          end
          @stats[:lessons] += 1
        end
      end
    end
  end
end
