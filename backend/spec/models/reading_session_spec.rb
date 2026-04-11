require 'rails_helper'

RSpec.describe ReadingSession, type: :model do
  it { is_expected.to belong_to(:learner) }
  it { is_expected.to belong_to(:library_item) }
  it { is_expected.to validate_presence_of(:session_type) }
  it { is_expected.to validate_inclusion_of(:session_type).in_array(%w[reading listening]) }
  it { is_expected.to validate_presence_of(:duration_seconds) }

  describe "#duration_minutes" do
    it "converts seconds to minutes" do
      session = build(:reading_session, duration_seconds: 900)
      expect(session.duration_minutes).to eq(15.0)
    end
  end

  describe "#completed?" do
    it "returns true when progress_pct >= 1.0" do
      session = build(:reading_session, progress_pct: 1.0)
      expect(session.completed?).to be true
    end

    it "returns false when progress_pct < 1.0" do
      session = build(:reading_session, progress_pct: 0.5)
      expect(session.completed?).to be false
    end
  end

  describe "#new_vocabulary_count" do
    it "counts items in new_srs_cards" do
      session = build(:reading_session, new_srs_cards: [ "word1", "word2" ])
      expect(session.new_vocabulary_count).to eq(2)
    end

    it "returns 0 when new_srs_cards is empty" do
      session = build(:reading_session, new_srs_cards: [])
      expect(session.new_vocabulary_count).to eq(0)
    end
  end

  describe "scopes" do
    let(:learner) { create(:learner) }

    it ".reading filters by reading sessions" do
      reading = create(:reading_session, learner: learner, session_type: "reading")
      listening = create(:reading_session, learner: learner, session_type: "listening")
      expect(ReadingSession.reading).to include(reading)
      expect(ReadingSession.reading).not_to include(listening)
    end

    it ".listening filters by listening sessions" do
      reading = create(:reading_session, learner: learner, session_type: "reading")
      listening = create(:reading_session, learner: learner, session_type: "listening")
      expect(ReadingSession.listening).to include(listening)
      expect(ReadingSession.listening).not_to include(reading)
    end
  end

  describe "scope .recent" do
    it "orders by created_at descending" do
      learner = create(:learner)
      old = create(:reading_session, learner: learner, created_at: 2.days.ago)
      recent = create(:reading_session, learner: learner, created_at: 1.hour.ago)
      expect(ReadingSession.recent.first).to eq(recent)
      expect(ReadingSession.recent.last).to eq(old)
    end
  end

  describe "scope .for_learner" do
    it "returns sessions for a specific learner" do
      learner1 = create(:learner)
      learner2 = create(:learner)
      s1 = create(:reading_session, learner: learner1)
      s2 = create(:reading_session, learner: learner2)
      expect(ReadingSession.for_learner(learner1)).to include(s1)
      expect(ReadingSession.for_learner(learner1)).not_to include(s2)
    end
  end

  describe "scope .this_week" do
    it "returns sessions created this week" do
      learner = create(:learner)
      this_week = create(:reading_session, learner: learner, created_at: Time.current)
      last_week = create(:reading_session, learner: learner, created_at: 2.weeks.ago)
      expect(ReadingSession.this_week).to include(this_week)
      expect(ReadingSession.this_week).not_to include(last_week)
    end
  end

  describe ".total_words_for" do
    it "sums words_read for a learner" do
      learner = create(:learner)
      create(:reading_session, learner: learner, words_read: 100)
      create(:reading_session, learner: learner, words_read: 250)
      expect(ReadingSession.total_words_for(learner)).to eq(350)
    end

    it "returns 0 when learner has no sessions" do
      learner = create(:learner)
      expect(ReadingSession.total_words_for(learner)).to eq(0)
    end
  end

  describe ".completed_count_for" do
    it "counts sessions with progress_pct >= 1.0" do
      learner = create(:learner)
      create(:reading_session, learner: learner, progress_pct: 1.0)
      create(:reading_session, learner: learner, progress_pct: 1.0)
      create(:reading_session, learner: learner, progress_pct: 0.5)
      expect(ReadingSession.completed_count_for(learner)).to eq(2)
    end

    it "returns 0 when no sessions are completed" do
      learner = create(:learner)
      create(:reading_session, learner: learner, progress_pct: 0.3)
      expect(ReadingSession.completed_count_for(learner)).to eq(0)
    end
  end

  describe ".total_minutes_for" do
    it "sums duration for a learner" do
      learner = create(:learner)
      create(:reading_session, learner: learner, duration_seconds: 600)
      create(:reading_session, learner: learner, duration_seconds: 300)
      expect(ReadingSession.total_minutes_for(learner)).to eq(15.0)
    end
  end

  describe ".weekly_summary" do
    it "returns summary stats for current week" do
      learner = create(:learner)
      create(:reading_session, learner: learner, duration_seconds: 600, words_read: 100)
      summary = ReadingSession.weekly_summary(learner)
      expect(summary[:sessions]).to eq(1)
      expect(summary[:words]).to eq(100)
    end
  end
end
