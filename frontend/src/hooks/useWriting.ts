import { useState, useCallback } from "react";
import { api } from "@/lib/api";

interface WritingFeedback {
  score: number;
  grammar_feedback: string;
  naturalness_feedback: string;
  register_feedback: string;
  suggestions: string[];
}

export function useWriting() {
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitWriting = useCallback(async (exerciseId: string, text: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.post("/writing/submit", { exercise_id: exerciseId, text });
      setFeedback(data);
      return data;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit writing");
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { feedback, submitting, submitWriting, error };
}
