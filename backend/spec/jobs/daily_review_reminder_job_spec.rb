require 'rails_helper'

RSpec.describe DailyReviewReminderJob, type: :job do
  it "sends notifications to learners with due cards" do
    learner = create(:learner, notifications_enabled: true)
    create(:srs_card, learner: learner, next_review_at: 1.hour.ago)
    expect(WebPushSender).to receive(:notify_learner).with(hash_including(learner: learner))
    described_class.new.perform
  end

  it "skips learners with no due cards" do
    create(:learner, notifications_enabled: true)
    expect(WebPushSender).not_to receive(:notify_learner)
    described_class.new.perform
  end

  it "skips learners with notifications disabled" do
    learner = create(:learner, notifications_enabled: false)
    create(:srs_card, learner: learner, next_review_at: 1.hour.ago)
    expect(WebPushSender).not_to receive(:notify_learner)
    described_class.new.perform
  end
end
