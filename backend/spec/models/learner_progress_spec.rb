require 'rails_helper'

RSpec.describe LearnerProgress, type: :model do
  it { is_expected.to belong_to(:learner) }
  it { is_expected.to belong_to(:lesson) }
  it { is_expected.to validate_presence_of(:status) }
  it { is_expected.to validate_inclusion_of(:status).in_array(%w[locked available in_progress completed]) }

  describe "uniqueness" do
    subject { create(:learner_progress) }

    it { is_expected.to validate_uniqueness_of(:lesson_id).scoped_to(:learner_id) }
  end

  describe "unhappy paths" do
    it "rejects an invalid status value" do
      progress = build(:learner_progress, status: "paused")
      expect(progress).not_to be_valid
      expect(progress.errors[:status]).to be_present
    end

    it "rejects a blank status" do
      progress = build(:learner_progress, status: "")
      expect(progress).not_to be_valid
      expect(progress.errors[:status]).to be_present
    end

    it "rejects duplicate lesson for the same learner" do
      existing = create(:learner_progress)
      duplicate = build(:learner_progress, learner: existing.learner, lesson: existing.lesson)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:lesson_id]).to be_present
    end
  end
end
