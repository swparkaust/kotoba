require 'rails_helper'

RSpec.describe SrsCard, type: :model do
  it { is_expected.to belong_to(:learner) }
  it { is_expected.to validate_presence_of(:card_type) }
  it { is_expected.to validate_inclusion_of(:card_type).in_array(%w[kanji vocabulary grammar writing speaking]) }
  it { is_expected.to validate_presence_of(:card_key) }

  describe "uniqueness" do
    subject { create(:srs_card) }

    it { is_expected.to validate_uniqueness_of(:card_key).scoped_to([ :learner_id, :card_type ]) }
  end
  it { is_expected.to validate_presence_of(:next_review_at) }

  describe ".active" do
    it "excludes burned cards" do
      learner = create(:learner)
      active = create(:srs_card, learner: learner, burned: false)
      create(:srs_card, learner: learner, burned: true, card_key: "burned_key")
      expect(SrsCard.active).to eq([ active ])
    end
  end

  describe ".due" do
    it "returns active cards with past next_review_at" do
      learner = create(:learner)
      due = create(:srs_card, learner: learner, next_review_at: 1.hour.ago, burned: false)
      create(:srs_card, learner: learner, next_review_at: 1.day.from_now, burned: false, card_key: "future")
      expect(SrsCard.due).to eq([ due ])
    end
  end

  describe ".by_type" do
    it "filters by card_type" do
      learner = create(:learner)
      kanji = create(:srs_card, learner: learner, card_type: "kanji")
      create(:srs_card, learner: learner, card_type: "vocabulary", card_key: "vocab1")
      expect(SrsCard.by_type("kanji")).to eq([ kanji ])
    end
  end

  describe ".by_level_range" do
    it "filters cards within a source_level range" do
      learner = create(:learner)
      low = create(:srs_card, learner: learner, card_data: { "front" => "a", "source_level" => 2 })
      create(:srs_card, learner: learner, card_data: { "front" => "b", "source_level" => 8 }, card_key: "high")
      expect(SrsCard.by_level_range(1, 3)).to eq([ low ])
    end
  end

  describe ".burned" do
    it "returns only burned cards" do
      learner = create(:learner)
      create(:srs_card, learner: learner, burned: false)
      burned = create(:srs_card, learner: learner, burned: true, card_key: "burned_key")
      expect(SrsCard.burned).to eq([ burned ])
    end
  end

  describe "interval_days validation" do
    it "rejects interval_days <= 0" do
      card = build(:srs_card, interval_days: 0)
      expect(card).not_to be_valid
      expect(card.errors[:interval_days]).to be_present
    end

    it "requires interval_days to be present" do
      card = build(:srs_card, interval_days: nil)
      expect(card).not_to be_valid
      expect(card.errors[:interval_days]).to be_present
    end
  end

  describe "ease_factor validation" do
    it "requires ease_factor to be present" do
      card = build(:srs_card, ease_factor: nil)
      expect(card).not_to be_valid
      expect(card.errors[:ease_factor]).to be_present
    end
  end
end
