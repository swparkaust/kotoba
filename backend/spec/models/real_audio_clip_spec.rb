require 'rails_helper'

RSpec.describe RealAudioClip, type: :model do
  it { is_expected.to belong_to(:lesson) }
  it { is_expected.to validate_presence_of(:title) }
  it { is_expected.to validate_presence_of(:audio_url) }
  it { is_expected.to validate_presence_of(:duration_seconds) }
  it { is_expected.to validate_presence_of(:transcription) }
  it { is_expected.to validate_presence_of(:formality) }
  it { is_expected.to validate_inclusion_of(:formality).in_array(%w[casual polite formal mixed]) }
  it { is_expected.to validate_presence_of(:speed) }
  it { is_expected.to validate_inclusion_of(:speed).in_array(%w[slow natural fast]) }
  it { is_expected.to validate_presence_of(:attribution) }
  it { is_expected.to validate_presence_of(:license) }
  it { is_expected.to validate_presence_of(:difficulty_level) }

  describe "unhappy paths" do
    it "rejects an invalid formality" do
      clip = build(:real_audio_clip, formality: "rude")
      expect(clip).not_to be_valid
      expect(clip.errors[:formality]).to be_present
    end

    it "rejects an invalid speed" do
      clip = build(:real_audio_clip, speed: "turbo")
      expect(clip).not_to be_valid
      expect(clip.errors[:speed]).to be_present
    end

    it "rejects a missing title" do
      clip = build(:real_audio_clip, title: nil)
      expect(clip).not_to be_valid
      expect(clip.errors[:title]).to be_present
    end
  end
end
