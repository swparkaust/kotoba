module Api
  module V1
    class SpeakingController < ApplicationController
      def submit
        exercise = Exercise.find(params[:exercise_id])

        unless params[:transcription].present? && params[:target_text].present?
          render json: { error: "transcription and target_text are required" }, status: :unprocessable_entity
          return
        end

        router = AiProviders.build_router
        evaluator = SpeechEvaluator.new(router: router)

        result = evaluator.evaluate(
          learner: current_learner,
          exercise: exercise,
          transcription: params[:transcription],
          target_text: params[:target_text]
        )

        render json: {
          accuracy_score: result.accuracy_score,
          transcription: result.transcription,
          pronunciation_notes: result.pronunciation_notes,
          problem_sounds: result.problem_sounds
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Exercise not found" }, status: :not_found
      end

      def history
        submissions = SpeakingSubmission
          .for_learner(current_learner)
          .recent
          .limit(params[:limit] || 20)
          .includes(:exercise)

        render json: submissions.map { |s|
          {
            id: s.id,
            exercise_id: s.exercise_id,
            target_text: s.target_text,
            transcription: s.transcription,
            accuracy_score: s.accuracy_score,
            pronunciation_notes: s.pronunciation_notes,
            problem_sounds: s.problem_sounds,
            created_at: s.created_at
          }
        }
      end
    end
  end
end
