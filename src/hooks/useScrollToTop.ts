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

  // Scroll naar het dashboard (left panel)
  const scrollToDashboard = useCallback(() => {
    // Zoek naar de left panel om daar naar boven te scrollen
    const leftPanel = document.querySelector('.left-panel');
    if (leftPanel && 'scrollTo' in leftPanel) {
      try {
        (leftPanel as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    }
    
    // Fallback: scroll ook de hele pagina naar boven
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  }, []);

  return { scrollToTop, scrollToDashboard };
}


