require 'rails_helper'

RSpec.describe Api::V1::CurriculumController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "GET #index" do
    it "returns curriculum levels for a language" do
      language = create(:language, code: "ja")
      create(:curriculum_level, language: language, position: 1)
      get :index, params: { language_code: "ja" }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(1)
    end

    it "returns 404 for unknown language code" do
      get :index, params: { language_code: "zz" }
      expect(response).to have_http_status(:not_found)
    end

    it "includes lesson and completion counts" do
      language = create(:language, code: "ja")
      level = create(:curriculum_level, language: language, position: 1)
      unit = create(:curriculum_unit, curriculum_level: level)
      create(:lesson, curriculum_unit: unit)
      get :index, params: { language_code: "ja" }
      data = JSON.parse(response.body).first
      expect(data).to have_key("lesson_count")
      expect(data).to have_key("completed_count")
    end
  end

  describe "GET #show" do
    it "returns a specific level with units and lessons" do
      level = create(:curriculum_level)
      unit = create(:curriculum_unit, curriculum_level: level)
      create(:lesson, curriculum_unit: unit)
      get :show, params: { id: level.id }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["curriculum_units"].length).to eq(1)
    end

    it "returns 404 for invalid level ID" do
      get :show, params: { id: 9999 }
      expect(response).to have_http_status(:not_found)
    end
  end
end
