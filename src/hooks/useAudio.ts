import { useCallback, useRef, useEffect } from 'react';

export const useAudio = (url: string, isGeluidActief: boolean): [() => void, () => void] => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Maak het audio-element maar één keer aan
  useEffect(() => {
    audioRef.current = new Audio(url);
  }, [url]);

  const play = useCallback(() => {
    if (!isGeluidActief || !audioRef.current) return;

    // Reset de audio naar het begin. Dit stopt ook de huidige playback.
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(e => {
      // Voorkom de console error als de gebruiker nog niet met de pagina heeft geïnteracteerd.
      if (e.name !== 'NotAllowedError') {
        console.error('Audio playback error:', e);
      }
    });
  }, [isGeluidActief]);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, []);

  return [play, stop];
}; 