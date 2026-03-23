RSpec.describe RealAudioScaffolder do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:service) { described_class.new(router: router, language_config: language_config) }

  let(:valid_response) do
    '{
      "transcript": "今日はいい天気ですね。",
      "annotated_transcript": [
        { "text": "今日は", "reading": "きょうは", "notes": "topic marker", "timestamp_start": 0, "timestamp_end": 2 }
      ],
      "vocabulary": [
        { "word": "天気", "reading": "てんき", "meaning": "weather", "context": "talking about weather" }
      ],
      "listening_tasks": [
        { "task_type": "gist", "question": "何について話していますか？", "answer": "天気", "difficulty": 2 }
      ],
      "cultural_notes": "Weather is a common small-talk topic in Japan.",
      "difficulty_rating": 3,
      "metadata": { "speech_rate": "natural", "register": "informal" }
    }'
  end

  let(:audio_clip) do
    OpenStruct.new(
      title: "Weather conversation",
      transcript: "今日はいい天気ですね。",
      url: "https://example.com/audio.mp3",
      metadata: { "duration_seconds" => 30, "formality" => "casual" }
    )
  end

  let(:audio_clip_hash) do
    {
      "title" => "Weather conversation",
      "transcription" => "今日はいい天気ですね。",
      "url" => "https://example.com/audio.mp3",
      "metadata" => { "duration_seconds" => 30, "formality" => "casual" }
    }
  end

  before do
    allow(router).to receive(:call).and_return(OpenStruct.new(text: valid_response))
  end

  describe "#scaffold" do
    it "calls the router with real_audio_scaffolding task" do
      expect(router).to receive(:call).with(hash_including(task: :real_audio_scaffolding))
      service.scaffold(audio_clip: audio_clip, level: 3)
    end

    it "includes level in the prompt" do
      expect(router).to receive(:call).with(hash_including(prompt: a_string_including("3")))
      service.scaffold(audio_clip: audio_clip, level: 3)
    end

    it "returns a ScaffoldedAudio struct" do
      result = service.scaffold(audio_clip: audio_clip, level: 3)
      expect(result).to be_a(RealAudioScaffolder::ScaffoldedAudio)
    end

    it "parses transcript and vocabulary" do
      result = service.scaffold(audio_clip: audio_clip, level: 3)
      expect(result.transcript).to eq("今日はいい天気ですね。")
      expect(result.vocabulary).to be_an(Array)
      expect(result.vocabulary.first["word"]).to eq("天気")
    end

    it "parses listening_tasks" do
      result = service.scaffold(audio_clip: audio_clip, level: 3)
      expect(result.listening_tasks).to be_an(Array)
      expect(result.listening_tasks.first["task_type"]).to eq("gist")
    end

    it "parses cultural_notes and difficulty_rating" do
      result = service.scaffold(audio_clip: audio_clip, level: 3)
      expect(result.cultural_notes).to include("small-talk")
      expect(result.difficulty_rating).to eq(3)
    end

    it "accepts Hash input as RealAudioBuildJob passes" do
      result = service.scaffold(audio_clip: audio_clip_hash, level: 3)
      expect(result).to be_a(RealAudioScaffolder::ScaffoldedAudio)
      expect(result.transcript).to eq("今日はいい天気ですね。")
    end
  end

  describe "error handling" do
    it "returns nil for empty response" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: ""))
      result = service.scaffold(audio_clip: audio_clip, level: 3)
      expect(result).to be_nil
    end

    it "returns nil for malformed JSON response" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: "not json at all"))
      result = service.scaffold(audio_clip: audio_clip, level: 3)
      expect(result).to be_nil
    end

    it "returns nil for nil response text" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: nil))
      result = service.scaffold(audio_clip: audio_clip, level: 3)
      expect(result).to be_nil
    end
  end
end
