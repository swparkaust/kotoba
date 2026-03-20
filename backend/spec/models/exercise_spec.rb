require 'rails_helper'

RSpec.describe Exercise, type: :model do
  it { is_expected.to belong_to(:lesson) }
  it { is_expected.to have_many(:writing_submissions).dependent(:destroy) }
  it { is_expected.to have_many(:speaking_submissions).dependent(:destroy) }
  it { is_expected.to validate_presence_of(:exercise_type) }
  it { is_expected.to validate_inclusion_of(:exercise_type).in_array(%w[multiple_choice picture_match trace fill_blank listening reorder writing speaking authentic_reading pragmatic_choice contrastive_grammar real_audio_comprehension]) }
  it { is_expected.to validate_presence_of(:position) }
  it { is_expected.to validate_presence_of(:content) }
  it { is_expected.to validate_inclusion_of(:difficulty).in_array(%w[easy normal challenge]) }
  it { is_expected.to validate_inclusion_of(:qa_status).in_array(%w[pending passed flagged rejected]) }
end
