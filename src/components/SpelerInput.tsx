import { useState } from 'react';
import './SpelerInput.css';

// Tooltip component en interface verwijderd - niet meer gebruikt

interface SpelerInputProps {
  onSpelerToevoegen: (naam: string) => void;
  gameMode: 'single' | 'multi';
  setGameMode: (mode: 'single' | 'multi') => void;
  isSpelerInputDisabled: boolean;
  isSpelGestart: boolean;
  isSerieuzeLeerModusActief?: boolean;
  setIsSerieuzeLeerModusActief?: (isActief: boolean) => void;
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
  onSpelReset,
}: SpelerInputProps) => {
  const [naam, setNaam] = useState('');
  const [showSerieuzeModusWaarschuwing, setShowSerieuzeModusWaarschuwing] = useState(false);
  const [showSerieuzeModusUitschakelen, setShowSerieuzeModusUitschakelen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (naam.trim()) {
      onSpelerToevoegen(naam.trim());
      setNaam('');
    }
  };

  const handleSerieuzeModusToggle = () => {
    if (!setIsSerieuzeLeerModusActief) return;

    if (!isSerieuzeLeerModusActief && isSpelGestart) {
      // Activeren tijdens actief spel - toon waarschuwing
      setShowSerieuzeModusWaarschuwing(true);
    } else if (isSerieuzeLeerModusActief && isSpelGestart) {
      // Uitschakelen tijdens actief spel - toon waarschuwing
      setShowSerieuzeModusUitschakelen(true);
    } else {
      // Geen actief spel - direct toggle
      setIsSerieuzeLeerModusActief(!isSerieuzeLeerModusActief);
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

  // Tooltip content voor leermodus - dynamisch op basis van status
  const leermodusTooltip = !isSerieuzeLeerModusActief ? (
    <div className="tooltip-content">
      <h4>📚 Schakel naar Leermodus</h4>
      <p><strong>Wat verandert er?</strong> Geen punten, minder afleiding, meer focus op leren.</p>
      <p><strong>Functies:</strong> Leren op basis van herhalingen met opslaan van data voor leeranalyses en certificaat.</p>
      <p><strong>💡 Perfect voor:</strong> Zelfstudie en portfolio ontwikkeling.</p>
    </div>
  ) : (
    <div className="tooltip-content">
      <h4>🏆 Schakel naar Highscore Modus</h4>
      <p><strong>Wat gebeurt er?</strong> Je schakelt over naar Highscore Modus voor competitie en fun.</p>
      <p><strong>Voordelen:</strong> Meer fun en je kunt ook om de beurt elkaars records proberen te verbeteren!</p>
      <p><strong>💡 Belangrijk:</strong> Je leerdata blijft bewaard voor later gebruik.</p>
    </div>
  );

  // Eenvoudige tooltip state
  const [showTooltip, setShowTooltip] = useState(false);

  const handleTooltipToggle = () => {
    setShowTooltip(!showTooltip);
  };

  const gameModeSelector = (
    <div className="game-mode-selector">
      <label>
        <input 
          type="radio" 
          name="gameMode" 
          value="single" 
          checked={gameMode === 'single'} 
          onChange={() => setGameMode('single')}
          disabled={isSpelGestart}
        />
        Single Player
      </label>
      <label>
        <input 
          type="radio" 
          name="gameMode" 
          value="multi" 
          checked={gameMode === 'multi'} 
          onChange={() => setGameMode('multi')}
          disabled={isSpelGestart}
        />
        Multiplayer
      </label>
    </div>
  );

  const singlePlayerModeSelector = (
    <div 
      className="game-mode-selector sub-selector"
      onMouseEnter={handleTooltipToggle}
      onMouseLeave={handleTooltipToggle}
    >
      <label>
        <input 
          type="radio" 
          name="singlePlayerMode" 
          value="highscore" 
          checked={!isSerieuzeLeerModusActief} 
          onChange={handleSerieuzeModusToggle}
          disabled={isSpelGestart}
        />
        🏆 Highscore
      </label>
      <label>
        <input 
          type="radio" 
          name="singlePlayerMode" 
          value="learn" 
          checked={isSerieuzeLeerModusActief} 
          onChange={handleSerieuzeModusToggle}
          disabled={isSpelGestart}
        />
        📚 Leermodus
      </label>
    </div>
  );

  return (
    <div className="speler-input-form">
      {gameModeSelector}
      
      {gameMode === 'single' && (
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'stretch' }}>
          {singlePlayerModeSelector}
          {showTooltip && (
            <div className="tooltip tooltip-top">
              {leermodusTooltip}
            </div>
          )}
        </div>
      )}

      {gameMode === 'multi' || (gameMode === 'single' && !isSerieuzeLeerModusActief) ? (
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



      {/* Waarschuwing modals blijven ongewijzigd */}
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

      {/* Waarschuwing modal voor uitschakelen tijdens actief spel */}
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