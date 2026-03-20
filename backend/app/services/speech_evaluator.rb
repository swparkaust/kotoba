class SpeechEvaluator
  def initialize(router:)
    @router = router
  end

  def evaluate(learner:, exercise:, transcription:, target_text:)
    response = @router.call(
      task: :speech_evaluation,
      system: system_prompt,
      prompt: build_prompt(target_text, transcription)
    )

    result = parse_evaluation(response&.text)

    submission = SpeakingSubmission.create!(
      learner: learner,
      exercise: exercise,
      transcription: transcription,
      target_text: target_text,
      evaluation: result,
      accuracy_score: result["accuracy_score"]&.to_i&.clamp(0, 100)
    )

    SpeechEvaluation.new(
      accuracy_score: submission.accuracy_score || 0,
      transcription: transcription,
      pronunciation_notes: result["pronunciation_notes"] || "",
      problem_sounds: Array(result["problem_sounds"])
    )
  end

  private

  def system_prompt
    <<~PROMPT
      You evaluate Japanese pronunciation by comparing a speech-to-text
      transcription against the target text.

      Identify:
      1. Overall accuracy (0-100)
      2. Specific pronunciation issues
      3. Problem sound pairs for focused practice

      Return JSON:
      {
        "accuracy_score": 0-100,
        "pronunciation_notes": "...",
        "problem_sounds": [{ "expected": "...", "heard": "...", "tip": "..." }]
      }
    PROMPT
  end

  def build_prompt(target, transcription)
    "Target: #{target}\nHeard: #{transcription}"
  end

  def parse_evaluation(text)
    return default_evaluation if text.blank?

    json = JSON.parse(text)
    return default_evaluation unless json.is_a?(Hash)

    json
  rescue JSON::ParserError => e
    Rails.logger.warn("SpeechEvaluator: failed to parse AI response: #{e.message}")
    default_evaluation
  end

  def default_evaluation
    { "accuracy_score" => 0, "pronunciation_notes" => "", "problem_sounds" => [] }
  end
end
