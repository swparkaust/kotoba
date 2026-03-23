require 'rails_helper'

RSpec.describe Studio::RealAudioBuildJob do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:curriculum_level) { double("CurriculumLevel", position: level) }
  let(:curriculum_unit) { double("CurriculumUnit", curriculum_level: curriculum_level) }
  let(:level) { 9 }

  let(:lesson) do
    double("Lesson",
      id: 1,
      curriculum_unit: curriculum_unit
    )
  end

  let(:scaffolder) { double("RealAudioScaffolder") }

  let(:scaffold_result) do
    double("ScaffoldResult",
      vocabulary: [{ "word" => "天気" }],
      listening_tasks: [{ "task" => "Listen for weather words" }]
    )
  end

  let(:metadata) do
    { "formality" => "polite", "duration_seconds" => 120, "speaker_count" => 2, "speed" => "natural" }
  end

  before do
    allow(AiProviders).to receive(:build_router).and_return(router)
    allow(Lesson).to receive(:find).with(1).and_return(lesson)
    allow(RealAudioScaffolder).to receive(:new).and_return(scaffolder)
    allow(scaffolder).to receive(:scaffold).and_return(scaffold_result)
    allow(RealAudioClip).to receive(:find_or_create_by!).and_yield(
      double("RealAudioClip").as_null_object
    )
  end

  context "when level < 8" do
    let(:level) { 6 }

    it "skips real audio generation" do
      described_class.new.perform(1, "https://audio.example.com/clip.mp3", "transcript", "Title", metadata.to_json, "ja")

      expect(scaffolder).not_to have_received(:scaffold)
    end
  end

  it "calls RealAudioScaffolder#scaffold with Hash input" do
    described_class.new.perform(1, "https://audio.example.com/clip.mp3", "transcript", "Title", metadata.to_json, "ja")

    expect(scaffolder).to have_received(:scaffold).with(
      audio_clip: hash_including(url: "https://audio.example.com/clip.mp3", transcription: "transcript"),
      level: 9
    )
  end

  it "creates RealAudioClip record" do
    described_class.new.perform(1, "https://audio.example.com/clip.mp3", "transcript", "Clip Title", metadata.to_json, "ja")

    expect(RealAudioClip).to have_received(:find_or_create_by!).with(lesson: lesson, title: "Clip Title")
  end

  it "validates formality" do
    bad_metadata = { "formality" => "super_casual" }.to_json

    expect {
      described_class.new.perform(1, "https://audio.example.com/clip.mp3", "transcript", "Title", bad_metadata, "ja")
    }.to raise_error(RuntimeError, /Invalid formality/)
  end
end
