class PlacementAttempt < ApplicationRecord
  belongs_to :learner
  belongs_to :language

  validates :recommended_level, presence: true, numericality: { in: 1..12 }
  validates :overall_score, presence: true, numericality: { greater_than_or_equal_to: 0.0, less_than_or_equal_to: 1.0 }
  validates :chosen_level, numericality: { in: 1..12 }, allow_nil: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_learner, ->(learner) { where(learner: learner) }
  scope :accepted, -> { where.not(chosen_level: nil) }
  scope :for_language, ->(language) { where(language: language) }

  def accepted?
    chosen_level.present?
  end

  def accepted_recommendation?
    chosen_level == recommended_level
  end

  def response_count
    (responses || []).length
  end

  def correct_responses
    (responses || []).count { |r| r["correct"] }
  end

  def accuracy
    return 0.0 if response_count.zero?

    correct_responses.to_f / response_count
  end

  def accept!(level = nil)
    update!(chosen_level: level || recommended_level)
  end

  def self.latest_for(learner:, language:)
    for_learner(learner).for_language(language).recent.first
  end
end
