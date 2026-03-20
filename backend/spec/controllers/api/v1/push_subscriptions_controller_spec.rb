require 'rails_helper'

RSpec.describe Api::V1::PushSubscriptionsController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "POST #create" do
    it "creates a push subscription" do
      params = {
        endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
        keys: { p256dh: "test-key", auth: "test-auth" }
      }

      expect { post :create, params: params }
        .to change(PushSubscription, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "does not duplicate subscriptions with the same endpoint" do
      create(:push_subscription, endpoint: "https://fcm.googleapis.com/fcm/send/abc123")
      params = {
        endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
        keys: { p256dh: "new-key", auth: "new-auth" }
      }
      expect { post :create, params: params }
        .not_to change(PushSubscription, :count)
      expect(response).to have_http_status(:created)
    end
  end

  describe "DELETE #destroy" do
    it "removes the subscription" do
      create(:push_subscription, endpoint: "https://fcm.googleapis.com/fcm/send/abc123", learner: learner)
      expect {
        delete :destroy, params: { endpoint: "https://fcm.googleapis.com/fcm/send/abc123" }
      }.to change(PushSubscription, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end
end
