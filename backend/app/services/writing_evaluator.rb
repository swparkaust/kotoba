class WritingEvaluator
  def initialize(router:)
    @router = router
  end

  def evaluate(learner:, exercise:, submitted_text:)
    level = exercise.lesson.curriculum_unit.curriculum_level.position

    response = @router.call(
      task: :writing_evaluation,
      system: system_prompt(level),
      prompt: build_prompt(exercise, submitted_text),
      max_tokens: 4096
    )

    result = parse_evaluation(response&.text)

    submission = WritingSubmission.create!(
      learner: learner,
      exercise: exercise,
      submitted_text: submitted_text,
      evaluation: result,
      score: result["score"]&.to_i&.clamp(0, 100)
    )

    WritingEvaluation.new(
      score: submission.score || 0,
      grammar_feedback: result["grammar_feedback"] || "",
      naturalness_feedback: result["naturalness_feedback"] || "",
      register_feedback: result["register_feedback"] || "",
      suggestions: Array(result["suggestions"])
    )
  end

  private

  def system_prompt(level)
    <<~PROMPT
      You are a Japanese writing teacher evaluating a student's written response.
      The student is at Level #{level}.

      All feedback must be in Japanese, using vocabulary and grammar
      appropriate for their level. Be encouraging and constructive.

      Evaluate on four dimensions:
      1. Grammar correctness
      2. Naturalness of expression
      3. Register appropriateness
      4. Content quality

      Return JSON:
      {
        "score": 0-100,
        "grammar_feedback": "...",
        "naturalness_feedback": "...",
        "register_feedback": "...",
        "suggestions": ["...", "..."]
      }
    PROMPT
  end

  def build_prompt(exercise, submitted_text)
    "Prompt: #{exercise.content['prompt']}\n\nStudent wrote:\n#{submitted_text}"
  end

  def parse_evaluation(text)
    return default_evaluation if text.blank?

    json = JSON.parse(text)
    return default_evaluation unless json.is_a?(Hash)

    json
  rescue JSON::ParserError => e
    Rails.logger.warn("WritingEvaluator: failed to parse AI response: #{e.message}")
    default_evaluation
  end

  def default_evaluation
    {
      "score" => 0,
      "grammar_feedback" => "",
      "naturalness_feedback" => "",
      "register_feedback" => "",
      "suggestions" => []
    }
  end
end
