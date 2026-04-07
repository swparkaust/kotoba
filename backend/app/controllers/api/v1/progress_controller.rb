module Api
  module V1
    class ProgressController < ApplicationController
      def index
        learner = current_learner
        progresses = learner.learner_progresses.includes(:lesson)
        render json: progresses
      end

      def update
        learner = current_learner
        lesson = Lesson.find(params[:lesson_id])
        progress = LearnerProgress.find_or_initialize_by(learner: learner, lesson: lesson)
        progress.update!(
          status: params[:status],
          score: params[:score],
          completed_at: params[:status] == "completed" ? Time.current : nil,
          attempts_count: progress.attempts_count + 1,
          exercise_results: params[:exercise_results] || []
        )

        unlock_next_lesson(learner, lesson) if params[:status] == "completed"

        ProgressChannel.broadcast_update(learner.id, {
          lesson_id: lesson.id,
          status: progress.status,
          score: progress.score
        })

        render json: progress
      end

      def jlpt_comparison
        learner = current_learner
        language = current_language
        mapper = JlptMapper.new
        render json: mapper.current_jlpt(learner: learner, language: language)
      end

      private

      def unlock_next_lesson(learner, completed_lesson)
        unit = completed_lesson.curriculum_unit
        next_lesson = unit.lessons.where("position > ?", completed_lesson.position).order(:position).first

        unless next_lesson
          next_unit = unit.curriculum_level.curriculum_units
            .where("position > ?", unit.position).order(:position).first

          unless next_unit
            next_level = unit.curriculum_level.language.curriculum_levels
              .where("position > ?", unit.curriculum_level.position).order(:position).first
            next_unit = next_level&.curriculum_units&.order(:position)&.first
          end

          next_lesson = next_unit&.lessons&.order(:position)&.first
        end

        return unless next_lesson

        LearnerProgress.find_or_create_by!(learner: learner, lesson: next_lesson) do |p|
          p.status = "available"
        end
      end
    end
  end
end
