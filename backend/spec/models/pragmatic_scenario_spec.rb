require 'rails_helper'

RSpec.describe PragmaticScenario, type: :model do
  it { is_expected.to belong_to(:lesson) }
  it { is_expected.to validate_presence_of(:title) }
  it { is_expected.to validate_presence_of(:situation_ja) }
  it { is_expected.to validate_presence_of(:cultural_topic) }

  describe "cultural_topic validation" do
    it "accepts valid topics" do
      scenario = build(:pragmatic_scenario, cultural_topic: "refusal")
      expect(scenario).to be_valid
    end

    it "rejects invalid topics" do
      scenario = build(:pragmatic_scenario, cultural_topic: "nonsense")
      expect(scenario).not_to be_valid
    end
  end

  describe "#speakers" do
    it "extracts unique speaker names from dialogue" do
      scenario = build(:pragmatic_scenario, dialogue: [
        { "speaker" => "上司", "text" => "飲みに行かない？" },
        { "speaker" => "部下", "text" => "ちょっと..." },
        { "speaker" => "上司", "text" => "そう？" }
      ])
      expect(scenario.speakers).to eq(["上司", "部下"])
    end
  end

  describe "#best_choice" do
    it "returns the choice with highest score" do
      scenario = build(:pragmatic_scenario, choices: [
        { "response" => "いいえ", "score" => 20 },
        { "response" => "ちょっと...", "score" => 100 },
        { "response" => "行きます", "score" => 50 }
      ])
      expect(scenario.best_choice["response"]).to eq("ちょっと...")
    end
  end

  describe "#evaluate_choice" do
    let(:scenario) do
      build(:pragmatic_scenario,
        choices: [
          { "response" => "はい", "score" => 100, "feedback" => "完璧です" },
          { "response" => "いいえ", "score" => 30 }
        ],
        analysis: { "rule" => "丁寧に断る" }
      )
    end

    it "returns score and feedback for a matching choice" do
      result = scenario.evaluate_choice("はい")
      expect(result[:score]).to eq(100)
      expect(result[:is_best]).to be true
    end

    it "returns 0 score for unrecognized choice" do
      result = scenario.evaluate_choice("unknown")
      expect(result[:score]).to eq(0)
    end
  end

  describe "scopes" do
    it ".by_topic filters by cultural topic" do
      refusal = create(:pragmatic_scenario, cultural_topic: "refusal")
      apology = create(:pragmatic_scenario, cultural_topic: "apology")
      expect(PragmaticScenario.by_topic("refusal")).to include(refusal)
      expect(PragmaticScenario.by_topic("refusal")).not_to include(apology)
    end

    it ".for_level_range filters by difficulty" do
      easy = create(:pragmatic_scenario, difficulty_level: 3)
      hard = create(:pragmatic_scenario, difficulty_level: 10)
      expect(PragmaticScenario.for_level_range(1, 5)).to include(easy)
      expect(PragmaticScenario.for_level_range(1, 5)).not_to include(hard)
    end

    it ".by_difficulty filters by exact difficulty level" do
      level3 = create(:pragmatic_scenario, difficulty_level: 3)
      level10 = create(:pragmatic_scenario, difficulty_level: 10)
      expect(PragmaticScenario.by_difficulty(3)).to include(level3)
      expect(PragmaticScenario.by_difficulty(3)).not_to include(level10)
    end
  end

  describe "#choice_count" do
    it "returns the number of choices" do
      scenario = build(:pragmatic_scenario, choices: [
        { "response" => "はい", "score" => 100 },
        { "response" => "いいえ", "score" => 30 },
        { "response" => "ちょっと...", "score" => 80 }
      ])
      expect(scenario.choice_count).to eq(3)
    end

    it "returns 0 when choices is nil" do
      scenario = build(:pragmatic_scenario)
      scenario.choices = nil
      expect(scenario.choice_count).to eq(0)
    end
  end

  describe "#cultural_rule" do
    it "extracts rule from analysis" do
      scenario = build(:pragmatic_scenario, analysis: { "rule" => "丁寧に断る" })
      expect(scenario.cultural_rule).to eq("丁寧に断る")
    end

    it "returns nil when analysis is nil" do
      scenario = build(:pragmatic_scenario)
      scenario.analysis = nil
      expect(scenario.cultural_rule).to be_nil
    end

    it "returns nil when rule key is missing" do
      scenario = build(:pragmatic_scenario, analysis: { "other" => "value" })
      expect(scenario.cultural_rule).to be_nil
    end
  end

  describe "#explanation" do
    it "extracts explanation from analysis" do
      scenario = build(:pragmatic_scenario, analysis: { "explanation" => "詳しい説明" })
      expect(scenario.explanation).to eq("詳しい説明")
    end

    it "returns nil when analysis is nil" do
      scenario = build(:pragmatic_scenario)
      scenario.analysis = nil
      expect(scenario.explanation).to be_nil
    end
  end
end
