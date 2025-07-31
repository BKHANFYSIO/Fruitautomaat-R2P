import { useState } from 'react';
import { useAudio } from '../hooks/useAudio';
import './KopOfMunt.css';

interface KopOfMuntProps {
  onKeuze: (keuze: 'kop' | 'munt') => void;
  punten: number;
  onVoltooid: () => void;
  isGeluidActief: boolean;
}

export const KopOfMunt = ({ onKeuze, punten, onVoltooid, isGeluidActief }: KopOfMuntProps) => {
  const [flipping, setFlipping] = useState(false);
  const [keuzeGemaakt, setKeuzeGemaakt] = useState<boolean>(false);
  const [playSpinningCoin] = useAudio('/sounds/spinning-coin.mp3', isGeluidActief);

  const handleFlip = (keuze: 'kop' | 'munt') => {
    if (flipping) return;

    playSpinningCoin(); // Speel het munt draai geluid
    setFlipping(true);
    setKeuzeGemaakt(true);
    
    setTimeout(() => {
      onKeuze(keuze); // Bepaal de uitslag en toon notificatie
      onVoltooid();   // Start het afronden van de beurt
    }, 3000); // Wacht tot de animatie klaar is
  };

  return (
    <div className="kop-of-munt-container">
      <div className="kop-of-munt-header">
        <h3>Kop of Munt!</h3>
        <p>Verdubbel {punten} punten naar {punten * 2}!</p>
      </div>
      
      <div className="coin-container">
        <div className={`coin ${flipping ? 'flipping' : ''}`}>
          <div className="side head">KOP</div>
          <div className="side tail">MUNT</div>
        </div>
      </div>

      {!keuzeGemaakt && (
        <div className="keuze-knoppen">
          <button onClick={() => handleFlip('kop')} disabled={flipping}>
            Ik kies Kop
          </button>
          <button onClick={() => handleFlip('munt')} disabled={flipping}>
            Ik kies Munt
          </button>
        </div>
      )}

      {keuzeGemaakt && (
        <div className="resultaat-tekst">
          <p>De munt wordt opgegooid...</p>
        </div>
      )}
    </div>
  );
}; 