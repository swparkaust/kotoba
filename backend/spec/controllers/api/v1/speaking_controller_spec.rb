require 'rails_helper'

RSpec.describe Api::V1::SpeakingController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "POST #submit" do
    let(:exercise) { create(:exercise, exercise_type: "speaking") }

    before do
      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(text: '{"accuracy_score":90,"pronunciation_notes":"よくできました","problem_sounds":[]}', task: :speech_evaluation)
      )
    end

    it "evaluates speech and returns feedback" do
      post :submit, params: { exercise_id: exercise.id, transcription: "おはよう", target_text: "おはよう" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["accuracy_score"]).to eq(90)
      expect(SpeakingSubmission.count).to eq(1)
    end

    it "returns 422 when transcription is missing" do
      post :submit, params: { exercise_id: exercise.id, target_text: "おはよう" }
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns 404 when exercise doesn't exist" do
      post :submit, params: { exercise_id: 99999, transcription: "test", target_text: "test" }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET #history" do
    it "returns recent speaking submissions for the learner" do
      exercise = create(:exercise, exercise_type: "speaking")
      create(:speaking_submission, learner: learner, exercise: exercise, accuracy_score: 90, transcription: "おはよう", target_text: "おはよう")
      create(:speaking_submission, learner: learner, exercise: exercise, accuracy_score: 70, transcription: "こんにちは", target_text: "こんにちは")

      get :history
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data.length).to eq(2)
      expect(data.first).to have_key("accuracy_score")
      expect(data.first).to have_key("transcription")
      expect(data.first).to have_key("target_text")
    end

    it "returns empty array when no submissions exist" do
      get :history
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data).to eq([])
    end

    it "respects limit parameter" do
      exercise = create(:exercise, exercise_type: "speaking")
      3.times { create(:speaking_submission, learner: learner, exercise: exercise) }

      get :history, params: { limit: 2 }
      data = JSON.parse(response.body)
      expect(data.length).to eq(2)
    end
  end
end
