module AiProviders
  def self.build
    case ENV.fetch("AI_PROVIDER", "ollama")
    when "anthropic"
      api_key = Rails.application.credentials.dig(:claude_api_key) || ENV["ANTHROPIC_API_KEY"]
      raise "ANTHROPIC_API_KEY not configured" if api_key.blank?

      AnthropicAdapter.new(api_key: api_key)
    when "ollama"
      OllamaAdapter.new(host: ENV.fetch("OLLAMA_HOST", "http://localhost:11434"))
    when "openai"
      api_key = Rails.application.credentials.dig(:openai_api_key) || ENV["OPENAI_API_KEY"]
      raise "OPENAI_API_KEY not configured" if api_key.blank?

      base_url = ENV["OPENAI_BASE_URL"]
      models = ENV["OPENAI_ADVANCED_MODEL"] ? {
        advanced: ENV["OPENAI_ADVANCED_MODEL"],
        standard: ENV.fetch("OPENAI_STANDARD_MODEL", ENV["OPENAI_ADVANCED_MODEL"])
      } : nil

      OpenaiAdapter.new(api_key: api_key, base_url: base_url, models: models)
    else
      raise ArgumentError, "Unknown AI_PROVIDER: #{ENV['AI_PROVIDER']}. Valid: anthropic, ollama, openai"
    end
  end

  def self.build_router
    provider = build
    model_map = case provider.provider_name
                when "ollama", "openai"
                  { advanced: provider.advanced_model, standard: provider.standard_model }
                else
                  AiModelRouter::DEFAULT_MODEL_MAP
                end

    AiModelRouter.new(provider: provider, model_map: model_map)
  end
end
