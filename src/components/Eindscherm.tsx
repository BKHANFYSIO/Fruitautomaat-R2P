import type { Speler } from '../data/types';
import './Eindscherm.css';
import type { HighScore } from '../data/highScoreManager';

interface EindschermProps {
  spelers: Speler[];
  onHerstart: () => void;
  gameMode: 'single' | 'multi';
  isNieuwRecord: boolean;
  highScore: HighScore | null;
  personalBest: HighScore | null;
  isNieuwPersoonlijkRecord: boolean;
}

export const Eindscherm = ({ spelers, onHerstart, gameMode, isNieuwRecord, highScore, personalBest, isNieuwPersoonlijkRecord }: EindschermProps) => {
  const gesorteerdeSpelers = [...spelers].sort((a, b) => b.score - a.score);
  const winnaar = gesorteerdeSpelers[0];

  const getRang = (index: number, spelers: Speler[]) => {
    if (index === 0) return 1;
    
    // Als de score gelijk is aan de vorige speler, geef dezelfde rang
    if (spelers[index].score === spelers[index - 1].score) {
      return getRang(index - 1, spelers);
    }
    
    // Anders, tel het aantal spelers met hogere scores + 1
    return index + 1;
  };

  return (
    <div className="eindscherm-overlay">
      <div className="eindscherm-content">
        <h1>Spel Voorbij!</h1>
        
        {gameMode === 'multi' ? (
          <div className="winnaar-banner">
            {(() => {
              const topScore = gesorteerdeSpelers[0].score;
              const winnaars = gesorteerdeSpelers.filter(speler => speler.score === topScore);
              
              if (winnaars.length === 1) {
                return <h2>Winnaar: {winnaars[0].naam}! 🏆</h2>;
              } else {
                return (
                  <div>
                    <h2>Gedeelde winnaars! 🏆</h2>
                    <p>{winnaars.map(w => w.naam).join(', ')} ({topScore.toFixed(1)} pnt)</p>
                  </div>
                );
              }
            })()}
          </div>
        ) : (
          <div className="winnaar-banner">
            <div className="resultaten-blok">
              <p><span className="record-label">Jouw Score ({winnaar.naam}):</span> {winnaar.score.toFixed(1)} pnt</p>
              {personalBest && (
                <p><span className="record-label">Jouw Oude Record:</span> {personalBest.score.toFixed(1)} pnt</p>
              )}
              {highScore && (
                <p><span className="record-label">Algemeen Record:</span> {highScore.score.toFixed(1)} pnt (door {highScore.spelerNaam})</p>
              )}
              <p className="record-status">
                {isNieuwPersoonlijkRecord ? '🏆 Nieuw Persoonlijk Record!' : isNieuwRecord ? '🎉 Nieuw Algemeen Record!' : 'Geen records verbroken'}
              </p>
            </div>
          </div>
        )}
        
        {gameMode === 'multi' && (
          <>
            <h3>Eindscores:</h3>
            <ol className="eindscore-lijst">
              {gesorteerdeSpelers.map((speler, index) => {
                const rang = getRang(index, gesorteerdeSpelers);
                return (
                  <li key={speler.naam} className="eindscore-item">
                    <span className="speler-rang">{rang}</span>
                    <span className="speler-naam">{speler.naam}</span>
                    <span className="speler-score">{speler.score.toFixed(1)} pnt</span>
                  </li>
                );
              })}
            </ol>
          </>
        )}
        
        <button onClick={onHerstart}>Nieuw Spel</button>
      </div>
    </div>
  );
}; 