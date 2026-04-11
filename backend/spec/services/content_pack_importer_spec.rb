require 'rails_helper'

RSpec.describe ContentPackImporter, type: :service do
  let(:pack_dir) { Dir.mktmpdir }

  after { FileUtils.rm_rf(pack_dir) }

  def write_manifest(dir, overrides = {})
    manifest = {
      format_version: 1,
      language_code: "ja",
      language_name: "Japanese",
      content_version: 1,
      lesson_count: 1,
      asset_count: 0
    }.merge(overrides)
    File.write(File.join(dir, "manifest.json"), manifest.to_json)
  end

  def write_curriculum(dir, overrides = {})
    curriculum = {
      native_name: "日本語",
      levels: [
        {
          position: 1,
          title: "Level 1",
          grade_equivalent: "Grade 1",
          test_equivalent: "N5",
          description: "Beginner level",
          units: [
            {
              position: 1,
              title: "Unit 1",
              description: "First unit",
              target_items: { characters: [ "あ" ] },
              lessons: [
                {
                  position: 1,
                  title: "Lesson 1",
                  skill_type: "character_intro",
                  objectives: [ "Learn あ" ]
                }
              ]
            }
          ]
        }
      ]
    }.deep_merge(overrides)
    File.write(File.join(dir, "curriculum.json"), curriculum.to_json)
  end

  describe "#validate!" do
    it "raises on invalid format_version" do
      write_manifest(pack_dir, format_version: 99)
      write_curriculum(pack_dir)
      importer = described_class.new(path: pack_dir)
      expect { importer.validate! }.to raise_error(RuntimeError, "Invalid format version")
    end

    it "raises when curriculum.json is missing" do
      write_manifest(pack_dir)
      importer = described_class.new(path: pack_dir)
      expect { importer.validate! }.to raise_error(RuntimeError, "Missing curriculum.json")
    end

    it "does not raise for valid pack" do
      write_manifest(pack_dir)
      write_curriculum(pack_dir)
      importer = described_class.new(path: pack_dir)
      expect { importer.validate! }.not_to raise_error
    end
  end

  describe "#import!" do
    before do
      write_manifest(pack_dir)
      write_curriculum(pack_dir)
    end

    it "creates Language record" do
      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(Language.find_by(code: "ja")).to be_present
      expect(Language.find_by(code: "ja").name).to eq("Japanese")
    end

    it "creates ContentPackVersion record" do
      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(ContentPackVersion.count).to eq(1)
      expect(ContentPackVersion.last.status).to eq("ready")
      expect(ContentPackVersion.last.published_at).to be_present
    end

    it "creates CurriculumLevel record" do
      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(CurriculumLevel.count).to eq(1)
      level = CurriculumLevel.last
      expect(level.position).to eq(1)
      expect(level.title).to eq("Level 1")
      expect(level.mext_grade).to eq("Grade 1")
    end

    it "creates CurriculumUnit record" do
      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(CurriculumUnit.count).to eq(1)
      unit = CurriculumUnit.last
      expect(unit.position).to eq(1)
      expect(unit.title).to eq("Unit 1")
    end

    it "creates Lesson record" do
      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(Lesson.count).to eq(1)
      lesson = Lesson.last
      expect(lesson.position).to eq(1)
      expect(lesson.title).to eq("Lesson 1")
      expect(lesson.skill_type).to eq("character_intro")
      expect(lesson.content_status).to eq("ready")
    end

    it "is idempotent — importing twice does not duplicate curriculum records" do
      described_class.new(path: pack_dir).import!
      write_manifest(pack_dir, content_version: 2)
      described_class.new(path: pack_dir).import!
      expect(Language.where(code: "ja").count).to eq(1)
      expect(CurriculumLevel.count).to eq(1)
      expect(CurriculumUnit.count).to eq(1)
      expect(Lesson.count).to eq(1)
      expect(ContentPackVersion.count).to eq(2)
    end

    it "tracks stats for imported records" do
      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(importer.stats[:levels]).to eq(1)
      expect(importer.stats[:lessons]).to eq(1)
    end

    it "imports exercises from exercises.json using position matching" do
      exercises = [
        { level_position: 1, unit_position: 1, lesson_position: 1, position: 1,
          exercise_type: "multiple_choice", content: { "prompt" => "test", "options" => %w[a b], "correct_answer" => "a" },
          difficulty: "normal" }
      ]
      File.write(File.join(pack_dir, "exercises.json"), exercises.to_json)

      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(Exercise.count).to eq(1)
      expect(Exercise.last.exercise_type).to eq("multiple_choice")
      expect(Exercise.last.qa_status).to eq("passed")
      expect(importer.stats[:exercises]).to eq(1)
    end

    it "skips exercises with non-existent curriculum positions" do
      exercises = [
        { level_position: 99, unit_position: 1, lesson_position: 1, position: 1,
          exercise_type: "fill_blank", content: { "prompt" => "test" }, difficulty: "normal" }
      ]
      File.write(File.join(pack_dir, "exercises.json"), exercises.to_json)

      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(Exercise.count).to eq(0)
    end

    it "imports library items from library.json" do
      library = [
        { item_type: "graded_reader", title: "桃太郎", body_text: "むかしむかし",
          audio_url: nil, attribution: "Folk tale", license: "public_domain",
          difficulty_level: 5, word_count: 800, glosses: [] }
      ]
      File.write(File.join(pack_dir, "library.json"), library.to_json)

      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(LibraryItem.count).to eq(1)
      expect(LibraryItem.last.title).to eq("桃太郎")
      expect(LibraryItem.last.item_type).to eq("graded_reader")
    end

    it "imports library items with audio_url" do
      library = [
        { item_type: "podcast", title: "ニュース", body_text: "きょうのニュース",
          audio_url: "/audio/news.mp3", attribution: "NHK", license: "public_domain",
          difficulty_level: 3, word_count: 200, glosses: [] }
      ]
      File.write(File.join(pack_dir, "library.json"), library.to_json)

      importer = described_class.new(path: pack_dir)
      importer.import!
      expect(LibraryItem.last.audio_url).to eq("/audio/news.mp3")
    end
  end
end
