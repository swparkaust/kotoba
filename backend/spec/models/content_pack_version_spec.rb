require 'rails_helper'

RSpec.describe ContentPackVersion, type: :model do
  it { is_expected.to belong_to(:language) }
  it { is_expected.to validate_presence_of(:version) }

  describe "uniqueness" do
    subject { create(:content_pack_version) }

    it { is_expected.to validate_uniqueness_of(:version).scoped_to(:language_id) }
  end
  it { is_expected.to validate_inclusion_of(:status).in_array(%w[building ready archived]) }

  describe "status methods" do
    it "#ready? returns true when status is ready" do
      v = build(:content_pack_version, status: "ready")
      expect(v.ready?).to be true
      expect(v.building?).to be false
    end

    it "#building? returns true when status is building" do
      v = build(:content_pack_version, status: "building")
      expect(v.building?).to be true
    end

    it "#archived? returns true when status is archived" do
      v = build(:content_pack_version, status: "archived")
      expect(v.archived?).to be true
    end

    it "#archived? returns false when status is not archived" do
      v = build(:content_pack_version, status: "ready")
      expect(v.archived?).to be false
    end
  end

  describe "scope .published" do
    it "returns ready versions with published_at set" do
      language = create(:language)
      published = create(:content_pack_version, language: language, version: 1, status: "ready", published_at: 1.day.ago)
      ready_not_published = create(:content_pack_version, language: language, version: 2, status: "ready", published_at: nil)
      building = create(:content_pack_version, language: language, version: 3, status: "building", published_at: nil)
      expect(ContentPackVersion.published).to include(published)
      expect(ContentPackVersion.published).not_to include(ready_not_published)
      expect(ContentPackVersion.published).not_to include(building)
    end
  end

  describe "#publish!" do
    it "sets status to ready and published_at" do
      v = create(:content_pack_version, status: "building", published_at: nil)
      v.publish!
      expect(v.reload.status).to eq("ready")
      expect(v.published_at).not_to be_nil
    end
  end

  describe "#archive!" do
    it "sets status to archived" do
      v = create(:content_pack_version, status: "ready")
      v.archive!
      expect(v.reload.status).to eq("archived")
    end
  end

  describe ".latest_ready" do
    it "returns the highest-version ready pack for a language" do
      language = create(:language)
      create(:content_pack_version, language: language, version: 1, status: "ready")
      v2 = create(:content_pack_version, language: language, version: 2, status: "ready")
      create(:content_pack_version, language: language, version: 3, status: "building")
      expect(ContentPackVersion.latest_ready(language)).to eq(v2)
    end
  end

  describe ".newer_than?" do
    it "returns true when a newer version exists" do
      language = create(:language)
      create(:content_pack_version, language: language, version: 2, status: "ready")
      expect(ContentPackVersion.newer_than?(language: language, version: 1)).to be true
    end

    it "returns false when no newer version exists" do
      language = create(:language)
      create(:content_pack_version, language: language, version: 1, status: "ready")
      expect(ContentPackVersion.newer_than?(language: language, version: 1)).to be false
    end
  end
end
