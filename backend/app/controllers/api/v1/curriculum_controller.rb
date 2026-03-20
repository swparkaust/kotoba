module Api
  module V1
    class CurriculumController < ApplicationController
      def index
        language = Language.find_by(code: params[:language_code])

        unless language
          render json: { error: "Language '#{params[:language_code]}' not found" }, status: :not_found
          return
        end

        levels = language.curriculum_levels
          .includes(curriculum_units: :lessons)
          .order(:position)

        progress_by_lesson = LearnerProgress.where(learner: current_learner)
          .index_by(&:lesson_id)

        render json: levels.map { |level|
          level.as_json(
            only: [:id, :position, :title, :mext_grade, :jlpt_approx, :description],
            include: {
              curriculum_units: {
                only: [:id, :position, :title, :description, :target_items],
                include: {
                  lessons: {
                    only: [:id, :position, :title, :skill_type, :content_status],
                    methods: []
                  }
                }
              }
            }
          ).merge(
            lesson_count: level.curriculum_units.flat_map(&:lessons).size,
            completed_count: level.curriculum_units.flat_map(&:lessons).count { |l|
              progress_by_lesson[l.id]&.status == "completed"
            }
          )
        }
      end

      def show
        level = CurriculumLevel.find(params[:id])

        render json: level.as_json(
          only: [:id, :position, :title, :mext_grade, :jlpt_approx, :description],
          include: {
            curriculum_units: {
              only: [:id, :position, :title, :description, :target_items],
              include: {
                lessons: {
                  only: [:id, :position, :title, :skill_type, :objectives, :content_status]
                }
              }
            }
          }
        )
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Curriculum level not found" }, status: :not_found
      end
    end
  end
end
