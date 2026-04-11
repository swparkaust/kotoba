module Api
  module V1
    class LessonsController < ApplicationController
      def index
        unit = CurriculumUnit.find(params[:unit_id])
        lessons = unit.lessons.order(:position)

        if params[:status].present?
          lesson_ids = lessons.pluck(:id)
          progress_map = LearnerProgress.where(learner: current_learner, lesson_id: lesson_ids)
                                         .index_by(&:lesson_id)
          lessons = lessons.select do |l|
            status = progress_map[l.id]&.status || "locked"
            status == params[:status]
          end
        end

        render json: lessons.as_json(
          only: [ :id, :position, :title, :skill_type, :objectives, :content_status ]
        )
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Unit not found" }, status: :not_found
      end

      def show
        lesson = Lesson.includes(:exercises, :content_assets).find(params[:id])
        progress = LearnerProgress.find_by(learner: current_learner, lesson: lesson)

        render json: lesson.as_json(
          only: [ :id, :position, :title, :skill_type, :objectives, :content_status ],
          include: {
            exercises: { only: [ :id, :position, :exercise_type, :content, :difficulty ] },
            content_assets: { only: [ :id, :asset_type, :url ] }
          }
        ).merge(
          progress_status: progress&.status || "locked",
          score: progress&.score
        )
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Lesson not found" }, status: :not_found
      end
    end
  end
end
