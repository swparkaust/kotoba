class Lesson < ApplicationRecord
  belongs_to :curriculum_unit
  has_many :exercises, dependent: :destroy
  has_many :content_assets, dependent: :destroy
  has_many :learner_progresses, dependent: :destroy
  has_many :authentic_sources, dependent: :destroy
  has_many :real_audio_clips, dependent: :destroy
  has_many :pragmatic_scenarios, dependent: :destroy
  has_many :contrastive_grammar_sets, dependent: :destroy

  validates :position, presence: true, uniqueness: { scope: :curriculum_unit_id }
  validates :title, presence: true
  validates :skill_type, presence: true, inclusion: { in: %w[character_intro vocabulary grammar reading listening review writing speaking authentic_reading pragmatics contrastive_grammar classical_japanese] }
  validates :content_status, presence: true, inclusion: { in: %w[pending building qa_review ready failed qa_failed] }

  scope :ready, -> { where(content_status: "ready") }
end
