import React, { useState, useRef, useEffect } from 'react';
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
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLeermodusTypeTooltip, setShowLeermodusTypeTooltip] = useState(false);

  const isTouchDevice = useRef(typeof window !== 'undefined' && 'ontouchstart' in window);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLongPressStart = (tooltipSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (hideTooltipTimeout.current) clearTimeout(hideTooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => {
        tooltipSetter(true);
        // Automatisch verbergen na 3 seconden
        hideTooltipTimeout.current = setTimeout(() => {
            tooltipSetter(false);
        }, 3000);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
    }
  };
  
  useEffect(() => {
    const eventType = isTouchDevice.current ? 'touchstart' : 'mousedown';

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.sub-selector') && !target.closest('.tooltip')) {
        setShowTooltip(false);
        setShowLeermodusTypeTooltip(false);
      }
    };

    document.addEventListener(eventType, handleClickOutside, true);
    return () => {
      document.removeEventListener(eventType, handleClickOutside, true);
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      if (hideTooltipTimeout.current) clearTimeout(hideTooltipTimeout.current);
    };
  }, []);


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
      setShowSerieuzeModusWaarschuwing(true);
    } else if (isSerieuzeLeerModusActief && isSpelGestart) {
      setShowSerieuzeModusUitschakelen(true);
    } else {
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

  const leermodusTooltip = (
    <div className="tooltip-content">
      {!isSerieuzeLeerModusActief ? (
        <>
          <h4>📚 Schakel naar Leermodus</h4>
          <p><strong>Wat verandert er?</strong> Geen punten, minder afleiding, meer focus op leren.</p>
          <p><strong>Functies:</strong> Leren op basis van herhalingen met opslaan van data voor leeranalyses en certificaat.</p>
          <p><strong>💡 Perfect voor:</strong> Zelfstudie en portfolio ontwikkeling.</p>
        </>
      ) : (
        <>
          <h4>🏆 Schakel naar Highscore Modus</h4>
          <p><strong>Wat gebeurt er?</strong> Je schakelt over naar Highscore Modus voor competitie en fun.</p>
          <p><strong>Voordelen:</strong> Meer fun en je kunt ook om de beurt elkaars records proberen te verbeteren!</p>
          <p><strong>💡 Belangrijk:</strong> Je leerdata blijft bewaard voor later gebruik.</p>
        </>
      )}
    </div>
  );

  const leermodusTypeTooltip = (
     <div className="tooltip-content">
        {leermodusType === 'normaal' ? (
            <>
                <h4>🔄 Schakel naar Leitner</h4>
                <p><strong>Wat verandert er?</strong> Je schakelt over naar de geavanceerde Leitner leermethode.</p>
                <p><strong>Voordelen:</strong> Spaced repetition met box systeem, gedetailleerde statistieken en optimale herhaling timing.</p>
                <p><strong>💡 Perfect voor:</strong> Langdurig leren en systematische kennis opbouw.</p>
            </>
        ) : (
            <>
                <h4>📚 Schakel naar Vrije Leermodus</h4>
                <p><strong>Wat verandert er?</strong> Je schakelt over naar de eenvoudige vrije leermodus.</p>
                <p><strong>Voordelen:</strong> Eenvoudige herhaling, snelle sessies en basis data opslag.</p>
                <p><strong>💡 Perfect voor:</strong> Snelle leersessies en eenvoudige herhaling.</p>
            </>
        )}
     </div>
  );

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

  const singlePlayerProps = {
    onMouseEnter: !isTouchDevice.current ? () => setShowTooltip(true) : undefined,
    onMouseLeave: !isTouchDevice.current ? () => setShowTooltip(false) : undefined,
    onTouchStart: isTouchDevice.current ? () => handleLongPressStart(setShowTooltip) : undefined,
    onTouchEnd: isTouchDevice.current ? handleLongPressEnd : undefined,
    onTouchMove: isTouchDevice.current ? handleLongPressEnd : undefined,
  };

  const leermodusTypeProps = {
    onMouseEnter: !isTouchDevice.current ? () => setShowLeermodusTypeTooltip(true) : undefined,
    onMouseLeave: !isTouchDevice.current ? () => setShowLeermodusTypeTooltip(false) : undefined,
    onTouchStart: isTouchDevice.current ? () => handleLongPressStart(setShowLeermodusTypeTooltip) : undefined,
    onTouchEnd: isTouchDevice.current ? handleLongPressEnd : undefined,
    onTouchMove: isTouchDevice.current ? handleLongPressEnd : undefined,
  };

  const singlePlayerModeSelector = (
    <div className="game-mode-selector sub-selector" {...singlePlayerProps}>
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

  const leermodusTypeSelector = (
    <div className="game-mode-selector sub-selector sub-sub-selector" {...leermodusTypeProps}>
      <label>
        <input 
          type="radio" 
          name="leermodusType" 
          value="normaal" 
          checked={leermodusType === 'normaal'} 
          onChange={() => setLeermodusType?.('normaal')}
          disabled={isSpelGestart}
        />
        📚 Vrije Leermodus
      </label>
      <label>
        <input 
          type="radio" 
          name="leermodusType" 
          value="leitner" 
          checked={leermodusType === 'leitner'} 
          onChange={() => setLeermodusType?.('leitner')}
          disabled={isSpelGestart}
        />
        🔄 Leitner
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

      {gameMode === 'single' && isSerieuzeLeerModusActief && (
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'stretch' }}>
          {leermodusTypeSelector}
          {showLeermodusTypeTooltip && (
            <div className="tooltip tooltip-top">
              {leermodusTypeTooltip}
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
