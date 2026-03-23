RSpec.describe AudioGenerator do
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:service) { described_class.new(language_config: language_config) }

  let(:lesson) do
    double("Lesson",
      curriculum_unit: double(
        curriculum_level: double(position: 1)
      )
    )
  end

  let(:exercise_with_audio) do
    OpenStruct.new(
      audio_cue: "こんにちは",
      target_text: "hello",
      exercise_type: "multiple_choice",
      skill_type: "vocabulary"
    )
  end

  let(:exercise_without_audio) do
    OpenStruct.new(
      audio_cue: nil,
      target_text: "test",
      exercise_type: "multiple_choice",
      skill_type: "vocabulary"
    )
  end

  let(:listening_exercise) do
    OpenStruct.new(
      audio_cue: "聞いてください",
      target_text: "リスニング",
      exercise_type: "listening",
      skill_type: "listening"
    )
  end

  describe "#generate" do
    it "returns an empty array when TTS_PROVIDER is none" do
      allow(ENV).to receive(:fetch).with("TTS_PROVIDER", "piper").and_return("none")
      result = service.generate(lesson: lesson, exercises: [exercise_with_audio])
      expect(result).to eq([])
    end

    it "produces clips for exercises with audio_cue" do
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch).with("TTS_PROVIDER", "piper").and_return("piper")
      allow(ENV).to receive(:fetch).with("PIPER_HOST", "http://localhost:5000").and_return("http://localhost:5000")

      stub_request = instance_double(Net::HTTPOK, is_a?: true, body: "fake_audio_data")
      allow(Net::HTTP).to receive(:post).and_return(stub_request)
      allow(stub_request).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
      allow(FileUtils).to receive(:mkdir_p)
      allow(File).to receive(:binwrite)

      result = service.generate(lesson: lesson, exercises: [exercise_with_audio, exercise_without_audio])
      expect(result).to be_an(Array)
      expect(result.length).to eq(1)
    end

    it "returns AudioClip structs" do
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch).with("TTS_PROVIDER", "piper").and_return("piper")
      allow(ENV).to receive(:fetch).with("PIPER_HOST", "http://localhost:5000").and_return("http://localhost:5000")

      stub_response = instance_double(Net::HTTPOK, body: "fake_audio")
      allow(Net::HTTP).to receive(:post).and_return(stub_response)
      allow(stub_response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
      allow(FileUtils).to receive(:mkdir_p)
      allow(File).to receive(:binwrite)

      result = service.generate(lesson: lesson, exercises: [exercise_with_audio])
      expect(result.first).to be_a(AudioGenerator::AudioClip)
      expect(result.first.asset_type).to eq("audio")
      expect(result.first.text).to eq("こんにちは")
    end

    it "returns empty array when no exercises have audio_cue" do
      allow(ENV).to receive(:fetch).with("TTS_PROVIDER", "piper").and_return("piper")
      result = service.generate(lesson: lesson, exercises: [exercise_without_audio])
      expect(result).to eq([])
    end

    it "produces two clips for a listening exercise with audio_cue and target_text" do
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch).with("TTS_PROVIDER", "piper").and_return("piper")
      allow(ENV).to receive(:fetch).with("PIPER_HOST", "http://localhost:5000").and_return("http://localhost:5000")

      stub_response = instance_double(Net::HTTPOK, body: "fake_audio")
      allow(Net::HTTP).to receive(:post).and_return(stub_response)
      allow(stub_response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
      allow(FileUtils).to receive(:mkdir_p)
      allow(File).to receive(:binwrite)

      result = service.generate(lesson: lesson, exercises: [listening_exercise])
      expect(result.length).to eq(2)
      expect(result[0].text).to eq("聞いてください")
      expect(result[1].text).to eq("リスニング")
    end
  end
end
