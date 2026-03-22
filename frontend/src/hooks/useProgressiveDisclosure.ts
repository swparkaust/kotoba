import { useMemo } from "react";

interface DisclosureState {
  showReviewTab: boolean;
  showJlptBar: boolean;
  showWriting: boolean;
  showSpeaking: boolean;
  showLibrary: boolean;
  showReadingTracker: boolean;
  showReviewFilters: boolean;
  showBurnControls: boolean;
  showLanguageSelector: boolean;
  dashboardLayout: "beginner" | "intermediate" | "advanced" | "full";
}

export function useProgressiveDisclosure(
  highestCompletedLevel: number,
  srsCardCount: number,
  burnedCardCount: number,
  readingSessionCount: number,
  availableLanguageCount: number = 1
): DisclosureState {
  return useMemo(() => ({
    showReviewTab: srsCardCount >= 1,
    showJlptBar: highestCompletedLevel >= 1,
    showWriting: highestCompletedLevel >= 3,
    showSpeaking: highestCompletedLevel >= 2,
    showLibrary: highestCompletedLevel >= 4,
    showReadingTracker: readingSessionCount >= 1,
    showReviewFilters: srsCardCount >= 50,
    showBurnControls: burnedCardCount >= 1,
    showLanguageSelector: availableLanguageCount >= 2,
    dashboardLayout:
      highestCompletedLevel <= 3 ? "beginner" :
      highestCompletedLevel <= 6 ? "intermediate" :
      highestCompletedLevel <= 9 ? "advanced" : "full",
  }), [highestCompletedLevel, srsCardCount, burnedCardCount, readingSessionCount, availableLanguageCount]);
}
