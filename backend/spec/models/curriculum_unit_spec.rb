require 'rails_helper'

RSpec.describe CurriculumUnit, type: :model do
  it { is_expected.to belong_to(:curriculum_level) }
  it { is_expected.to have_many(:lessons).dependent(:destroy) }
  it { is_expected.to validate_presence_of(:position) }
  it { is_expected.to validate_presence_of(:title) }
  it { is_expected.to validate_presence_of(:description) }

  describe "uniqueness" do
    subject { create(:curriculum_unit) }

    it { is_expected.to validate_uniqueness_of(:position).scoped_to(:curriculum_level_id) }
  end

  describe "unhappy paths" do
    it "rejects a missing title" do
      unit = build(:curriculum_unit, title: nil)
      expect(unit).not_to be_valid
      expect(unit.errors[:title]).to be_present
    end

    it "rejects duplicate position within the same curriculum level" do
      level = create(:curriculum_level)
      create(:curriculum_unit, curriculum_level: level, position: 1)
      duplicate = build(:curriculum_unit, curriculum_level: level, position: 1)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:position]).to be_present
    end

    it "rejects a missing description" do
      unit = build(:curriculum_unit, description: nil)
      expect(unit).not_to be_valid
      expect(unit.errors[:description]).to be_present
    end
  end
end
