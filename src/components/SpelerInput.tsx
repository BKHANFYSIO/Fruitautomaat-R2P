import { useState, useEffect } from 'react';
import './SpelerInput.css';

interface SpelerInputProps {
  onSpelerToevoegen: (naam: string) => void;
  gameMode: 'single' | 'multi';
  setGameMode: (mode: 'single' | 'multi') => void;
  isSpelerInputDisabled: boolean;
  isSpelGestart: boolean;
  isSerieuzeLeerModusActief?: boolean;
  setIsSerieuzeLeerModusActief?: (isActief: boolean) => void;
  leermodusType?: 'normaal' | 'leitner';
  setLeermodusType?: (type: 'normaal' | 'leitner') => void;
  onSpelReset?: () => void;
}

export const SpelerInput = ({ 
  onSpelerToevoegen, 
  gameMode, 
  setGameMode, 
  isSpelerInputDisabled, 
  isSpelGestart, 
  isSerieuzeLeerModusActief = false,
  setIsSerieuzeLeerModusActief,
  leermodusType = 'normaal',
  setLeermodusType,
  onSpelReset,
}: SpelerInputProps) => {
  const [naam, setNaam] = useState('');
  const [showSerieuzeModusWaarschuwing, setShowSerieuzeModusWaarschuwing] = useState(false);
  const [showSerieuzeModusUitschakelen, setShowSerieuzeModusUitschakelen] = useState(false);
  
  // Lokale state voor directe feedback
  const [localActiveMode, setLocalActiveMode] = useState<string>('');

  // Tooltip states
  const [showHighscoreTooltip, setShowHighscoreTooltip] = useState(false);
  const [showMultiplayerTooltip, setShowMultiplayerTooltip] = useState(false);
  const [showVrijeLeermodusTooltip, setShowVrijeLeermodusTooltip] = useState(false);
  const [showLeitnerTooltip, setShowLeitnerTooltip] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (naam.trim()) {
      onSpelerToevoegen(naam.trim());
      setNaam('');
    }
  };

  // Nieuwe functies voor directe modus selectie
  const handleHighscoreSelect = () => {
    setLocalActiveMode('highscore'); // Direct feedback
    if (isSpelGestart && isSerieuzeLeerModusActief) {
      setShowSerieuzeModusUitschakelen(true);
    } else {
      setGameMode('single');
      setIsSerieuzeLeerModusActief?.(false);
      if (onSpelReset) onSpelReset();
    }
  };

  const handleMultiplayerSelect = () => {
    setLocalActiveMode('multiplayer'); // Direct feedback
    setGameMode('multi');
    if (onSpelReset) onSpelReset();
  };

  const handleVrijeLeermodusSelect = () => {
    setLocalActiveMode('vrije-leermodus'); // Direct feedback
    if (isSpelGestart && !isSerieuzeLeerModusActief) {
      setShowSerieuzeModusWaarschuwing(true);
    } else {
      setGameMode('single');
      setIsSerieuzeLeerModusActief?.(true);
      setLeermodusType?.('normaal');
      if (onSpelReset) onSpelReset();
    }
  };

  const handleLeitnerSelect = () => {
    setLocalActiveMode('leitner'); // Direct feedback
    if (isSpelGestart && !isSerieuzeLeerModusActief) {
      setShowSerieuzeModusWaarschuwing(true);
    } else {
      setGameMode('single');
      setIsSerieuzeLeerModusActief?.(true);
      setLeermodusType?.('leitner');
      if (onSpelReset) onSpelReset();
    }
  };

  const handleSerieuzeModusBevestiging = () => {
    if (setIsSerieuzeLeerModusActief && onSpelReset) {
      setIsSerieuzeLeerModusActief(true);
      onSpelReset();
    }
    setShowSerieuzeModusWaarschuwing(false);
  };

  const handleSerieuzeModusUitschakelen = () => {
    if (setIsSerieuzeLeerModusActief && onSpelReset) {
      onSpelReset();
      setIsSerieuzeLeerModusActief(false);
    }
    setShowSerieuzeModusUitschakelen(false);
  };

  const isInputVolledigUitgeschakeld = isSpelerInputDisabled || (gameMode === 'multi' && isSpelGestart);

  // Bepaal welke modus actief is - gebruik lokale state als die bestaat, anders bereken
  const getActiveMode = () => {
    if (localActiveMode) return localActiveMode;
    if (gameMode === 'multi') return 'multiplayer';
    if (!isSerieuzeLeerModusActief) return 'highscore';
    if (leermodusType === 'leitner') return 'leitner';
    return 'vrije-leermodus';
  };

  const activeMode = getActiveMode();

  // Reset lokale state wanneer props veranderen (bijvoorbeeld bij spel reset)
  useEffect(() => {
    if (!isSpelGestart) {
      setLocalActiveMode('');
    }
  }, [isSpelGestart]);

  return (
    <div className="speler-input-form">
      <h3 className="mode-selector-title">Kies je spelmodus</h3>
      
      <div className="mode-selector-grid">
        {/* Bovenste rij */}
        <div 
          className="mode-button-container"
          onMouseEnter={() => setShowHighscoreTooltip(true)}
          onMouseLeave={() => setShowHighscoreTooltip(false)}
        >
          <button
            className={`mode-button ${activeMode === 'highscore' ? 'active' : ''}`}
            onClick={handleHighscoreSelect}
            disabled={isSpelGestart}
          >
            <span className="mode-icon">🏆</span>
            <span className="mode-text">Highscore</span>
          </button>
          {showHighscoreTooltip && (
            <div className="tooltip tooltip-top">
              <div className="tooltip-content">
                <h4>🏆 Highscore Modus</h4>
                <p><strong>Competitie en fun!</strong> Probeer de hoogste score te behalen.</p>
                <p><strong>Functies:</strong> Punten verdienen, records verbeteren, leaderboards.</p>
                <p><strong>💡 Perfect voor:</strong> Competitief spelen en records breken.</p>
              </div>
            </div>
          )}
        </div>

        <div 
          className="mode-button-container"
          onMouseEnter={() => setShowMultiplayerTooltip(true)}
          onMouseLeave={() => setShowMultiplayerTooltip(false)}
        >
          <button
            className={`mode-button ${activeMode === 'multiplayer' ? 'active' : ''}`}
            onClick={handleMultiplayerSelect}
            disabled={isSpelGestart}
          >
            <span className="mode-icon">👥</span>
            <span className="mode-text">Multiplayer</span>
          </button>
          {showMultiplayerTooltip && (
            <div className="tooltip tooltip-top">
              <div className="tooltip-content">
                <h4>👥 Multiplayer Modus</h4>
                <p><strong>Samen spelen!</strong> Speel met meerdere spelers om de beurt.</p>
                <p><strong>Functies:</strong> Meerdere spelers, om de beurt spelen, gezamenlijke scores.</p>
                <p><strong>💡 Perfect voor:</strong> Groepsactiviteiten en samen leren.</p>
              </div>
            </div>
          )}
        </div>

        {/* Onderste rij */}
        <div 
          className="mode-button-container"
          onMouseEnter={() => setShowVrijeLeermodusTooltip(true)}
          onMouseLeave={() => setShowVrijeLeermodusTooltip(false)}
        >
          <button
            className={`mode-button ${activeMode === 'vrije-leermodus' ? 'active' : ''}`}
            onClick={handleVrijeLeermodusSelect}
            disabled={isSpelGestart}
          >
            <span className="mode-icon">📚</span>
            <span className="mode-text">Vrije Leermodus</span>
          </button>
          {showVrijeLeermodusTooltip && (
            <div className="tooltip tooltip-top">
              <div className="tooltip-content">
                <h4>📚 Vrije Leermodus</h4>
                <p><strong>Focus op leren!</strong> Geen punten, minder afleiding.</p>
                <p><strong>Functies:</strong> Eenvoudige herhaling, basis data opslag, leeranalyses.</p>
                <p><strong>💡 Perfect voor:</strong> Snelle leersessies en eenvoudige herhaling.</p>
              </div>
            </div>
          )}
        </div>

        <div 
          className="mode-button-container"
          onMouseEnter={() => setShowLeitnerTooltip(true)}
          onMouseLeave={() => setShowLeitnerTooltip(false)}
        >
          <button
            className={`mode-button ${activeMode === 'leitner' ? 'active' : ''}`}
            onClick={handleLeitnerSelect}
            disabled={isSpelGestart}
          >
            <span className="mode-icon">🔄</span>
            <span className="mode-text">Leitner</span>
          </button>
          {showLeitnerTooltip && (
            <div className="tooltip tooltip-top">
              <div className="tooltip-content">
                <h4>🔄 Leitner Leermodus</h4>
                <p><strong>Geavanceerd leren!</strong> Spaced repetition met box systeem.</p>
                <p><strong>Functies:</strong> Box systeem, gedetailleerde statistieken, optimale herhaling timing.</p>
                <p><strong>💡 Perfect voor:</strong> Langdurig leren en systematische kennis opbouw.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Speler input form - alleen voor multiplayer en highscore */}
      {(gameMode === 'multi' || (gameMode === 'single' && !isSerieuzeLeerModusActief)) ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Naam van nieuwe speler"
            disabled={isInputVolledigUitgeschakeld}
          />
          <button type="submit" disabled={isInputVolledigUitgeschakeld}>
            {isSpelerInputDisabled ? 'Eén speler maximaal' : isSpelGestart ? 'Spel is bezig' : 'Voeg speler toe'}
          </button>
        </form>
      ) : null}

      {/* Waarschuwing modals */}
      {showSerieuzeModusWaarschuwing && (
        <div className="serieuze-modus-modal-overlay" onClick={() => setShowSerieuzeModusWaarschuwing(false)}>
          <div className="serieuze-modus-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="serieuze-modus-modal-header">
              <h3>⚠️ Spel Reset Vereist</h3>
              <button 
                onClick={() => setShowSerieuzeModusWaarschuwing(false)}
                className="serieuze-modus-modal-close"
              >
                &times;
              </button>
            </div>
            <div className="serieuze-modus-modal-body">
              <p>
                <strong>Leer Modus kan niet worden geactiveerd tijdens een actief spel.</strong>
              </p>
              <p>
                Om Leer Modus te activeren, moet het huidige spel worden gereset. 
                Dit betekent dat alle voortgang, scores worden gewist en de speler naam moet opnieuw worden ingevoerd.
              </p>
              <p>
                <em>Wil je doorgaan en het spel resetten?</em>
              </p>
            </div>
            <div className="serieuze-modus-modal-footer">
              <button 
                onClick={() => setShowSerieuzeModusWaarschuwing(false)}
                className="serieuze-modus-modal-button secondary"
              >
                Annuleren
              </button>
              <button 
                onClick={handleSerieuzeModusBevestiging}
                className="serieuze-modus-modal-button primary"
              >
                Ja, Reset Spel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSerieuzeModusUitschakelen && (
        <div className="serieuze-modus-modal-overlay" onClick={() => setShowSerieuzeModusUitschakelen(false)}>
          <div className="serieuze-modus-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="serieuze-modus-modal-header">
              <h3>⚠️ Overschakelen naar Highscore Modus</h3>
              <button 
                onClick={() => setShowSerieuzeModusUitschakelen(false)}
                className="serieuze-modus-modal-close"
              >
                &times;
              </button>
            </div>
            <div className="serieuze-modus-modal-body">
              <p>
                <strong>Weet je zeker dat je Leer Modus wilt uitschakelen?</strong>
              </p>
              <p>
                Dit zal het huidige spel resetten en overschakelen naar Highscore Modus:
              </p>
              <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                <li>Aantal beurten wordt gereset naar 0</li>
                <li>Huidige sessie wordt beëindigd</li>
                <li>Spel staat klaar voor nieuwe ronde</li>
                <li>Leerdata en statistieken blijven bewaard</li>
              </ul>
              <p>
                <em>Je kunt altijd terug naar Leer Modus schakelen.</em>
              </p>
            </div>
            <div className="serieuze-modus-modal-footer">
              <button 
                onClick={() => setShowSerieuzeModusUitschakelen(false)}
                className="serieuze-modus-modal-button secondary"
              >
                Annuleren
              </button>
              <button 
                onClick={handleSerieuzeModusUitschakelen}
                className="serieuze-modus-modal-button primary"
              >
                Ja, Overschakelen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 