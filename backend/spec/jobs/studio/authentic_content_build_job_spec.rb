require 'rails_helper'

RSpec.describe Studio::AuthenticContentBuildJob do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:curriculum_level) { double("CurriculumLevel", position: level) }
  let(:curriculum_unit) { double("CurriculumUnit", curriculum_level: curriculum_level) }
  let(:level) { 8 }

  let(:lesson) do
    double("Lesson",
      id: 1,
      curriculum_unit: curriculum_unit
    )
  end

  let(:scaffolder) { double("AuthenticContentScaffolder") }

  let(:scaffold_result) do
    double("ScaffoldResult",
      source_text: "日本の文化について",
      vocabulary_notes: [ { "word" => "文化" } ],
      grammar_notes: [],
      comprehension_questions: []
    )
  end

  before do
    allow(AiProviders).to receive(:build_router).and_return(router)
    allow(Lesson).to receive(:find).with(1).and_return(lesson)
    allow(AuthenticContentScaffolder).to receive(:new).and_return(scaffolder)
    allow(scaffolder).to receive(:scaffold).and_return(scaffold_result)
    allow(AuthenticSource).to receive(:find_or_create_by!).and_yield(
      double("AuthenticSource").as_null_object
    )
  end

  context "when level < 7" do
    let(:level) { 5 }

    it "skips authentic content generation" do
      described_class.new.perform(1, nil, "Test", "literature", "ja")

      expect(scaffolder).not_to have_received(:scaffold)
    end
  end

  it "calls AuthenticContentScaffolder#scaffold" do
    described_class.new.perform(1, "source text", "Test", "literature", "ja")

    expect(scaffolder).to have_received(:scaffold).with(source: "source text", level: 8)
  end

  it "creates AuthenticSource record" do
    described_class.new.perform(1, "source text", "Test Title", "news", "ja")

    expect(AuthenticSource).to have_received(:find_or_create_by!).with(lesson: lesson, title: "Test Title")
  end

  it "raises when scaffolder returns nil" do
    allow(scaffolder).to receive(:scaffold).and_return(nil)

    expect {
      described_class.new.perform(1, "source text", "Test", "literature", "ja")
    }.to raise_error(RuntimeError, /AuthenticContentScaffolder returned nil/)
  end

  it "defaults to literature when source_type is invalid" do
    source_double = double("AuthenticSource").as_null_object
    allow(AuthenticSource).to receive(:find_or_create_by!).and_yield(source_double)

    described_class.new.perform(1, "source text", "Test", "invalid_type", "ja")

    expect(source_double).to have_received(:source_type=).with("literature")
  end
end
