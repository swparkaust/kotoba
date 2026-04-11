require 'rails_helper'

RSpec.describe WritingSubmission, type: :model do
  it { is_expected.to belong_to(:learner) }
  it { is_expected.to belong_to(:exercise) }
  it { is_expected.to validate_presence_of(:submitted_text) }

  describe "score validation" do
    it "allows nil score" do
      sub = build(:writing_submission, score: nil)
      sub.valid?
      expect(sub.errors[:score]).to be_empty
    end

    it "rejects score above 100" do
      sub = build(:writing_submission, score: 101)
      expect(sub).not_to be_valid
    end

    it "rejects negative score" do
      sub = build(:writing_submission, score: -1)
      expect(sub).not_to be_valid
    end
  end

  describe "#passed?" do
    it "returns true when score >= 60" do
      sub = build(:writing_submission, score: 60)
      expect(sub.passed?).to be true
    end

    it "returns false when score < 60" do
      sub = build(:writing_submission, score: 59)
      expect(sub.passed?).to be false
    end

    it "returns false when score is nil" do
      sub = build(:writing_submission, score: nil)
      expect(sub.passed?).to be false
    end
  end

  describe "#grammar_feedback" do
    it "extracts grammar_feedback from evaluation" do
      sub = build(:writing_submission, evaluation: { "grammar_feedback" => "良い文法です" })
      expect(sub.grammar_feedback).to eq("良い文法です")
    end

    it "returns nil when evaluation is empty" do
      sub = build(:writing_submission, evaluation: {})
      expect(sub.grammar_feedback).to be_nil
    end
  end

  describe "#suggestions" do
    it "returns suggestions array from evaluation" do
      sub = build(:writing_submission, evaluation: { "suggestions" => [ "もっと丁寧に" ] })
      expect(sub.suggestions).to eq([ "もっと丁寧に" ])
    end

    it "returns empty array when no suggestions" do
      sub = build(:writing_submission, evaluation: {})
      expect(sub.suggestions).to eq([])
    end
  end

  describe "scopes" do
    it ".recent orders by created_at desc" do
      old = create(:writing_submission, created_at: 2.days.ago)
      new_sub = create(:writing_submission, created_at: 1.hour.ago)
      expect(WritingSubmission.recent.first).to eq(new_sub)
    end

    it ".high_scoring filters by score >= 80" do
      high = create(:writing_submission, score: 85)
      low = create(:writing_submission, score: 50)
      expect(WritingSubmission.high_scoring).to include(high)
      expect(WritingSubmission.high_scoring).not_to include(low)
    end

    it ".for_exercise filters by exercise" do
      exercise1 = create(:exercise)
      exercise2 = create(:exercise)
      s1 = create(:writing_submission, exercise: exercise1)
      s2 = create(:writing_submission, exercise: exercise2)
      expect(WritingSubmission.for_exercise(exercise1)).to include(s1)
      expect(WritingSubmission.for_exercise(exercise1)).not_to include(s2)
    end

    it ".for_learner filters by learner" do
      learner1 = create(:learner)
      learner2 = create(:learner)
      s1 = create(:writing_submission, learner: learner1)
      s2 = create(:writing_submission, learner: learner2)
      expect(WritingSubmission.for_learner(learner1)).to include(s1)
      expect(WritingSubmission.for_learner(learner1)).not_to include(s2)
    end
  end

  describe "#naturalness_feedback" do
    it "extracts naturalness_feedback from evaluation" do
      sub = build(:writing_submission, evaluation: { "naturalness_feedback" => "自然な表現です" })
      expect(sub.naturalness_feedback).to eq("自然な表現です")
    end

    it "returns nil when evaluation is empty" do
      sub = build(:writing_submission, evaluation: {})
      expect(sub.naturalness_feedback).to be_nil
    end
  end

  describe "#register_feedback" do
    it "extracts register_feedback from evaluation" do
      sub = build(:writing_submission, evaluation: { "register_feedback" => "丁寧語が適切です" })
      expect(sub.register_feedback).to eq("丁寧語が適切です")
    end

    it "returns nil when evaluation is empty" do
      sub = build(:writing_submission, evaluation: {})
      expect(sub.register_feedback).to be_nil
    end
  end

  describe "#level" do
    it "returns the curriculum level position from the exercise chain" do
      language = create(:language, code: "ja")
      level = create(:curriculum_level, language: language, position: 3)
      unit = create(:curriculum_unit, curriculum_level: level)
      lesson = create(:lesson, curriculum_unit: unit)
      exercise = create(:exercise, lesson: lesson)
      sub = build(:writing_submission, exercise: exercise)
      expect(sub.level).to eq(3)
    end

    it "returns nil when exercise has no lesson" do
      sub = build(:writing_submission)
      allow(sub.exercise).to receive(:lesson).and_return(nil)
      expect(sub.level).to be_nil
    end
  end

  describe "seed_srs_card callback" do
    it "creates an SRS card when submission passes and srs_key is present" do
      exercise = create(:exercise, content: { "correct_answer" => "x", "hints" => [], "srs_key" => "書く" })
      expect {
        create(:writing_submission, exercise: exercise, score: 80, submitted_text: "書く")
      }.to change(SrsCard, :count).by(1)
      card = SrsCard.last
      expect(card.card_type).to eq("writing")
      expect(card.card_key).to eq("書く")
    end

    it "does not create an SRS card when submission fails" do
      exercise = create(:exercise, content: { "correct_answer" => "x", "hints" => [], "srs_key" => "書く" })
      expect {
        create(:writing_submission, exercise: exercise, score: 40, submitted_text: "書く")
      }.not_to change(SrsCard, :count)
    end

    it "does not create an SRS card when srs_key is absent" do
      exercise = create(:exercise, content: { "correct_answer" => "x", "hints" => [] })
      expect {
        create(:writing_submission, exercise: exercise, score: 80, submitted_text: "書く")
      }.not_to change(SrsCard, :count)
    end
  end
end
