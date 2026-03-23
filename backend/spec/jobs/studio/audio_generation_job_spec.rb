require 'rails_helper'

RSpec.describe Studio::AudioGenerationJob do
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:generator) { double("AudioGenerator") }

  let(:lesson) do
    double("Lesson", id: 1, exercises: exercises_relation)
  end

  let(:exercises_relation) { double("ExercisesRelation") }

  let(:exercise_with_audio) do
    double("Exercise",
      id: 10,
      exercise_type: "listening",
      content: {
        "audio_scripts" => [{ "text" => "こんにちは" }],
        "audio_cue" => "こんにちは",
        "target_text" => "hello",
        "image_cue" => nil
      }
    )
  end

  let(:exercise_without_audio) do
    double("Exercise",
      id: 11,
      exercise_type: "reading",
      content: { "audio_scripts" => [] }
    )
  end

  let(:clip) do
    double("Clip",
      url: "https://cdn.example.com/audio.mp3",
      local_path: nil,
      metadata: { asset_key: "audio_10_abc1" }
    )
  end

  before do
    allow(Lesson).to receive(:find).with(1).and_return(lesson)
    allow(AudioGenerator).to receive(:new).and_return(generator)
    allow(exercises_relation).to receive(:where).and_return(exercises_relation)
    allow(exercises_relation).to receive(:not).and_return([exercise_with_audio, exercise_without_audio])
  end

  it "skips exercises with empty audio_scripts" do
    allow(exercises_relation).to receive(:not).and_return([exercise_without_audio])

    described_class.new.perform(1, "ja")

    expect(generator).not_to have_received(:generate) if generator.respond_to?(:generate)
  end

  it "creates ContentAsset for exercises with audio content" do
    allow(generator).to receive(:generate).and_return([clip])
    allow(ContentAsset).to receive(:exists?).and_return(false)
    allow(ContentAsset).to receive(:create!)

    described_class.new.perform(1, "ja")

    expect(ContentAsset).to have_received(:create!).with(
      hash_including(
        lesson: lesson,
        asset_type: "audio_mp3",
        asset_key: "audio_10_abc1",
        url: "https://cdn.example.com/audio.mp3"
      )
    )
  end

  it "skips duplicate asset_keys" do
    allow(generator).to receive(:generate).and_return([clip])
    allow(ContentAsset).to receive(:exists?).and_return(true)
    allow(ContentAsset).to receive(:create!)

    described_class.new.perform(1, "ja")

    expect(ContentAsset).not_to have_received(:create!)
  end
end
