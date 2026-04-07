import { useRef, useCallback, useState, useEffect } from "react";

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const play = useCallback((src: string, playbackRate: number = 1) => {
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    audioRef.current = new Audio(src);
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.play().catch((e) => {
      setError(e?.message || "Audio playback failed");
    });
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return { play, stop, error };
}
