require 'rails_helper'

RSpec.describe AiModelRouter do
  let(:provider) { instance_double(AiProviders::Base) }
  let(:router) { described_class.new(provider: provider) }

  describe "#call" do
    before do
      allow(provider).to receive(:complete).and_return(
        AiResponse.new(text: "response", model: "claude-opus-4-20250514", provider: "anthropic")
      )
    end

    it "routes an advanced task to the advanced model" do
      expect(provider).to receive(:complete).with(hash_including(model: "claude-opus-4-20250514"))
      router.call(task: :lesson_content_generation, system: "sys", prompt: "go")
    end

    it "routes a standard task to the standard model" do
      expect(provider).to receive(:complete).with(hash_including(model: "claude-sonnet-4-20250514"))
      router.call(task: :hint_feedback, system: "sys", prompt: "go")
    end

    it "raises ArgumentError for unknown task" do
      expect { router.call(task: :nonexistent_task, system: "sys", prompt: "go") }
        .to raise_error(ArgumentError, /Unknown AI task/)
    end

    it "returns an AiResponse with the task set" do
      result = router.call(task: :writing_evaluation, system: "sys", prompt: "go")
      expect(result).to be_a(AiResponse)
      expect(result.task).to eq(:writing_evaluation)
    end

    it "passes system, prompt, and max_tokens to the provider" do
      expect(provider).to receive(:complete).with(
        model: "claude-sonnet-4-20250514",
        system: "be helpful",
        prompt: "hello",
        max_tokens: 2048
      )
      router.call(task: :notification_copy, system: "be helpful", prompt: "hello", max_tokens: 2048)
    end
  end
end
