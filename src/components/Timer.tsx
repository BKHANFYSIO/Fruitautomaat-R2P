import { useState, useEffect } from 'react';
import { useAudio } from '../hooks/useAudio';
import './Timer.css';

interface TimerProps {
  tijdslimiet: number; // in seconden
  onTimeUp: () => void;
  isActief: boolean;
  isGeluidActief: boolean;
  isTimerActief?: boolean; // Nieuwe prop voor timer zichtbaarheid
}

export const Timer = ({ tijdslimiet, onTimeUp, isActief, isGeluidActief, isTimerActief = true }: TimerProps) => {
  const [resterendeTijd, setResterendeTijd] = useState(tijdslimiet);
  
  const [playTick, stopTick] = useAudio('/sounds/timer-tick.mp3', isGeluidActief);
  const [playEnd] = useAudio('/sounds/timer-end.mp3', isGeluidActief);

  useEffect(() => {
    setResterendeTijd(tijdslimiet);
  }, [tijdslimiet]);

  useEffect(() => {
    if (!isActief || !isTimerActief) {
      return;
    }

    const intervalId = setInterval(() => {
      setResterendeTijd((prevTijd) => {
        if (prevTijd <= 1) {
          clearInterval(intervalId);
          stopTick(); // Stop de tick als die nog speelt
          playEnd();
          onTimeUp();
          return 0;
        }

        const nieuweTijd = prevTijd - 1;

        if (nieuweTijd <= 10 && nieuweTijd > 0) {
          playTick();
        }

        return nieuweTijd;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActief, isTimerActief, onTimeUp, playTick, playEnd, stopTick]);

  // Als timer niet actief is, toon niets
  if (!isTimerActief) {
    return null;
  }

  const progressPercentage = (resterendeTijd / tijdslimiet) * 100;
  const isUrgent = resterendeTijd <= 10;

  return (
    <div className={`timer-container ${isUrgent ? 'urgent' : ''}`}>
      <p>Resterende tijd: {resterendeTijd}s</p>
      <div className="timer-bar">
        <div
          className={`timer-progress ${isUrgent ? 'urgent' : ''}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}; 