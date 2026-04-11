require 'rails_helper'

RSpec.describe WritingEvaluator, type: :service do
  let(:router) { instance_double(AiModelRouter) }
  let(:service) { described_class.new(router: router) }

  before do
    allow(router).to receive(:call).and_return(
      AiResponse.new(
        text: '{"score":75,"grammar_feedback":"文法はほとんど正しいです","naturalness_feedback":"自然な表現です","register_feedback":"丁寧語が適切です","suggestions":["もう少し接続詞を使いましょう"]}',
        model: "claude-opus-4-20250514",
        task: :writing_evaluation
      )
    )
  end

  it "routes to the writing_evaluation task" do
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "writing")
    expect(router).to receive(:call).with(hash_including(task: :writing_evaluation))
    service.evaluate(learner: learner, exercise: exercise, submitted_text: "今日は天気がいいです。")
  end

  it "creates a WritingSubmission and returns a WritingEvaluation" do
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "writing")
    result = service.evaluate(learner: learner, exercise: exercise, submitted_text: "今日は天気がいいです。")
    expect(result).to be_a(WritingEvaluation)
    expect(result.score).to eq(75)
    expect(WritingSubmission.count).to eq(1)
  end

  it "returns default evaluation when AI returns malformed JSON" do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: "invalid", model: "test", task: :writing_evaluation)
    )
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "writing")
    result = service.evaluate(learner: learner, exercise: exercise, submitted_text: "テスト")
    expect(result.score).to eq(0)
    expect(result.suggestions).to eq([])
  end

  it "returns default evaluation when AI returns blank text" do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: "", model: "test", task: :writing_evaluation)
    )
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "writing")
    result = service.evaluate(learner: learner, exercise: exercise, submitted_text: "テスト")
    expect(result.score).to eq(0)
    expect(result.grammar_feedback).to eq("")
    expect(result.suggestions).to eq([])
  end

  it "handles AI response with missing keys gracefully" do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: '{"score":50}', model: "test", task: :writing_evaluation)
    )
    learner = create(:learner)
    exercise = create(:exercise, exercise_type: "writing")
    result = service.evaluate(learner: learner, exercise: exercise, submitted_text: "テスト")
    expect(result.score).to eq(50)
    expect(result.grammar_feedback).to eq("")
    expect(result.suggestions).to eq([])
  end
end
