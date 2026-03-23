RSpec.describe Studio::CurriculumParser do
  let(:curriculum_path) { File.expand_path("../curricula/ja/curriculum.yml", __dir__) }
  let(:art_direction_path) { File.expand_path("../config/art_direction.yml", __dir__) }

  let(:parser) do
    described_class.new(
      language: "ja",
      curriculum_path: curriculum_path,
      art_direction_path: art_direction_path
    )
  end

  describe "#lessons" do
    it "returns an array of hashes with level, unit, and lesson keys" do
      lessons = parser.lessons
      expect(lessons).to be_an(Array)
      expect(lessons).not_to be_empty
      expect(lessons.first).to have_key(:level)
      expect(lessons.first).to have_key(:unit)
      expect(lessons.first).to have_key(:lesson)
    end

    it "contains lesson data from the YAML curriculum" do
      first_lesson = parser.lessons.first[:lesson]
      expect(first_lesson["title"]).to eq("Lesson 1 — あ (a)")
      expect(first_lesson["skill_type"]).to eq("character_intro")
      expect(first_lesson["objectives"]).to be_an(Array)
    end

    it "preserves the level and unit context for each lesson" do
      first = parser.lessons.first
      expect(first[:level]["position"]).to eq(1)
      expect(first[:level]["title"]).to include("Hiragana")
      expect(first[:unit]["position"]).to eq(1)
      expect(first[:unit]["title"]).to include("Vowels")
    end

    it "flattens lessons across all levels and units" do
      lessons = parser.lessons
      level_positions = lessons.map { |l| l[:level]["position"] }.uniq
      expect(level_positions.size).to be > 1
    end
  end

  describe "#generation_targets_for" do
    it "returns target config for a level with generation_targets" do
      targets = parser.generation_targets_for(1)
      expect(targets).to be_a(Hash)
      expect(targets["target_lessons"]).to be_a(Integer)
      expect(targets["target_lessons"]).to be > 0
    end

    it "returns an empty hash for a nonexistent level" do
      targets = parser.generation_targets_for(999)
      expect(targets).to eq({})
    end

    it "includes vocab and grammar targets" do
      targets = parser.generation_targets_for(1)
      expect(targets).to have_key("target_vocab")
      expect(targets).to have_key("target_grammar")
    end
  end

  describe "#seed_lessons_for" do
    it "returns only lessons for the specified level position" do
      level1_lessons = parser.seed_lessons_for(1)
      expect(level1_lessons).to be_an(Array)
      expect(level1_lessons).not_to be_empty
      level1_lessons.each do |entry|
        expect(entry[:level]["position"]).to eq(1)
      end
    end

    it "returns an empty array for a nonexistent level" do
      expect(parser.seed_lessons_for(999)).to eq([])
    end

    it "returns fewer lessons than the total across all levels" do
      all_lessons = parser.lessons
      level1_lessons = parser.seed_lessons_for(1)
      expect(level1_lessons.size).to be < all_lessons.size
    end
  end

  describe "#levels" do
    it "returns the parsed levels from the curriculum" do
      expect(parser.levels).to be_an(Array)
      expect(parser.levels.first["position"]).to eq(1)
      expect(parser.levels.first["title"]).to include("Hiragana")
    end
  end

  describe "#generation_config" do
    it "returns generation configuration from the curriculum" do
      config = parser.generation_config
      expect(config).to be_a(Hash)
      expect(config["exercises_per_lesson"]).to eq(20)
      expect(config["target_total_lessons"]).to eq(1400)
    end
  end

  describe "#deficit_for" do
    it "returns the difference between target and seed lesson count" do
      targets = parser.generation_targets_for(1)
      seed_count = parser.seed_lessons_for(1).size
      expected_deficit = [targets["target_lessons"] - seed_count, 0].max
      expect(parser.deficit_for(1)).to eq(expected_deficit)
    end

    it "returns zero for a level with no generation targets" do
      expect(parser.deficit_for(999)).to eq(0)
    end
  end

  describe "#library_progression" do
    it "returns the library progression hash from the curriculum" do
      progression = parser.library_progression
      expect(progression).to be_a(Hash)
      expect(progression).not_to be_empty
    end

    it "contains level band entries with type and word_count" do
      progression = parser.library_progression
      entry = progression["levels_1_2"]
      expect(entry).to be_a(Hash)
      expect(entry["type"]).to eq("graded_reader")
      expect(entry["word_count"]).to eq("100-500")
    end

    it "returns an empty hash when key is missing" do
      allow(parser).to receive(:library_progression).and_call_original
      curriculum = { "language" => {} }
      stub_parser = described_class.new(
        language: "ja",
        curriculum_path: File.expand_path("../curricula/ja/curriculum.yml", __dir__),
        art_direction_path: File.expand_path("../config/art_direction.yml", __dir__)
      )
      allow(stub_parser.instance_variable_get(:@curriculum)).to receive(:dig).with("language", "library_progression").and_return(nil)
      expect(stub_parser.library_progression).to eq({})
    end
  end
end
