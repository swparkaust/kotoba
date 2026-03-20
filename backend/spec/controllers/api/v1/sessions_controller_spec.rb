require 'rails_helper'

RSpec.describe Api::V1::SessionsController, type: :controller do
  describe "POST #create" do
    it "returns auth token for valid credentials" do
      create(:learner, email: "test@example.com", password: "password123", auth_token: nil)
      post :create, params: { email: "test@example.com", password: "password123" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data).to have_key("auth_token")
      expect(data["learner"]["email"]).to eq("test@example.com")
    end

    it "returns 401 for invalid credentials" do
      create(:learner, email: "test@example.com", password: "password123")
      post :create, params: { email: "test@example.com", password: "wrong" }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST #signup" do
    it "creates a new learner and returns auth token" do
      expect {
        post :signup, params: { display_name: "New User", email: "new@example.com", password: "password123" }
      }.to change(Learner, :count).by(1)
      expect(response).to have_http_status(:created)
      data = JSON.parse(response.body)
      expect(data).to have_key("auth_token")
    end

    it "returns 422 for duplicate email" do
      create(:learner, email: "taken@example.com")
      post :signup, params: { display_name: "User", email: "taken@example.com", password: "password123" }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
