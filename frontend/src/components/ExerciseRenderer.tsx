"use client";

import { useState } from "react";
import { MultipleChoice } from "./MultipleChoice";
import { FillInBlank } from "./FillInBlank";
import { CharacterTracer } from "./CharacterTracer";
import { ListeningExercise } from "./ListeningExercise";
import { PictureMatchCard } from "./PictureMatchCard";
import { ContrastiveGrammarExercise } from "./ContrastiveGrammarExercise";
import { PragmaticScenario } from "./PragmaticScenario";
import { AuthenticReader } from "./AuthenticReader";
import { RealAudioPlayer } from "./RealAudioPlayer";
import { WritingExercise } from "./WritingExercise";

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
      cluster_name?: string;
      patterns?: Array<{ pattern: string; usage_ja: string; example_sentences: string[] }>;
      exercises?: Array<{ context: string; correct: string; options: string[] }>;
      title?: string;
      situation_ja?: string;
      dialogue?: Array<{ speaker: string; text: string; implied_meaning: string; tone: string }>;
      choices?: Array<{ response: string; consequence: string; score: number }>;
      analysis?: { rule: string };
      body_text?: string;
      attribution?: string;
      scaffolding?: {
        glosses?: Array<{ word: string; reading: string; definition_ja: string; example_sentence: string }>;
        comprehension_questions?: Array<{ question_ja: string; expected_answer_ja: string }>;
        listening_tips?: string[];
      };
      transcription?: string;
    };
    difficulty?: string;
  };
  onAnswer: (answer: string) => void;
}

export function ExerciseRenderer({ exercise, onAnswer }: ExerciseRendererProps) {
  const { exercise_type, content } = exercise;
  const [done, setDone] = useState(false);

  const renderExercise = () => {
    const correctIndex = content.options?.indexOf(content.correct_answer || "") ?? -1;

    switch (exercise_type) {
      case "multiple_choice":
        return (
          <MultipleChoice
            prompt={content.prompt || ""}
            options={content.options || []}
            imageUrl={content.image_url}
            correctIndex={correctIndex}
            onAnswer={onAnswer}
          />
        );

      case "fill_blank":
        return (
          <FillInBlank
            prompt={content.prompt || ""}
            correctAnswer={content.correct_answer}
            onSubmit={onAnswer}
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
            correctIndex={correctIndex}
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

      case "contrastive_grammar":
        return (
          <ContrastiveGrammarExercise
            set={{
              cluster_name: content.cluster_name || "",
              patterns: content.patterns || [],
              exercises: content.exercises || [],
            }}
            onAnswer={onAnswer}
          />
        );

      case "pragmatic_choice":
        return (
          <PragmaticScenario
            scenario={{
              title: content.title || "",
              situation_ja: content.situation_ja || "",
              dialogue: content.dialogue || [],
              choices: content.choices || [],
              analysis: content.analysis || { rule: "" },
            }}
            onChoice={(index) =>
              onAnswer((content.choices || [])[index]?.response || "")
            }
          />
        );

      case "authentic_reading":
        return (
          <>
            <AuthenticReader
              source={{
                title: content.title || "",
                body_text: content.body_text || "",
                attribution: content.attribution || "",
                scaffolding: {
                  glosses: content.scaffolding?.glosses || [],
                  comprehension_questions: content.scaffolding?.comprehension_questions || [],
                },
              }}
            />
            <button
              data-testid="reading-done"
              disabled={done}
              onClick={() => { setDone(true); onAnswer("done"); }}
              className="mt-4 w-full rounded-xl bg-orange-500 py-3 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              Done Reading
            </button>
          </>
        );

      case "real_audio_comprehension":
        return (
          <>
            <RealAudioPlayer
              audioUrl={content.audio_src || ""}
              transcription={content.transcription || ""}
              scaffolding={{
                glosses: content.scaffolding?.glosses,
                comprehension_questions: content.scaffolding?.comprehension_questions?.map((q) => q.question_ja),
                listening_tips: content.scaffolding?.listening_tips,
              }}
            />
            <button
              data-testid="listening-done"
              disabled={done}
              onClick={() => { setDone(true); onAnswer("done"); }}
              className="mt-4 w-full rounded-xl bg-orange-500 py-3 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              Done Listening
            </button>
          </>
        );

      case "writing":
        return (
          <WritingExercise
            prompt={content.prompt || ""}
            onSubmit={onAnswer}
          />
        );

      default:
        if (content.options && content.options.length > 0) {
          return (
            <MultipleChoice
              prompt={content.prompt || ""}
              options={content.options}
              correctIndex={correctIndex}
              onAnswer={onAnswer}
            />
          );
        }

        return (
          <FillInBlank
            prompt={content.prompt || ""}
            correctAnswer={content.correct_answer}
            onSubmit={onAnswer}
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
