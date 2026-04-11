module Api
  module V1
    class LanguagesController < ApplicationController
      skip_before_action :authenticate_learner!

      def index
        languages = Language.active.order(:name)

        if params[:search].present?
          query = "%#{params[:search]}%"
          languages = languages.where("name ILIKE ? OR native_name ILIKE ? OR code ILIKE ?", query, query, query)
        end

        render json: languages.as_json(only: [ :id, :code, :name, :native_name ])
      end

      def show
        language = Language.active.find_by!(code: params[:code])

        render json: language.as_json(
          only: [ :id, :code, :name, :native_name ],
          methods: [],
          include: {}
        ).merge(
          level_count: language.curriculum_levels.count,
          latest_content_pack: ContentPackVersion.latest_ready(language)&.version
        )
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Language not found" }, status: :not_found
      end
    end
  end
end
