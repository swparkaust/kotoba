require 'rails_helper'

RSpec.describe Api::V1::ContentPacksController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "GET #latest" do
    it "returns the latest ready content pack" do
      language = create(:language, code: "ja")
      create(:content_pack_version, language: language, version: 1, status: "ready", published_at: Time.current)
      get :latest, params: { language_code: "ja" }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["version"]).to eq(1)
    end

    it "returns 404 when no ready pack exists" do
      create(:language, code: "ja")
      get :latest, params: { language_code: "ja" }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET #check_update" do
    it "detects available updates" do
      language = create(:language, code: "ja")
      create(:content_pack_version, language: language, version: 2, status: "ready")
      get :check_update, params: { language_code: "ja", current_version: 1 }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["update_available"]).to be true
      expect(data["latest_version"]).to eq(2)
    end
  end
end
