module Studio
  class CurriculumParser
    attr_reader :language, :levels

    def initialize(language:, curriculum_path:, art_direction_path:)
      @language = language
      @curriculum = YAML.load_file(curriculum_path)
      @art_direction = YAML.load_file(art_direction_path)
      @levels = parse_levels
    end

    def lessons
      @levels.flat_map do |level|
        (level["units"] || []).flat_map do |unit|
          (unit["lessons"] || []).map do |lesson|
            { level: level, unit: unit, lesson: lesson }
          end
        end
      end
    end

    def generation_config
      @curriculum.dig("language", "generation_config") || {}
    end

    def library_progression
      @curriculum.dig("language", "library_progression") || {}
    end

    def generation_targets_for(level_position)
      level = @levels.find { |l| l["position"] == level_position }
      level&.dig("generation_targets") || {}
    end

    def seed_lessons_for(level_position)
      lessons.select { |l| l[:level]["position"] == level_position }
    end

    def deficit_for(level_position)
      targets = generation_targets_for(level_position)
      target_count = targets["target_lessons"] || 0
      current_count = seed_lessons_for(level_position).size
      [target_count - current_count, 0].max
    end

    private

    def parse_levels
      @curriculum.fetch("levels", [])
    end
  end
end
