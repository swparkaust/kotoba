require 'rails_helper'

RSpec.describe PlacementQuestionGenerator, type: :service do
  let(:router) { instance_double(AiModelRouter) }
  let(:service) { described_class.new(router: router) }
  let(:language) { create(:language, code: "ja") }

  let(:valid_ai_json) do
    {
      prompt: "「学校」の読み方は？",
      options: [ "がっこう", "がくこう", "がっこ", "がこう" ],
      correct_answer: "がっこう",
      skill_tested: "kanji",
      level: 1
    }.to_json
  end

  before do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: valid_ai_json, model: "claude-opus-4-20250514", task: :placement_question_generation)
    )
  end

  it "routes to the placement_question_generation task" do
    create(:curriculum_level, language: language, position: 1)
    expect(router).to receive(:call).with(hash_including(task: :placement_question_generation)).at_least(:once)
    service.generate(language: language, levels: 1..1)
  end

  it "returns an array of question hashes" do
    create(:curriculum_level, language: language, position: 1)
    result = service.generate(language: language, levels: 1..1)
    expect(result).to be_an(Array)
    expect(result.length).to eq(PlacementQuestionGenerator::QUESTIONS_PER_LEVEL)
  end

  it "returns hashes with prompt, options, correct_answer, skill_tested, and level" do
    create(:curriculum_level, language: language, position: 1)
    result = service.generate(language: language, levels: 1..1)
    question = result.first
    expect(question).to include(:prompt, :options, :correct_answer, :skill_tested, :level)
    expect(question[:options].length).to eq(4)
    expect(question[:options]).to include(question[:correct_answer])
  end

  it "falls back when AI returns bad JSON" do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: "not valid json at all", model: "test", task: :placement_question_generation)
    )
    create(:curriculum_level, language: language, position: 1)
    result = service.generate(language: language, levels: 1..1)
    expect(result).to be_an(Array)
    expect(result.length).to eq(PlacementQuestionGenerator::QUESTIONS_PER_LEVEL)
    result.each do |q|
      expect(q).to include(:prompt, :options, :correct_answer, :skill_tested, :level)
      expect(q[:options].length).to eq(4)
      expect(q[:options]).to include(q[:correct_answer])
    end
  end

  it "falls back when AI returns JSON with wrong number of options" do
    bad_json = { prompt: "test", options: [ "a", "b" ], correct_answer: "a", skill_tested: "vocab", level: 1 }.to_json
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: bad_json, model: "test", task: :placement_question_generation)
    )
    create(:curriculum_level, language: language, position: 1)
    result = service.generate(language: language, levels: 1..1)
    result.each do |q|
      expect(q[:options].length).to eq(4)
    end
  end

  it "falls back when correct_answer is not in options" do
    bad_json = { prompt: "test", options: [ "a", "b", "c", "d" ], correct_answer: "z", skill_tested: "vocab", level: 1 }.to_json
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: bad_json, model: "test", task: :placement_question_generation)
    )
    create(:curriculum_level, language: language, position: 1)
    result = service.generate(language: language, levels: 1..1)
    result.each do |q|
      expect(q[:options]).to include(q[:correct_answer])
    end
  end

  it "skips levels that do not exist in the database" do
    create(:curriculum_level, language: language, position: 1)
    result = service.generate(language: language, levels: 1..3)
    expect(result.length).to eq(PlacementQuestionGenerator::QUESTIONS_PER_LEVEL)
  end

  it "generates questions for multiple levels" do
    create(:curriculum_level, language: language, position: 1)
    create(:curriculum_level, language: language, position: 2)
    result = service.generate(language: language, levels: 1..2)
    expect(result.length).to eq(PlacementQuestionGenerator::QUESTIONS_PER_LEVEL * 2)
  end

  it "falls back when router raises a StandardError" do
    allow(router).to receive(:call).and_raise(StandardError, "network failure")
    create(:curriculum_level, language: language, position: 1)
    result = service.generate(language: language, levels: 1..1)
    expect(result).to be_an(Array)
    expect(result.length).to eq(PlacementQuestionGenerator::QUESTIONS_PER_LEVEL)
    result.each do |q|
      expect(q).to include(:prompt, :options, :correct_answer, :skill_tested, :level)
      expect(q[:options].length).to eq(4)
      expect(q[:options]).to include(q[:correct_answer])
    end
  end
end
