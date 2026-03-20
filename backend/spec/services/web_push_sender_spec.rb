require 'rails_helper'

RSpec.describe WebPushSender, type: :service do
  let!(:subscription) do
    create(:push_subscription,
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      p256dh_key: "test-p256dh", auth_key: "test-auth")
  end

  before do
    allow(Rails.application.credentials).to receive(:dig).and_return(nil)
    allow(Rails.application.credentials).to receive(:dig).with(:vapid, :subject).and_return("mailto:test@example.com")
    allow(Rails.application.credentials).to receive(:dig).with(:vapid, :public_key).and_return("pub")
    allow(Rails.application.credentials).to receive(:dig).with(:vapid, :private_key).and_return("priv")
  end

  it "sends a push notification to all subscriptions" do
    expect(WebPush).to receive(:payload_send).with(hash_including(
      endpoint: "https://fcm.googleapis.com/fcm/send/abc"
    ))
    described_class.notify_all(title: "Test", body: "Hello")
  end

  it "destroys expired subscriptions" do
    response = double("response", body: "Gone", code: 410)
    allow(WebPush).to receive(:payload_send).and_raise(WebPush::ExpiredSubscription.new(response, "fcm.googleapis.com"))
    expect { described_class.notify_all(title: "Test", body: "Hello") }
      .to change(PushSubscription, :count).by(-1)
  end

  it "skips sending when VAPID keys are missing" do
    allow(Rails.application.credentials).to receive(:dig).and_return(nil)
    allow(ENV).to receive(:[]).and_return(nil)
    allow(ENV).to receive(:fetch).and_call_original
    expect(WebPush).not_to receive(:payload_send)
    described_class.notify_all(title: "Test", body: "Hello")
  end

  describe ".notify_learner" do
    it "sends push only to the specified learner's subscriptions" do
      learner = create(:learner)
      learner_sub = create(:push_subscription,
        learner_id: learner.id,
        endpoint: "https://fcm.googleapis.com/fcm/send/learner1",
        p256dh_key: "p256dh-learner", auth_key: "auth-learner")

      expect(WebPush).to receive(:payload_send).with(hash_including(
        endpoint: "https://fcm.googleapis.com/fcm/send/learner1"
      ))
      expect(WebPush).not_to receive(:payload_send).with(hash_including(
        endpoint: subscription.endpoint
      ))

      described_class.notify_learner(learner: learner, title: "Review", body: "Time to review")
    end

    it "skips sending when VAPID keys are missing" do
      learner = create(:learner)
      create(:push_subscription, learner_id: learner.id)
      allow(Rails.application.credentials).to receive(:dig).and_return(nil)
      allow(ENV).to receive(:[]).and_return(nil)
      allow(ENV).to receive(:fetch).and_call_original
      expect(WebPush).not_to receive(:payload_send)
      described_class.notify_learner(learner: learner, title: "Test", body: "Hello")
    end
  end
end
