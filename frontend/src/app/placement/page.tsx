"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import { PlacementTest } from "@/components/PlacementTest";

interface PlacementQuestion {
  prompt: string;
  options: string[];
  level: number;
  skill_tested: string;
}

export default function PlacementPage() {
  const router = useRouter();
  const { languageCode } = useLanguage();
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<{ recommended_level: number; overall_score: number; id: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions from server on mount
  useEffect(() => {
    setLoading(true);
    api.get(`/placement/questions?language_code=${languageCode}`)
      .then((data) => {
        setQuestions(data.questions || []);
        setSessionKey(data.session_key);
      })
      .catch((e) => setError(e?.message || "Failed to load placement test"))
      .finally(() => setLoading(false));
  }, [languageCode]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(
    async (answer: string) => {
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      const isLast = currentIndex >= questions.length - 1;

      if (isLast) {
        // Submit all answers to server for grading
        setSubmitting(true);
        try {
          const data = await api.post("/placement", {
            language_code: languageCode,
            session_key: sessionKey,
            answers: newAnswers,
          });
          setResult({
            recommended_level: data.recommended_level,
            overall_score: data.overall_score,
            id: data.id,
          });
        } catch (e: any) {
          setError(e?.message || "Failed to submit placement test");
        } finally {
          setSubmitting(false);
        }
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentIndex, answers, questions.length, languageCode, sessionKey]
  );

  const handleAccept = useCallback(
    async (level: number) => {
      if (!result) return;
      try {
        await api.post(`/placement/${result.id}/accept`, { chosen_level: level });
        router.push("/dashboard");
      } catch (e: any) {
        setError(e?.message || "Failed to accept placement");
      }
    },
    [result, router]
  );

  if (loading) return <div className="text-center py-12 text-stone-400">Generating placement test...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (questions.length === 0) return <div className="text-center py-12 text-stone-400">No questions available</div>;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-stone-800">Placement Test</h1>

      {!result && !submitting && (
        <div className="text-sm text-stone-500">
          Question {currentIndex + 1} of {questions.length}
        </div>
      )}

      {submitting ? (
        <div className="text-center text-stone-500 py-8">Evaluating your answers...</div>
      ) : (
        <PlacementTest
          question={result ? undefined : currentQuestion ? { prompt: currentQuestion.prompt, options: currentQuestion.options } : undefined}
          result={result ? { recommended_level: result.recommended_level, overall_score: result.overall_score } : undefined}
          onAnswer={handleAnswer}
          onAccept={handleAccept}
        />
      )}

      {!result && (
        <div className="w-full bg-stone-200 rounded-full h-1">
          <div
            className="bg-orange-500 h-1 rounded-full transition-all"
            style={{ width: `${(currentIndex / questions.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
