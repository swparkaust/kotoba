require 'rails_helper'

RSpec.describe CurriculumLevel, type: :model do
  it { is_expected.to belong_to(:language) }
  it { is_expected.to have_many(:curriculum_units).dependent(:destroy) }
  it { is_expected.to validate_presence_of(:position) }
  it { is_expected.to validate_presence_of(:title) }
  it { is_expected.to validate_presence_of(:mext_grade) }
  it { is_expected.to validate_presence_of(:jlpt_approx) }
  it { is_expected.to validate_presence_of(:description) }

  describe "uniqueness" do
    subject { create(:curriculum_level) }

    it { is_expected.to validate_uniqueness_of(:position).scoped_to(:language_id) }
  end

  describe "unhappy paths" do
    it "rejects a missing title" do
      level = build(:curriculum_level, title: nil)
      expect(level).not_to be_valid
      expect(level.errors[:title]).to be_present
    end

    it "rejects duplicate position within the same language" do
      language = create(:language, code: "ja")
      create(:curriculum_level, language: language, position: 1)
      duplicate = build(:curriculum_level, language: language, position: 1)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:position]).to be_present
    end

    it "rejects a missing description" do
      level = build(:curriculum_level, description: nil)
      expect(level).not_to be_valid
      expect(level.errors[:description]).to be_present
    end
  end
end
