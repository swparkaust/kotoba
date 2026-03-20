require 'rails_helper'

RSpec.describe Api::V1::WritingController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "POST #submit" do
    it "evaluates writing and returns feedback" do
      exercise = create(:exercise, exercise_type: "writing")

      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(text: '{"score":80,"grammar_feedback":"良い","naturalness_feedback":"自然","register_feedback":"適切","suggestions":["続けてください"]}', task: :writing_evaluation)
      )

      post :submit, params: { exercise_id: exercise.id, text: "今日は天気がいいです。" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["score"]).to eq(80)
      expect(WritingSubmission.count).to eq(1)
    end
  end

  describe "GET #history" do
    it "returns recent writing submissions" do
      exercise = create(:exercise, exercise_type: "writing")
      WritingSubmission.create!(learner: learner, exercise: exercise, submitted_text: "テスト", evaluation: {}, score: 75)
      get :history
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(1)
    end

    it "only returns submissions for the current learner" do
      other = create(:learner)
      exercise = create(:exercise, exercise_type: "writing")
      WritingSubmission.create!(learner: other, exercise: exercise, submitted_text: "他人の", evaluation: {}, score: 60)
      WritingSubmission.create!(learner: learner, exercise: exercise, submitted_text: "自分の", evaluation: {}, score: 80)
      get :history
      data = JSON.parse(response.body)
      expect(data.length).to eq(1)
      expect(data.first["submitted_text"]).to eq("自分の")
    end
  end
end
