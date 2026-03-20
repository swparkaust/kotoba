class ContrastiveGrammarSet < ApplicationRecord
  belongs_to :lesson

  validates :cluster_name, presence: true
  validates :patterns, presence: true
  validates :exercises, presence: true
  validates :confusion_notes, presence: true
  validates :difficulty_level, presence: true, numericality: { in: 1..12 }

  scope :by_difficulty, ->(level) { where(difficulty_level: level) }
  scope :for_level_range, ->(min, max) { where(difficulty_level: min..max) }
  scope :search_cluster, ->(query) { where("cluster_name ILIKE ?", "%#{query}%") }

  def pattern_names
    (patterns || []).map { |p| p["pattern"] }
  end

  def pattern_count
    (patterns || []).length
  end

  def exercise_count
    (exercises || []).length
  end

  def confusion_explanation
    confusion_notes&.dig("explanation")
  end

  def evaluate_answer(exercise_index, answer)
    ex = (exercises || [])[exercise_index]
    return { correct: false, feedback: "問題が見つかりません。" } unless ex

    correct = ex["correct"]
    is_correct = answer.strip == correct.strip

    {
      correct: is_correct,
      expected: correct,
      context: ex["context"],
      feedback: is_correct ? "正解です！" : "正しい答えは「#{correct}」です。#{confusion_explanation}"
    }
  end
end
