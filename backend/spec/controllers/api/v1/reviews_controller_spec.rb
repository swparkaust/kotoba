require 'rails_helper'

RSpec.describe Api::V1::ReviewsController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "GET #index" do
    it "returns due SRS cards" do
      create(:srs_card, learner: learner, next_review_at: 1.hour.ago)
      get :index
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(1)
    end
  end

  describe "GET #stats" do
    it "returns card statistics" do
      create(:srs_card, learner: learner, next_review_at: 1.hour.ago)
      get :stats
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data).to have_key("total")
      expect(data).to have_key("due_now")
    end
  end

  describe "POST #submit" do
    it "records a review and updates the card interval" do
      card = create(:srs_card, learner: learner, next_review_at: 1.hour.ago, interval_days: 1)
      post :submit, params: { id: card.id, correct: true }
      expect(response).to have_http_status(:ok)
      card.reload
      expect(card.interval_days).to be > 1
    end

    it "returns 404 for non-existent card" do
      post :submit, params: { id: 999999, correct: true }
      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for another learner's card" do
      other = create(:learner)
      card = create(:srs_card, learner: other, next_review_at: 1.hour.ago)
      post :submit, params: { id: card.id, correct: true }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST #reactivate" do
    it "unburns a burned card" do
      card = create(:srs_card, learner: learner, burned: true, interval_days: 180)
      post :reactivate, params: { id: card.id }
      expect(response).to have_http_status(:ok)
      card.reload
      expect(card.burned).to be false
      expect(card.interval_days).to eq(1)
    end

    it "returns 404 for non-existent card" do
      post :reactivate, params: { id: 999999 }
      expect(response).to have_http_status(:not_found)
    end
  end
end
