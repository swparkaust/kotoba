class AiModelRouter
  TASK_TIERS = {
    lesson_content_generation: :advanced,
    placement_evaluation: :advanced,
    placement_question_generation: :advanced,
    illustration_generation: :advanced,
    qa_exercise_accuracy: :advanced,
    qa_visual_inspection: :advanced,
    qa_curriculum_alignment: :advanced,
    qa_audio_verification: :standard,
    writing_evaluation: :advanced,
    authentic_content_scaffolding: :advanced,
    pragmatic_scenario_generation: :advanced,
    real_audio_scaffolding: :advanced,
    exercise_variation: :standard,
    hint_feedback: :standard,
    speech_evaluation: :standard,
    contrastive_grammar_generation: :standard,
    library_gloss_generation: :standard,
    notification_copy: :standard
  }.freeze

  DEFAULT_MODEL_MAP = {
    advanced: "claude-opus-4-20250514",
    standard: "claude-sonnet-4-20250514"
  }.freeze

  def initialize(provider:, model_map: DEFAULT_MODEL_MAP)
    @provider = provider
    @model_map = model_map
  end

  def call(task:, system:, prompt:, max_tokens: 4096)
    tier = TASK_TIERS.fetch(task) do
      raise ArgumentError, "Unknown AI task: #{task}. Known tasks: #{TASK_TIERS.keys.join(', ')}"
    end

    model = @model_map.fetch(tier)

    response = @provider.complete(
      model: model,
      system: system,
      prompt: prompt,
      max_tokens: max_tokens
    )

    AiResponse.new(
      text: response.text,
      model: response.model,
      provider: response.provider,
      task: task
    )
  end
end
