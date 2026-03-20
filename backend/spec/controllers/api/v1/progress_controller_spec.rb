require 'rails_helper'

RSpec.describe Api::V1::ProgressController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "GET #index" do
    it "returns progress for the current learner" do
      lesson = create(:lesson)
      create(:learner_progress, learner: learner, lesson: lesson, status: "completed")
      get :index
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(1)
    end
  end

  describe "GET #jlpt_comparison" do
    it "returns JLPT mapping data" do
      create(:language, code: "ja")
      get :jlpt_comparison, params: { language_code: "ja" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data).to have_key("jlpt_label")
    end
  end

  describe "PATCH #update" do
    it "updates progress and broadcasts via ProgressChannel" do
      lesson = create(:lesson)
      expect(ProgressChannel).to receive(:broadcast_update).with(
        learner.id, hash_including(lesson_id: lesson.id, status: "completed")
      )

      patch :update, params: { lesson_id: lesson.id, status: "completed", score: 90, exercise_results: [] }
      expect(response).to have_http_status(:ok)
      expect(LearnerProgress.find_by(learner: learner, lesson: lesson).status).to eq("completed")
    end

    it "unlocks the next lesson on completion" do
      lesson1 = create(:lesson, position: 1)
      lesson2 = create(:lesson, position: 2, curriculum_unit: lesson1.curriculum_unit)
      allow(ProgressChannel).to receive(:broadcast_update)

      patch :update, params: { lesson_id: lesson1.id, status: "completed", score: 85 }
      expect(LearnerProgress.find_by(learner: learner, lesson: lesson2)&.status).to eq("available")
    end
  end
end
