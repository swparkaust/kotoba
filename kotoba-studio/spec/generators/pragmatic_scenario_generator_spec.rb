RSpec.describe PragmaticScenarioGenerator do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:service) { described_class.new(router: router, language_config: language_config) }

  let(:valid_response) do
    '{
      "title": "レストランで注文する",
      "context": "You are at a Japanese restaurant ordering food.",
      "dialogue": [
        {
          "speaker": "店員",
          "text": "いらっしゃいませ。ご注文はお決まりですか？",
          "reading": "いらっしゃいませ。ごちゅうもんはおきまりですか？",
          "translation": "Welcome. Have you decided on your order?",
          "register": "formal",
          "notes": "Standard polite greeting in restaurants"
        }
      ],
      "vocabulary": [
        { "word": "注文", "reading": "ちゅうもん", "meaning": "order", "register": "neutral" }
      ],
      "grammar_focus": ["〜はお決まりですか", "〜をお願いします"],
      "cultural_notes": "In Japan, you call the waiter by saying すみません.",
      "variations": [
        { "context": "casual restaurant", "dialogue_change": "Use casual speech" }
      ],
      "metadata": {
        "difficulty": 3,
        "register": "formal",
        "situation_type": "restaurant"
      }
    }'
  end

  before do
    allow(router).to receive(:call).and_return(OpenStruct.new(text: valid_response))
  end

  describe "#generate" do
    it "calls the router with pragmatic_scenario_generation task" do
      expect(router).to receive(:call).with(hash_including(task: :pragmatic_scenario_generation))
      service.generate(level: 5, theme: "food", situation: "ordering at a restaurant")
    end

    it "includes level in the prompt" do
      expect(router).to receive(:call).with(hash_including(prompt: a_string_including("5")))
      service.generate(level: 5, theme: "food", situation: "ordering at a restaurant")
    end

    it "includes theme and situation in the prompt" do
      expect(router).to receive(:call).with(
        hash_including(prompt: a_string_including("food").and(a_string_including("ordering at a restaurant")))
      )
      service.generate(level: 5, theme: "food", situation: "ordering at a restaurant")
    end

    it "returns a Scenario struct" do
      result = service.generate(level: 5, theme: "food", situation: "ordering at a restaurant")
      expect(result).to be_a(PragmaticScenarioGenerator::Scenario)
    end

    it "parses title and context" do
      result = service.generate(level: 5, theme: "food", situation: "ordering at a restaurant")
      expect(result.title).to eq("レストランで注文する")
      expect(result.context).to eq("You are at a Japanese restaurant ordering food.")
    end

    it "parses dialogue" do
      result = service.generate(level: 5, theme: "food", situation: "ordering at a restaurant")
      expect(result.dialogue).to be_an(Array)
      expect(result.dialogue.first["speaker"]).to eq("店員")
    end

    it "parses vocabulary" do
      result = service.generate(level: 5, theme: "food", situation: "ordering at a restaurant")
      expect(result.vocabulary).to be_an(Array)
      expect(result.vocabulary.first["word"]).to eq("注文")
    end

    it "parses grammar_focus and cultural_notes" do
      result = service.generate(level: 5, theme: "food", situation: "ordering at a restaurant")
      expect(result.grammar_focus).to eq(["〜はお決まりですか", "〜をお願いします"])
      expect(result.cultural_notes).to include("すみません")
    end

    it "parses variations and metadata" do
      result = service.generate(level: 5, theme: "food", situation: "ordering at a restaurant")
      expect(result.variations).to be_an(Array)
      expect(result.metadata["difficulty"]).to eq(3)
    end
  end

  describe "error handling" do
    it "returns nil for malformed JSON response" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: "not valid json"))
      result = service.generate(level: 5, theme: "food", situation: "ordering")
      expect(result).to be_nil
    end

    it "returns nil for empty response" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: ""))
      result = service.generate(level: 5, theme: "food", situation: "ordering")
      expect(result).to be_nil
    end
  end
end
