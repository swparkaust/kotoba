require 'rails_helper'

RSpec.describe Studio::ContentBuildJob do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:curriculum_level) { double("CurriculumLevel", position: 3) }
  let(:curriculum_unit) { double("CurriculumUnit", curriculum_level: curriculum_level, target_items: {}) }

  let(:lesson) do
    double("Lesson",
      id: 1,
      content_status: "building",
      skill_type: "vocabulary",
      title: "Greetings",
      curriculum_unit: curriculum_unit
    )
  end

  let(:generator) { double("LessonContentGenerator") }

  before do
    allow(AiProviders).to receive(:build_router).and_return(router)
    allow(Lesson).to receive(:find).with(1).and_return(lesson)
    allow(Lesson).to receive(:find_by).and_return(lesson)
    allow(LessonContentGenerator).to receive(:new).and_return(generator)
    allow(generator).to receive(:generate)
    allow(Studio::AudioGenerationJob).to receive(:perform_async)
  end

  it "returns early when content_status is ready" do
    allow(lesson).to receive(:content_status).and_return("ready")

    described_class.new.perform(1, "ja")

    expect(LessonContentGenerator).not_to have_received(:new)
  end

  it "calls LessonContentGenerator#generate" do
    described_class.new.perform(1, "ja")

    expect(generator).to have_received(:generate).with(lesson: lesson)
  end

  it "enqueues AudioGenerationJob" do
    described_class.new.perform(1, "ja")

    expect(Studio::AudioGenerationJob).to have_received(:perform_async).with(1, "ja")
  end

  it "sets content_status to failed on error" do
    allow(generator).to receive(:generate).and_raise(StandardError, "boom")
    allow(lesson).to receive(:update!)

    expect { described_class.new.perform(1, "ja") }.to raise_error(StandardError, "boom")
    expect(lesson).to have_received(:update!).with(content_status: "failed")
  end

  context "when skill_type is pragmatics" do
    let(:lesson) do
      double("Lesson",
        id: 1,
        content_status: "building",
        skill_type: "pragmatics",
        title: "Refusing Politely",
        curriculum_unit: curriculum_unit
      )
    end

    let(:scenario) do
      double("PragmaticScenario",
        title: "Refusing Politely",
        context: "友達に誘われた場面",
        dialogue: [ { "speaker" => "A", "text" => "明日遊ばない？", "notes" => nil, "register" => "casual" } ],
        variations: [ { "dialogue_change" => "ちょっと用事があって…", "context" => "soft refusal" } ],
        cultural_notes: "Indirect refusal is preferred",
        grammar_focus: "〜て form"
      )
    end

    let(:pragmatic_gen) { double("PragmaticScenarioGenerator") }

    before do
      allow(curriculum_unit).to receive(:target_items).and_return({ "cultural_topic" => "refusal" })
      allow(PragmaticScenarioGenerator).to receive(:new).and_return(pragmatic_gen)
      allow(pragmatic_gen).to receive(:generate).and_return(scenario)
      allow(PragmaticScenario).to receive(:find_or_create_by!).and_yield(double("PragmaticScenario").as_null_object)
    end

    it "builds a PragmaticScenario via PragmaticScenarioGenerator" do
      described_class.new.perform(1, "ja")

      expect(pragmatic_gen).to have_received(:generate).with(
        level: 3, theme: "refusal", situation: "Refusing Politely"
      )
      expect(PragmaticScenario).to have_received(:find_or_create_by!)
    end
  end

  context "when skill_type is contrastive_grammar" do
    let(:lesson) do
      double("Lesson",
        id: 1,
        content_status: "building",
        skill_type: "contrastive_grammar",
        title: "は vs が",
        curriculum_unit: curriculum_unit
      )
    end

    let(:grammar_set) do
      double("ContrastiveGrammarResult",
        contrast_explanation: "は marks topic, が marks subject",
        pattern_a: { "name" => "は", "usage_context" => "topic marker" },
        pattern_b: { "name" => "が", "usage_context" => "subject marker" },
        exercises: [ { "text" => "___が好きです", "answer" => "が", "options" => [ "は", "が" ] } ],
        examples: [ { "pattern" => "a", "text" => "私は学生です" } ],
        common_errors: [ "Using は when が is required" ]
      )
    end

    let(:contrastive_gen) { double("ContrastiveGrammarGenerator") }

    before do
      allow(curriculum_unit).to receive(:target_items).and_return({ "grammar" => [ "は", "が" ] })
      allow(ContrastiveGrammarGenerator).to receive(:new).and_return(contrastive_gen)
      allow(contrastive_gen).to receive(:generate).and_return(grammar_set)
      allow(ContrastiveGrammarSet).to receive(:find_or_create_by!).and_yield(double("ContrastiveGrammarSet").as_null_object)
    end

    it "builds a ContrastiveGrammarSet via ContrastiveGrammarGenerator" do
      described_class.new.perform(1, "ja")

      expect(contrastive_gen).to have_received(:generate).with(
        pattern_a: "は", pattern_b: "が", level: 3
      )
      expect(ContrastiveGrammarSet).to have_received(:find_or_create_by!)
    end
  end

  context "when skill_type is authentic_reading" do
    let(:lesson) do
      double("Lesson",
        id: 1,
        content_status: "building",
        skill_type: "authentic_reading",
        title: "News Article",
        curriculum_unit: curriculum_unit
      )
    end

    before do
      allow(Studio::AuthenticContentBuildJob).to receive(:perform_async)
    end

    it "enqueues AuthenticContentBuildJob" do
      described_class.new.perform(1, "ja")

      expect(Studio::AuthenticContentBuildJob).to have_received(:perform_async).with(
        1, nil, "News Article", "literature", "ja"
      )
    end
  end
end
