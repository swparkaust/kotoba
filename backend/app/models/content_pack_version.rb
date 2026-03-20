class ContentPackVersion < ApplicationRecord
  belongs_to :language

  validates :version, presence: true, uniqueness: { scope: :language_id },
            numericality: { only_integer: true, greater_than: 0 }
  validates :status, presence: true, inclusion: { in: %w[building ready archived] }
  validates :lesson_count, numericality: { greater_than_or_equal_to: 0 }
  validates :asset_count, numericality: { greater_than_or_equal_to: 0 }

  scope :ready, -> { where(status: "ready") }
  scope :for_language, ->(language) { where(language: language) }
  scope :latest_first, -> { order(version: :desc) }
  scope :published, -> { ready.where.not(published_at: nil) }

  def ready?
    status == "ready"
  end

  def building?
    status == "building"
  end

  def archived?
    status == "archived"
  end

  def publish!
    update!(status: "ready", published_at: Time.current)
  end

  def archive!
    update!(status: "archived")
  end

  def self.latest_ready(language)
    for_language(language).ready.latest_first.first
  end

  def self.newer_than?(language:, version:)
    latest = latest_ready(language)
    return false unless latest

    latest.version > version
  end
end
