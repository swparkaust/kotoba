RSpec.describe ContrastiveGrammarGenerator do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:service) { described_class.new(router: router, language_config: language_config) }

  let(:valid_response) do
    '{
      "pattern_a": {
        "name": "は",
        "structure": "topic marker",
        "meaning": "marks the topic of a sentence",
        "usage_context": "introducing or contrasting topics"
      },
      "pattern_b": {
        "name": "が",
        "structure": "subject marker",
        "meaning": "marks the grammatical subject",
        "usage_context": "new information or emphasis"
      },
      "contrast_explanation": "は marks known/topical information while が introduces new or focused information.",
      "examples": [
        {
          "pattern": "a",
          "text": "わたしは学生です。",
          "reading": "わたしはがくせいです。",
          "translation": "I am a student.",
          "explanation": "は marks わたし as the topic"
        }
      ],
      "common_errors": [
        {
          "error": "Using は for new subjects in answers",
          "correction": "Use が when answering who/what questions",
          "explanation": "が is used for new information focus"
        }
      ],
      "exercises": [
        {
          "type": "choose_correct",
          "prompt": "わたし___学生です。",
          "options": ["は", "が"],
          "answer": "は",
          "explanation": "Introducing oneself uses topic marker は"
        }
      ],
      "metadata": {
        "difficulty": 2,
        "jlpt_level": "N5",
        "frequency": "high"
      }
    }'
  end

  before do
    allow(router).to receive(:call).and_return(OpenStruct.new(text: valid_response))
  end

  describe "#generate" do
    it "calls the router with contrastive_grammar_generation task" do
      expect(router).to receive(:call).with(hash_including(task: :contrastive_grammar_generation))
      service.generate(pattern_a: "は", pattern_b: "が", level: 2)
    end

    it "includes patterns in the prompt" do
      expect(router).to receive(:call).with(
        hash_including(prompt: a_string_including("は").and(a_string_including("が")))
      )
      service.generate(pattern_a: "は", pattern_b: "が", level: 2)
    end

    it "includes level in the prompt" do
      expect(router).to receive(:call).with(hash_including(prompt: a_string_including("2")))
      service.generate(pattern_a: "は", pattern_b: "が", level: 2)
    end

    it "returns a GrammarSet struct" do
      result = service.generate(pattern_a: "は", pattern_b: "が", level: 2)
      expect(result).to be_a(ContrastiveGrammarGenerator::GrammarSet)
    end

    it "parses pattern_a and pattern_b" do
      result = service.generate(pattern_a: "は", pattern_b: "が", level: 2)
      expect(result.pattern_a["name"]).to eq("は")
      expect(result.pattern_b["name"]).to eq("が")
    end

    it "parses contrast_explanation" do
      result = service.generate(pattern_a: "は", pattern_b: "が", level: 2)
      expect(result.contrast_explanation).to include("topic")
    end

    it "parses examples" do
      result = service.generate(pattern_a: "は", pattern_b: "が", level: 2)
      expect(result.examples).to be_an(Array)
      expect(result.examples.first["text"]).to include("学生")
    end

    it "parses common_errors" do
      result = service.generate(pattern_a: "は", pattern_b: "が", level: 2)
      expect(result.common_errors).to be_an(Array)
      expect(result.common_errors.first["error"]).to include("は")
    end

    it "parses exercises and metadata" do
      result = service.generate(pattern_a: "は", pattern_b: "が", level: 2)
      expect(result.exercises).to be_an(Array)
      expect(result.exercises.first["type"]).to eq("choose_correct")
      expect(result.metadata["jlpt_level"]).to eq("N5")
    end
  end

  describe "error handling" do
    it "returns nil for malformed JSON response" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: "not valid json"))
      result = service.generate(pattern_a: "は", pattern_b: "が", level: 2)
      expect(result).to be_nil
    end

    it "returns nil for empty response" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: ""))
      result = service.generate(pattern_a: "は", pattern_b: "が", level: 2)
      expect(result).to be_nil
    end
  end
end
