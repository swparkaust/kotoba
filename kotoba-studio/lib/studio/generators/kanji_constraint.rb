module KanjiConstraint
  # Generates a prompt constraint instructing the AI to only use kanji that have
  # been taught at the given MEXT curriculum level, matching Kokugo textbooks.
  # Words with untaught kanji must be written in hiragana instead.
  def kanji_constraint_for_level(level_pos)
    return "" unless level_pos

    grade_chars = @lang.grade_characters || {}
    max_grade = case level_pos
                when 1 then 0
                when 2 then 1
                when 3..4 then 2
                when 5 then 3
                when 6 then 4
                when 7 then 6
                else nil
                end

    return "" if max_grade.nil?

    permitted = Set.new
    (1..max_grade).each { |g| permitted.merge(grade_chars[g] || []) }

    if permitted.empty? && max_grade == 0
      <<~CONSTRAINT
        KANJI RULE (CRITICAL — MEXT 学年別漢字配当表):
        This is Level 1. No kanji has been taught yet.
        You MUST write ALL text in hiragana and katakana only. Do NOT use any kanji.
        This matches MEXT Kokugo textbooks at this level.
      CONSTRAINT
    else
      <<~CONSTRAINT
        KANJI RULE (CRITICAL — MEXT 学年別漢字配当表):
        Only the following #{permitted.size} kanji have been taught at this level: #{permitted.to_a.join}
        You MUST NOT use any kanji outside this list in ANY part of the content.
        If a word normally uses kanji not in this list, write it in hiragana instead.
        This matches MEXT Kokugo textbooks at the same grade level.
      CONSTRAINT
    end
  end
end
