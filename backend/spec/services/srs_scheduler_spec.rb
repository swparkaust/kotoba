require 'rails_helper'

RSpec.describe SrsScheduler, type: :service do
  let(:scheduler) { described_class.new }

  describe "#due_cards" do
    it "returns cards due for review" do
      learner = create(:learner)
      due = create(:srs_card, learner: learner, next_review_at: 1.hour.ago)
      create(:srs_card, learner: learner, next_review_at: 1.day.from_now, card_key: "future")
      expect(scheduler.due_cards(learner: learner)).to eq([ due ])
    end

    it "excludes burned cards" do
      learner = create(:learner)
      create(:srs_card, learner: learner, next_review_at: 1.hour.ago, burned: true)
      expect(scheduler.due_cards(learner: learner)).to be_empty
    end

    it "filters by card_type" do
      learner = create(:learner)
      kanji = create(:srs_card, learner: learner, next_review_at: 1.hour.ago, card_type: "kanji")
      create(:srs_card, learner: learner, next_review_at: 1.hour.ago, card_type: "vocabulary", card_key: "vocab1")
      expect(scheduler.due_cards(learner: learner, card_type: "kanji")).to eq([ kanji ])
    end

    it "respects time_budget_minutes" do
      learner = create(:learner)
      5.times { |i| create(:srs_card, learner: learner, next_review_at: i.hours.ago, card_key: "key_#{i}") }
      result = scheduler.due_cards(learner: learner, time_budget_minutes: 0.5)
      expect(result.count).to eq(2)
    end

    it "filters by level_min and level_max" do
      learner = create(:learner)
      low = create(:srs_card, learner: learner, next_review_at: 1.hour.ago,
                   card_data: { "front" => "a", "source_level" => 2 }, card_key: "low")
      create(:srs_card, learner: learner, next_review_at: 1.hour.ago,
             card_data: { "front" => "b", "source_level" => 8 }, card_key: "high")
      result = scheduler.due_cards(learner: learner, level_min: 1, level_max: 3)
      expect(result).to eq([ low ])
    end
  end

  describe "#record_review" do
    it "increases interval on correct answer" do
      card = create(:srs_card, interval_days: 1, ease_factor: 2.5)
      scheduler.record_review(card: card, correct: true)
      expect(card.interval_days).to eq(3)
      expect(card.repetitions).to eq(1)
    end

    it "resets interval on incorrect answer" do
      card = create(:srs_card, interval_days: 10, ease_factor: 2.5, repetitions: 5)
      scheduler.record_review(card: card, correct: false)
      expect(card.interval_days).to eq(1)
      expect(card.repetitions).to eq(0)
    end

    it "burns card after BURN_THRESHOLD consecutive correct reviews at max interval" do
      card = create(:srs_card, interval_days: 180, ease_factor: 2.5, repetitions: 9)
      scheduler.record_review(card: card, correct: true)
      expect(card.burned).to be true
    end

    it "does not burn card below threshold" do
      card = create(:srs_card, interval_days: 180, ease_factor: 2.5, repetitions: 8)
      scheduler.record_review(card: card, correct: true)
      expect(card.burned).to be false
    end
  end

  describe "#reactivate" do
    it "unburns a card and resets it" do
      card = create(:srs_card, burned: true, interval_days: 180, repetitions: 15)
      scheduler.reactivate(card: card)
      expect(card.burned).to be false
      expect(card.interval_days).to eq(1)
      expect(card.repetitions).to eq(0)
    end
  end

  describe "#stats" do
    it "returns card statistics" do
      learner = create(:learner)
      create(:srs_card, learner: learner, next_review_at: 1.hour.ago, burned: false)
      create(:srs_card, learner: learner, next_review_at: 1.day.from_now, burned: false, card_key: "future")
      create(:srs_card, learner: learner, next_review_at: 1.hour.ago, burned: true, card_key: "burned")
      stats = scheduler.stats(learner: learner)
      expect(stats[:total]).to eq(3)
      expect(stats[:active]).to eq(2)
      expect(stats[:burned]).to eq(1)
      expect(stats[:due_now]).to eq(1)
    end
  end
end
