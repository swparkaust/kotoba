require 'rails_helper'

RSpec.describe AuthenticSource, type: :model do
  it { is_expected.to belong_to(:lesson) }
  it { is_expected.to validate_presence_of(:source_type) }
  it { is_expected.to validate_inclusion_of(:source_type).in_array(%w[news literature editorial academic government]) }
  it { is_expected.to validate_presence_of(:title) }
  it { is_expected.to validate_presence_of(:body_text) }
  it { is_expected.to validate_presence_of(:attribution) }
  it { is_expected.to validate_presence_of(:license) }
  it { is_expected.to validate_inclusion_of(:license).in_array(%w[public_domain cc_by cc_by_sa fair_use]) }
  it { is_expected.to validate_presence_of(:difficulty_level) }

  describe "unhappy paths" do
    it "rejects an invalid source_type" do
      source = build(:authentic_source, source_type: "blog")
      expect(source).not_to be_valid
      expect(source.errors[:source_type]).to be_present
    end

    it "rejects a missing title" do
      source = build(:authentic_source, title: nil)
      expect(source).not_to be_valid
      expect(source.errors[:title]).to be_present
    end

    it "rejects an invalid license" do
      source = build(:authentic_source, license: "mit")
      expect(source).not_to be_valid
      expect(source.errors[:license]).to be_present
    end

    it "rejects difficulty_level below valid range" do
      source = build(:authentic_source, difficulty_level: 5)
      expect(source).not_to be_valid
      expect(source.errors[:difficulty_level]).to be_present
    end

    it "rejects difficulty_level above valid range" do
      source = build(:authentic_source, difficulty_level: 13)
      expect(source).not_to be_valid
      expect(source.errors[:difficulty_level]).to be_present
    end
  end
end
