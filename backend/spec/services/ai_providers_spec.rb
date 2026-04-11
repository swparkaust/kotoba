require 'rails_helper'

RSpec.describe AiProviders::Base do
  it "raises NotImplementedError for #complete" do
    expect { described_class.new.complete(model: "x", system: "x", prompt: "x") }
      .to raise_error(NotImplementedError)
  end

  it "raises NotImplementedError for #available_models" do
    expect { described_class.new.available_models }
      .to raise_error(NotImplementedError)
  end

  it "raises NotImplementedError for #provider_name" do
    expect { described_class.new.provider_name }
      .to raise_error(NotImplementedError)
  end
end

RSpec.describe AiProviders::AnthropicAdapter do
  let(:adapter) { described_class.new(api_key: "test-key") }

  around do |example|
    original = ENV["ANTHROPIC_API_KEY"]
    ENV["ANTHROPIC_API_KEY"] = "test-key"
    Anthropic.configure { |c| c.access_token = "test-key" }
    example.run
    ENV["ANTHROPIC_API_KEY"] = original
    Anthropic.configure { |c| c.access_token = original }
  end

  before do
    allow_any_instance_of(Anthropic::Client).to receive(:messages).and_return(
      { "content" => [ { "type" => "text", "text" => "test response" } ] }
    )
  end

  it "implements the Base interface" do
    expect(adapter).to be_a(AiProviders::Base)
  end

  it "returns an AiResponse from #complete" do
    response = adapter.complete(model: "claude-opus-4-20250514", system: "test", prompt: "test")
    expect(response).to be_a(AiResponse)
    expect(response.text).to eq("test response")
    expect(response.provider).to eq("anthropic")
  end

  it "returns AiResponse with nil text when the provider raises StandardError" do
    allow_any_instance_of(Anthropic::Client).to receive(:messages).and_raise(StandardError, "connection lost")
    response = adapter.complete(model: "claude-opus-4-20250514", system: "test", prompt: "test")
    expect(response).to be_a(AiResponse)
    expect(response.text).to be_nil
    expect(response.provider).to eq("anthropic")
  end

  it "returns the MODELS constant from #available_models" do
    expect(adapter.available_models).to eq(AiProviders::AnthropicAdapter::MODELS)
  end
end

RSpec.describe AiProviders::OllamaAdapter do
  let(:adapter) { described_class.new(host: "http://localhost:11434", advanced_model: "qwen3:32b", standard_model: "qwen3:8b") }

  let(:chat_response) { { "message" => { "role" => "assistant", "content" => "test response" } } }
  let(:tags_response) { { "models" => [ { "name" => "qwen3:32b" }, { "name" => "qwen3:8b" } ] } }

  before do
    stub_request(:post, "http://localhost:11434/api/chat")
      .to_return(status: 200, body: chat_response.to_json, headers: { "Content-Type" => "application/json" })
    stub_request(:get, "http://localhost:11434/api/tags")
      .to_return(status: 200, body: tags_response.to_json, headers: { "Content-Type" => "application/json" })
  end

  it "implements the Base interface" do
    expect(adapter).to be_a(AiProviders::Base)
  end

  it "returns an AiResponse from #complete" do
    response = adapter.complete(model: "qwen3:32b", system: "test", prompt: "test")
    expect(response).to be_a(AiResponse)
    expect(response.text).to eq("test response")
    expect(response.provider).to eq("ollama")
  end

  it "lists available models" do
    expect(adapter.available_models).to eq([ "qwen3:32b", "qwen3:8b" ])
  end

  it "returns empty array when unreachable" do
    stub_request(:get, "http://localhost:11434/api/tags").to_raise(Errno::ECONNREFUSED)
    expect(adapter.available_models).to eq([])
  end

  describe "#complete error paths" do
    it "returns AiResponse with nil text on timeout" do
      stub_request(:post, "http://localhost:11434/api/chat").to_timeout
      response = adapter.complete(model: "qwen3:32b", system: "test", prompt: "test")
      expect(response).to be_a(AiResponse)
      expect(response.text).to be_nil
      expect(response.provider).to eq("ollama")
    end

    it "returns AiResponse with nil text on connection refused" do
      stub_request(:post, "http://localhost:11434/api/chat").to_raise(Errno::ECONNREFUSED)
      response = adapter.complete(model: "qwen3:32b", system: "test", prompt: "test")
      expect(response).to be_a(AiResponse)
      expect(response.text).to be_nil
      expect(response.provider).to eq("ollama")
    end

    it "returns AiResponse with nil text on HTTP 500" do
      stub_request(:post, "http://localhost:11434/api/chat")
        .to_return(status: 500, body: "Internal Server Error", headers: { "Content-Type" => "text/plain" })
      response = adapter.complete(model: "qwen3:32b", system: "test", prompt: "test")
      expect(response).to be_a(AiResponse)
      expect(response.text).to be_nil
      expect(response.provider).to eq("ollama")
    end

    it "returns AiResponse with nil text on JSON parse error" do
      stub_request(:post, "http://localhost:11434/api/chat")
        .to_return(status: 200, body: "not json at all", headers: { "Content-Type" => "application/json" })
      response = adapter.complete(model: "qwen3:32b", system: "test", prompt: "test")
      expect(response).to be_a(AiResponse)
      expect(response.text).to be_nil
      expect(response.provider).to eq("ollama")
    end
  end

  describe "#advanced_model" do
    it "returns the configured advanced model" do
      expect(adapter.advanced_model).to eq("qwen3:32b")
    end

    it "detects the best available model when not explicitly set" do
      auto_adapter = described_class.new(host: "http://localhost:11434")
      expect(auto_adapter.advanced_model).to be_a(String)
    end
  end

  describe "#standard_model" do
    it "returns the configured standard model" do
      expect(adapter.standard_model).to eq("qwen3:8b")
    end

    it "detects the best available model when not explicitly set" do
      auto_adapter = described_class.new(host: "http://localhost:11434")
      expect(auto_adapter.standard_model).to be_a(String)
    end
  end

  describe "#healthy?" do
    it "returns true when running" do
      expect(adapter.healthy?).to be true
    end

    it "returns false when unreachable" do
      stub_request(:get, "http://localhost:11434/api/tags").to_raise(Errno::ECONNREFUSED)
      expect(adapter.healthy?).to be false
    end
  end
end

RSpec.describe AiProviders, ".build" do
  around do |example|
    original_provider = ENV["AI_PROVIDER"]
    original_key = ENV["ANTHROPIC_API_KEY"]
    ENV["ANTHROPIC_API_KEY"] = "test-key"
    Anthropic.configure { |c| c.access_token = "test-key" }
    example.run
    ENV["AI_PROVIDER"] = original_provider
    ENV["ANTHROPIC_API_KEY"] = original_key
    Anthropic.configure { |c| c.access_token = original_key }
  end

  it "returns AnthropicAdapter when AI_PROVIDER is 'anthropic'" do
    ENV["AI_PROVIDER"] = "anthropic"
    expect(described_class.build).to be_a(AiProviders::AnthropicAdapter)
  end

  it "returns OllamaAdapter when AI_PROVIDER is 'ollama'" do
    ENV["AI_PROVIDER"] = "ollama"
    stub_request(:get, "http://localhost:11434/api/tags")
      .to_return(status: 200, body: { models: [ { name: "qwen3:32b" } ] }.to_json)
    expect(described_class.build).to be_a(AiProviders::OllamaAdapter)
  end

  it "returns OpenaiAdapter when AI_PROVIDER is 'openai'" do
    ENV["AI_PROVIDER"] = "openai"
    ENV["OPENAI_API_KEY"] = "test-openai-key"
    expect(described_class.build).to be_a(AiProviders::OpenaiAdapter)
    ENV.delete("OPENAI_API_KEY")
  end

  it "defaults to OllamaAdapter" do
    ENV.delete("AI_PROVIDER")
    expect(described_class.build).to be_a(AiProviders::OllamaAdapter)
  end

  it "raises on unknown provider" do
    ENV["AI_PROVIDER"] = "unknown"
    expect { described_class.build }.to raise_error(ArgumentError, /Unknown AI_PROVIDER/)
  end
end

RSpec.describe AiProviders, ".build_router" do
  around do |example|
    original_provider = ENV["AI_PROVIDER"]
    original_api_key = ENV["ANTHROPIC_API_KEY"]
    ENV["ANTHROPIC_API_KEY"] = "test-key"
    ENV["AI_PROVIDER"] = "anthropic"
    Anthropic.configure { |c| c.access_token = "test-key" }
    example.run
    ENV["AI_PROVIDER"] = original_provider
    ENV["ANTHROPIC_API_KEY"] = original_api_key
    Anthropic.configuration = Anthropic::Configuration.new
  end

  it "returns an AiModelRouter" do
    expect(described_class.build_router).to be_a(AiModelRouter)
  end

  it "uses the default model map for Anthropic" do
    router = described_class.build_router
    provider = instance_double(AiProviders::AnthropicAdapter, provider_name: "anthropic")
    allow(AiProviders).to receive(:build).and_return(provider)
    allow(provider).to receive(:complete).and_return(
      AiResponse.new(text: "ok", model: "claude-opus-4-20250514", provider: "anthropic")
    )

    new_router = described_class.build_router
    expect(new_router).to be_a(AiModelRouter)
  end

  it "uses provider-specific models for ollama" do
    ENV["AI_PROVIDER"] = "ollama"
    stub_request(:get, "http://localhost:11434/api/tags")
      .to_return(status: 200, body: { models: [ { name: "qwen3:32b" } ] }.to_json)
    router = described_class.build_router
    expect(router).to be_a(AiModelRouter)
  end
end
