module Api
  module V1
    class WritingController < ApplicationController
      def submit
        learner = current_learner
        exercise = Exercise.find(params[:exercise_id])
        evaluator = WritingEvaluator.new(router: ai_router)

        result = evaluator.evaluate(
          learner: learner,
          exercise: exercise,
          submitted_text: params[:text]
        )

        render json: {
          score: result.score,
          grammar_feedback: result.grammar_feedback,
          naturalness_feedback: result.naturalness_feedback,
          register_feedback: result.register_feedback,
          suggestions: result.suggestions
        }
      end

      def history
        learner = current_learner
        submissions = learner.writing_submissions.order(created_at: :desc).limit(20)
        render json: submissions
      end
    end
  end
end
