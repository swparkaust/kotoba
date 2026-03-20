AiResponse = Struct.new(:text, :model, :provider, :task, keyword_init: true)

ExercisePayload = Struct.new(:exercise_type, :content, :difficulty, :position, keyword_init: true)
LessonContent = Struct.new(:exercises, :illustrations, :audio_scripts, :raw_response, keyword_init: true)
PlacementResult = Struct.new(:recommended_level, :scores_by_level, :overall_score, keyword_init: true)
WritingEvaluation = Struct.new(:score, :grammar_feedback, :naturalness_feedback, :register_feedback, :suggestions, keyword_init: true)
SpeechEvaluation = Struct.new(:accuracy_score, :transcription, :pronunciation_notes, :problem_sounds, keyword_init: true)
