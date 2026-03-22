"use client";

interface CelebrationOverlayProps {
  type: "lesson" | "level";
  score: number;
  jlptMilestone?: string;
  onDismiss: () => void;
}

export function CelebrationOverlay({ type, score, jlptMilestone, onDismiss }: CelebrationOverlayProps) {
  return (
    <div data-testid="celebration" className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl">
        <div data-testid="celebration-checkmark" className="text-5xl mb-4">✓</div>
        <div data-testid="celebration-message" className="text-lg text-stone-700 mb-2">
          {type === "level" && jlptMilestone
            ? `${jlptMilestone} level reached!`
            : "Lesson complete!"}
        </div>
        <div data-testid="celebration-score" className="text-2xl font-bold text-orange-600 mb-6">
          {score}%
        </div>
        <button
          data-testid="celebration-dismiss"
          onClick={onDismiss}
          className="rounded-xl bg-orange-500 px-6 py-2 text-white hover:bg-orange-400"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
