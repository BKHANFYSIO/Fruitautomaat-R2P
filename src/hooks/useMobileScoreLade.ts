import { useCallback, useRef } from 'react';

export function useMobileScoreLade(
  isMobieleWeergave: boolean,
  isAutomatischScorebordActief: boolean,
  setIsScoreLadeOpen: (open: boolean) => void,
) {
  const closeTimerRef = useRef<number | null>(null);

  const clearExistingTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const open = useCallback(() => {
    if (isMobieleWeergave) {
      setIsScoreLadeOpen(true);
    }
  }, [isMobieleWeergave, setIsScoreLadeOpen]);

  const close = useCallback(() => {
    if (isMobieleWeergave) {
      setIsScoreLadeOpen(false);
    }
  }, [isMobieleWeergave, setIsScoreLadeOpen]);

  const autoShow = useCallback((durationMs: number = 3000) => {
    if (!isMobieleWeergave || !isAutomatischScorebordActief) return;
    clearExistingTimer();
    setIsScoreLadeOpen(true);
    closeTimerRef.current = window.setTimeout(() => {
      setIsScoreLadeOpen(false);
      closeTimerRef.current = null;
    }, durationMs);
  }, [isMobieleWeergave, isAutomatischScorebordActief, setIsScoreLadeOpen, clearExistingTimer]);

  return { open, close, autoShow };
}


