require 'rails_helper'

RSpec.describe Studio::QA::ContentQualityReviewer do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }
  let(:reviewer) { described_class.new(router: router, language_config: language_config) }

  let(:exercise_hash) do
    {
      "exercise_type" => "multiple_choice",
      "prompt" => "「あ」はどれですか？",
      "target_text" => "あ",
      "options" => [ "あ", "い", "う", "え" ],
      "correct_answer" => "あ",
      "audio_cue" => nil,
      "difficulty" => "easy"
    }
  end

  let(:content) do
    Studio::QA::ContentQualityReviewer::NormalizedContent.new(
      exercises: [ exercise_hash ] * 4,
      illustrations: [],
      audio_scripts: [],
      exercise_records: []
    )
  end

  let(:lesson) do
    double("Lesson", id: 1, exercises: double(update_all: true, to_a: []),
      content_assets: double(where: []), content_version: 0,
      title: "Lesson 1", skill_type: "character_intro", objectives: [ "Recognize あ" ])
  end

  let(:level) { double(position: 1, mext_grade: "Grade 1 (first half)", jlpt_approx: "Pre-N5", title: "Level 1") }

  before do
    allow(lesson).to receive(:update!)
    allow(lesson).to receive_message_chain(:curriculum_unit, :curriculum_level).and_return(level)
    allow(lesson).to receive_message_chain(:curriculum_unit, :target_items).and_return({ "characters" => [ "あ" ] })

    # Default: all agents pass
    allow(router).to receive(:call).and_return(
      OpenStruct.new(text: '{"pass":true,"notes":"All checks passed"}')
    )
  end

  describe "4-phase review pipeline" do
    it "calls accuracy, pedagogy, and cultural agents" do
      tasks_called = []
      allow(router).to receive(:call) do |args|
        tasks_called << args[:task]
        OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
      end

      reviewer.review(lesson: lesson, content: content)

      expect(tasks_called).to include(:qa_exercise_accuracy)
    end

    it "calls the adversarial reviewer" do
      prompts_seen = []
      allow(router).to receive(:call) do |args|
        prompts_seen << args[:system] if args[:system]
        OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
      end

      reviewer.review(lesson: lesson, content: content)

      adversarial = prompts_seen.any? { |p| p.include?("ADVERSARIAL") }
      expect(adversarial).to be true
    end

    it "calls curriculum alignment review" do
      tasks_called = []
      allow(router).to receive(:call) do |args|
        tasks_called << args[:task]
        OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
      end

      reviewer.review(lesson: lesson, content: content)
      expect(tasks_called).to include(:qa_curriculum_alignment)
    end
  end

  describe "multi-agent consensus" do
    it "passes when all agents agree" do
      result = reviewer.review(lesson: lesson, content: content)
      expect(result.passed?).to be true
    end

    it "rejects when multiple agents disagree" do
      allow(router).to receive(:call) do |args|
        if args[:system]&.include?("ACCURACY") || args[:system]&.include?("PEDAGOGY")
          OpenStruct.new(text: '{"pass":false,"notes":"Wrong answer"}')
        else
          OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
        end
      end

      result = reviewer.review(lesson: lesson, content: content)
      expect(result.passed?).to be false
    end
  end

  describe "structural checks (Phase 1, no AI)" do
    it "rejects exercises with missing prompts" do
      bad_exercise = exercise_hash.merge("prompt" => "")
      bad_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ bad_exercise ] * 4, illustrations: [], audio_scripts: [], exercise_records: []
      )

      result = reviewer.review(lesson: lesson, content: bad_content)
      expect(result.issues).to include(a_string_matching(/missing prompt/))
    end

    it "flags English text when no-English rule applies" do
      eng_exercise = exercise_hash.merge("prompt" => "Select the correct answer")
      eng_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ eng_exercise ] * 4, illustrations: [], audio_scripts: [], exercise_records: []
      )

      result = reviewer.review(lesson: lesson, content: eng_content)
      expect(result.issues).to include(a_string_matching(/English text/))
    end
  end

  describe "structural checks (Phase 1, no AI) — additional paths" do
    it "rejects multiple_choice with missing correct_answer" do
      bad_exercise = exercise_hash.merge("correct_answer" => "")
      bad_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ bad_exercise ] * 4, illustrations: [], audio_scripts: [], exercise_records: []
      )

      result = reviewer.review(lesson: lesson, content: bad_content)
      expect(result.issues).to include(a_string_matching(/missing correct answer/))
    end

    it "rejects when correct_answer is not in options" do
      bad_exercise = exercise_hash.merge("correct_answer" => "お")
      bad_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ bad_exercise ] * 4, illustrations: [], audio_scripts: [], exercise_records: []
      )

      result = reviewer.review(lesson: lesson, content: bad_content)
      expect(result.issues).to include(a_string_matching(/correct answer not in choices/))
    end

    it "rejects when fewer than 4 exercises" do
      short_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ exercise_hash ] * 3, illustrations: [], audio_scripts: [], exercise_records: []
      )

      result = reviewer.review(lesson: lesson, content: short_content)
      expect(result.issues).to include(a_string_matching(/Too few exercises/))
    end

    it "rejects MEXT kanji grade violation (Grade 3 kanji at Level 2)" do
      level2 = double(position: 2, mext_grade: "Grade 1", jlpt_approx: "Pre-N5", title: "Level 2")
      allow(lesson).to receive_message_chain(:curriculum_unit, :curriculum_level).and_return(level2)

      kanji_exercise = exercise_hash.merge("prompt" => "世の中", "target_text" => "世")
      kanji_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ kanji_exercise ] * 4, illustrations: [], audio_scripts: [], exercise_records: []
      )

      result = reviewer.review(lesson: lesson, content: kanji_content)
      expect(result.issues).to include(a_string_matching(/kanji '世'.*not permitted at Level 2/))
    end
  end

  describe "multi-agent consensus — additional paths" do
    it "passes with a suggestion when 1-of-3 agents dissents" do
      call_count = 0
      allow(router).to receive(:call) do |args|
        call_count += 1
        if args[:system]&.include?("ACCURACY") && call_count <= 3
          OpenStruct.new(text: '{"pass":false,"notes":"Minor concern"}')
        else
          OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
        end
      end

      result = reviewer.review(lesson: lesson, content: content)
      expect(result.passed?).to be true
      expect(result.suggestions).to include(a_string_matching(/1 agent concern/))
    end
  end

  describe "adversarial reviewer" do
    it "rejects when adversarial reviewer finds flaws" do
      allow(router).to receive(:call) do |args|
        if args[:system]&.include?("ADVERSARIAL")
          OpenStruct.new(text: '{"pass":false,"notes":"Found subtle error in exercise 2"}')
        else
          OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
        end
      end

      result = reviewer.review(lesson: lesson, content: content)
      expect(result.passed?).to be false
      expect(result.issues).to include(a_string_matching(/Adversarial review/))
    end
  end

  describe "finalization" do
    it "sets lesson content_status to ready on pass" do
      result = reviewer.review(lesson: lesson, content: content)
      expect(result.passed?).to be true
      expect(lesson).to have_received(:update!).with(hash_including(content_status: "ready"))
    end

    it "sets lesson content_status to qa_failed on exhausted retries" do
      bad_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [], illustrations: [], audio_scripts: [], exercise_records: []
      )

      result = reviewer.review(lesson: lesson, content: bad_content)
      expect(result.passed?).to be false
      expect(lesson).to have_received(:update!).with(hash_including(content_status: "qa_failed"))
    end
  end

  describe "score calculation" do
    it "returns score < 1.0 when multiple issues exist" do
      allow(router).to receive(:call) do |args|
        if args[:system]&.include?("ACCURACY") || args[:system]&.include?("PEDAGOGY")
          OpenStruct.new(text: '{"pass":false,"notes":"Problem found"}')
        else
          OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
        end
      end

      result = reviewer.review(lesson: lesson, content: content)
      expect(result.score).to be < 1.0
    end
  end

  describe "constants" do
    it "has MAX_RETRIES set to 3" do
      expect(described_class::MAX_RETRIES).to eq(3)
    end
  end

  describe "structural checks — illustration missing image" do
    it "rejects an illustration with no url, local_path, or data" do
      ill_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ exercise_hash ] * 4,
        illustrations: [ { "url" => nil, "local_path" => nil, "data" => nil } ],
        audio_scripts: [],
        exercise_records: []
      )

      result = reviewer.review(lesson: lesson, content: ill_content)
      expect(result.issues).to include(a_string_matching(/missing image/))
    end
  end

  describe "structural checks — audio missing file" do
    it "rejects an audio clip with no url or local_path" do
      audio_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ exercise_hash ] * 4,
        illustrations: [],
        audio_scripts: [ { "url" => nil, "local_path" => nil, "text" => "あ" } ],
        exercise_records: []
      )

      result = reviewer.review(lesson: lesson, content: audio_content)
      expect(result.issues).to include(a_string_matching(/missing file/))
    end
  end

  describe "Phase 3 AI illustration review" do
    it "calls the :qa_visual_inspection task for illustrations" do
      ill_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ exercise_hash ] * 4,
        illustrations: [ { "url" => "https://example.com/img.webp", "asset_key" => "scene_1", "file_size" => 100_000 } ],
        audio_scripts: [],
        exercise_records: []
      )

      tasks_called = []
      allow(router).to receive(:call) do |args|
        tasks_called << args[:task]
        OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
      end

      reviewer.review(lesson: lesson, content: ill_content)
      expect(tasks_called).to include(:qa_visual_inspection)
    end
  end

  describe "Phase 3 AI audio review" do
    it "calls the :qa_audio_verification task for audio clips" do
      audio_content = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ exercise_hash ] * 4,
        illustrations: [],
        audio_scripts: [ { "url" => "https://example.com/audio.mp3", "text" => "あいうえお" } ],
        exercise_records: []
      )

      tasks_called = []
      allow(router).to receive(:call) do |args|
        tasks_called << args[:task]
        OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
      end

      reviewer.review(lesson: lesson, content: audio_content)
      expect(tasks_called).to include(:qa_audio_verification)
    end
  end

  describe "auto-correction path" do
    it "calls update_exercise_content when accuracy agent returns corrected_content" do
      record = double("Exercise", is_a?: true)
      allow(record).to receive(:is_a?).with(ActiveRecord::Base).and_return(true)
      allow(record).to receive(:update!)

      corrected = { "prompt" => "corrected prompt", "correct_answer" => "あ" }
      content_with_records = Studio::QA::ContentQualityReviewer::NormalizedContent.new(
        exercises: [ exercise_hash ] * 4,
        illustrations: [],
        audio_scripts: [],
        exercise_records: [ record ] * 4
      )

      call_count = 0
      allow(router).to receive(:call) do |args|
        call_count += 1
        if args[:task] == :qa_exercise_accuracy
          OpenStruct.new(text: { pass: true, auto_correctable: true, corrected_content: corrected, notes: "fixed" }.to_json)
        else
          OpenStruct.new(text: '{"pass":true,"notes":"ok"}')
        end
      end

      reviewer.review(lesson: lesson, content: content_with_records)
      expect(record).to have_received(:update!).with(hash_including(content: corrected)).at_least(:once)
    end
  end
end
