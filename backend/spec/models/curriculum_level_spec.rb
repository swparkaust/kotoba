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
end
