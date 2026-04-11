require 'rails_helper'

RSpec.describe Language, type: :model do
  it { is_expected.to validate_presence_of(:code) }

  describe "uniqueness" do
    subject { create(:language) }

    it { is_expected.to validate_uniqueness_of(:code) }
  end
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_presence_of(:native_name) }
  it { is_expected.to have_many(:curriculum_levels).dependent(:destroy) }
  it { is_expected.to have_many(:placement_attempts).dependent(:destroy) }
  it { is_expected.to have_many(:content_pack_versions).dependent(:destroy) }
  it { is_expected.to have_many(:library_items).dependent(:destroy) }

  describe ".active" do
    it "returns only active languages" do
      active = create(:language, code: "ja", active: true)
      create(:language, code: "ko", active: false, name: "Korean", native_name: "한국어")
      expect(Language.active).to eq([ active ])
    end
  end

  describe "unhappy paths" do
    it "rejects a duplicate code" do
      create(:language, code: "ja")
      duplicate = build(:language, code: "ja")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:code]).to be_present
    end

    it "rejects a missing name" do
      language = build(:language, name: nil)
      expect(language).not_to be_valid
      expect(language.errors[:name]).to be_present
    end

    it "rejects a missing native_name" do
      language = build(:language, native_name: nil)
      expect(language).not_to be_valid
      expect(language.errors[:native_name]).to be_present
    end
  end
end
