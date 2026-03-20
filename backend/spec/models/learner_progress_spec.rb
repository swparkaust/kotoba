require 'rails_helper'

RSpec.describe LearnerProgress, type: :model do
  it { is_expected.to belong_to(:learner) }
  it { is_expected.to belong_to(:lesson) }
  it { is_expected.to validate_presence_of(:status) }
  it { is_expected.to validate_inclusion_of(:status).in_array(%w[locked available in_progress completed]) }

  describe "uniqueness" do
    subject { create(:learner_progress) }

    it { is_expected.to validate_uniqueness_of(:lesson_id).scoped_to(:learner_id) }
  end
end
