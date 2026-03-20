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
end
