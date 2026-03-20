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
end
