class WritingSubmission < ApplicationRecord
  belongs_to :learner
  belongs_to :exercise

  validates :submitted_text, presence: true, length: { minimum: 1, maximum: 10_000 }
  validates :score, numericality: { in: 0..100 }, allow_nil: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_learner, ->(learner) { where(learner: learner) }
  scope :high_scoring, -> { where("score >= ?", 80) }
  scope :for_exercise, ->(exercise) { where(exercise: exercise) }

  after_create :seed_srs_card

  def grammar_feedback
    evaluation&.dig("grammar_feedback")
  end

  def naturalness_feedback
    evaluation&.dig("naturalness_feedback")
  end

  def register_feedback
    evaluation&.dig("register_feedback")
  end

  def suggestions
    evaluation&.dig("suggestions") || []
  end

  def passed?
    score.present? && score >= 60
  end

  def level
    exercise&.lesson&.curriculum_unit&.curriculum_level&.position
  end

  private

  def seed_srs_card
    return unless passed?

    key = exercise.content&.dig("srs_key")
    return unless key

    SrsCard.seed_for(
      learner: learner,
      card_type: "writing",
      card_key: key,
      card_data: { front: key, back: submitted_text, source_level: level }
    )
  end
end
