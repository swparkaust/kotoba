RSpec.describe AuthenticContentScaffolder do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:service) { described_class.new(router: router, language_config: language_config) }

  let(:valid_response) do
    '{
      "source_text": "日本の学校では給食があります。",
      "vocabulary_notes": [{"word": "給食", "reading": "きゅうしょく", "meaning": "学校で出る食事", "usage_example": "給食を食べる"}],
      "grammar_notes": [{"pattern": "〜があります", "explanation": "existence of inanimate things", "examples": ["本があります"]}],
      "comprehension_questions": [{"question": "日本の学校では何がありますか？", "answer": "給食があります", "difficulty": 2}],
      "metadata": {"difficulty_rating": 8, "topic": "school lunch"}
    }'
  end

  before do
    allow(router).to receive(:call).and_return(OpenStruct.new(text: valid_response))
  end

  describe "#scaffold" do
    it "calls the router with authentic_content_scaffolding task" do
      expect(router).to receive(:call).with(hash_including(task: :authentic_content_scaffolding))
      service.scaffold(source: "テスト", level: 8)
    end

    it "includes the source text in the prompt" do
      expect(router).to receive(:call).with(hash_including(prompt: a_string_including("テスト")))
      service.scaffold(source: "テスト", level: 8)
    end

    it "includes level in the prompt" do
      expect(router).to receive(:call).with(hash_including(prompt: a_string_including("8")))
      service.scaffold(source: "テスト", level: 8)
    end

    it "returns a ScaffoldedContent struct" do
      result = service.scaffold(source: "テスト", level: 8)
      expect(result).to be_a(AuthenticContentScaffolder::ScaffoldedContent)
    end

    it "parses vocabulary_notes from the response" do
      result = service.scaffold(source: "テスト", level: 8)
      expect(result.vocabulary_notes).to be_an(Array)
      expect(result.vocabulary_notes.first["word"]).to eq("給食")
    end

    it "parses comprehension questions from the response" do
      result = service.scaffold(source: "テスト", level: 8)
      expect(result.comprehension_questions).to be_an(Array)
      expect(result.comprehension_questions.first["question"]).to eq("日本の学校では何がありますか？")
    end
  end

  describe "error handling" do
    it "returns nil for malformed JSON response" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: "invalid"))
      result = service.scaffold(source: "テスト", level: 8)
      expect(result).to be_nil
    end

    it "returns nil for empty response" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: ""))
      result = service.scaffold(source: "テスト", level: 8)
      expect(result).to be_nil
    end
  end
end
