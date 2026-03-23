RSpec.describe IllustrationGenerator do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:service) { described_class.new(router: router, language_config: language_config) }

  let(:lesson) do
    double("Lesson",
      title: "Lesson 1 — Greetings",
      curriculum_unit: double(
        curriculum_level: double(position: 1)
      )
    )
  end

  let(:exercise_with_image) do
    OpenStruct.new(
      image_cue: "a friendly cat waving hello",
      exercise_type: "picture_match",
      audio_cue: nil,
      target_text: "ねこ"
    )
  end

  let(:exercise_without_image) do
    OpenStruct.new(
      image_cue: nil,
      exercise_type: "multiple_choice",
      audio_cue: nil,
      target_text: "test"
    )
  end

  describe "#generate" do
    it "returns an empty array when IMAGE_PROVIDER is none" do
      stub_const("IllustrationGenerator::IMAGE_PROVIDER", "none")
      result = service.generate(lesson: lesson, exercises: [exercise_with_image])
      expect(result).to eq([])
    end

    it "only processes exercises with image_cue" do
      stub_const("IllustrationGenerator::IMAGE_PROVIDER", "dalle")
      allow(service).to receive(:generate_dalle).and_return("https://example.com/image.png")

      result = service.generate(lesson: lesson, exercises: [exercise_with_image, exercise_without_image])
      expect(result.length).to eq(1)
    end

    it "returns an array of Illustration structs" do
      stub_const("IllustrationGenerator::IMAGE_PROVIDER", "dalle")
      allow(service).to receive(:generate_dalle).and_return("https://example.com/image.png")

      result = service.generate(lesson: lesson, exercises: [exercise_with_image])
      expect(result).to be_an(Array)
      expect(result.first).to be_a(IllustrationGenerator::Illustration)
    end

    it "sets asset_type to illustration_png" do
      stub_const("IllustrationGenerator::IMAGE_PROVIDER", "dalle")
      allow(service).to receive(:generate_dalle).and_return("https://example.com/image.png")

      result = service.generate(lesson: lesson, exercises: [exercise_with_image])
      expect(result.first.asset_type).to eq("illustration_png")
    end

    it "includes the image_cue in the prompt" do
      stub_const("IllustrationGenerator::IMAGE_PROVIDER", "dalle")
      allow(service).to receive(:generate_dalle).and_return("https://example.com/image.png")

      result = service.generate(lesson: lesson, exercises: [exercise_with_image])
      expect(result.first.prompt).to include("a friendly cat waving hello")
    end

    it "sets url from the image provider" do
      stub_const("IllustrationGenerator::IMAGE_PROVIDER", "dalle")
      allow(service).to receive(:generate_dalle).and_return("https://example.com/image.png")

      result = service.generate(lesson: lesson, exercises: [exercise_with_image])
      expect(result.first.url).to eq("https://example.com/image.png")
    end

    it "returns empty array when no exercises have image_cue" do
      stub_const("IllustrationGenerator::IMAGE_PROVIDER", "dalle")
      result = service.generate(lesson: lesson, exercises: [exercise_without_image])
      expect(result).to eq([])
    end
  end

  describe "#dimensions_for" do
    it "returns 512x512 for picture_match exercises" do
      stub_const("IllustrationGenerator::IMAGE_PROVIDER", "dalle")
      allow(service).to receive(:generate_dalle).and_return("https://example.com/image.png")

      exercise = OpenStruct.new(
        image_cue: "a red apple",
        exercise_type: "picture_match",
        audio_cue: nil,
        target_text: "りんご"
      )

      result = service.generate(lesson: lesson, exercises: [exercise])
      expect(result.first.width).to eq(512)
      expect(result.first.height).to eq(512)
    end

    it "returns 256x256 for trace exercises" do
      stub_const("IllustrationGenerator::IMAGE_PROVIDER", "dalle")
      allow(service).to receive(:generate_dalle).and_return("https://example.com/image.png")

      exercise = OpenStruct.new(
        image_cue: "stroke order for あ",
        exercise_type: "trace",
        audio_cue: nil,
        target_text: "あ"
      )

      result = service.generate(lesson: lesson, exercises: [exercise])
      expect(result.first.width).to eq(256)
      expect(result.first.height).to eq(256)
    end
  end
end
