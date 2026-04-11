require 'rails_helper'

RSpec.describe Api::V1::SimulateController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "POST #create" do
    before do
      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(text: "わたしはがくせいです。", task: :learner_simulation)
      )
    end

    it "returns AI-generated learner text for good quality" do
      post :create, params: { context: "自己紹介をしてください", level: 1, quality: "good" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["text"]).to be_present
    end

    it "returns AI-generated learner text for poor quality" do
      post :create, params: { context: "自己紹介をしてください", level: 1, quality: "poor" }
      expect(response).to have_http_status(:ok)
    end

    it "accepts exercise_type parameter" do
      post :create, params: { context: "おはよう", level: 2, quality: "good", exercise_type: "speaking" }
      expect(response).to have_http_status(:ok)
    end

    it "scales max_tokens by level" do
      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call) do |args|
        expect(args[:max_tokens]).to eq(50)
        AiResponse.new(text: "はい", task: :learner_simulation)
      end
      post :create, params: { context: "test", level: 1 }
    end

    it "cleans thinking tokens from response" do
      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(text: "<think>let me think</think>わたしです。", task: :learner_simulation)
      )
      post :create, params: { context: "test", level: 1 }
      data = JSON.parse(response.body)
      expect(data["text"]).to eq("わたしです。")
    end

    it "cleans markdown code blocks from response" do
      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(text: "```\nわたしです\n```", task: :learner_simulation)
      )
      post :create, params: { context: "test", level: 1 }
      data = JSON.parse(response.body)
      expect(data["text"]).to eq("わたしです")
    end

    it "returns null for empty AI response" do
      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(text: nil, task: :learner_simulation)
      )
      post :create, params: { context: "test", level: 1 }
      data = JSON.parse(response.body)
      expect(data["text"]).to be_nil
    end

    it "returns 404 outside test environment" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("production"))
      post :create, params: { context: "test" }
      expect(response).to have_http_status(:not_found)
    end

    it "varies character constraints and errors across all level ranges" do
      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)

      prompts = {}
      allow(router).to receive(:call) do |args|
        prompts[args[:max_tokens]] = args[:system]
        AiResponse.new(text: "テスト", task: :learner_simulation)
      end

      post :create, params: { context: "test", level: 1 }
      post :create, params: { context: "test", level: 2 }
      post :create, params: { context: "test", level: 3 }
      post :create, params: { context: "test", level: 6 }
      post :create, params: { context: "test", level: 7 }
      post :create, params: { context: "test", level: 10 }

      expect(prompts[50]).to include("ONLY hiragana").or include("Grade-1 kanji")
      expect(prompts[80]).to include("240 kanji")
      expect(prompts[120]).to include("640 kanji")
      expect(prompts[180]).to include("1,000 kanji")
      expect(prompts[250]).to include("near-native")
    end

    it "generates speaking-specific poor pronunciation prompt" do
      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)

      captured_prompt = nil
      allow(router).to receive(:call) do |args|
        captured_prompt = args[:prompt]
        AiResponse.new(text: "こにちわ", task: :learner_simulation)
      end

      post :create, params: { context: "こんにちは", level: 1, quality: "poor", exercise_type: "speaking" }
      expect(captured_prompt).to include("mispronounce")
    end

    it "generates speaking-specific good pronunciation prompt" do
      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)

      captured_prompt = nil
      allow(router).to receive(:call) do |args|
        captured_prompt = args[:prompt]
        AiResponse.new(text: "こんにちは", task: :learner_simulation)
      end

      post :create, params: { context: "こんにちは", level: 1, quality: "good", exercise_type: "speaking" }
      expect(captured_prompt).to include("reads aloud")
    end
  end
end
