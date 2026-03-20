require 'rails_helper'

RSpec.describe PlacementAttempt, type: :model do
  it { is_expected.to belong_to(:learner) }
  it { is_expected.to belong_to(:language) }
  it { is_expected.to validate_presence_of(:recommended_level) }
  it { is_expected.to validate_presence_of(:overall_score) }

  describe "recommended_level validation" do
    it "rejects level 0" do
      attempt = build(:placement_attempt, recommended_level: 0)
      expect(attempt).not_to be_valid
    end

    it "rejects level 13" do
      attempt = build(:placement_attempt, recommended_level: 13)
      expect(attempt).not_to be_valid
    end

    it "accepts level 1" do
      attempt = build(:placement_attempt, recommended_level: 1)
      expect(attempt).to be_valid
    end
  end

  describe "#accepted?" do
    it "returns true when chosen_level is set" do
      attempt = build(:placement_attempt, chosen_level: 3)
      expect(attempt.accepted?).to be true
    end

    it "returns false when chosen_level is nil" do
      attempt = build(:placement_attempt, chosen_level: nil)
      expect(attempt.accepted?).to be false
    end
  end

  describe "#accuracy" do
    it "calculates correct response ratio" do
      attempt = build(:placement_attempt, responses: [
        { "correct" => true }, { "correct" => false }, { "correct" => true }
      ])
      expect(attempt.accuracy).to be_within(0.01).of(0.67)
    end

    it "returns 0 for empty responses" do
      attempt = build(:placement_attempt, responses: [])
      expect(attempt.accuracy).to eq(0.0)
    end
  end

  describe "#accept!" do
    it "sets chosen_level to recommended_level by default" do
      attempt = create(:placement_attempt, recommended_level: 5)
      attempt.accept!
      expect(attempt.reload.chosen_level).to eq(5)
    end

    it "accepts a custom level" do
      attempt = create(:placement_attempt, recommended_level: 5)
      attempt.accept!(3)
      expect(attempt.reload.chosen_level).to eq(3)
    end
  end

  describe "#accepted_recommendation?" do
    it "returns true when chosen_level equals recommended_level" do
      attempt = build(:placement_attempt, recommended_level: 5, chosen_level: 5)
      expect(attempt.accepted_recommendation?).to be true
    end

    it "returns false when chosen_level differs from recommended_level" do
      attempt = build(:placement_attempt, recommended_level: 5, chosen_level: 3)
      expect(attempt.accepted_recommendation?).to be false
    end

    it "returns false when chosen_level is nil" do
      attempt = build(:placement_attempt, recommended_level: 5, chosen_level: nil)
      expect(attempt.accepted_recommendation?).to be false
    end
  end

  describe "#response_count" do
    it "returns the number of responses" do
      attempt = build(:placement_attempt, responses: [
        { "correct" => true }, { "correct" => false }, { "correct" => true }
      ])
      expect(attempt.response_count).to eq(3)
    end

    it "returns 0 for nil responses" do
      attempt = build(:placement_attempt, responses: nil)
      expect(attempt.response_count).to eq(0)
    end
  end

  describe "#correct_responses" do
    it "counts responses where correct is true" do
      attempt = build(:placement_attempt, responses: [
        { "correct" => true }, { "correct" => false }, { "correct" => true }
      ])
      expect(attempt.correct_responses).to eq(2)
    end

    it "returns 0 for nil responses" do
      attempt = build(:placement_attempt, responses: nil)
      expect(attempt.correct_responses).to eq(0)
    end

    it "returns 0 when no responses are correct" do
      attempt = build(:placement_attempt, responses: [
        { "correct" => false }, { "correct" => false }
      ])
      expect(attempt.correct_responses).to eq(0)
    end
  end

  describe ".latest_for" do
    it "returns the most recent attempt for a learner and language" do
      learner = create(:learner)
      language = create(:language)
      create(:placement_attempt, learner: learner, language: language, created_at: 1.day.ago)
      recent = create(:placement_attempt, learner: learner, language: language, created_at: 1.hour.ago)
      expect(PlacementAttempt.latest_for(learner: learner, language: language)).to eq(recent)
    end
  end
end
