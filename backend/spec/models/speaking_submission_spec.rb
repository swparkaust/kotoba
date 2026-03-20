require 'rails_helper'

RSpec.describe SpeakingSubmission, type: :model do
  it { is_expected.to belong_to(:learner) }
  it { is_expected.to belong_to(:exercise) }
  it { is_expected.to validate_presence_of(:transcription) }
  it { is_expected.to validate_presence_of(:target_text) }

  describe "#passed?" do
    it "returns true when accuracy_score >= 60" do
      sub = build(:speaking_submission, accuracy_score: 75)
      expect(sub.passed?).to be true
    end

    it "returns false when accuracy_score < 60" do
      sub = build(:speaking_submission, accuracy_score: 40)
      expect(sub.passed?).to be false
    end
  end

  describe "#similarity_ratio" do
    it "returns 1.0 for identical strings" do
      sub = build(:speaking_submission, transcription: "あいう", target_text: "あいう")
      expect(sub.similarity_ratio).to eq(1.0)
    end

    it "returns a ratio for partially matching strings" do
      sub = build(:speaking_submission, transcription: "あいえ", target_text: "あいう")
      expect(sub.similarity_ratio).to be_between(0.5, 0.9)
    end

    it "returns 0 for empty transcription" do
      sub = build(:speaking_submission, transcription: "", target_text: "あいう")
      expect(sub.similarity_ratio).to eq(0.0)
    end
  end

  describe "#pronunciation_notes" do
    it "extracts notes from evaluation" do
      sub = build(:speaking_submission, evaluation: { "pronunciation_notes" => ["r-sound"] })
      expect(sub.pronunciation_notes).to eq(["r-sound"])
    end

    it "returns empty string when no notes" do
      sub = build(:speaking_submission, evaluation: {})
      expect(sub.pronunciation_notes).to eq("")
    end
  end

  describe "scopes" do
    it ".high_accuracy returns submissions with score >= 80" do
      high = create(:speaking_submission, accuracy_score: 90)
      low = create(:speaking_submission, accuracy_score: 50)
      expect(SpeakingSubmission.high_accuracy).to include(high)
      expect(SpeakingSubmission.high_accuracy).not_to include(low)
    end

    it ".for_exercise filters by exercise" do
      exercise1 = create(:exercise)
      exercise2 = create(:exercise)
      s1 = create(:speaking_submission, exercise: exercise1)
      s2 = create(:speaking_submission, exercise: exercise2)
      expect(SpeakingSubmission.for_exercise(exercise1)).to include(s1)
      expect(SpeakingSubmission.for_exercise(exercise1)).not_to include(s2)
    end

    it ".recent orders by created_at descending" do
      old = create(:speaking_submission, created_at: 2.days.ago)
      recent = create(:speaking_submission, created_at: 1.hour.ago)
      expect(SpeakingSubmission.recent.first).to eq(recent)
      expect(SpeakingSubmission.recent.last).to eq(old)
    end

    it ".for_learner filters by learner" do
      learner1 = create(:learner)
      learner2 = create(:learner)
      s1 = create(:speaking_submission, learner: learner1)
      s2 = create(:speaking_submission, learner: learner2)
      expect(SpeakingSubmission.for_learner(learner1)).to include(s1)
      expect(SpeakingSubmission.for_learner(learner1)).not_to include(s2)
    end
  end

  describe "#problem_sounds" do
    it "extracts problem_sounds from evaluation" do
      sub = build(:speaking_submission, evaluation: { "problem_sounds" => ["r", "l"] })
      expect(sub.problem_sounds).to eq(["r", "l"])
    end

    it "returns empty array when no problem_sounds" do
      sub = build(:speaking_submission, evaluation: {})
      expect(sub.problem_sounds).to eq([])
    end
  end

  describe "#fluency_score" do
    it "extracts fluency_score from evaluation" do
      sub = build(:speaking_submission, evaluation: { "fluency_score" => 88 })
      expect(sub.fluency_score).to eq(88)
    end

    it "returns nil when no fluency_score" do
      sub = build(:speaking_submission, evaluation: {})
      expect(sub.fluency_score).to be_nil
    end
  end

  describe "seed_srs_card callback" do
    it "creates an SRS card when submission passes and srs_key is present" do
      exercise = create(:exercise, content: { "correct_answer" => "x", "hints" => [], "srs_key" => "おはよう" })
      expect {
        create(:speaking_submission, exercise: exercise, accuracy_score: 80, target_text: "おはよう")
      }.to change(SrsCard, :count).by(1)
      card = SrsCard.last
      expect(card.card_type).to eq("speaking")
      expect(card.card_key).to eq("おはよう")
    end

    it "does not create an SRS card when submission fails" do
      exercise = create(:exercise, content: { "correct_answer" => "x", "hints" => [], "srs_key" => "おはよう" })
      expect {
        create(:speaking_submission, exercise: exercise, accuracy_score: 40, target_text: "おはよう")
      }.not_to change(SrsCard, :count)
    end

    it "does not create an SRS card when srs_key is absent" do
      exercise = create(:exercise, content: { "correct_answer" => "x", "hints" => [] })
      expect {
        create(:speaking_submission, exercise: exercise, accuracy_score: 80, target_text: "おはよう")
      }.not_to change(SrsCard, :count)
    end
  end
end
