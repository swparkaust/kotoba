RSpec.describe KanjiConstraint do
  let(:language_config) { LanguageConfig.load(language_code: "ja") }

  let(:test_class) do
    Class.new do
      include KanjiConstraint

      def initialize(lang)
        @lang = lang
      end
    end
  end

  let(:instance) { test_class.new(language_config) }

  describe "#kanji_constraint_for_level" do
    it "returns a no-kanji rule for level 1" do
      result = instance.kanji_constraint_for_level(1)
      expect(result).to include("No kanji")
      expect(result).to include("hiragana")
    end

    it "includes Grade 1 kanji for level 2" do
      result = instance.kanji_constraint_for_level(2)
      expect(result).to include("KANJI RULE")
      expect(result).to include("kanji have been taught")
    end

    it "returns empty string for level 8 and above" do
      result = instance.kanji_constraint_for_level(8)
      expect(result).to eq("")
    end

    it "returns empty string for level 10" do
      result = instance.kanji_constraint_for_level(10)
      expect(result).to eq("")
    end

    it "returns empty string for nil level" do
      result = instance.kanji_constraint_for_level(nil)
      expect(result).to eq("")
    end

    it "returns a constraint for level 5" do
      result = instance.kanji_constraint_for_level(5)
      expect(result).to include("KANJI RULE")
    end

    it "returns a constraint for level 7" do
      result = instance.kanji_constraint_for_level(7)
      expect(result).to include("KANJI RULE")
    end
  end
end
