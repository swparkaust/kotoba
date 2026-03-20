class ReadingSession < ApplicationRecord
  belongs_to :learner
  belongs_to :library_item

  validates :session_type, presence: true, inclusion: { in: %w[reading listening] }
  validates :duration_seconds, presence: true, numericality: { greater_than: 0 }
  validates :words_read, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :progress_pct, numericality: { greater_than_or_equal_to: 0.0, less_than_or_equal_to: 1.0 }, allow_nil: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_learner, ->(learner) { where(learner: learner) }
  scope :reading, -> { where(session_type: "reading") }
  scope :listening, -> { where(session_type: "listening") }
  scope :this_week, -> { where("created_at >= ?", Time.current.beginning_of_week) }

  def duration_minutes
    (duration_seconds / 60.0).round(1)
  end

  def completed?
    progress_pct.present? && progress_pct >= 1.0
  end

  def new_vocabulary_count
    (new_srs_cards || []).length
  end

  def self.total_minutes_for(learner)
    for_learner(learner).sum(:duration_seconds) / 60.0
  end

  def self.total_words_for(learner)
    for_learner(learner).sum(:words_read)
  end

  def self.completed_count_for(learner)
    for_learner(learner).where("progress_pct >= 1.0").count
  end

  def self.weekly_summary(learner)
    sessions = for_learner(learner).this_week
    {
      sessions: sessions.count,
      minutes: (sessions.sum(:duration_seconds) / 60.0).round(1),
      words: sessions.sum(:words_read),
      items: sessions.select(:library_item_id).distinct.count
    }
  end
end
