require "tmpdir"
require "time"

unless nil.respond_to?(:present?)
  class NilClass; def present? = false; end
  class String; def present? = !empty?; end
end

RSpec.describe Studio::ContentPackExporter do
  let(:language_config) do
    LanguageConfig.load(language_code: "ja")
  end

  let(:language) { double("Language", code: "ja") }

  let(:lesson_double) do
    double("Lesson",
      position: 1, title: "Lesson 1", skill_type: "character_intro",
      objectives: ["Recognize あ"], content_status: "ready")
  end

  let(:unit_double) do
    lessons_relation = double("LessonsRelation")
    allow(lessons_relation).to receive(:order).with(:position).and_return([lesson_double])
    double("CurriculumUnit",
      position: 1, title: "Unit 1", description: "The five vowels",
      target_items: { "characters" => ["あ"] }, lessons: lessons_relation)
  end

  let(:level_double) do
    units_relation = double("UnitsRelation")
    allow(units_relation).to receive(:order).with(:position).and_return([unit_double])
    double("CurriculumLevel",
      position: 1, title: "Level 1", mext_grade: "Grade 1",
      jlpt_approx: "Pre-N5", description: "Hiragana basics",
      curriculum_units: units_relation)
  end

  let(:exercise_lesson_double) do
    unit_for_ex = double("UnitForExercise", position: 1, curriculum_level: double("LevelForExercise", position: 1))
    double("LessonForExercise", position: 1, curriculum_unit: unit_for_ex)
  end

  let(:exercise_double) do
    double("Exercise",
      id: 1, lesson_id: 1, position: 1, exercise_type: "multiple_choice",
      content: { "prompt" => "test" }, difficulty: "easy",
      lesson: exercise_lesson_double)
  end

  let(:asset_double) do
    double("ContentAsset",
      id: 1, lesson_id: 1, asset_type: "illustration_png",
      asset_key: "illustration_1", url: nil, data: "PNG_DATA".b)
  end

  before do
    stub_const("Language", Class.new { def self.find_by!(**); end })
    stub_const("CurriculumLevel", Class.new { def self.where(**); end })
    stub_const("Exercise", Class.new { def self.joins(*); end })
    stub_const("ContentAsset", Class.new { def self.joins(*); end })
    stub_const("ContentPackVersion", Class.new { def self.where(**); end })
    stub_const("Lesson", Class.new { def self.joins(*); end })

    allow(Language).to receive(:find_by!).with(code: "ja").and_return(language)

    levels_query = double("LevelsQuery")
    allow(CurriculumLevel).to receive(:where).and_return(levels_query)
    allow(levels_query).to receive(:order).and_return(levels_query)
    allow(levels_query).to receive(:includes).and_return([level_double])
    allow(levels_query).to receive(:map) { |&block| [level_double].map(&block) }

    exercises_query = double("ExercisesQuery")
    allow(Exercise).to receive(:joins).and_return(exercises_query)
    allow(exercises_query).to receive(:where).and_return(exercises_query)
    allow(exercises_query).to receive(:includes).and_return(exercises_query)
    allow(exercises_query).to receive(:map) { |&block| [exercise_double].map(&block) }

    stub_const("LibraryItem", Class.new { def self.where(**); end })
    library_query = double("LibraryQuery")
    allow(LibraryItem).to receive(:where).and_return(library_query)
    allow(library_query).to receive(:map) { |&block| [].map(&block) }

    assets_query = double("AssetsQuery")
    allow(ContentAsset).to receive(:joins).and_return(assets_query)
    allow(assets_query).to receive(:where).and_return(assets_query)
    allow(assets_query).to receive(:to_a).and_return([asset_double])
    allow(assets_query).to receive(:each) { |&block| [asset_double].each(&block) }
    allow(assets_query).to receive(:map) { |&block| [asset_double].map(&block) }
    allow(assets_query).to receive(:count).and_return(1)

    lessons_query = double("LessonsQuery")
    allow(Lesson).to receive(:joins).and_return(lessons_query)
    allow(lessons_query).to receive(:where).and_return(lessons_query)
    allow(lessons_query).to receive(:count).and_return(1)

    allow(ContentPackVersion).to receive(:where).and_return(double(maximum: 0))
  end

  describe "#export" do
    it "creates manifest.json in the output directory" do
      Dir.mktmpdir do |dir|
        exporter = described_class.new(language_config: language_config)
        exporter.export(dir)

        manifest_path = File.join(dir, "manifest.json")
        expect(File.exist?(manifest_path)).to be true

        manifest = JSON.parse(File.read(manifest_path))
        expect(manifest["language_code"]).to eq("ja")
        expect(manifest["language_name"]).to eq("Japanese")
        expect(manifest["format_version"]).to eq(1)
        expect(manifest["content_version"]).to eq(1)
        expect(manifest["lesson_count"]).to eq(1)
        expect(manifest["asset_count"]).to eq(1)
      end
    end

    it "creates curriculum.json with level and unit structure" do
      Dir.mktmpdir do |dir|
        exporter = described_class.new(language_config: language_config)
        exporter.export(dir)

        curriculum_path = File.join(dir, "curriculum.json")
        expect(File.exist?(curriculum_path)).to be true

        curriculum = JSON.parse(File.read(curriculum_path))
        expect(curriculum["native_name"]).to eq("日本語")
        expect(curriculum["levels"].size).to eq(1)
        expect(curriculum["levels"][0]["position"]).to eq(1)
        expect(curriculum["levels"][0]["units"].size).to eq(1)
        expect(curriculum["levels"][0]["units"][0]["lessons"].size).to eq(1)
      end
    end

    it "creates exercises.json with exercise data" do
      Dir.mktmpdir do |dir|
        exporter = described_class.new(language_config: language_config)
        exporter.export(dir)

        exercises_path = File.join(dir, "exercises.json")
        expect(File.exist?(exercises_path)).to be true

        exercises = JSON.parse(File.read(exercises_path))
        expect(exercises.size).to eq(1)
        ex = exercises[0]
        expect(ex["exercise_type"]).to eq("multiple_choice")
        expect(ex["level_position"]).to eq(1)
        expect(ex["unit_position"]).to eq(1)
        expect(ex["lesson_position"]).to eq(1)
        expect(ex["position"]).to eq(1)
        expect(ex["content"]).to eq({ "prompt" => "test" })
        expect(ex["difficulty"]).to eq("easy")
        expect(ex).not_to have_key("id")
        expect(ex).not_to have_key("lesson_id")
      end
    end

    it "writes asset binary data to the assets directory" do
      Dir.mktmpdir do |dir|
        exporter = described_class.new(language_config: language_config)
        exporter.export(dir)

        asset_file = File.join(dir, "assets", "illustration_1.png")
        expect(File.exist?(asset_file)).to be true
        expect(File.binread(asset_file)).to eq("PNG_DATA".b)
      end
    end

    it "creates assets/index.json with asset metadata" do
      Dir.mktmpdir do |dir|
        exporter = described_class.new(language_config: language_config)
        exporter.export(dir)

        index_path = File.join(dir, "assets", "index.json")
        expect(File.exist?(index_path)).to be true

        index = JSON.parse(File.read(index_path))
        expect(index.size).to eq(1)
        expect(index[0]["type"]).to eq("illustration_png")
        expect(index[0]["key"]).to eq("illustration_1")
      end
    end

    it "returns a summary hash with path, lessons, and assets" do
      Dir.mktmpdir do |dir|
        exporter = described_class.new(language_config: language_config)
        result = exporter.export(dir)

        expect(result[:path]).to eq(dir)
        expect(result[:lessons]).to eq(1)
        expect(result[:assets]).to eq(1)
      end
    end
  end
end
