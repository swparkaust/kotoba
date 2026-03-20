require 'rails_helper'

RSpec.describe Api::V1::LibraryController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "GET #index" do
    it "returns library items for a language" do
      language = create(:language, code: "ja")
      create(:library_item, language: language, difficulty_level: 7)
      get :index, params: { language_code: "ja" }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(1)
    end

    it "returns recommendations when requested" do
      language = create(:language, code: "ja")
      create(:library_item, language: language, difficulty_level: 5)
      get :index, params: { language_code: "ja", recommended: true }
      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET #show" do
    it "returns a single library item" do
      language = create(:language, code: "ja")
      item = create(:library_item, language: language, difficulty_level: 7)
      get :show, params: { id: item.id }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["title"]).to eq(item.title)
    end
  end

  describe "GET #reading_stats" do
    it "returns reading and listening time" do
      get :reading_stats
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data).to have_key("total_reading_minutes")
      expect(data).to have_key("total_listening_minutes")
    end
  end

  describe "POST #record_session" do
    it "creates a reading session and SRS cards" do
      language = create(:language, code: "ja")
      item = create(:library_item, language: language, difficulty_level: 6)

      expect {
        post :record_session, params: {
          id: item.id,
          session_type: "reading",
          duration_seconds: 600,
          words_read: 200,
          progress_pct: 0.5,
          new_srs_cards: [{ "word" => "桜", "definition_ja" => "春に咲く花" }]
        }
      }.to change(ReadingSession, :count).by(1)
        .and change(SrsCard, :count).by(1)
      expect(response).to have_http_status(:created)
    end
  end
end
