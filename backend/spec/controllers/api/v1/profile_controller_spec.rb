require 'rails_helper'

RSpec.describe Api::V1::ProfileController, type: :controller do
  let(:learner) { create(:learner, active_language_code: "ja") }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "GET #show" do
    it "returns the current learner profile" do
      get :show
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["active_language_code"]).to eq("ja")
    end

    it "includes display name and email" do
      get :show
      data = JSON.parse(response.body)
      expect(data["display_name"]).to eq(learner.display_name)
      expect(data["email"]).to eq(learner.email)
    end
  end

  describe "PATCH #update" do
    it "updates the active language" do
      create(:language, code: "ko", name: "Korean", native_name: "한국어")
      patch :update, params: { active_language_code: "ko" }
      expect(response).to have_http_status(:ok)
      expect(learner.reload.active_language_code).to eq("ko")
    end

    it "returns 422 for invalid update" do
      patch :update, params: { display_name: "" }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
