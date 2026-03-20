require 'rails_helper'

RSpec.describe Lesson, type: :model do
  it { is_expected.to belong_to(:curriculum_unit) }
  it { is_expected.to have_many(:exercises).dependent(:destroy) }
  it { is_expected.to have_many(:content_assets).dependent(:destroy) }
  it { is_expected.to have_many(:learner_progresses).dependent(:destroy) }
  it { is_expected.to have_many(:authentic_sources).dependent(:destroy) }
  it { is_expected.to have_many(:real_audio_clips).dependent(:destroy) }
  it { is_expected.to have_many(:pragmatic_scenarios).dependent(:destroy) }
  it { is_expected.to have_many(:contrastive_grammar_sets).dependent(:destroy) }
  it { is_expected.to validate_presence_of(:position) }

  describe "uniqueness" do
    subject { create(:lesson) }

    it { is_expected.to validate_uniqueness_of(:position).scoped_to(:curriculum_unit_id) }
  end
  it { is_expected.to validate_presence_of(:title) }
  it { is_expected.to validate_presence_of(:skill_type) }
  it { is_expected.to validate_inclusion_of(:skill_type).in_array(%w[character_intro vocabulary grammar reading listening review writing speaking authentic_reading pragmatics contrastive_grammar classical_japanese]) }
  it { is_expected.to validate_inclusion_of(:content_status).in_array(%w[pending building qa_review ready failed qa_failed]) }

  describe ".ready" do
    it "returns only lessons with ready content" do
      ready = create(:lesson, content_status: "ready")
      create(:lesson, content_status: "pending")
      expect(Lesson.ready).to eq([ready])
    end
  end
end
