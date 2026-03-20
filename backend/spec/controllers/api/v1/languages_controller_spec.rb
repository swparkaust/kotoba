require 'rails_helper'

RSpec.describe Api::V1::LanguagesController, type: :controller do
  describe "GET #index" do
    it "returns active languages" do
      create(:language, code: "ja", active: true)
      create(:language, code: "ko", active: true, name: "Korean", native_name: "한국어")
      create(:language, code: "zh", active: false, name: "Chinese", native_name: "中文")
      get :index
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data.length).to eq(2)
    end

    it "works without authentication" do
      get :index
      expect(response).to have_http_status(:ok)
    end

    it "filters by search query" do
      create(:language, code: "ja", active: true)
      create(:language, code: "ko", active: true, name: "Korean", native_name: "한국어")
      get :index, params: { search: "Korean" }
      data = JSON.parse(response.body)
      expect(data.length).to eq(1)
      expect(data.first["code"]).to eq("ko")
    end
  end

  describe "GET #show" do
    it "returns a language with level_count and latest_content_pack" do
      language = create(:language, code: "ja", active: true)
      create(:curriculum_level, language: language, position: 1)
      create(:curriculum_level, language: language, position: 2)
      create(:content_pack_version, language: language, version: 3, status: "ready")
      get :show, params: { code: "ja" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["code"]).to eq("ja")
      expect(data["level_count"]).to eq(2)
      expect(data["latest_content_pack"]).to eq(3)
    end

    it "returns 404 for inactive language" do
      create(:language, code: "zh", active: false, name: "Chinese", native_name: "中文")
      get :show, params: { code: "zh" }
      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for non-existent language" do
      get :show, params: { code: "xx" }
      expect(response).to have_http_status(:not_found)
    end
  end
end
