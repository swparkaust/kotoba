module Studio
  module QA
    class ContentQualityReviewer
      MAX_RETRIES = 3

      ReviewResult = Struct.new(:passed, :score, :issues, :suggestions, keyword_init: true) do
        def passed?
          passed
        end
      end

      def initialize(router:, language_config:)
        @router = router
        @lang = language_config
      end

      def review(lesson:, content:)
        attempts = 0

        begin
          attempts += 1
          exercise_result = review_exercises(content.exercises, lesson)
          illustration_result = review_illustrations(content.illustrations, lesson)
          audio_result = review_audio(content.audio_scripts, lesson)
          alignment_result = review_curriculum_alignment(content, lesson)

          all_results = [exercise_result, illustration_result, audio_result, alignment_result]
          passed = all_results.all?(&:passed?)
          overall_score = all_results.sum(&:score) / all_results.length.to_f
          all_issues = all_results.flat_map(&:issues)
          all_suggestions = all_results.flat_map(&:suggestions)

          if !passed && attempts < MAX_RETRIES
            handle_rejections(lesson, content, all_issues)
            raise "Quality check failed, retrying"
          end

          ReviewResult.new(
            passed: passed,
            score: overall_score,
            issues: all_issues,
            suggestions: all_suggestions
          )
        rescue StandardError => e
          retry if attempts < MAX_RETRIES && e.message == "Quality check failed, retrying"
          ReviewResult.new(passed: false, score: 0.0, issues: [e.message], suggestions: [])
        end
      end

      private

      def review_exercises(exercises, lesson)
        issues = []
        suggestions = []

        if exercises.empty?
          issues << "No exercises generated"
          return ReviewResult.new(passed: false, score: 0.0, issues: issues, suggestions: suggestions)
        end

        exercises.each_with_index do |ex, idx|
          issues << "Exercise #{idx + 1}: missing prompt" if ex.prompt.nil? || ex.prompt.strip.empty?
          issues << "Exercise #{idx + 1}: missing target text" if ex.target_text.nil? || ex.target_text.strip.empty?

          if %w[multiple_choice picture_match].include?(ex.exercise_type)
            if ex.choices.nil? || ex.choices.length < 2
              issues << "Exercise #{idx + 1}: multiple choice needs at least 2 choices"
            end
            if ex.correct_answer.nil? || ex.correct_answer.strip.empty?
              issues << "Exercise #{idx + 1}: missing correct answer"
            end
          end

          if @lang.no_english_rule && ex.prompt&.match?(/[a-zA-Z]{3,}/)
            suggestions << "Exercise #{idx + 1}: prompt may contain English text, review for no-English rule"
          end
        end

        score = issues.empty? ? 1.0 : [1.0 - (issues.length * 0.1), 0.0].max
        ReviewResult.new(passed: issues.empty?, score: score, issues: issues, suggestions: suggestions)
      end

      def review_illustrations(illustrations, lesson)
        issues = []
        suggestions = []

        illustrations.each_with_index do |ill, idx|
          if ill.is_a?(Hash)
            issues << "Illustration #{idx + 1}: missing URL or local path" if ill[:url].nil? && ill[:local_path].nil?
          else
            issues << "Illustration #{idx + 1}: missing URL or local path" if ill.url.nil? && ill.local_path.nil?
          end
        end

        score = issues.empty? ? 1.0 : [1.0 - (issues.length * 0.15), 0.0].max
        ReviewResult.new(passed: issues.empty?, score: score, issues: issues, suggestions: suggestions)
      end

      def review_audio(audio_clips, lesson)
        issues = []
        suggestions = []

        audio_clips.each_with_index do |clip, idx|
          if clip.is_a?(Hash)
            issues << "Audio #{idx + 1}: missing file path or URL" if clip[:url].nil? && clip[:local_path].nil?
            issues << "Audio #{idx + 1}: missing text" if clip[:text].nil? || clip[:text].strip.empty?
          else
            issues << "Audio #{idx + 1}: missing file path or URL" if clip.url.nil? && clip.local_path.nil?
            issues << "Audio #{idx + 1}: missing text" if clip.text.nil? || clip.text.strip.empty?
          end
        end

        score = issues.empty? ? 1.0 : [1.0 - (issues.length * 0.1), 0.0].max
        ReviewResult.new(passed: issues.empty?, score: score, issues: issues, suggestions: suggestions)
      end

      def review_curriculum_alignment(content, lesson)
        issues = []
        suggestions = []

        target_items = lesson.curriculum_unit&.target_items || {}
        target_vocab = target_items["vocabulary"] || []
        grammar_points = target_items["grammar"] || []

        unless target_vocab.empty?
          exercise_texts = content.exercises.map { |ex| "#{ex.prompt} #{ex.target_text}" }.join(" ")
          missing_vocab = target_vocab.reject { |v| exercise_texts.include?(v) }
          if missing_vocab.any?
            suggestions << "Target vocabulary not found in exercises: #{missing_vocab.join(", ")}"
          end
        end

        exercise_count = content.exercises.length
        if exercise_count < 4
          issues << "Too few exercises: #{exercise_count} (minimum 4 recommended)"
        elsif exercise_count > 20
          suggestions << "High exercise count: #{exercise_count}. Consider splitting into multiple lessons."
        end

        exercise_types = content.exercises.map(&:exercise_type).uniq
        if exercise_types.length < 2
          suggestions << "Low exercise type variety: only #{exercise_types.join(", ")}"
        end

        score = issues.empty? ? 1.0 : [1.0 - (issues.length * 0.2), 0.0].max
        ReviewResult.new(passed: issues.empty?, score: score, issues: issues, suggestions: suggestions)
      end

      def handle_rejections(lesson, content, issues)
        log_message = "QA rejection for lesson #{lesson.id}: #{issues.join("; ")}"
        if defined?(Rails)
          Rails.logger.warn(log_message)
        else
          warn(log_message)
        end
      end
    end
  end
end
