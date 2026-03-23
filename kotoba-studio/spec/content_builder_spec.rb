RSpec.describe LanguageConfig do
  describe ".load" do
    let(:config) { LanguageConfig.load(language_code: "ja") }

    it "returns a LanguageConfig instance" do
      expect(config).to be_a(LanguageConfig)
    end

    it "has the correct language code" do
      expect(config.code).to eq("ja")
    end

    it "has the correct language name" do
      expect(config.name).to eq("Japanese")
    end

    it "has the correct native name" do
      expect(config.native_name).to eq("日本語")
    end

    it "has script systems including hiragana, katakana, and kanji" do
      expect(config.script_systems).to include("hiragana", "katakana", "kanji")
    end

    it "has official curriculum set to MEXT Kokugo" do
      expect(config.official_curriculum).to eq("MEXT Kokugo")
    end

    it "has equivalence test set to JLPT" do
      expect(config.equivalence_test).to eq("JLPT")
    end

    it "has teaching bands for beginner, intermediate, and advanced" do
      expect(config.teaching_bands).to eq(
        beginner: 1..4, intermediate: 5..8, advanced: 9..12
      )
    end

    it "has art direction merged from language-specific and default config" do
      expect(config.art_direction).to be_a(Hash)
      expect(config.art_direction["style"]).to include("watercolor")
      expect(config.art_direction["style_reference"]).to include("Ghibli")
    end

    it "has voice profiles" do
      expect(config.voice_profiles).to be_a(Hash)
    end

    it "has no_english_rule set to true" do
      expect(config.no_english_rule).to be true
    end

    it "has classical_variant set to classical_japanese" do
      expect(config.classical_variant).to eq("classical_japanese")
    end

    it "loads grade characters from kanji_grades.yml" do
      expect(config.grade_characters).to be_a(Hash)
    end

    describe "#skill_type_map" do
      it "has all 15 skill types" do
        expect(config.skill_type_map.keys.size).to eq(15)
      end

      it "includes character_intro with trace exercise type" do
        expect(config.skill_type_map["character_intro"]).to include("trace")
      end

      it "includes grammar with fill_blank and reorder" do
        expect(config.skill_type_map["grammar"]).to include("fill_blank", "reorder")
      end

      it "includes reading with multiple_choice" do
        expect(config.skill_type_map["reading"]).to include("multiple_choice")
      end

      it "includes listening with listening exercise type" do
        expect(config.skill_type_map["listening"]).to include("listening")
      end

      it "includes classical_japanese" do
        expect(config.skill_type_map).to have_key("classical_japanese")
      end

      it "includes all expected skill type keys" do
        expected_keys = %w[
          character_intro drill kanji_intro grammar_intro vocabulary
          grammar reading listening writing speaking review
          authentic_reading pragmatics contrastive_grammar classical_japanese
        ]
        expect(config.skill_type_map.keys).to match_array(expected_keys)
      end

      it "maps each skill type to an array of exercise types" do
        config.skill_type_map.each_value do |types|
          expect(types).to be_an(Array)
          expect(types).not_to be_empty
        end
      end
    end
  end
end
