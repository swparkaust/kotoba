class LearnerProgress < ApplicationRecord
  belongs_to :learner
  belongs_to :lesson

  validates :status, presence: true, inclusion: { in: %w[locked available in_progress completed] }
  validates :lesson_id, uniqueness: { scope: :learner_id }
end
