require 'rails_helper'

RSpec.describe Api::V1::LessonsController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "GET #show" do
    it "returns a lesson with exercises" do
      lesson = create(:lesson, content_status: "ready")
      create(:exercise, lesson: lesson)
      get :show, params: { id: lesson.id }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["exercises"].length).to eq(1)
    end

    it "includes progress status for the current learner" do
      lesson = create(:lesson)
      create(:learner_progress, learner: learner, lesson: lesson, status: "completed")
      get :show, params: { id: lesson.id }
      data = JSON.parse(response.body)
      expect(data["progress_status"]).to eq("completed")
    end

    it "returns 404 for non-existent lesson" do
      get :show, params: { id: 99999 }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET #index" do
    it "returns lessons for a unit" do
      unit = create(:curriculum_unit)
      create(:lesson, curriculum_unit: unit, position: 1, title: "Lesson A")
      create(:lesson, curriculum_unit: unit, position: 2, title: "Lesson B")
      get :index, params: { unit_id: unit.id }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data.length).to eq(2)
      expect(data.first["title"]).to eq("Lesson A")
    end

    it "returns 404 for non-existent unit" do
      get :index, params: { unit_id: 99999 }
      expect(response).to have_http_status(:not_found)
    end

    it "filters lessons by status param" do
      unit = create(:curriculum_unit)
      lesson_a = create(:lesson, curriculum_unit: unit, position: 1, title: "Lesson A")
      lesson_b = create(:lesson, curriculum_unit: unit, position: 2, title: "Lesson B")
      create(:learner_progress, learner: learner, lesson: lesson_a, status: "completed")
      create(:learner_progress, learner: learner, lesson: lesson_b, status: "available")

      get :index, params: { unit_id: unit.id, status: "completed" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data.length).to eq(1)
      expect(data.first["title"]).to eq("Lesson A")
    end
  end
end
