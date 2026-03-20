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
      version.update!(status: "ready", published_at: Time.current)
    end
  end

  private

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
