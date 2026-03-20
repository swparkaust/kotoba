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
              target_items: { characters: ["あ"] },
              lessons: [
                {
                  position: 1,
                  title: "Lesson 1",
                  skill_type: "character_intro",
                  objectives: ["Learn あ"]
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
  end
end
