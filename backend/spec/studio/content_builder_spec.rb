require 'rails_helper'

RSpec.describe LessonContentGenerator do
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:router) { double("AiModelRouter") }

  let(:exercise_result) do
    OpenStruct.new(
      exercise_type: "multiple_choice",
      position: 1,
      prompt: "「あ」はどれですか？",
      target_text: "あ",
      choices: [ "あ", "い", "う", "え" ],
      correct_answer: "あ",
      audio_cue: "あ",
      image_cue: "a rain scene",
      metadata: { "difficulty" => "1" }
    )
  end

  let(:illustration_result) { OpenStruct.new(url: "/tmp/illustration_1.png") }
  let(:audio_result) { OpenStruct.new(url: "/tmp/audio_1.mp3") }

  let(:exercise_generator) { double("ExerciseGenerator") }
  let(:illustration_generator) { double("IllustrationGenerator") }
  let(:audio_generator) { double("AudioGenerator") }

  let(:exercises_relation) { double("ExercisesRelation") }
  let(:assets_relation) { double("AssetsRelation") }

  let(:lesson) do
    double("Lesson",
      id: 1,
      title: "Lesson 1 — あ (a)",
      skill_type: "character_intro",
      exercises: exercises_relation,
      content_assets: assets_relation)
  end

  before do
    allow(ExerciseGenerator).to receive(:new).and_return(exercise_generator)
    allow(IllustrationGenerator).to receive(:new).and_return(illustration_generator)
    allow(AudioGenerator).to receive(:new).and_return(audio_generator)

    allow(exercise_generator).to receive(:generate).with(lesson: lesson).and_return([ exercise_result ])
    allow(illustration_generator).to receive(:generate).with(lesson: lesson, exercises: [ exercise_result ]).and_return([ illustration_result ])
    allow(audio_generator).to receive(:generate).with(lesson: lesson, exercises: [ exercise_result ]).and_return([ audio_result ])

    allow(lesson).to receive(:update!)
    allow(exercises_relation).to receive(:destroy_all)
    allow(exercises_relation).to receive(:create!)
    allow(assets_relation).to receive(:destroy_all)
    allow(assets_relation).to receive(:create!)

    allow(ActiveRecord::Base).to receive(:transaction).and_yield

    stub_const("Studio::QualityReviewJob", double(perform_async: true))
    stub_const("LessonContent", Struct.new(:exercises, :illustrations, :audio_scripts, :raw_response, keyword_init: true))
  end

  describe "#generate" do
    subject(:generator) { described_class.new(router: router, language_config: language_config) }

    it "sets lesson status to building before generating" do
      generator.generate(lesson: lesson)
      expect(lesson).to have_received(:update!).with(content_status: "building").ordered
    end

    it "clears existing exercises and content assets" do
      generator.generate(lesson: lesson)
      expect(exercises_relation).to have_received(:destroy_all)
      expect(assets_relation).to have_received(:destroy_all)
    end

    it "calls generate on the exercise generator" do
      generator.generate(lesson: lesson)
      expect(exercise_generator).to have_received(:generate).with(lesson: lesson)
    end

    it "calls generate on the illustration generator with exercises" do
      generator.generate(lesson: lesson)
      expect(illustration_generator).to have_received(:generate).with(lesson: lesson, exercises: [ exercise_result ])
    end

    it "calls generate on the audio generator with exercises" do
      generator.generate(lesson: lesson)
      expect(audio_generator).to have_received(:generate).with(lesson: lesson, exercises: [ exercise_result ])
    end

    it "creates exercise records in the transaction" do
      generator.generate(lesson: lesson)
      expect(exercises_relation).to have_received(:create!).with(
        hash_including(
          exercise_type: "multiple_choice",
          position: 1,
          difficulty: "easy",
          qa_status: "pending"
        )
      )
    end

    it "creates illustration asset records" do
      generator.generate(lesson: lesson)
      expect(assets_relation).to have_received(:create!).with(
        hash_including(
          asset_type: "illustration_png",
          asset_key: "illustration_1",
          url: "/tmp/illustration_1.png"
        )
      )
    end

    it "creates audio asset records" do
      generator.generate(lesson: lesson)
      expect(assets_relation).to have_received(:create!).with(
        hash_including(
          asset_type: "audio_mp3",
          asset_key: "audio_1",
          url: "/tmp/audio_1.mp3"
        )
      )
    end

    it "sets lesson status to qa_review after building" do
      generator.generate(lesson: lesson)
      expect(lesson).to have_received(:update!).with(content_status: "qa_review")
    end

    it "enqueues a quality review job" do
      generator.generate(lesson: lesson)
      expect(Studio::QualityReviewJob).to have_received(:perform_async).with(1, "ja")
    end

    it "returns a LessonContent with exercises, illustrations, and audio" do
      result = generator.generate(lesson: lesson)
      expect(result.exercises).to eq([ exercise_result ])
      expect(result.illustrations).to eq([ illustration_result ])
      expect(result.audio_scripts).to eq([ audio_result ])
    end

    context "when exercise generation returns no exercises" do
      before do
        allow(exercise_generator).to receive(:generate).and_return([])
      end

      it "raises an error" do
        expect { generator.generate(lesson: lesson) }.to raise_error(RuntimeError, /No exercises generated/)
      end

      it "sets lesson status to failed" do
        generator.generate(lesson: lesson) rescue nil
        expect(lesson).to have_received(:update!).with(content_status: "failed")
      end
    end

    context "when an error occurs during generation" do
      before do
        allow(exercise_generator).to receive(:generate).and_raise(StandardError, "API failure")
      end

      it "sets lesson status to failed and re-raises" do
        expect { generator.generate(lesson: lesson) }.to raise_error(StandardError, "API failure")
        expect(lesson).to have_received(:update!).with(content_status: "failed")
      end
    end

    it "builds content hash with illustration_specs when image_cue is present" do
      generator.generate(lesson: lesson)
      expect(exercises_relation).to have_received(:create!).with(
        hash_including(
          content: hash_including(
            "illustration_specs" => [ { "key" => "ex_1", "description" => "a rain scene" } ]
          )
        )
      )
    end

    it "builds content hash with audio_scripts when audio_cue is present" do
      generator.generate(lesson: lesson)
      expect(exercises_relation).to have_received(:create!).with(
        hash_including(
          content: hash_including(
            "audio_scripts" => [ { "key" => "audio_1", "text" => "あ" } ]
          )
        )
      )
    end
  end
end
