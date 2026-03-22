"use client";

import { MultipleChoice } from "./MultipleChoice";
import { FillInBlank } from "./FillInBlank";
import { CharacterTracer } from "./CharacterTracer";
import { ListeningExercise } from "./ListeningExercise";
import { PictureMatchCard } from "./PictureMatchCard";

interface ExerciseRendererProps {
  exercise: {
    id: number;
    exercise_type: string;
    content: {
      prompt?: string;
      options?: string[];
      correct_answer?: string;
      image_url?: string;
      audio_src?: string;
      character?: string;
      picture_options?: Array<{ imageUrl: string; label: string }>;
      correct_index?: number;
      hints?: string[];
    };
    difficulty?: string;
  };
  onAnswer: (answer: string) => void;
}

export function ExerciseRenderer({ exercise, onAnswer }: ExerciseRendererProps) {
  const { exercise_type, content } = exercise;

  const renderExercise = () => {
    switch (exercise_type) {
      case "multiple_choice":
        return (
          <MultipleChoice
            prompt={content.prompt || ""}
            options={content.options || []}
            imageUrl={content.image_url}
            correctIndex={content.options?.indexOf(content.correct_answer || "") ?? -1}
            onAnswer={(answer) => onAnswer(answer)}
          />
        );

      case "fill_blank":
        return (
          <FillInBlank
            prompt={content.prompt || ""}
            onSubmit={(answer) => onAnswer(answer)}
          />
        );

      case "trace":
        return (
          <CharacterTracer
            character={content.character || content.correct_answer || ""}
            onComplete={() => onAnswer(content.correct_answer || "")}
          />
        );

      case "listening":
        return (
          <ListeningExercise
            audioSrc={content.audio_src || ""}
            options={content.options || []}
            onAnswer={(index) => onAnswer((content.options || [])[index] || "")}
          />
        );

      case "picture_match":
        return (
          <PictureMatchCard
            options={content.picture_options || []}
            correctIndex={content.correct_index}
            onSelect={(index) =>
              onAnswer((content.picture_options || [])[index]?.label || "")
            }
          />
        );

      default:
        // Fallback: render as multiple choice if options exist, otherwise as prompt
        if (content.options && content.options.length > 0) {
          return (
            <div className="space-y-4">
              <p className="text-lg text-stone-700">{content.prompt}</p>
              <div className="space-y-2">
                {content.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => onAnswer(option)}
                    className="block w-full text-left p-3 rounded-lg border border-stone-200 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return (
          <FillInBlank
            prompt={content.prompt || ""}
            onSubmit={(answer) => onAnswer(answer)}
          />
        );
    }
  };

  return (
    <div data-testid="exercise-renderer">
      <div data-testid={`exercise-type-${exercise_type}`} className="p-4">
        {content.hints && content.hints.length > 0 && (
          <div className="mb-4 text-sm text-amber-600 bg-amber-50 rounded-lg p-2">
            Hint: {content.hints[0]}
          </div>
        )}
        {renderExercise()}
      </div>
    </div>
  );
}
