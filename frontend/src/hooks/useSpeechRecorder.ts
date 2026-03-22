import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";

interface SpeechFeedback {
  accuracy_score: number;
  transcription: string;
  pronunciation_notes: string;
  problem_sounds: Array<{ expected: string; heard: string; tip: string }>;
}

export function useSpeechRecorder(lang: string = "ja-JP") {
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback((onTranscript: (text: string) => void) => {
    setError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setRecording(false);
    };

    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, [lang]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  const submitSpeech = useCallback(async (exerciseId: string, transcription: string, targetText: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.post("/speaking/submit", {
        exercise_id: exerciseId,
        transcription,
        target_text: targetText,
      });
      setFeedback(data);
      return data;
    } catch (e: any) {
      setError(e?.message || "Failed to submit speech");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { recording, feedback, submitting, error, startRecording, stopRecording, submitSpeech };
}
