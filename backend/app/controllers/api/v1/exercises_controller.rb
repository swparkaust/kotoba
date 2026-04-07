module Api
  module V1
    class ExercisesController < ApplicationController
      def index
        lesson = Lesson.find(params[:lesson_id])
        exercises = lesson.exercises.order(:position)

        if params[:exercise_type].present?
          exercises = exercises.where(exercise_type: params[:exercise_type])
        end

        render json: exercises.as_json(
          only: [:id, :position, :exercise_type, :content, :difficulty, :qa_status]
        )
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Lesson not found" }, status: :not_found
      end

      def show
        exercise = Exercise.find(params[:id])
        render json: exercise.as_json(
          only: [:id, :position, :exercise_type, :content, :difficulty, :qa_status]
        )
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Exercise not found" }, status: :not_found
      end

      def submit
        exercise = Exercise.find(params[:id])
        answer = submit_params[:answer]

        if answer.blank?
          render json: { error: "Answer is required" }, status: :unprocessable_entity
          return
        end

        correct = evaluate_answer(exercise, answer)

        if exercise.content["srs_key"].present?
          card = SrsCard.seed_for(
            learner: current_learner,
            card_type: exercise.content["srs_type"] || "vocabulary",
            card_key: exercise.content["srs_key"],
            card_data: exercise.content["srs_data"] || {
              front: exercise.content["srs_key"],
              back: exercise.content["correct_answer"],
              source_level: exercise.lesson&.curriculum_unit&.curriculum_level&.position
            }
          )
          SrsScheduler.new.record_review(card: card, correct: correct)
        end

        render json: {
          correct: correct,
          correct_answer: correct ? nil : exercise.content["correct_answer"],
          feedback: exercise.content["hints"]
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Exercise not found" }, status: :not_found
      end

      private

      def submit_params
        params.permit(:id, :answer)
      end

      def evaluate_answer(exercise, answer)
        correct_answer = exercise.content["correct_answer"].to_s
        given = answer.to_s.strip

        # Normalize for Japanese text: ignore full/half width differences
        normalize = ->(s) { s.unicode_normalize(:nfkc).downcase.gsub(/\s+/, "") }

        normalize.call(given) == normalize.call(correct_answer)
      end
    end
  end
end
