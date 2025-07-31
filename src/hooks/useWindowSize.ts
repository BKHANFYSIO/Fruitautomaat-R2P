import { useState, useEffect } from 'react';

// Hook om de venstergrootte bij te houden
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    // Roep de handler direct aan om de initiële grootte in te stellen
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []); // Lege array zorgt ervoor dat dit effect maar één keer runt

  return windowSize;
}; 