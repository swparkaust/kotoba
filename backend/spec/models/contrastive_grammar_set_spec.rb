require 'rails_helper'

RSpec.describe ContrastiveGrammarSet, type: :model do
  it { is_expected.to belong_to(:lesson) }
  it { is_expected.to validate_presence_of(:cluster_name) }
  it { is_expected.to validate_presence_of(:patterns) }
  it { is_expected.to validate_presence_of(:exercises) }
  it { is_expected.to validate_presence_of(:confusion_notes) }
  it { is_expected.to validate_presence_of(:difficulty_level) }

  describe "#pattern_names" do
    it "extracts pattern strings from patterns array" do
      set = build(:contrastive_grammar_set, patterns: [
        { "pattern" => "〜ても", "usage_ja" => "仮定的" },
        { "pattern" => "〜のに", "usage_ja" => "事実" }
      ])
      expect(set.pattern_names).to eq(["〜ても", "〜のに"])
    end
  end

  describe "#evaluate_answer" do
    let(:set) do
      build(:contrastive_grammar_set,
        exercises: [
          { "context" => "早く起きた___遅刻した", "correct" => "のに" }
        ],
        confusion_notes: { "explanation" => "「のに」は事実に対して使います" }
      )
    end

    it "returns correct for matching answer" do
      result = set.evaluate_answer(0, "のに")
      expect(result[:correct]).to be true
      expect(result[:feedback]).to include("正解")
    end

    it "returns incorrect with explanation for wrong answer" do
      result = set.evaluate_answer(0, "ても")
      expect(result[:correct]).to be false
      expect(result[:expected]).to eq("のに")
      expect(result[:feedback]).to include("のに")
    end

    it "handles invalid exercise index" do
      result = set.evaluate_answer(99, "answer")
      expect(result[:correct]).to be false
    end
  end

  describe "scopes" do
    it ".search_cluster finds by partial name" do
      set = create(:contrastive_grammar_set, cluster_name: "〜ても vs 〜のに")
      expect(ContrastiveGrammarSet.search_cluster("ても")).to include(set)
    end

    it ".for_level_range filters by difficulty" do
      easy = create(:contrastive_grammar_set, difficulty_level: 4)
      hard = create(:contrastive_grammar_set, difficulty_level: 10)
      expect(ContrastiveGrammarSet.for_level_range(1, 6)).to include(easy)
      expect(ContrastiveGrammarSet.for_level_range(1, 6)).not_to include(hard)
    end

    it ".by_difficulty filters by exact difficulty level" do
      level4 = create(:contrastive_grammar_set, difficulty_level: 4)
      level8 = create(:contrastive_grammar_set, difficulty_level: 8)
      expect(ContrastiveGrammarSet.by_difficulty(4)).to include(level4)
      expect(ContrastiveGrammarSet.by_difficulty(4)).not_to include(level8)
    end
  end

  describe "#pattern_count" do
    it "returns the number of patterns" do
      set = build(:contrastive_grammar_set, patterns: [
        { "pattern" => "〜ても", "usage_ja" => "仮定的" },
        { "pattern" => "〜のに", "usage_ja" => "事実" }
      ])
      expect(set.pattern_count).to eq(2)
    end

    it "returns 0 when patterns is nil" do
      set = build(:contrastive_grammar_set)
      set.patterns = nil
      expect(set.pattern_count).to eq(0)
    end
  end

  describe "#exercise_count" do
    it "returns the number of exercises" do
      set = build(:contrastive_grammar_set, exercises: [
        { "context" => "a", "correct" => "ても" },
        { "context" => "b", "correct" => "のに" },
        { "context" => "c", "correct" => "ても" }
      ])
      expect(set.exercise_count).to eq(3)
    end

    it "returns 0 when exercises is nil" do
      set = build(:contrastive_grammar_set)
      set.exercises = nil
      expect(set.exercise_count).to eq(0)
    end
  end

  describe "#confusion_explanation" do
    it "extracts explanation from confusion_notes" do
      set = build(:contrastive_grammar_set, confusion_notes: { "explanation" => "大事な違い" })
      expect(set.confusion_explanation).to eq("大事な違い")
    end

    it "returns nil when confusion_notes is nil" do
      set = build(:contrastive_grammar_set)
      set.confusion_notes = nil
      expect(set.confusion_explanation).to be_nil
    end

    it "returns nil when explanation key is missing" do
      set = build(:contrastive_grammar_set, confusion_notes: { "other" => "value" })
      expect(set.confusion_explanation).to be_nil
    end
  end
end
