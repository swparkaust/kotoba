class LibraryItem < ApplicationRecord
  belongs_to :language
  has_many :reading_sessions, dependent: :destroy

  validates :item_type, presence: true, inclusion: { in: %w[graded_reader article novel podcast lecture] }
  validates :title, presence: true
  validates :attribution, presence: true
  validates :license, presence: true
  validates :difficulty_level, presence: true, numericality: { in: 1..12 }

  scope :active, -> { where(active: true) }
  scope :for_level, ->(level) { where(difficulty_level: level) }
  scope :for_level_range, ->(min, max) { where(difficulty_level: min..max) }
  scope :text_items, -> { where(item_type: %w[graded_reader article novel]) }
  scope :audio_items, -> { where(item_type: %w[podcast lecture]) }
end
