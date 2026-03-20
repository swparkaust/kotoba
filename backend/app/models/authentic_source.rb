class AuthenticSource < ApplicationRecord
  belongs_to :lesson

  validates :source_type, presence: true, inclusion: { in: %w[news literature editorial academic government] }
  validates :title, presence: true
  validates :body_text, presence: true
  validates :attribution, presence: true
  validates :license, presence: true, inclusion: { in: %w[public_domain cc_by cc_by_sa fair_use] }
  validates :difficulty_level, presence: true, numericality: { in: 7..12 }
end
