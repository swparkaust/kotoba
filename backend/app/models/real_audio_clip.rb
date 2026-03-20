class RealAudioClip < ApplicationRecord
  belongs_to :lesson

  validates :title, presence: true
  validates :audio_url, presence: true
  validates :duration_seconds, presence: true
  validates :transcription, presence: true
  validates :formality, presence: true, inclusion: { in: %w[casual polite formal mixed] }
  validates :speed, presence: true, inclusion: { in: %w[slow natural fast] }
  validates :attribution, presence: true
  validates :license, presence: true
  validates :difficulty_level, presence: true
end
