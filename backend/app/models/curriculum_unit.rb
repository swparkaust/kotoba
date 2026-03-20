class CurriculumUnit < ApplicationRecord
  belongs_to :curriculum_level
  has_many :lessons, dependent: :destroy

  validates :position, presence: true, uniqueness: { scope: :curriculum_level_id }
  validates :title, presence: true
  validates :description, presence: true
end
