require 'rails_helper'

RSpec.describe SpeechEvaluator, type: :service do
  let(:router) { instance_double(AiModelRouter) }
  let(:service) { described_class.new(router: router) }

  before do
    allow(router).to receive(:call).and_return(
      AiResponse.new(
        text: '{"accuracy_score":82,"pronunciation_notes":"全体的に良い発音です","problem_sounds":[{"expected":"り","heard":"li","tip":"舌先を上あごにつけてください"}]}',
        model: "claude-sonnet-4-20250514",
        task: :speech_evaluation
      )
    )
  end

  it "routes to the speech_evaluation task" do
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "speaking")
    expect(router).to receive(:call).with(hash_including(task: :speech_evaluation))
    service.evaluate(learner: learner, exercise: exercise, transcription: "おはようございます", target_text: "おはようございます")
  end

  it "creates a SpeakingSubmission and returns a SpeechEvaluation" do
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "speaking")
    result = service.evaluate(learner: learner, exercise: exercise, transcription: "おはようございます", target_text: "おはようございます")
    expect(result).to be_a(SpeechEvaluation)
    expect(result.accuracy_score).to eq(82)
    expect(SpeakingSubmission.count).to eq(1)
  end

  it "returns default evaluation when AI returns nil text" do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: nil, model: "test", task: :speech_evaluation)
    )
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "speaking")
    result = service.evaluate(learner: learner, exercise: exercise, transcription: "テスト", target_text: "テスト")
    expect(result.accuracy_score).to eq(0)
    expect(result.problem_sounds).to eq([])
  end

  it "returns default evaluation when AI returns malformed JSON" do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: "not valid json {{{", model: "test", task: :speech_evaluation)
    )
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "speaking")
    result = service.evaluate(learner: learner, exercise: exercise, transcription: "テスト", target_text: "テスト")
    expect(result).to be_a(SpeechEvaluation)
    expect(result.accuracy_score).to eq(0)
    expect(result.pronunciation_notes).to eq("")
    expect(result.problem_sounds).to eq([])
  end

  it "returns default evaluation when AI returns valid JSON that is not a Hash" do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: '"just a string"', model: "test", task: :speech_evaluation)
    )
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "speaking")
    result = service.evaluate(learner: learner, exercise: exercise, transcription: "テスト", target_text: "テスト")
    expect(result.accuracy_score).to eq(0)
    expect(result.problem_sounds).to eq([])
  end
end
