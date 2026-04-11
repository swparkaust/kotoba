require 'rails_helper'

RSpec.describe LibraryItem, type: :model do
  it { is_expected.to belong_to(:language) }
  it { is_expected.to have_many(:reading_sessions).dependent(:destroy) }
  it { is_expected.to validate_presence_of(:item_type) }
  it { is_expected.to validate_inclusion_of(:item_type).in_array(%w[graded_reader article novel podcast lecture]) }
  it { is_expected.to validate_presence_of(:title) }
  it { is_expected.to validate_presence_of(:attribution) }
  it { is_expected.to validate_presence_of(:license) }
  it { is_expected.to validate_presence_of(:difficulty_level) }

  describe ".for_level_range" do
    it "filters by difficulty level" do
      language = create(:language, code: "ja")
      item7 = create(:library_item, language: language, difficulty_level: 7)
      create(:library_item, language: language, difficulty_level: 11, title: "Advanced")
      expect(LibraryItem.for_level_range(5, 8)).to eq([item7])
    end
  end

  describe ".active" do
    it "returns only active items" do
      language = create(:language, code: "ja")
      active_item = create(:library_item, language: language, active: true)
      create(:library_item, language: language, active: false, title: "Inactive")
      expect(LibraryItem.active).to eq([active_item])
    end
  end

  describe ".for_level" do
    it "returns items matching a specific difficulty level" do
      language = create(:language, code: "ja")
      item5 = create(:library_item, language: language, difficulty_level: 5)
      create(:library_item, language: language, difficulty_level: 8, title: "Higher")
      expect(LibraryItem.for_level(5)).to eq([item5])
    end
  end

  describe ".text_items" do
    it "returns graded_reader, article, and novel items" do
      language = create(:language, code: "ja")
      reader = create(:library_item, language: language, item_type: "graded_reader")
      article = create(:library_item, language: language, item_type: "article", title: "Article")
      novel = create(:library_item, language: language, item_type: "novel", title: "Novel")
      create(:library_item, language: language, item_type: "podcast", title: "Podcast")
      expect(LibraryItem.text_items).to contain_exactly(reader, article, novel)
    end
  end

  describe ".audio_items" do
    it "returns podcast and lecture items" do
      language = create(:language, code: "ja")
      create(:library_item, language: language, item_type: "graded_reader")
      podcast = create(:library_item, language: language, item_type: "podcast", title: "Podcast")
      lecture = create(:library_item, language: language, item_type: "lecture", title: "Lecture")
      expect(LibraryItem.audio_items).to contain_exactly(podcast, lecture)
    end
  end

  describe "unhappy paths" do
    it "rejects an invalid item_type" do
      item = build(:library_item, item_type: "video")
      expect(item).not_to be_valid
      expect(item.errors[:item_type]).to be_present
    end

    it "rejects difficulty_level below valid range" do
      item = build(:library_item, difficulty_level: 0)
      expect(item).not_to be_valid
      expect(item.errors[:difficulty_level]).to be_present
    end

    it "rejects difficulty_level above valid range" do
      item = build(:library_item, difficulty_level: 13)
      expect(item).not_to be_valid
      expect(item.errors[:difficulty_level]).to be_present
    end

    it "rejects a missing title" do
      item = build(:library_item, title: nil)
      expect(item).not_to be_valid
      expect(item.errors[:title]).to be_present
    end
  end
end
