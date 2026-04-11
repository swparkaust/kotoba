module Api
  module V1
    class PlacementController < ApplicationController
      # GET /placement/questions — fetch server-generated placement questions
      def questions
        language = current_language
        generator = PlacementQuestionGenerator.new(router: ai_router)

        questions = generator.generate(language: language)

        # Strip correct_answer before sending to client
        safe_questions = questions.map do |q|
          { prompt: q[:prompt], options: q[:options], level: q[:level], skill_tested: q[:skill_tested] }
        end

        # Store full questions (with answers) in session for server-side grading
        session_key = "placement_#{current_learner.id}_#{Time.current.to_i}"
        Rails.cache.write(session_key, questions, expires_in: 1.hour)

        render json: { questions: safe_questions, session_key: session_key }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Language not found" }, status: :not_found
      end

      # POST /placement — submit answers for server-side grading
      def create
        learner = current_learner
        language = current_language

        session_key = params[:session_key]
        stored_questions = session_key ? Rails.cache.read(session_key) : nil

        # Grade answers server-side if we have the question bank
        responses = if stored_questions && params[:answers].is_a?(Array)
                      params[:answers].each_with_index.map do |answer, i|
                        q = stored_questions[i]
                        next unless q

                        {
                          "answer" => answer,
                          "correct" => answer == q[:correct_answer],
                          "level" => q[:level],
                          "skill_tested" => q[:skill_tested]
                        }
                      end.compact
        else
                      # Fallback: trust client-provided responses (backward compat)
                      Array(params[:responses])
        end

        Rails.cache.delete(session_key) if session_key

        evaluator = PlacementEvaluator.new(router: ai_router)

        result = evaluator.evaluate(
          learner: learner,
          language: language,
          responses: responses
        )

        render json: {
          id: PlacementAttempt.where(learner: learner, language: language).order(created_at: :desc).first&.id,
          recommended_level: result.recommended_level,
          overall_score: result.overall_score,
          scores_by_level: result.scores_by_level
        }
      end

      # POST /placement/:id/accept — accept placement and unlock levels
      def accept
        learner = current_learner
        attempt = learner.placement_attempts.find(params[:id])
        chosen = params[:chosen_level] || attempt.recommended_level
        attempt.update!(chosen_level: chosen)

        language = attempt.language

        # Mark all lessons BELOW chosen level as completed (skipped via placement)
        below_levels = language.curriculum_levels.where("position < ?", chosen).order(:position)
        below_levels.each do |level|
          level.curriculum_units.each do |unit|
            unit.lessons.each do |lesson|
              progress = LearnerProgress.find_or_initialize_by(learner: learner, lesson: lesson)
              unless progress.status == "completed"
                progress.update!(status: "completed", score: 100, completed_at: Time.current)
              end
            end
          end
        end

        # Mark lessons AT the chosen level as available
        chosen_level = language.curriculum_levels.find_by(position: chosen)
        if chosen_level
          chosen_level.curriculum_units.each do |unit|
            unit.lessons.each do |lesson|
              LearnerProgress.find_or_create_by!(learner: learner, lesson: lesson) do |p|
                p.status = "available"
              end
            end
          end
        end

        render json: { chosen_level: chosen, levels_skipped: below_levels.count, message: "Placed at Level #{chosen}" }
      end
    end
  end
end
