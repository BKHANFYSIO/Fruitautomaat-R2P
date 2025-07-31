import type { Speler } from '../data/types';
import './Scorebord.css';
import type { HighScore } from '../data/highScoreManager';
import type { Achievement } from '../data/types';
import { getLeerDataManager } from '../data/leerDataManager';
import { useState, useEffect } from 'react';

interface ScorebordProps {
  spelers: Speler[];
  huidigeSpeler: Speler | null;
  huidigeRonde?: number;
  maxRondes?: number;
  gameMode: 'single' | 'multi';
  highScore: HighScore | null;
  personalBest: HighScore | null;
  isSerieuzeLeerModusActief?: boolean;
  aantalBeurtenGespeeld?: number;
}

export const Scorebord = ({ spelers, huidigeSpeler, huidigeRonde, maxRondes, gameMode, highScore, personalBest, isSerieuzeLeerModusActief = false, aantalBeurtenGespeeld = 0 }: ScorebordProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const gesorteerdeSpelers = [...spelers].sort((a, b) => b.score - a.score);

  // Laad achievements voor serieuze leer-modus
  useEffect(() => {
    if (isSerieuzeLeerModusActief && gameMode === 'single') {
      const leerDataManager = getLeerDataManager();
      const loadedAchievements = leerDataManager.loadAchievements();
      setAchievements(loadedAchievements);
    }
  }, [isSerieuzeLeerModusActief, gameMode, aantalBeurtenGespeeld]);

  const getRang = (index: number, spelers: Speler[]) => {
    if (index === 0) return 1;
    
    // Als de score gelijk is aan de vorige speler, geef dezelfde rang
    if (spelers[index].score === spelers[index - 1].score) {
      return getRang(index - 1, spelers);
    }
    
    // Anders, tel het aantal spelers met hogere scores + 1
    return index + 1;
  };

  const getPodiumClass = (rang: number) => {
    switch (rang) {
      case 1: return 'podium-goud';
      case 2: return 'podium-zilver';
      case 3: return 'podium-brons';
      default: return '';
    }
  };

  // Toon serieuze leer-modus content
  if (isSerieuzeLeerModusActief && gameMode === 'single') {
    const laatsteAchievement = achievements.length > 0 ? achievements[achievements.length - 1] : null;
    
    return (
      <div className="scorebord-container">
        <div className="scorebord-header">
          <h2>Leer Dashboard</h2>
          <div className="ronde-teller">
            <>Leer Modus<br/>Oneindig</>
          </div>
        </div>
        
        <ol className="scorelijst">
          <li className="score-item actieve-speler">
            <span className="speler-rang">1</span>
            <span className="speler-naam">
              Jij
              <span className="indicator"> ▶</span>
            </span>
            <div className="speler-info">
              <div className="speler-stats">
                <div className="beurten-info">
                  <span className="sessie-beurten">{aantalBeurtenGespeeld} spins</span>
                  {achievements.length > 0 && (
                    <span className="totaal-beurten" title="Totaal aantal opdrachten gedaan">
                      ({achievements.length} achievement{achievements.length !== 1 ? 's' : ''} behaald)
                    </span>
                  )}
                </div>
              </div>
              {laatsteAchievement ? (
                <span 
                  className="speler-score achievement-score"
                  title={`${laatsteAchievement.naam}: ${laatsteAchievement.beschrijving}\nKlik om alle achievements te bekijken`}
                  onClick={() => {
                    // Trigger leeranalyse openen
                    const event = new CustomEvent('openLeeranalyse');
                    window.dispatchEvent(event);
                  }}
                >
                  {laatsteAchievement.icon}
                </span>
              ) : (
                <span className="speler-score"></span>
              )}
            </div>
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="scorebord-container">
      <div className="scorebord-header">
        <h2>Scorebord</h2>
        {maxRondes !== undefined && (
          <div className="ronde-teller">
            {isSerieuzeLeerModusActief ? (
              <>Leer Modus<br/>Oneindig</>
            ) : maxRondes > 0 ? (
              `Ronde ${huidigeRonde} van ${maxRondes}`
            ) : (
              <>Rondes<br/>Geen limiet</>
            )}
          </div>
        )}
      </div>
      {gameMode === 'single' && !isSerieuzeLeerModusActief && (
        <div className="highscore-display">
          <h3>🏆 Highscore Modus</h3>
          {highScore && (
            <p>
              <span className="record-label">Record:</span> {highScore.score.toFixed(1)} pnt (door {highScore.spelerNaam})
            </p>
          )}
          {personalBest && (
            <p>
              <span className="record-label">Jouw Record:</span> {personalBest.score.toFixed(1)} pnt
            </p>
          )}
          {(!highScore && !personalBest) && <p>Zet de eerste score neer!</p>}
        </div>
      )}
      {gesorteerdeSpelers.length === 0 ? (
        <p>Nog geen spelers toegevoegd.</p>
      ) : (
        <ol className="scorelijst">
          {gesorteerdeSpelers.map((speler, index) => {
            const rang = getRang(index, gesorteerdeSpelers);
            return (
              <li 
                key={speler.naam} 
                className={`score-item ${getPodiumClass(rang)} ${speler.naam === huidigeSpeler?.naam ? 'actieve-speler' : ''}`}
              >
                <span className="speler-rang">{rang}</span>
              <span className="speler-naam">
                {speler.naam}
                {speler.naam === huidigeSpeler?.naam && <span className="indicator"> ▶</span>}
              </span>

              <div className="speler-info">
                <div className="speler-stats">
                  <span className="speler-beurten-teller">{speler.beurten} {speler.beurten === 1 ? 'beurt' : 'beurten'}</span>
                  {speler.extraSpins > 0 && (
                    <span className="extra-spins-teller" title={`${speler.extraSpins} extra spin(s)`}>
                      <img src="/images/joker.png" alt="Joker" className="joker-icon" />×{speler.extraSpins}
                    </span>
                  )}
                </div>
                {isSerieuzeLeerModusActief ? (
                  <span className="speler-score"></span>
                ) : (
                  <span className="speler-score">{speler.score.toFixed(1)} pnt</span>
                )}
              </div>
            </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}; 