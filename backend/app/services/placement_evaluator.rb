class PlacementEvaluator
  def initialize(router:)
    @router = router
  end

  def evaluate(learner:, language:, responses:)
    response = @router.call(
      task: :placement_evaluation,
      system: system_prompt,
      prompt: build_prompt(responses),
      max_tokens: 2048
    )

    result = parse_result(response&.text)

    PlacementAttempt.create!(
      learner: learner,
      language: language,
      recommended_level: result.recommended_level,
      responses: responses,
      overall_score: result.overall_score
    )

    result
  end

  private

  def system_prompt
    <<~PROMPT
      You evaluate placement test responses for a Japanese language learning app.
      The app follows the MEXT Kokugo curriculum (Levels 1-12, covering
      elementary through high school).

      Given a set of test responses at various difficulty levels, determine:
      1. The highest level where the learner demonstrates >= 70% competence.
      2. An overall score (0.0-1.0).
      3. Brief scores per level tested.

      Return JSON: { "recommended_level": N, "overall_score": F, "scores_by_level": { "1": F, ... } }
    PROMPT
  end

  def build_prompt(responses)
    "Evaluate these placement test responses:\n#{responses.to_json}"
  end

  def parse_result(text)
    if text.blank?
      return PlacementResult.new(recommended_level: 1, scores_by_level: {}, overall_score: 0.0)
    end

    json = JSON.parse(text)
    unless json.is_a?(Hash)
      return PlacementResult.new(recommended_level: 1, scores_by_level: {}, overall_score: 0.0)
    end

    PlacementResult.new(
      recommended_level: (json["recommended_level"] || 1).to_i.clamp(1, 12),
      scores_by_level: json["scores_by_level"] || {},
      overall_score: (json["overall_score"] || 0.0).to_f.clamp(0.0, 1.0)
    )
  rescue JSON::ParserError => e
    Rails.logger.warn("PlacementEvaluator: failed to parse AI response: #{e.message}")
    PlacementResult.new(recommended_level: 1, scores_by_level: {}, overall_score: 0.0)
  end
end
