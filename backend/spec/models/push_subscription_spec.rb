require 'rails_helper'

RSpec.describe PushSubscription, type: :model do
  it { is_expected.to belong_to(:learner).optional }
  it { is_expected.to validate_presence_of(:endpoint) }

  describe "uniqueness" do
    subject { create(:push_subscription) }

    it { is_expected.to validate_uniqueness_of(:endpoint) }
  end
  it { is_expected.to validate_presence_of(:p256dh_key) }
  it { is_expected.to validate_presence_of(:auth_key) }

  describe "#web_push_payload" do
    it "returns a hash with endpoint, p256dh, and auth" do
      sub = build(:push_subscription, endpoint: "https://fcm.example.com/1", p256dh_key: "p256dh", auth_key: "auth")
      payload = sub.web_push_payload
      expect(payload[:endpoint]).to eq("https://fcm.example.com/1")
      expect(payload[:p256dh]).to eq("p256dh")
      expect(payload[:auth]).to eq("auth")
    end
  end

  describe "#expired?" do
    it "returns true for subscriptions older than 90 days" do
      sub = build(:push_subscription, updated_at: 91.days.ago)
      expect(sub.expired?).to be true
    end

    it "returns false for recent subscriptions" do
      sub = build(:push_subscription, updated_at: 1.day.ago)
      expect(sub.expired?).to be false
    end
  end

  describe "scopes" do
    it ".active returns subscriptions with a learner" do
      learner = create(:learner)
      with_learner = create(:push_subscription, learner: learner)
      without = create(:push_subscription, learner: nil)
      expect(PushSubscription.active).to include(with_learner)
      expect(PushSubscription.active).not_to include(without)
    end

    it ".orphaned returns subscriptions without a learner" do
      learner = create(:learner)
      create(:push_subscription, learner: learner)
      orphaned = create(:push_subscription, learner: nil)
      expect(PushSubscription.orphaned).to include(orphaned)
    end
  end

  describe "scope .for_learner" do
    it "returns subscriptions for a specific learner" do
      learner1 = create(:learner)
      learner2 = create(:learner)
      sub1 = create(:push_subscription, learner: learner1)
      sub2 = create(:push_subscription, learner: learner2)
      expect(PushSubscription.for_learner(learner1)).to include(sub1)
      expect(PushSubscription.for_learner(learner1)).not_to include(sub2)
    end
  end

  describe ".for_notifiable_learners" do
    it "returns subscriptions for learners with notifications enabled" do
      enabled = create(:learner, notifications_enabled: true)
      disabled = create(:learner, notifications_enabled: false)
      sub_enabled = create(:push_subscription, learner: enabled)
      sub_disabled = create(:push_subscription, learner: disabled)
      result = PushSubscription.for_notifiable_learners
      expect(result).to include(sub_enabled)
      expect(result).not_to include(sub_disabled)
    end

    it "excludes orphaned subscriptions without a learner" do
      orphaned = create(:push_subscription, learner: nil)
      expect(PushSubscription.for_notifiable_learners).not_to include(orphaned)
    end
  end

  describe ".cleanup_expired!" do
    it "removes subscriptions older than 90 days" do
      old = create(:push_subscription)
      old.update_column(:updated_at, 91.days.ago)
      fresh = create(:push_subscription)

      expect { PushSubscription.cleanup_expired! }.to change(PushSubscription, :count).by(-1)
      expect(PushSubscription.exists?(old.id)).to be false
      expect(PushSubscription.exists?(fresh.id)).to be true
    end
  end
end
