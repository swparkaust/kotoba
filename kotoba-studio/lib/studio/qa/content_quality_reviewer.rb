module Studio
  module QA
    class ContentQualityReviewer
      MAX_RETRIES = 3

      ReviewResult = Struct.new(:passed, :score, :issues, :suggestions, keyword_init: true) do
        def passed?
          passed
        end
      end

      NormalizedContent = Struct.new(:exercises, :illustrations, :audio_scripts, :exercise_records, keyword_init: true)

      def initialize(router:, language_config:)
        @router = router
        @lang = language_config
      end

      def review(lesson:, content: nil)
        content = load_content(lesson) unless content.is_a?(NormalizedContent)
        attempts = 0

        begin
          attempts += 1

          # Phase 1: Structural checks (deterministic, no AI)
          structural_results = [
            structural_review_exercises(lesson, content),
            structural_review_illustrations(content),
            structural_review_audio(content),
            structural_review_alignment(lesson, content)
          ]

          structural_issues = structural_results.flat_map(&:issues)
          if structural_issues.any?
            if attempts < MAX_RETRIES
              handle_rejections(lesson, structural_issues)
              raise RetryError, "Structural QA failed"
            end
            return finalize(lesson, false, structural_results)
          end

          # Phase 2: Multi-agent AI review (3 specialists per exercise)
          agent_results = multi_agent_review_exercises(lesson, content)

          # Phase 3: AI review of illustrations, audio, curriculum alignment
          asset_results = [
            ai_review_all_illustrations(lesson, content),
            ai_review_all_audio(lesson, content),
            ai_review_curriculum_alignment(lesson, content)
          ]

          # Phase 4: Adversarial review (tries to find flaws the specialists missed)
          adversarial_result = adversarial_review(lesson, content, agent_results)

          all_results = structural_results + [agent_results] + asset_results + [adversarial_result]
          passed = all_results.all?(&:passed?)
          all_issues = all_results.flat_map(&:issues)

          if !passed && attempts < MAX_RETRIES
            handle_rejections(lesson, all_issues)
            raise RetryError, "Multi-agent QA failed"
          end

          finalize(lesson, passed, all_results)
        rescue RetryError
          retry if attempts < MAX_RETRIES
          lesson.update!(content_status: "qa_failed")
          ReviewResult.new(passed: false, score: 0.0, issues: ["Failed after #{MAX_RETRIES} retries"], suggestions: [])
        end
      end

      private

      RetryError = Class.new(StandardError)

      # ═══════════════════════════════════════════════════════════════
      # PHASE 1: Structural Checks (deterministic, no AI cost)
      # ═══════════════════════════════════════════════════════════════

      def structural_review_exercises(lesson, content)
        exercises = extract_exercises(content, lesson)
        return fail_result("No exercises generated") if exercises.empty?

        issues = []
        exercises.each_with_index do |ex, idx|
          issues.concat(check_exercise_structure(ex, idx, lesson))
        end

        build_result(issues)
      end

      def check_exercise_structure(exercise, idx, lesson)
        issues = []
        prompt = field(exercise, :prompt, "content", "prompt")
        choices = field(exercise, :choices, "content", "options")
        correct = field(exercise, :correct_answer, "content", "correct_answer")
        ex_type = field(exercise, :exercise_type)

        issues << "Exercise #{idx + 1}: missing prompt" if prompt.to_s.strip.empty?

        if %w[multiple_choice picture_match listening pragmatic_choice contrastive_grammar].include?(ex_type)
          issues << "Exercise #{idx + 1}: needs at least 2 choices" if choices.nil? || choices.length < 2
          issues << "Exercise #{idx + 1}: missing correct answer" if correct.to_s.strip.empty?
          issues << "Exercise #{idx + 1}: correct answer not in choices" if choices&.any? && correct.present? && !choices.include?(correct)
        end

        # No-English rule
        if @lang.no_english_rule
          text = "#{prompt} #{correct} #{choices&.join(' ')}"
          if text.match?(/[a-zA-Z]{4,}/) && !text.match?(/JLPT|MEXT|SRS|NHK/)
            issues << "Exercise #{idx + 1}: contains English text (violates no-English rule)"
          end
        end

        # MEXT kanji grade check
        all_text = "#{prompt} #{correct} #{choices&.join(' ')}".to_s
        kanji_chars = all_text.scan(/\p{Han}/).uniq
        if kanji_chars.any?
          level_pos = lesson.curriculum_unit&.curriculum_level&.position
          if level_pos
            permitted = permitted_kanji_for_level(level_pos)
            if permitted.any?
              kanji_chars.each do |k|
                unless permitted.include?(k)
                  issues << "Exercise #{idx + 1}: kanji '#{k}' is Grade #{kanji_grade_for(k) || '?'}, not permitted at Level #{level_pos}"
                end
              end
            end
          end
        end

        issues
      end

      def structural_review_illustrations(content)
        illustrations = content.respond_to?(:illustrations) ? content.illustrations : []
        return pass_result if illustrations.empty?

        issues = []
        illustrations.each_with_index do |ill, idx|
          url = field(ill, :url)
          local = field(ill, :local_path)
          data = field(ill, :data)
          size = field(ill, :file_size)

          issues << "Illustration #{idx + 1}: missing image" if url.nil? && local.nil? && data.nil?
          issues << "Illustration #{idx + 1}: too small (#{size} bytes)" if size && size < 50_000
        end
        build_result(issues)
      end

      def structural_review_audio(content)
        clips = content.respond_to?(:audio_scripts) ? content.audio_scripts : []
        return pass_result if clips.empty?

        issues = []
        clips.each_with_index do |clip, idx|
          issues << "Audio #{idx + 1}: missing file" if field(clip, :url).nil? && field(clip, :local_path).nil?
          issues << "Audio #{idx + 1}: missing text" if field(clip, :text).to_s.strip.empty?
          size = field(clip, :file_size)
          issues << "Audio #{idx + 1}: too small (#{size} bytes)" if size && size < 5_000
        end
        build_result(issues)
      end

      def structural_review_alignment(lesson, content)
        exercises = extract_exercises(content, lesson)
        issues = []
        issues << "Too few exercises: #{exercises.length} (minimum 4)" if exercises.length < 4
        build_result(issues)
      end

      # ═══════════════════════════════════════════════════════════════
      # PHASE 2: Multi-Agent Exercise Review (3 specialists)
      # ═══════════════════════════════════════════════════════════════

      def multi_agent_review_exercises(lesson, content)
        exercises = extract_exercises(content, lesson)
        records = content.respond_to?(:exercise_records) ? (content.exercise_records || []) : []
        level = lesson.curriculum_unit&.curriculum_level
        return pass_result unless level

        all_issues = []
        all_suggestions = []

        exercises.each_with_index do |exercise, idx|
          record = records[idx]
          content_json = exercise_content_json(exercise)
          exercise_context = build_exercise_context(exercise, level, lesson)

          # Agent 1: Accuracy Specialist (Advanced tier — Opus)
          accuracy = call_agent(
            task: :qa_exercise_accuracy,
            system: accuracy_agent_prompt(level),
            prompt: exercise_context,
            label: "Accuracy Agent"
          )

          # Agent 2: Pedagogy Specialist (Standard tier — Sonnet)
          pedagogy = call_agent(
            task: :contrastive_grammar_generation, # Standard tier
            system: pedagogy_agent_prompt(level, lesson),
            prompt: exercise_context,
            label: "Pedagogy Agent"
          )

          # Agent 3: Cultural/Linguistic Specialist (Standard tier — Sonnet)
          cultural = call_agent(
            task: :hint_feedback, # Standard tier
            system: cultural_agent_prompt(level),
            prompt: exercise_context,
            label: "Cultural Agent"
          )

          # Consensus: exercise passes only if all 3 agents agree
          agent_results = [accuracy, pedagogy, cultural]
          passes = agent_results.count { |r| r[:pass] }
          fails = agent_results.count { |r| !r[:pass] }

          if fails >= 2
            # Majority reject — definite failure
            notes = agent_results.select { |r| !r[:pass] }.map { |r| r[:notes] }.join("; ")
            all_issues << "Exercise #{idx + 1}: rejected by #{fails}/3 agents — #{notes}"
            update_exercise_status(record, "rejected", notes)
          elsif fails == 1
            # One agent disagrees — flag as suggestion, still passes
            dissent = agent_results.find { |r| !r[:pass] }
            all_suggestions << "Exercise #{idx + 1}: 1 agent concern — #{dissent[:notes]}"
            update_exercise_status(record, "passed", "2/3 consensus pass")
          else
            update_exercise_status(record, "passed", "3/3 unanimous pass")
          end

          # Auto-correction from accuracy agent
          if accuracy[:corrected_content]
            update_exercise_content(record, accuracy[:corrected_content])
          end
        end

        ReviewResult.new(
          passed: all_issues.empty?,
          score: all_issues.empty? ? 1.0 : [1.0 - (all_issues.length * 0.1), 0.0].max,
          issues: all_issues,
          suggestions: all_suggestions
        )
      end

      def accuracy_agent_prompt(level)
        if level.position > 7
          kanji_note = "All Jouyou kanji are permitted at this level."
        else
          permitted = permitted_kanji_for_level(level.position)
          kanji_note = permitted.any? ?
            "PERMITTED KANJI (#{permitted.size} chars from #{@lang.official_curriculum} 学年別漢字配当表): #{permitted.to_a.join}" :
            "No kanji permitted at this level."
        end

        <<~PROMPT
          You are Agent 1: ACCURACY SPECIALIST for a #{@lang.name} language learning app.
          Your sole job is to verify factual correctness.

          Level #{level.position} (#{level.mext_grade}, #{level.jlpt_approx}).

          CHECK:
          1. Is the correct_answer ACTUALLY correct? Verify the #{@lang.name} is valid.
          2. Are distractors plausible but DEFINITIVELY wrong? No ambiguous options.
          3. Is there EXACTLY ONE right answer?
          4. #{kanji_note}
          5. Any kanji NOT in the permitted list is a GRADE VIOLATION — fail immediately.

          Return JSON:
          { "pass": true/false, "auto_correctable": true/false, "corrected_content": {...} or null, "notes": "..." }
        PROMPT
      end

      def pedagogy_agent_prompt(level, lesson)
        <<~PROMPT
          You are Agent 2: PEDAGOGY SPECIALIST for a #{@lang.name} language learning app.
          Your sole job is to verify the exercise teaches what it claims to teach.

          Level #{level.position} (#{level.mext_grade}, #{level.jlpt_approx}).
          Lesson objectives: #{lesson.objectives.to_json}

          CHECK:
          1. Does this exercise actually test/teach the stated objectives?
          2. Is the difficulty appropriate for this level (not too easy, not too hard)?
          3. Would a learner at this level understand the exercise without English?
          4. Does the exercise build on skills from previous levels?
          5. Is the exercise type appropriate for the skill being taught?

          Return JSON: { "pass": true/false, "notes": "..." }
        PROMPT
      end

      def cultural_agent_prompt(level)
        <<~PROMPT
          You are Agent 3: CULTURAL & LINGUISTIC SPECIALIST for a #{@lang.name} learning app.
          Your sole job is to verify cultural accuracy and natural #{@lang.name}.

          Level #{level.position} (#{level.mext_grade}, #{level.jlpt_approx}).

          CHECK:
          1. Is all #{@lang.name} text grammatically correct and natural-sounding?
          2. Would a native #{@lang.name} speaker find anything unnatural or awkward?
          3. Are cultural references accurate and appropriate?
          4. Is the register (formal/casual/keigo) appropriate for the context?
          5. Does the exercise avoid stereotypes or cultural insensitivity?
          6. Is there ANY English, romanization, or non-#{@lang.name} text? (should be none)

          Return JSON: { "pass": true/false, "notes": "..." }
        PROMPT
      end

      # ═══════════════════════════════════════════════════════════════
      # PHASE 3: Asset Reviews (single-agent, AI-powered)
      # ═══════════════════════════════════════════════════════════════

      def ai_review_all_illustrations(lesson, content)
        illustrations = content.respond_to?(:illustrations) ? content.illustrations : []
        return pass_result if illustrations.empty?

        issues = []
        illustrations.each_with_index do |ill, idx|
          key = field(ill, :asset_key) || "illustration_#{idx}"
          result = call_agent(
            task: :qa_visual_inspection,
            system: illustration_review_prompt,
            prompt: "Asset key: #{key}, file_size: #{field(ill, :file_size) || 'unknown'}",
            label: "Visual Inspector"
          )
          issues << "Illustration '#{key}': #{result[:notes]}" unless result[:pass]
        end
        build_result(issues)
      end

      def illustration_review_prompt
        <<~PROMPT
          You verify illustrations for a #{@lang.name} language learning app.
          Style guide: #{@lang.art_direction.to_json}

          Check: (1) asset key matches plausible content, (2) file size indicates real image,
          (3) style consistent with guide (watercolor, warm tones), (4) no text/watermarks.

          Return JSON: { "pass": true/false, "notes": "..." }
        PROMPT
      end

      def ai_review_all_audio(lesson, content)
        clips = content.respond_to?(:audio_scripts) ? content.audio_scripts : []
        return pass_result if clips.empty?

        issues = []
        clips.each_with_index do |clip, idx|
          text = field(clip, :text)
          next if text.to_s.strip.empty?

          result = call_agent(
            task: :qa_audio_verification,
            system: audio_review_prompt,
            prompt: "Expected text: #{text}",
            label: "Audio Verifier"
          )
          issues << "Audio '#{text}': #{result[:notes]}" unless result[:pass]
        end
        build_result(issues)
      end

      def audio_review_prompt
        <<~PROMPT
          You verify audio assets for a #{@lang.name} language learning app.
          Check: (1) text is valid #{@lang.name}, (2) appropriate for level, (3) produces meaningful audio.
          Return JSON: { "pass": true/false, "notes": "..." }
        PROMPT
      end

      def ai_review_curriculum_alignment(lesson, content)
        exercises = extract_exercises(content, lesson)
        level = lesson.curriculum_unit&.curriculum_level
        return pass_result unless level

        exercise_summary = exercises.map { |e|
          "#{field(e, :exercise_type) || 'unknown'} (#{field(e, :difficulty) || 'unknown'})"
        }.join(", ")

        result = call_agent(
          task: :qa_curriculum_alignment,
          system: alignment_review_prompt,
          prompt: <<~PAYLOAD,
            Level: #{level.position} — #{level.title} (#{level.mext_grade}, #{level.jlpt_approx})
            Lesson: #{lesson.title} (#{lesson.skill_type})
            Objectives: #{lesson.objectives.to_json}
            Exercises: #{exercises.length} total — #{exercise_summary}
            Target items: #{lesson.curriculum_unit&.target_items&.to_json}
          PAYLOAD
          label: "Curriculum Alignment"
        )

        issues = result[:pass] ? [] : ["Curriculum alignment: #{result[:notes]}"]
        build_result(issues)
      end

      def alignment_review_prompt
        <<~PROMPT
          You verify curriculum alignment for a #{@lang.name} learning app (#{@lang.official_curriculum}).
          Check: (1) exercises cover objectives, (2) difficulty progresses easy→challenge,
          (3) skill types appropriate for grade, (4) MEXT expectations met.
          #{@lang.classical_variant ? "(5) Classical content uses correct historical grammar." : ""}
          Return JSON: { "pass": true/false, "notes": "..." }
        PROMPT
      end

      # ═══════════════════════════════════════════════════════════════
      # PHASE 4: Adversarial Review (tries to break what passed)
      # ═══════════════════════════════════════════════════════════════

      def adversarial_review(lesson, content, agent_results)
        exercises = extract_exercises(content, lesson)
        level = lesson.curriculum_unit&.curriculum_level
        return pass_result unless level
        return pass_result if exercises.empty?

        # Sample up to 5 exercises that passed all agents
        samples = exercises.first(5).map { |ex| exercise_content_json(ex) }

        result = call_agent(
          task: :qa_exercise_accuracy, # Advanced tier for adversarial
          system: adversarial_prompt(level, lesson),
          prompt: <<~PAYLOAD,
            These #{samples.length} exercises PASSED all 3 specialist reviewers.
            Your job is to find ANY flaw they missed.

            #{samples.each_with_index.map { |s, i| "Exercise #{i + 1}: #{s}" }.join("\n\n")}
          PAYLOAD
          label: "Adversarial Reviewer"
        )

        issues = result[:pass] ? [] : ["Adversarial review: #{result[:notes]}"]
        build_result(issues)
      end

      def adversarial_prompt(level, lesson)
        <<~PROMPT
          You are the ADVERSARIAL REVIEWER for a #{@lang.name} language learning app.
          Three specialist agents already approved these exercises. Your job is to find
          ANY remaining flaw: factual errors, ambiguous answers, unnatural #{@lang.name},
          grade-inappropriate kanji, cultural issues, or pedagogical problems.

          Level #{level.position} (#{level.mext_grade}, #{level.jlpt_approx}).
          Lesson: #{lesson.title}

          Be hostile. Try to break every exercise. If you genuinely find zero issues,
          return pass. Do not invent problems.

          Return JSON: { "pass": true/false, "notes": "specific issues found or 'no issues'" }
        PROMPT
      end

      # ═══════════════════════════════════════════════════════════════
      # Helpers
      # ═══════════════════════════════════════════════════════════════

      def call_agent(task:, system:, prompt:, label:)
        response = @router.call(task: task, system: system, prompt: prompt, max_tokens: 2048)
        parse_agent_response(response&.text, label)
      rescue StandardError => e
        log_warn("#{label} failed: #{e.message}")
        { pass: true, notes: "#{label} unavailable: #{e.message}", corrected_content: nil }
      end

      def parse_agent_response(text, label)
        return { pass: true, notes: "#{label}: no response" } if text.nil? || text.strip.empty?
        json = JSON.parse(text)
        {
          pass: json["pass"] != false,
          notes: json["notes"] || "",
          corrected_content: json["corrected_content"]
        }
      rescue JSON::ParserError
        { pass: true, notes: "#{label}: unparseable response" }
      end

      def finalize(lesson, passed, all_results)
        overall_score = all_results.sum(&:score) / [all_results.length, 1].max.to_f
        all_issues = all_results.flat_map(&:issues)
        all_suggestions = all_results.flat_map(&:suggestions)

        if passed
          lesson.update!(content_status: "ready", content_version: lesson.content_version + 1)
          lesson.exercises.update_all(qa_status: "passed") if lesson.respond_to?(:exercises)
        else
          lesson.update!(content_status: "qa_failed")
          lesson.exercises.update_all(qa_status: "failed") if lesson.respond_to?(:exercises)
        end

        ReviewResult.new(passed: passed, score: overall_score, issues: all_issues, suggestions: all_suggestions)
      end

      def extract_exercises(content, lesson)
        if content.respond_to?(:exercises)
          content.exercises
        else
          (lesson.exercises.to_a rescue [])
        end
      end

      def exercise_content_json(exercise)
        if exercise.respond_to?(:content) && exercise.content.is_a?(Hash)
          exercise.content.to_json
        elsif exercise.respond_to?(:to_json)
          exercise.to_json
        else
          exercise.to_s
        end
      end

      def build_exercise_context(exercise, level, lesson)
        <<~CTX
          Exercise type: #{field(exercise, :exercise_type) || 'unknown'}
          Content: #{exercise_content_json(exercise)}
          Grade: #{level.mext_grade} | JLPT: #{level.jlpt_approx}
          Objectives: #{lesson.objectives.to_json}
          Target items: #{lesson.curriculum_unit&.target_items&.to_json}
        CTX
      end

      def update_exercise_status(exercise, status, notes)
        exercise.update!(qa_status: status, qa_notes: notes) if exercise.respond_to?(:update!)
      rescue StandardError => e
        log_warn("Failed to update exercise status: #{e.message}")
      end

      def update_exercise_content(exercise, corrected)
        exercise.update!(content: corrected) if exercise.respond_to?(:update!) && corrected
      rescue StandardError => e
        log_warn("Failed to auto-correct exercise: #{e.message}")
      end

      def field(obj, *keys)
        keys.each do |key|
          return obj.send(key) if obj.respond_to?(key)
        end
        # Try hash access for nested keys
        keys.each do |key|
          val = obj.dig(key) rescue nil
          return val if val
          val = obj.dig(key.to_s) rescue nil
          return val if val
        end
        nil
      end

      def permitted_kanji_for_level(level_pos)
        @permitted_kanji_cache ||= {}
        return @permitted_kanji_cache[level_pos] if @permitted_kanji_cache.key?(level_pos)

        grade_chars = @lang.grade_characters || {}
        max_grade = case level_pos
                    when 1 then 0
                    when 2 then 1
                    when 3..4 then 2
                    when 5 then 3
                    when 6 then 4
                    when 7 then 6
                    else 6
                    end

        permitted = Set.new
        (1..max_grade).each { |g| permitted.merge(grade_chars[g] || []) }
        @permitted_kanji_cache[level_pos] = permitted
      end

      def kanji_grade_for(char)
        @kanji_grade_map ||= begin
          map = {}
          (@lang.grade_characters || {}).each { |grade, chars| chars.each { |c| map[c] = grade } }
          map
        end
        @kanji_grade_map[char]
      end

      def pass_result
        ReviewResult.new(passed: true, score: 1.0, issues: [], suggestions: [])
      end

      def fail_result(message)
        ReviewResult.new(passed: false, score: 0.0, issues: [message], suggestions: [])
      end

      def build_result(issues)
        ReviewResult.new(
          passed: issues.empty?,
          score: issues.empty? ? 1.0 : [1.0 - (issues.length * 0.1), 0.0].max,
          issues: issues,
          suggestions: []
        )
      end

      def handle_rejections(lesson, issues)
        log_warn("QA rejection for lesson #{lesson.respond_to?(:id) ? lesson.id : 'unknown'}: #{issues.join('; ')}")
      end

      def load_content(lesson)
        exercise_records = lesson.exercises.order(:position).to_a
        exercises = exercise_records.map { |e| normalize_exercise(e) }
        illustrations = lesson.content_assets.where(asset_type: %w[illustration_webp illustration_png scene_webp character_sheet_png]).map { |a| normalize_asset(a) }
        audio = lesson.content_assets.where(asset_type: %w[audio_mp3 audio_ogg]).map { |a| normalize_asset(a) }
        NormalizedContent.new(exercises: exercises, illustrations: illustrations, audio_scripts: audio, exercise_records: exercise_records)
      end

      def log_warn(msg)
        defined?(Rails) ? Rails.logger.warn(msg) : warn(msg)
      end
    end
  end
end
