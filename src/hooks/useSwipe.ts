import { useState, useCallback } from 'react';

interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
}

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const useSwipe = (callbacks: SwipeCallbacks, config: SwipeConfig = {}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 500 // Iets meer tijd voor comfort
  } = config;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      });
    }
  }, []);

  const onTouchMove = useCallback((_e: React.TouchEvent) => {
    // Deze functie kan leeg blijven of worden gebruikt om scrollen te voorkomen,
    // maar we houden het eenvoudig voor maximale compatibiliteit.
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    if (!touch) {
      setTouchStart(null);
      return;
    }

    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    if (deltaTime > maxSwipeTime) {
      setTouchStart(null);
      return;
    }

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > minSwipeDistance && absDeltaX > absDeltaY) {
      // Horizontale swipe
      if (deltaX > 0 && callbacks.onSwipeRight) {
        callbacks.onSwipeRight();
      } else if (callbacks.onSwipeLeft) {
        callbacks.onSwipeLeft();
      }
    } else if (absDeltaY > minSwipeDistance && absDeltaY > absDeltaX) {
      // Verticale swipe
      if (deltaY > 0 && callbacks.onSwipeDown) {
        callbacks.onSwipeDown();
      } else if (callbacks.onSwipeUp) {
        callbacks.onSwipeUp();
      }
    }

    setTouchStart(null);
  }, [touchStart, minSwipeDistance, maxSwipeTime, callbacks]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}; 