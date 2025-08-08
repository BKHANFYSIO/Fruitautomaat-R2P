import { useCallback, useEffect, useState } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // ignore
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          // ignore
        });
      }
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}



