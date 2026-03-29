require 'rails_helper'

RSpec.describe AiProviders::OpenaiAdapter do
  let(:adapter) { described_class.new(api_key: "test-key", base_url: "https://api.openai.com") }

  let(:chat_response) do
    {
      "choices" => [
        { "message" => { "role" => "assistant", "content" => "test response" } }
      ]
    }
  end

  before do
    stub_request(:post, "https://api.openai.com/v1/chat/completions")
      .to_return(status: 200, body: chat_response.to_json, headers: { "Content-Type" => "application/json" })
  end

  it "implements the Base interface" do
    expect(adapter).to be_a(AiProviders::Base)
  end

  describe "#complete" do
    it "returns an AiResponse" do
      response = adapter.complete(model: "gpt-4o", system: "test", prompt: "test")
      expect(response).to be_a(AiResponse)
      expect(response.text).to eq("test response")
      expect(response.provider).to eq("openai")
      expect(response.model).to eq("gpt-4o")
    end

    it "returns AiResponse with nil text on HTTP error" do
      stub_request(:post, "https://api.openai.com/v1/chat/completions")
        .to_return(status: 500, body: "Internal Server Error")
      response = adapter.complete(model: "gpt-4o", system: "test", prompt: "test")
      expect(response).to be_a(AiResponse)
      expect(response.text).to be_nil
    end

    it "returns AiResponse with nil text on timeout" do
      stub_request(:post, "https://api.openai.com/v1/chat/completions")
        .to_raise(Net::ReadTimeout)
      response = adapter.complete(model: "gpt-4o", system: "test", prompt: "test")
      expect(response.text).to be_nil
    end

    it "returns AiResponse with nil text on connection refused" do
      stub_request(:post, "https://api.openai.com/v1/chat/completions")
        .to_raise(Errno::ECONNREFUSED)
      response = adapter.complete(model: "gpt-4o", system: "test", prompt: "test")
      expect(response.text).to be_nil
    end
  end

  describe "#provider_name" do
    it "returns 'openai'" do
      expect(adapter.provider_name).to eq("openai")
    end
  end

  describe "#available_models" do
    it "returns the default models" do
      expect(adapter.available_models).to eq(%w[gpt-4o o3 gpt-4o-mini gpt-4.1-mini])
    end

    it "returns custom models when configured" do
      custom = described_class.new(api_key: "k", models: { advanced: "custom-adv", standard: "custom-std" })
      expect(custom.available_models).to eq(%w[custom-adv custom-std])
    end
  end

  describe "#advanced_model" do
    it "returns the default advanced model" do
      expect(adapter.advanced_model).to eq("gpt-4o")
    end

    it "returns custom advanced model when configured" do
      custom = described_class.new(api_key: "k", models: { advanced: "custom-adv", standard: "custom-std" })
      expect(custom.advanced_model).to eq("custom-adv")
    end
  end

  describe "#standard_model" do
    it "returns the default standard model" do
      expect(adapter.standard_model).to eq("gpt-4o-mini")
    end

    it "returns custom standard model when configured" do
      custom = described_class.new(api_key: "k", models: { advanced: "custom-adv", standard: "custom-std" })
      expect(custom.standard_model).to eq("custom-std")
    end
  end
end
