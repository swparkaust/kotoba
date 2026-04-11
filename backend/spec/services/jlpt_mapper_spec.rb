require 'rails_helper'

RSpec.describe JlptMapper, type: :service do
  let(:mapper) { described_class.new }

  it "returns Pre-N5 for a learner with no completed levels" do
    learner = create(:learner)
    language = create(:language, code: "ja")
    result = mapper.current_jlpt(learner: learner, language: language)
    expect(result[:jlpt_label]).to eq("Pre-N5")
    expect(result[:percentage]).to eq(0)
    expect(result[:total_levels]).to eq(12)
  end

  it "returns N5 when level 2 is fully completed" do
    learner = create(:learner)
    language = create(:language, code: "ja")
    level = create(:curriculum_level, language: language, position: 2)
    unit = create(:curriculum_unit, curriculum_level: level)
    lesson = create(:lesson, curriculum_unit: unit)
    create(:learner_progress, learner: learner, lesson: lesson, status: "completed")

    result = mapper.current_jlpt(learner: learner, language: language)
    expect(result[:jlpt_label]).to eq("N5")
    expect(result[:completed_levels]).to eq(2)
  end

  it "includes all 12 levels in the map" do
    expect(JlptMapper::LEVEL_JLPT_MAP.keys).to eq((1..12).to_a)
  end

  it "uses en-dash in range labels" do
    labels = JlptMapper::LEVEL_JLPT_MAP.values.map { |v| v[:label] }
    range_labels = labels.select { |l| l.include?("–") }
    expect(range_labels).not_to be_empty
    expect(labels.none? { |l| l.include?("-") && !l.include?("–") && !l.start_with?("Pre-") }).to be true
  end

  it "returns Pre-N5 when no curriculum levels exist for the language" do
    learner = create(:learner)
    language = create(:language, code: "ko", name: "Korean", native_name: "한국어")
    result = mapper.current_jlpt(learner: learner, language: language)
    expect(result[:jlpt_label]).to eq("Pre-N5")
    expect(result[:completed_levels]).to eq(0)
    expect(result[:percentage]).to eq(0)
  end

  it "returns Pre-N5 when levels exist but none are completed" do
    learner = create(:learner)
    language = create(:language, code: "ja")
    create(:curriculum_level, language: language, position: 1)
    create(:curriculum_level, language: language, position: 2)
    result = mapper.current_jlpt(learner: learner, language: language)
    expect(result[:jlpt_label]).to eq("Pre-N5")
    expect(result[:completed_levels]).to eq(0)
  end
end
