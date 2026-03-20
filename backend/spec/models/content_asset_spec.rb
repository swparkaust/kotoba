require 'rails_helper'

RSpec.describe ContentAsset, type: :model do
  it { is_expected.to belong_to(:lesson) }
  it { is_expected.to validate_presence_of(:asset_type) }
  it { is_expected.to validate_inclusion_of(:asset_type).in_array(%w[illustration_webp illustration_png scene_webp character_sheet_png audio_mp3 audio_ogg]) }
  it { is_expected.to validate_presence_of(:asset_key) }

  describe "uniqueness" do
    subject { create(:content_asset) }

    it { is_expected.to validate_uniqueness_of(:asset_key).scoped_to(:lesson_id) }
  end
  it { is_expected.to validate_inclusion_of(:qa_status).in_array(%w[pending passed flagged rejected]) }

  it "requires either data or url" do
    asset = build(:content_asset, data: nil, url: nil)
    expect(asset).not_to be_valid
    expect(asset.errors[:base]).to include("Either data or url must be present")
  end
end
