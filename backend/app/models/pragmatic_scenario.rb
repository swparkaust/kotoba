class PragmaticScenario < ApplicationRecord
  belongs_to :lesson

  validates :title, presence: true
  validates :situation_ja, presence: true
  validates :dialogue, presence: true
  validates :choices, presence: true
  validates :analysis, presence: true
  validates :cultural_topic, presence: true
  validates :difficulty_level, presence: true, numericality: { in: 1..12 }

  scope :by_topic, ->(topic) { where(cultural_topic: topic) }
  scope :by_difficulty, ->(level) { where(difficulty_level: level) }
  scope :for_level_range, ->(min, max) { where(difficulty_level: min..max) }

  CULTURAL_TOPICS = %w[
    refusal apology gratitude request introduction
    complaint compliment invitation negotiation
    sympathy disagreement congratulation condolence
  ].freeze

  validates :cultural_topic, inclusion: { in: CULTURAL_TOPICS }

  def speakers
    (dialogue || []).map { |line| line["speaker"] }.uniq
  end

  def best_choice
    return nil if choices.blank?

    choices.max_by { |c| c["score"].to_i }
  end

  def choice_count
    (choices || []).length
  end

  def cultural_rule
    analysis&.dig("rule")
  end

  def explanation
    analysis&.dig("explanation")
  end

  def evaluate_choice(response_text)
    match = (choices || []).find { |c| c["response"] == response_text }
    return { score: 0, feedback: "その選択肢は見つかりませんでした。" } unless match

    {
      score: match["score"].to_i,
      feedback: match["feedback"] || cultural_rule,
      is_best: match == best_choice
    }
  end
end
