import { renderHook } from "@testing-library/react";
import { useProgressiveDisclosure } from "@/hooks/useProgressiveDisclosure";

describe("useProgressiveDisclosure", () => {
  it("hides everything for a brand new learner", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(0, 0, 0, 0, 1));
    expect(result.current.showReviewTab).toBe(false);
    expect(result.current.showJlptBar).toBe(false);
    expect(result.current.showWriting).toBe(false);
    expect(result.current.showSpeaking).toBe(false);
    expect(result.current.showLibrary).toBe(false);
    expect(result.current.showLanguageSelector).toBe(false);
    expect(result.current.dashboardLayout).toBe("beginner");
  });

  it("shows review tab once learner has SRS cards", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(1, 5, 0, 0, 1));
    expect(result.current.showReviewTab).toBe(true);
    expect(result.current.showJlptBar).toBe(true);
  });

  it("shows library at Level 5", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(4, 100, 0, 0, 1));
    expect(result.current.showLibrary).toBe(true);
    expect(result.current.dashboardLayout).toBe("intermediate");
  });

  it("shows review filters at 50+ cards", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(6, 200, 5, 10, 1));
    expect(result.current.showReviewFilters).toBe(true);
    expect(result.current.showBurnControls).toBe(true);
    expect(result.current.dashboardLayout).toBe("intermediate");
  });

  it("shows language selector when multiple languages available", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(0, 0, 0, 0, 2));
    expect(result.current.showLanguageSelector).toBe(true);
  });

  it("shows full layout at Level 10+", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(10, 5000, 100, 50));
    expect(result.current.dashboardLayout).toBe("full");
  });

  it("shows writing at Level 3+", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(3, 10, 0, 0, 1));
    expect(result.current.showWriting).toBe(true);
  });

  it("shows speaking at Level 2+", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(2, 10, 0, 0, 1));
    expect(result.current.showSpeaking).toBe(true);
  });

  it("shows advanced dashboard layout at Level 7-9", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(7, 200, 10, 5, 1));
    expect(result.current.dashboardLayout).toBe("advanced");
  });

  it("shows JLPT bar at level 1+", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(1, 0, 0, 0, 1));
    expect(result.current.showJlptBar).toBe(true);
  });

  it("hides JLPT bar at level 0", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(0, 0, 0, 0, 1));
    expect(result.current.showJlptBar).toBe(false);
  });

  it("shows reading tracker with 1+ reading sessions", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(0, 0, 0, 1, 1));
    expect(result.current.showReadingTracker).toBe(true);
  });

  it("hides reading tracker with 0 reading sessions", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(0, 0, 0, 0, 1));
    expect(result.current.showReadingTracker).toBe(false);
  });

  it("shows burn controls with 1+ burned cards", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(0, 0, 1, 0, 1));
    expect(result.current.showBurnControls).toBe(true);
  });

  it("hides burn controls with 0 burned cards", () => {
    const { result } = renderHook(() => useProgressiveDisclosure(0, 0, 0, 0, 1));
    expect(result.current.showBurnControls).toBe(false);
  });
});
