class SrsCard < ApplicationRecord
  belongs_to :learner

  validates :card_type, presence: true, inclusion: { in: %w[kanji vocabulary grammar writing speaking] }
  validates :card_key, presence: true, uniqueness: { scope: [:learner_id, :card_type] }
  validates :interval_days, presence: true, numericality: { greater_than: 0 }
  validates :ease_factor, presence: true
  validates :next_review_at, presence: true

  scope :active, -> { where(burned: false) }
  scope :burned, -> { where(burned: true) }
  scope :due, -> { active.where("next_review_at <= ?", Time.current) }
  scope :by_type, ->(type) { where(card_type: type) }
  scope :by_level_range, ->(min, max) {
    where("card_data->>'source_level' IS NOT NULL")
      .where("(card_data->>'source_level')::int BETWEEN ? AND ?", min, max)
  }
end
