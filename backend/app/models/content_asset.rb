class ContentAsset < ApplicationRecord
  belongs_to :lesson

  validates :asset_type, presence: true, inclusion: { in: %w[illustration_webp illustration_png scene_webp character_sheet_png audio_mp3 audio_ogg] }
  validates :asset_key, presence: true, uniqueness: { scope: :lesson_id }
  validates :qa_status, presence: true, inclusion: { in: %w[pending passed flagged rejected] }
  validate :data_or_url_present

  private

  def data_or_url_present
    errors.add(:base, "Either data or url must be present") if data.blank? && url.blank?
  end
end
