import type { RefObject } from 'react';
import { useCallback } from 'react';

export function useScrollToTop(mainContentRef?: RefObject<HTMLElement | null>) {
  const scrollToTop = useCallback(() => {
    if (mainContentRef?.current && 'scrollTo' in mainContentRef.current) {
      try {
        (mainContentRef.current as HTMLElement).scrollTo(0, 0);
      } catch {}
    }
    try {
      window.scrollTo(0, 0);
    } catch {}
  }, [mainContentRef]);

  return { scrollToTop };
}


