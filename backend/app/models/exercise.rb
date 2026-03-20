class Exercise < ApplicationRecord
  belongs_to :lesson
  has_many :writing_submissions, dependent: :destroy
  has_many :speaking_submissions, dependent: :destroy

  validates :exercise_type, presence: true, inclusion: { in: %w[multiple_choice picture_match trace fill_blank listening reorder writing speaking authentic_reading pragmatic_choice contrastive_grammar real_audio_comprehension] }
  validates :position, presence: true
  validates :content, presence: true
  validates :difficulty, presence: true, inclusion: { in: %w[easy normal challenge] }
  validates :qa_status, presence: true, inclusion: { in: %w[pending passed flagged rejected] }
end
