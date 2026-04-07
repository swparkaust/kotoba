class SpeakingSubmission < ApplicationRecord
  belongs_to :learner
  belongs_to :exercise

  validates :transcription, presence: true
  validates :target_text, presence: true
  validates :accuracy_score, numericality: { in: 0..100 }, allow_nil: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_learner, ->(learner) { where(learner: learner) }
  scope :high_accuracy, -> { where("accuracy_score >= ?", 80) }
  scope :for_exercise, ->(exercise) { where(exercise: exercise) }

  after_create :seed_srs_card

  def pronunciation_notes
    evaluation&.dig("pronunciation_notes") || ""
  end

  def problem_sounds
    evaluation&.dig("problem_sounds") || []
  end

  def fluency_score
    evaluation&.dig("fluency_score")
  end

  def passed?
    accuracy_score.present? && accuracy_score >= 60
  end

  def similarity_ratio
    return 0.0 if target_text.blank? || transcription.blank?

    target_chars = target_text.chars
    spoken_chars = transcription.chars
    matches = target_chars.zip(spoken_chars).count { |a, b| a == b }
    matches.to_f / [target_chars.length, spoken_chars.length].max
  end

  private

  def seed_srs_card
    return unless passed?

    key = exercise.content&.dig("srs_key")
    return unless key

    SrsCard.seed_for(
      learner: learner,
      card_type: "speaking",
      card_key: key,
      card_data: { front: key, back: target_text, source_level: level }
    )
  end

  def level
    exercise&.lesson&.curriculum_unit&.curriculum_level&.position
  end
end
