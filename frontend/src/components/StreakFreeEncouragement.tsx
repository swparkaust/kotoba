"use client";

import { useState, useEffect } from "react";

const MESSAGES_NEW = [
  "Welcome to your Japanese journey.",
  "Every great journey begins with a single step.",
  "Your first lesson is waiting for you.",
];

const MESSAGES_RETURNING = [
  "Welcome back. Pick up where you left off.",
  "You've been learning beautiful characters.",
  "Every time you practice, your brain builds new connections.",
  "Your next lesson is ready when you are.",
  "Learning a language is a gift you give yourself.",
  "Small steps lead to great distances.",
];

interface StreakFreeEncouragementProps {
  lessonsCompleted: number;
}

export function StreakFreeEncouragement({ lessonsCompleted }: StreakFreeEncouragementProps) {
  const messages = lessonsCompleted === 0 ? MESSAGES_NEW : MESSAGES_RETURNING;
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- selecting a random message on prop change is intentional
    setMessage(messages[Math.floor(Math.random() * messages.length)]);
  }, [lessonsCompleted, messages]);

  return (
    <div data-testid="encouragement" className="rounded-xl bg-amber-50 border border-amber-100 p-4">
      <p data-testid="encouragement-message" className="text-stone-700 text-sm">
        {message}
      </p>
    </div>
  );
}
