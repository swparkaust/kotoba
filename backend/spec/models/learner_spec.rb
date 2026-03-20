require 'rails_helper'

RSpec.describe Learner, type: :model do
  it { is_expected.to validate_presence_of(:display_name) }
  it { is_expected.to validate_presence_of(:email) }

  describe "uniqueness" do
    subject { create(:learner) }

    it { is_expected.to validate_uniqueness_of(:email) }
  end
  it { is_expected.to have_many(:learner_progresses).dependent(:destroy) }
  it { is_expected.to have_many(:srs_cards).dependent(:destroy) }
  it { is_expected.to have_many(:placement_attempts).dependent(:destroy) }
  it { is_expected.to have_many(:writing_submissions).dependent(:destroy) }
  it { is_expected.to have_many(:speaking_submissions).dependent(:destroy) }
  it { is_expected.to have_many(:reading_sessions).dependent(:destroy) }
  it { is_expected.to have_many(:push_subscriptions).dependent(:destroy) }

  describe "belongs_to :active_language" do
    it "associates with a Language via active_language_code" do
      language = create(:language, code: "ja")
      learner = create(:learner, active_language_code: "ja")
      expect(learner.active_language).to eq(language)
    end

    it "allows nil active_language" do
      learner = build(:learner, active_language_code: nil)
      expect(learner).to be_valid
      expect(learner.active_language).to be_nil
    end
  end

  describe "has_secure_password" do
    it "authenticates with the correct password" do
      learner = create(:learner, password: "secret123")
      expect(learner.authenticate("secret123")).to eq(learner)
    end

    it "rejects an incorrect password" do
      learner = create(:learner, password: "secret123")
      expect(learner.authenticate("wrong")).to be_falsey
    end
  end
end
