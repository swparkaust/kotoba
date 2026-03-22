"use client";

interface SpeakingFeedbackProps {
  score: number;
  notes: string;
  problemSounds: Array<{ expected: string; heard: string; tip: string }>;
}

export function SpeakingFeedback({ score, notes, problemSounds }: SpeakingFeedbackProps) {
  return (
    <div data-testid="speaking-feedback" className="space-y-4 rounded-xl bg-blue-50 border border-blue-100 p-4">
      <div data-testid="speaking-score" className="text-2xl font-bold text-blue-700">{score}</div>
      <div data-testid="speaking-notes" className="text-sm text-stone-700">{notes}</div>
      <div data-testid="problem-sound-list" className="space-y-2">
        {problemSounds.map((ps, i) => (
          <div key={i} className="text-sm bg-white rounded-lg p-2">
            <span className="text-red-500">{ps.heard}</span> → <span className="text-green-600">{ps.expected}</span>
            <p className="text-stone-500 text-xs mt-1">{ps.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
