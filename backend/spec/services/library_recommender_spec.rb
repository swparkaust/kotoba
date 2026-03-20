require 'rails_helper'

RSpec.describe LibraryRecommender, type: :service do
  let(:service) { described_class.new }
  let(:language) { create(:language, code: "ja") }
  let(:learner) { create(:learner) }

  it "returns an array of hashes with item and estimated_comprehension" do
    level = create(:curriculum_level, language: language, position: 1)
    unit = create(:curriculum_unit, curriculum_level: level)
    lesson = create(:lesson, curriculum_unit: unit)
    create(:learner_progress, learner: learner, lesson: lesson, status: "completed")
    create(:library_item, language: language, difficulty_level: 1, glosses: [{ "word" => "犬" }])

    results = service.recommend(learner: learner, language: language, limit: 5)
    expect(results).to be_an(Array)
    expect(results.first).to include(:item, :estimated_comprehension)
    expect(results.first[:item]).to be_a(LibraryItem)
    expect(results.first[:estimated_comprehension]).to be_a(Integer)
  end

  it "returns empty array for learner with no progress" do
    create(:library_item, language: language, difficulty_level: 5, glosses: [{ "word" => "犬" }])
    results = service.recommend(learner: learner, language: language, limit: 5)
    expect(results).to be_an(Array)
    results.each do |r|
      expect(r[:item].difficulty_level).to be_between(1, 2)
    end
  end

  it "calculates comprehension based on known SRS cards matching item glosses" do
    level = create(:curriculum_level, language: language, position: 1)
    unit = create(:curriculum_unit, curriculum_level: level)
    lesson = create(:lesson, curriculum_unit: unit)
    create(:learner_progress, learner: learner, lesson: lesson, status: "completed")

    create(:srs_card, learner: learner, card_key: "犬", card_type: "vocabulary", burned: false)
    create(:srs_card, learner: learner, card_key: "猫", card_type: "vocabulary", burned: false)

    create(:library_item, language: language, difficulty_level: 1,
           glosses: [{ "word" => "犬" }, { "word" => "猫" }, { "word" => "鳥" }, { "word" => "魚" }])

    results = service.recommend(learner: learner, language: language, limit: 5)
    expect(results.length).to eq(1)
    expect(results.first[:estimated_comprehension]).to eq(50)
  end

  it "returns 100 comprehension when all glosses are known" do
    level = create(:curriculum_level, language: language, position: 1)
    unit = create(:curriculum_unit, curriculum_level: level)
    lesson = create(:lesson, curriculum_unit: unit)
    create(:learner_progress, learner: learner, lesson: lesson, status: "completed")

    create(:srs_card, learner: learner, card_key: "犬", card_type: "vocabulary", burned: false)
    create(:srs_card, learner: learner, card_key: "猫", card_type: "vocabulary", burned: false)

    create(:library_item, language: language, difficulty_level: 1,
           glosses: [{ "word" => "犬" }, { "word" => "猫" }])

    results = service.recommend(learner: learner, language: language, limit: 5)
    expect(results.first[:estimated_comprehension]).to eq(100)
  end

  it "returns 0 comprehension when no glosses are known" do
    level = create(:curriculum_level, language: language, position: 1)
    unit = create(:curriculum_unit, curriculum_level: level)
    lesson = create(:lesson, curriculum_unit: unit)
    create(:learner_progress, learner: learner, lesson: lesson, status: "completed")

    create(:library_item, language: language, difficulty_level: 1,
           glosses: [{ "word" => "犬" }, { "word" => "猫" }])

    results = service.recommend(learner: learner, language: language, limit: 5)
    expect(results.first[:estimated_comprehension]).to eq(0)
  end

  it "excludes burned SRS cards from comprehension calculation" do
    level = create(:curriculum_level, language: language, position: 1)
    unit = create(:curriculum_unit, curriculum_level: level)
    lesson = create(:lesson, curriculum_unit: unit)
    create(:learner_progress, learner: learner, lesson: lesson, status: "completed")

    create(:srs_card, learner: learner, card_key: "犬", card_type: "vocabulary", burned: true)

    create(:library_item, language: language, difficulty_level: 1,
           glosses: [{ "word" => "犬" }, { "word" => "猫" }])

    results = service.recommend(learner: learner, language: language, limit: 5)
    expect(results.first[:estimated_comprehension]).to eq(0)
  end

  it "respects the limit parameter" do
    level = create(:curriculum_level, language: language, position: 1)
    unit = create(:curriculum_unit, curriculum_level: level)
    lesson = create(:lesson, curriculum_unit: unit)
    create(:learner_progress, learner: learner, lesson: lesson, status: "completed")

    3.times { |i| create(:library_item, language: language, difficulty_level: 1, title: "Reader #{i}") }

    results = service.recommend(learner: learner, language: language, limit: 2)
    expect(results.length).to be <= 2
  end
end
