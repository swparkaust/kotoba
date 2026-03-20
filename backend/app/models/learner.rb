class Learner < ApplicationRecord
  has_secure_password

  belongs_to :active_language, class_name: "Language", foreign_key: "active_language_code", primary_key: "code", optional: true

  has_many :learner_progresses, dependent: :destroy
  has_many :srs_cards, dependent: :destroy
  has_many :placement_attempts, dependent: :destroy
  has_many :writing_submissions, dependent: :destroy
  has_many :speaking_submissions, dependent: :destroy
  has_many :reading_sessions, dependent: :destroy
  has_many :push_subscriptions, dependent: :destroy

  validates :display_name, presence: true
  validates :email, presence: true, uniqueness: true
end
