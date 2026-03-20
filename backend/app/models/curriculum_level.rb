class CurriculumLevel < ApplicationRecord
  belongs_to :language
  has_many :curriculum_units, dependent: :destroy

  validates :position, presence: true, uniqueness: { scope: :language_id }
  validates :title, presence: true
  validates :mext_grade, presence: true
  validates :jlpt_approx, presence: true
  validates :description, presence: true
end
