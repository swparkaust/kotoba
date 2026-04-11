module Api
  module V1
    class SimulateController < ApplicationController
      before_action :require_test_environment

      def create
        context = params.require(:context)
        level = params.fetch(:level, 1).to_i
        quality = params.fetch(:quality, "good")
        exercise_type = params.fetch(:exercise_type, "writing")

        response = ai_router.call(
          task: :learner_simulation,
          system: system_prompt(level, exercise_type),
          prompt: user_prompt(context, level, quality, exercise_type),
          max_tokens: max_tokens_for(level)
        )

        render json: { text: clean_response(response.text) }
      end

      private

      def system_prompt(level, exercise_type)
        <<~SYSTEM
          You are simulating an English-speaking adult learning Japanese at MEXT level #{level}/12.
          Your native language is English. You make mistakes influenced by English grammar and phonology.

          #{character_constraints(level)}
          #{level_errors(level)}

          #{exercise_type == "speaking" ? "You are producing a speech transcription — write what the learner actually said, in the script they would use at their level." : "You are writing a response — use only characters and grammar you know at this level."}

          Output ONLY the learner's #{exercise_type == "speaking" ? "transcription" : "written text"}. No explanation, no translation, no quotation marks, no markdown.
        SYSTEM
      end

      def character_constraints(level)
        case level
        when 1
          "You know ONLY hiragana (46 characters). You cannot read or write katakana or kanji. Your vocabulary is limited to: greetings (こんにちは, おはよう, さようなら), numbers 1-10, and self-introduction phrases. Maximum response: 5-15 characters."
        when 2
          "You know hiragana and katakana. You can write 80 Grade-1 kanji (一, 二, 三, 大, 小, 日, 月, etc). Your vocabulary covers basic nouns, simple verbs (です, ます), and particles は, の. Maximum response: 10-25 characters."
        when 3..4
          "You know hiragana, katakana, and ~240 kanji (Grades 1-2). You can use basic verb conjugation (ます form, て-form), い/な-adjectives, and common particles (は, が, を, に, で, と). Maximum response: 15-40 characters."
        when 5..6
          "You know ~640 kanji (Grades 1-4). You can use potential/conditional forms, passive/causative, and basic keigo (です/ます). You read simple news articles. Maximum response: 30-80 characters."
        when 7..8
          "You know ~1,000 kanji. You use full keigo (尊敬語/謙譲語), write formal letters, and read literary texts. Maximum response: 50-150 characters."
        when 9..12
          "You know 1,000+ kanji and write at near-native level. You understand classical Japanese (古文), regional dialects, and academic writing. Maximum response: 80-200 characters."
        end
      end

      def level_errors(level)
        case level
        when 1
          "Common mistakes: confuse は/わ in particles, omit particles entirely, use English word order (SVO instead of SOV), write romaji mixed with hiragana, forget to conjugate verbs."
        when 2
          "Common mistakes: wrong kanji readings (音読み vs 訓読み), use は when が is needed, forget counters, mix up similar hiragana (め/ぬ, わ/れ)."
        when 3..4
          "Common mistakes: wrong て-form conjugation (especially irregular verbs 行く→行って), confuse に/で for location, use dictionary form instead of ます form in polite context, forget を with transitive verbs."
        when 5..6
          "Common mistakes: wrong conditional form choice (ば/たら/と/なら), passive/causative confusion, overuse of から for reasons when ので is more natural, literal translation of English idioms."
        when 7..8
          "Common mistakes: wrong keigo level (using 尊敬語 for own actions), inconsistent register within a sentence, unnatural kanji compound usage, awkward formal letter conventions."
        when 9..12
          "Occasional mistakes: subtle register mismatches, rare kanji misuse, unnatural classical Japanese forms, slight unnatural phrasing that reveals non-native origin."
        end
      end

      def user_prompt(context, level, quality, exercise_type)
        task = exercise_type == "speaking" ? "pronounce" : "write a response to"

        if quality == "poor"
          if exercise_type == "speaking"
            "The learner tries to say: \"#{context}\". " \
            "They mispronounce it — confusing し/ち, adding vowels between consonants (English habit), " \
            "wrong pitch accent, and mixing up long/short vowels. Produce their flawed transcription."
          else
            "The learner is struggling. They attempt to #{task}: \"#{context}\". " \
            "Produce their flawed attempt with multiple realistic mistakes typical of their level. " \
            "The mistakes should look like a real human made them, not random corruption."
          end
        else
          if exercise_type == "speaking"
            "The learner reads aloud: \"#{context}\". " \
            "They pronounce it correctly with only minor accent differences natural for an English speaker."
          else
            "The learner responds competently to: \"#{context}\". " \
            "Their response is correct for their level — simple at low levels, sophisticated at high levels."
          end
        end
      end

      def max_tokens_for(level)
        case level
        when 1..2 then 50
        when 3..4 then 80
        when 5..6 then 120
        when 7..8 then 180
        else 250
        end
      end

      def clean_response(text)
        return nil if text.nil?
        cleaned = text.dup
        cleaned.gsub!(/<think>.*?<\/think>/m, "")
        cleaned.gsub!(/^```\w*\n?/, "")
        cleaned.gsub!(/\n?```$/, "")
        cleaned.gsub!(/^["'「」]|["'「」]$/, "")
        cleaned.strip!
        cleaned.empty? ? nil : cleaned
      end

      def require_test_environment
        head :not_found unless Rails.env.test?
      end
    end
  end
end
