require "yaml"
require "json"
require "net/http"
require "uri"
require "fileutils"
require "securerandom"
require "ostruct"

module Studio
  module CLI
    def self.parse(args)
      options = { action: :build, language: "ja" }
      args.each_with_index do |arg, i|
        case arg
        when "--language" then options[:language] = args[i + 1]
        when "--level" then options[:level] = args[i + 1].to_i
        when "--rebuild" then options[:action] = :rebuild
        when "--status" then options[:action] = :status
        when "--export" then options[:action] = :export; options[:output_path] = args[i + 1]
        when "--fill" then options[:action] = :fill
        end
      end
      options
    end

    def self.run(options)
      language_config = LanguageConfig.load(language_code: options[:language])
      parser = Studio::CurriculumParser.new(
        language: options[:language],
        curriculum_path: "curricula/#{options[:language]}/curriculum.yml",
        art_direction_path: "config/art_direction.yml"
      )

      case options[:action]
      when :build
        build(parser, language_config, level: options[:level])
      when :fill
        fill(parser, language_config, level: options[:level])
      when :rebuild
        rebuild(parser, language_config, level: options[:level])
      when :status
        status(parser, language_config)
      when :export
        export(language_config, options[:output_path])
      end
    end

    def self.build(parser, language_config, level: nil)
      lessons = parser.lessons
      lessons = lessons.select { |l| l[:level]["position"] == level } if level

      pending = lessons.reject { |l| Lesson.find_by(title: l[:lesson]["title"])&.content_status == "ready" }
      puts "Building #{pending.size} seed lessons (#{lessons.size - pending.size} already ready)..."

      pending.each do |entry|
        lesson = find_or_create_lesson(entry)
        Studio::ContentBuildJob.perform_async(lesson.id, language_config.code)
        puts "  Queued: #{lesson.title}"
      end

      puts "#{pending.size} jobs queued. Monitor with --status."
      puts "Run --fill to generate additional lessons to meet density targets."
    end

    # --fill generates additional lessons beyond the manual seeds to meet generation_targets.
    # Unlike build (which processes manually-defined lessons), fill creates new lessons
    # with varied skill types and objectives to cover the full JLPT vocabulary/grammar scope.
    #
    # Distribution strategy:
    #   40% vocabulary/grammar drills (SRS-feeding exercises)
    #   20% reading comprehension (graded readers, authentic texts)
    #   15% listening comprehension
    #   15% writing/speaking production
    #   10% review/mock exam
    def self.fill(parser, language_config, level: nil)
      positions = level ? [level] : (1..12).to_a

      skill_distribution = {
        "vocabulary" => 0.20, "grammar_intro" => 0.20,
        "authentic_reading" => 0.20, "listening" => 0.15,
        "writing" => 0.08, "speaking" => 0.07, "review" => 0.10
      }

      total_generated = 0
      positions.each do |pos|
        targets = parser.generation_targets_for(pos)
        next if targets.empty?

        target_count = targets["target_lessons"] || 0
        target_vocab = targets["target_vocab"] || 0
        target_grammar = targets["target_grammar"] || 0

        language = Language.find_by!(code: language_config.code)
        db_level = CurriculumLevel.find_by(language: language, position: pos)
        next unless db_level

        existing_count = Lesson.joins(curriculum_unit: :curriculum_level)
                               .where(curriculum_levels: { id: db_level.id })
                               .count
        deficit = [target_count - existing_count, 0].max
        next if deficit.zero?

        puts "Level #{pos}: #{existing_count}/#{target_count} lessons. Generating #{deficit} more..."
        puts "  Vocab target: #{target_vocab} words, Grammar target: #{target_grammar} points"

        units = db_level.curriculum_units.order(:position)
        next if units.empty?

        # Calculate how many lessons of each skill type to generate
        lessons_by_skill = skill_distribution.map do |skill, pct|
          [skill, (deficit * pct).ceil]
        end.to_h

        # Adjust to hit exact deficit
        total_planned = lessons_by_skill.values.sum
        if total_planned > deficit
          lessons_by_skill[lessons_by_skill.keys.last] -= (total_planned - deficit)
        end

        # Vocab/grammar words to cover, distributed across vocab and grammar lessons
        vocab_per_lesson = target_vocab > 0 ? (target_vocab.to_f / (lessons_by_skill["vocabulary"] || 1)).ceil : 10
        grammar_per_lesson = target_grammar > 0 ? (target_grammar.to_f / (lessons_by_skill["grammar_intro"] || 1)).ceil : 3

        lesson_num = 0
        lessons_by_skill.each do |skill_type, count|
          count.times do |j|
            unit = units[lesson_num % units.count]
            position = unit.lessons.maximum(:position).to_i + 1

            objectives = case skill_type
                         when "vocabulary"
                           ["Learn #{vocab_per_lesson} new vocabulary words at this level",
                            "Use new words in context sentences",
                            "Add words to SRS review deck"]
                         when "grammar_intro"
                           ["Practice #{grammar_per_lesson} grammar patterns at this level",
                            "Complete fill-in-the-blank and reordering exercises",
                            "Distinguish similar grammar patterns"]
                         when "authentic_reading"
                           ["Read a passage at JLPT #{db_level.jlpt_approx} level",
                            "Answer comprehension questions about main idea and details",
                            "Learn vocabulary from context"]
                         when "listening"
                           ["Listen to audio at natural speed for this level",
                            "Answer comprehension questions from audio",
                            "Identify key information and speaker intent"]
                         when "writing"
                           ["Write a response appropriate for this level",
                            "Receive AI feedback on grammar, naturalness, and register"]
                         when "speaking"
                           ["Produce spoken Japanese at this level",
                            "Practice pronunciation and fluency"]
                         when "review"
                           ["Review vocabulary and grammar from this level",
                            "Complete mixed-format exercises",
                            "Identify and strengthen weak areas"]
                         else
                           ["Practice #{skill_type} skills at this level"]
                         end

            title = "#{db_level.title} — #{skill_type.tr('_', ' ').capitalize} #{j + 1}"

            Lesson.create!(
              curriculum_unit: unit,
              position: position,
              title: title,
              skill_type: skill_type,
              objectives: objectives,
              content_status: "pending"
            )

            Studio::ContentBuildJob.perform_async(
              Lesson.last.id, language_config.code
            )

            lesson_num += 1
            total_generated += 1
          end
        end

        puts "  Queued #{deficit} lessons (#{lessons_by_skill.map { |k,v| "#{v} #{k}" }.join(', ')})"
      end

      puts "\nGenerated #{total_generated} additional lessons. Monitor with --status."
    end

    def self.rebuild(parser, language_config, level: nil)
      lessons = parser.lessons
      lessons = lessons.select { |l| l[:level]["position"] == level } if level

      puts "Rebuilding ALL #{lessons.size} lessons..."
      lessons.each do |entry|
        lesson = find_or_create_lesson(entry)
        lesson.update!(content_status: "pending")
        lesson.exercises.destroy_all
        lesson.content_assets.destroy_all
        Studio::ContentBuildJob.perform_async(lesson.id, language_config.code)
        puts "  Queued rebuild: #{lesson.title}"
      end
    end

    def self.status(parser, language_config)
      lessons = parser.lessons
      counts = { ready: 0, building: 0, qa_review: 0, failed: 0, qa_failed: 0, pending: 0 }

      lessons.each do |entry|
        lesson = Lesson.find_by(title: entry[:lesson]["title"])
        status = lesson&.content_status || "pending"
        counts[status.to_sym] = (counts[status.to_sym] || 0) + 1
      end

      puts "Content Status for #{language_config.name}:"
      counts.each { |status, count| puts "  #{status}: #{count}" if count > 0 }
      puts "  Seed lessons: #{lessons.size}"

      puts "\nGeneration Targets:"
      (1..12).each do |pos|
        targets = parser.generation_targets_for(pos)
        next if targets.empty?

        target = targets["target_lessons"] || 0
        language = Language.find_by(code: parser.language)
        db_level = CurriculumLevel.find_by(language: language, position: pos) if language
        actual = db_level ? Lesson.joins(curriculum_unit: :curriculum_level)
                                   .where(curriculum_levels: { id: db_level.id }).count : 0
        pct = target > 0 ? (actual * 100.0 / target).round : 0
        bar = "#" * [pct / 5, 20].min + "." * [20 - pct / 5, 0].max
        puts "  L#{pos.to_s.rjust(2)}: #{actual.to_s.rjust(4)}/#{target.to_s.rjust(4)} [#{bar}] #{pct}%"
      end
    end

    def self.export(language_config, output_path)
      output_path ||= "output/#{language_config.code}_v1"
      exporter = Studio::ContentPackExporter.new(language_config: language_config)
      result = exporter.export(output_path)
      puts "Exported #{result[:lessons]} lessons and #{result[:assets]} assets to #{result[:path]}"
    end

    def self.find_or_create_lesson(entry)
      level_data = entry[:level]
      unit_data = entry[:unit]
      lesson_data = entry[:lesson]

      language = Language.find_by!(code: level_data.dig("language", "code") || "ja")
      level = CurriculumLevel.find_or_create_by!(language: language, position: level_data["position"]) do |l|
        l.title = level_data["title"]
        l.mext_grade = level_data["grade_equivalent"]
        l.jlpt_approx = level_data["test_equivalent"]
        l.description = level_data["description"]
      end

      unit = CurriculumUnit.find_or_create_by!(curriculum_level: level, position: unit_data["position"]) do |u|
        u.title = unit_data["title"]
        u.description = unit_data["description"]
        u.target_items = unit_data["target_items"] || {}
      end

      Lesson.find_or_create_by!(curriculum_unit: unit, position: lesson_data["position"]) do |l|
        l.title = lesson_data["title"]
        l.skill_type = lesson_data["skill_type"]
        l.objectives = lesson_data["objectives"] || []
        l.content_status = "pending"
      end
    end
    private_class_method :find_or_create_lesson
  end
end
