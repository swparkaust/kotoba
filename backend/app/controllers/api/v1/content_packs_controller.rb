module Api
  module V1
    class ContentPacksController < ApplicationController
      def latest
        language = current_language
        pack = language.content_pack_versions.where(status: "ready").order(version: :desc).first
        if pack
          render json: pack
        else
          head :not_found
        end
      end

      def check_update
        language = current_language
        current_version = params[:current_version].to_i
        latest = language.content_pack_versions.where(status: "ready").order(version: :desc).first

        render json: {
          update_available: latest && latest.version > current_version,
          latest_version: latest&.version,
          current_version: current_version
        }
      end
    end
  end
end
