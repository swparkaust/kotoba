class Language < ApplicationRecord
  has_many :curriculum_levels, dependent: :destroy
  has_many :placement_attempts, dependent: :destroy
  has_many :content_pack_versions, dependent: :destroy
  has_many :library_items, dependent: :destroy

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :native_name, presence: true

  scope :active, -> { where(active: true) }
end
