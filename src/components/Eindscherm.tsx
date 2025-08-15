import type { Speler } from '../data/types';
import './Eindscherm.css';
import type { HighScore } from '../data/highScoreManager';
import { Modal } from './Modal';

interface EindschermProps {
  spelers: Speler[];
  onHerstart: () => void;
  gameMode: 'single' | 'multi';
  isNieuwRecord: boolean;
  highScore: HighScore | null;
  personalBest: HighScore | null;
  isNieuwPersoonlijkRecord: boolean;
  onOpenHighscoreRecords?: () => void; // Nieuwe prop voor het openen van highscore records
}

export const Eindscherm = ({ spelers, onHerstart, gameMode, isNieuwRecord, highScore, personalBest, isNieuwPersoonlijkRecord, onOpenHighscoreRecords }: EindschermProps) => {
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
    <Modal isOpen={true} onClose={onHerstart} title={<span>🏁 Spel voorbij</span>} size="md" variant="success">
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
              {isNieuwPersoonlijkRecord ? '🏆 Nieuw Persoonlijk Record!' : isNieuwRecord ? '🎉 Nieuw Algemeen Record!' : (personalBest || highScore) ? 'Geen records verbroken' : 'Eerste poging met deze categorieën!'}
            </p>
            
            {/* Highscore records sectie - alleen voor single player modus */}
            {onOpenHighscoreRecords && gameMode === 'single' && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333',
                fontSize: '0.9rem'
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#e0e0e0' }}>
                  <strong>💡 Probeer andere categorieën!</strong>
                </p>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#b0b0b0', lineHeight: '1.4' }}>
                  Bekijk je opgeslagen records en probeer verschillende categorie-combinaties. 
                  Je kunt eenvoudig eerdere categorie-selecties hergebruiken voor nieuwe pogingen.
                </p>
                <button
                  onClick={onOpenHighscoreRecords}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#45a049';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                  }}
                >
                  🏆 Bekijk Opgeslagen Records
                </button>
              </div>
            )}
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

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onHerstart} className="herstart-knop">Nieuw spel</button>
      </div>
    </Modal>
  );
}; 