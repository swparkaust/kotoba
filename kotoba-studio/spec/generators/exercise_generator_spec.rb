RSpec.describe ExerciseGenerator do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:service) { described_class.new(router: router, language_config: language_config) }

  let(:valid_response) do
    '[{"exercise_type":"multiple_choice","skill_type":"character_intro","prompt":"あ はどれですか？","target_text":"あ","choices":["あ","い","う","え"],"correct_answer":"あ","audio_cue":null,"image_cue":null,"metadata":{"difficulty":1,"tags":[]}}]'
  end

  let(:lesson) do
    double("Lesson",
      id: 1,
      curriculum_unit: double(
        curriculum_level: double(title: "Level 1", mext_grade: "Grade 1 (first half)", jlpt_approx: "Pre-N5", position: 1),
        title: "Unit 1 — Vowels",
        target_items: { "characters" => ["あ", "い", "う", "え", "お"] }
      ),
      title: "Lesson 1 — あ",
      skill_type: "character_intro",
      objectives: ["Recognize あ by sight", "Trace あ"]
    )
  end

  before do
    allow(router).to receive(:call).and_return(OpenStruct.new(text: valid_response))
  end

  describe "#generate" do
    it "calls the router with lesson_content_generation task" do
      expect(router).to receive(:call).with(hash_including(task: :lesson_content_generation))
      service.generate(lesson: lesson)
    end

    it "returns an array of exercise structs" do
      result = service.generate(lesson: lesson)
      expect(result).to be_an(Array)
      expect(result.length).to eq(1)
    end

    it "parses exercise_type correctly" do
      result = service.generate(lesson: lesson)
      expect(result.first.exercise_type).to eq("multiple_choice")
    end

    it "parses prompt and choices" do
      result = service.generate(lesson: lesson)
      expect(result.first.prompt).to eq("あ はどれですか？")
      expect(result.first.choices).to eq(["あ", "い", "う", "え"])
      expect(result.first.correct_answer).to eq("あ")
    end

    it "includes the system prompt with language config" do
      expect(router).to receive(:call).with(
        hash_including(system: a_string_including("Japanese"))
      )
      service.generate(lesson: lesson)
    end

    it "includes lesson context in the prompt" do
      expect(router).to receive(:call).with(
        hash_including(prompt: a_string_including("Lesson 1"))
      )
      service.generate(lesson: lesson)
    end
  end

  describe "error handling" do
    it "handles malformed JSON gracefully" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: "not valid json"))
      result = service.generate(lesson: lesson)
      expect(result).to be_an(Array)
    end

    it "handles empty response" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: "[]"))
      result = service.generate(lesson: lesson)
      expect(result).to eq([])
    end

    it "raises when AI returns nil text" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: nil))
      expect { service.generate(lesson: lesson) }.to raise_error(RuntimeError, /empty response/)
    end

    it "raises when AI returns blank text" do
      allow(router).to receive(:call).and_return(OpenStruct.new(text: "   "))
      expect { service.generate(lesson: lesson) }.to raise_error(RuntimeError, /empty response/)
    end
  end

  describe "#correct_kanji_violations" do
    let(:kanji_exercise_response) do
      '[{"exercise_type":"multiple_choice","skill_type":"character_intro","prompt":"飲み物はどれですか？","target_text":"飲む","choices":["飲む","たべる","のむ","みる"],"correct_answer":"飲む","audio_cue":"飲み物","image_cue":null,"metadata":{"difficulty":1,"tags":[]}}]'
    end

    let(:corrected_json) do
      '{"prompt":"のみものはどれですか？","target_text":"のむ","choices":["のむ","たべる","のむ","みる"],"correct_answer":"のむ","audio_cue":"のみもの"}'
    end

    let(:level1_lesson) do
      double("Lesson",
        id: 1,
        curriculum_unit: double(
          curriculum_level: double(title: "Level 1", mext_grade: "Pre-Grade 1", jlpt_approx: "Pre-N5", position: 1),
          title: "Unit 1 — Vowels",
          target_items: { "characters" => ["あ", "い", "う", "え", "お"] }
        ),
        title: "Lesson 1 — あ",
        skill_type: "character_intro",
        objectives: ["Recognize あ by sight"]
      )
    end

    let(:level8_lesson) do
      double("Lesson",
        id: 8,
        curriculum_unit: double(
          curriculum_level: double(title: "Level 8", mext_grade: "Grade 6", jlpt_approx: "N3", position: 8),
          title: "Unit 8 — Advanced",
          target_items: { "vocabulary" => ["飲む"] }
        ),
        title: "Lesson 8 — Advanced",
        skill_type: "vocabulary",
        objectives: ["Learn advanced vocab"]
      )
    end

    it "triggers correction call with exercise_variation task at level 1" do
      allow(router).to receive(:call)
        .with(hash_including(task: :lesson_content_generation))
        .and_return(OpenStruct.new(text: kanji_exercise_response))

      allow(router).to receive(:call)
        .with(hash_including(task: :exercise_variation))
        .and_return(OpenStruct.new(text: corrected_json))

      service.generate(lesson: level1_lesson)

      expect(router).to have_received(:call).with(hash_including(task: :exercise_variation))
    end

    it "skips correction entirely at level 8+" do
      allow(router).to receive(:call)
        .with(hash_including(task: :lesson_content_generation))
        .and_return(OpenStruct.new(text: kanji_exercise_response))

      service.generate(lesson: level8_lesson)

      expect(router).not_to have_received(:call).with(hash_including(task: :exercise_variation))
    end

    it "preserves original exercise when correction AI returns malformed JSON" do
      allow(router).to receive(:call)
        .with(hash_including(task: :lesson_content_generation))
        .and_return(OpenStruct.new(text: kanji_exercise_response))

      allow(router).to receive(:call)
        .with(hash_including(task: :exercise_variation))
        .and_return(OpenStruct.new(text: "not valid json at all"))

      result = service.generate(lesson: level1_lesson)

      expect(result.first.prompt).to eq("飲み物はどれですか？")
      expect(result.first.target_text).to eq("飲む")
    end
  end
end
