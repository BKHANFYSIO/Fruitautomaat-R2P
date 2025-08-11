import { useState, useEffect, useMemo, useRef } from 'react';
import { getLeerDataManager } from '../data/leerDataManager';
import type { Opdracht, Speler, SpinResultaatAnalyse, GamePhase } from '../data/types';
import Rol from './Rol';
import { Hendel } from './Hendel'; // Importeer Hendel
import { useAudio } from '../hooks/useAudio';
import { useSettings } from '../context/SettingsContext';
import { opdrachtTypeIconen } from '../data/constants';
import './Fruitautomaat.css';

type RolItem = { symbool?: string; img?: string };

// Hulpcomponent voor knoppen met geïntegreerde tooltip functionaliteit
const TooltipButton = ({
  onClick,
  disabled = false,
  children,
  tooltipContent,
  className = '',
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  tooltipContent: React.ReactNode;
  className?: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const pressTimer = useRef<number | null>(null);

  // Effect om tooltip te sluiten bij klikken buiten de knop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTooltip && isTouchDevice()) {
        const target = event.target as Element;
        const container = target.closest('.tooltip-button-container');
        if (!container) {
          setShowTooltip(false);
        }
      }
    };

    if (showTooltip && isTouchDevice()) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTooltip]);

  const handlePressStart = () => {
    pressTimer.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, 500); // 500ms voor een lange druk
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleClick = () => {
    // Als tooltip open is, sluit deze eerst
    if (showTooltip) {
      setShowTooltip(false);
      return;
    }
    // Anders voer de normale klik actie uit
    onClick();
  };

  // Detecteer of het een touch-apparaat is
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  return (
    <div
      className="tooltip-button-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={isTouchDevice() ? handlePressStart : undefined}
      onTouchEnd={isTouchDevice() ? handlePressEnd : undefined}
      onTouchCancel={isTouchDevice() ? handlePressEnd : undefined}
      onMouseDown={() => setShowTooltip(false)}
    >
      <button
        className={className}
        onClick={handleClick}
        disabled={disabled}
      >
        {children}
      </button>
      {showTooltip && (
        <div className="tooltip tooltip-top">{tooltipContent}</div>
      )}
    </div>
  );
};


interface FruitautomaatProps {
  titel: string;
  opdrachten: Opdracht[];
  spelers: Speler[];
  isSpinning: boolean;
  resultaat: {
    jackpot: number[];
    categorie: number;
    opdracht: number;
    naam: number;
  };
  fruitDisplayItems: RolItem[];
  onSpin: () => void; // Voeg onSpin toe
  isSpinButtonDisabled: boolean; // Om de hendel te kunnen disablen
  spinAnalyse: SpinResultaatAnalyse | null; // Voeg spinAnalyse toe
  isGeluidActief: boolean;
  gamePhase: GamePhase;
  children?: React.ReactNode;
  welcomeMessage?: React.ReactNode;
  // Pauze functionaliteit props
  huidigeOpdracht?: { opdracht: any; type: string; box?: number } | null;
  laatsteBeoordeeldeOpdracht?: { opdracht: any; type: string; box?: number } | null;
  isSerieuzeLeerModusActief?: boolean;
  leermodusType?: 'normaal' | 'leitner';
  onPauseOpdracht?: () => void;
  isBeoordelingDirect?: boolean;
  // Kale modus prop
  isKaleModusActief?: boolean;
}

export const Fruitautomaat = ({ 
  titel,
  opdrachten, 
  spelers, 
  isSpinning, 
  resultaat, 
  fruitDisplayItems, 
  onSpin, 
  isSpinButtonDisabled, 
  spinAnalyse, 
  isGeluidActief,
  gamePhase,
  children,
  welcomeMessage,
  huidigeOpdracht,
  laatsteBeoordeeldeOpdracht,
  isSerieuzeLeerModusActief = false,
  leermodusType,
  onPauseOpdracht,
  isBeoordelingDirect = false,
  isKaleModusActief = false
}: FruitautomaatProps) => {
  const { isRolTijdVerkort } = useSettings();
  
  // Effect om tooltips te sluiten bij klikken buiten
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.tooltip-button-container')) {
        // Sluit alle open tooltips
        document.querySelectorAll('.tooltip-button-container.tooltip-active').forEach(container => {
          container.classList.remove('tooltip-active');
        });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);
  
  const [activeSpin, setActiveSpin] = useState({
    jackpot1: false, jackpot2: false, jackpot3: false,
    categorie: false, opdracht: false, naam: false,
  });

  const [playRolStop] = useAudio('/sounds/rol-stop.mp3', isGeluidActief);

  useEffect(() => {
    if (isSpinning && !isBeoordelingDirect) {
      setActiveSpin({
        jackpot1: true, jackpot2: true, jackpot3: true,
        categorie: true, opdracht: true, naam: true,
      });

      // Gebruik verkorte tijd als de instelling actief is
      const baseDelay = isRolTijdVerkort ? 200 : 1000;
      const interval = isRolTijdVerkort ? 100 : 500;

      // Alleen rol-stop geluid spelen als kale modus niet actief is
      const shouldPlaySound = !isKaleModusActief;

      setTimeout(() => { setActiveSpin(s => ({ ...s, jackpot1: false })); if (shouldPlaySound) playRolStop(); }, baseDelay);
      setTimeout(() => { setActiveSpin(s => ({ ...s, jackpot2: false })); if (shouldPlaySound) playRolStop(); }, baseDelay + interval);
      setTimeout(() => { setActiveSpin(s => ({ ...s, jackpot3: false })); if (shouldPlaySound) playRolStop(); }, baseDelay + interval * 2);
      setTimeout(() => { setActiveSpin(s => ({ ...s, categorie: false })); if (shouldPlaySound) playRolStop(); }, baseDelay + interval * 3);
      setTimeout(() => { setActiveSpin(s => ({ ...s, opdracht: false })); if (shouldPlaySound) playRolStop(); }, baseDelay + interval * 4);
      setTimeout(() => { setActiveSpin(s => ({ ...s, naam: false })); if (shouldPlaySound) playRolStop(); }, baseDelay + interval * 5);
    }
  }, [isSpinning, playRolStop, isRolTijdVerkort, isBeoordelingDirect, isKaleModusActief]);

  const categorieItems = useMemo(() => {
    return [
      ...new Set(
        opdrachten.map(o => 
          o.Hoofdcategorie 
            ? `${o.Hoofdcategorie}: ${o.Categorie}` 
            : o.Categorie
        )
      )
    ];
  }, [opdrachten]);
  const opdrachtTeksten = useMemo(() => opdrachten.map(o => o.Opdracht), [opdrachten]);
  const spelerNamen = useMemo(() => {
    if (isSerieuzeLeerModusActief && spelers.length === 0) {
      return ["Jij"];
    }
    return spelers.map(s => s.naam);
  }, [spelers, isSerieuzeLeerModusActief]);
  
  const isBonusRondeActief = gamePhase === 'bonus_round';

  return (
    <div className="fruitautomaat-machine">
      <header className="fruitautomaat-header">
        <h1>{titel}</h1>
      </header>
      {welcomeMessage}
      <div className="fruitautomaat-body">
        <div className="fruitautomaat-rollen-wrapper">
          {!isKaleModusActief && (
            <div className="jackpot-rij">
              <Rol items={fruitDisplayItems} stopAt={resultaat.jackpot[0]} isSpinning={activeSpin.jackpot1} className="jackpot-rol-item" isWinnend={!isSpinning && spinAnalyse?.winnendeSymbolen?.includes(fruitDisplayItems[resultaat.jackpot[0]]?.symbool || '')} />
              <Rol items={fruitDisplayItems} stopAt={resultaat.jackpot[1]} isSpinning={activeSpin.jackpot2} className="jackpot-rol-item" isWinnend={!isSpinning && spinAnalyse?.winnendeSymbolen?.includes(fruitDisplayItems[resultaat.jackpot[1]]?.symbool || '')} />
              <Rol items={fruitDisplayItems} stopAt={resultaat.jackpot[2]} isSpinning={activeSpin.jackpot3} className="jackpot-rol-item" isWinnend={!isSpinning && spinAnalyse?.winnendeSymbolen?.includes(fruitDisplayItems[resultaat.jackpot[2]]?.symbool || '')} />
            </div>
          )}

          <div className="opdracht-rij">
            <div className="opdracht-rol categorie-rol">
              <Rol items={resultaat.categorie === -1 ? ['Categorie'] : categorieItems} stopAt={resultaat.categorie === -1 ? 0 : resultaat.categorie} isSpinning={activeSpin.categorie} height={120} />
            </div>
            <div className="opdracht-rol opdracht-tekst-rol">
              <Rol items={isBonusRondeActief ? ['Doe eerst de bonusopdracht'] : (resultaat.opdracht === -1 ? ['Opdracht'] : opdrachtTeksten)} stopAt={isBonusRondeActief ? 0 : (resultaat.opdracht === -1 ? 0 : resultaat.opdracht)} isSpinning={activeSpin.opdracht} height={120} />
            </div>
            <div className="opdracht-rol speler-rol">
              <Rol items={resultaat.naam === -1 ? ['Speler'] : spelerNamen} stopAt={resultaat.naam === -1 ? 0 : resultaat.naam} isSpinning={activeSpin.naam} height={120} />
            </div>
          </div>
        </div>
        <Hendel onSpin={onSpin} disabled={isSpinButtonDisabled} />
      </div>
      <div className="fruitautomaat-footer">
        {isSpinButtonDisabled && !children && (
          <div className="start-instructies">
            {/* Dit bericht wordt nu in App.tsx beheerd, dus hier leeg */}
          </div>
        )}
        {children}

        {huidigeOpdracht && gamePhase !== 'spinning' && (
          <div className="opdracht-info-footer">
                         <div className="tooltip-button-container" 
               onTouchStart={(e) => {
                 e.preventDefault();
                 const container = e.currentTarget;
                 container.classList.add('tooltip-active');
               }}
               onClick={(e) => {
                 const container = e.currentTarget;
                 if (container.classList.contains('tooltip-active')) {
                   container.classList.remove('tooltip-active');
                 }
               }}
             >
               <span className="info-item">
                 {huidigeOpdracht.opdracht.bron === 'systeem' ? '📖' : '👨‍💼'}
               </span>
               <div className="tooltip tooltip-top">
                 <div className="tooltip-content">
                   <strong>Bron</strong>
                   <p>{huidigeOpdracht.opdracht.bron || 'Onbekend'}</p>
              </div>
              {/* Hint-links (optioneel) naar leeranalyse / leerstrategieën via globale notificaties */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {/* Deze knoppen verschijnen alleen wanneer via notificaties wordt aangemoedigd; anders blijven ze onzichtbaar */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openLeeranalyse'))}
                  className="link-button"
                  style={{ display: 'none' }}
                  id="footer-link-leeranalyse"
                >
                  Leeranalyse
                </button>
                <button
                  onClick={() => window.dispatchEvent(new Event('openLeerstrategien'))}
                  className="link-button"
                  style={{ display: 'none' }}
                  id="footer-link-leerstrategien"
                >
                  Leerstrategieën
                </button>
              </div>
               </div>
             </div>
             <div className="tooltip-button-container"
               onTouchStart={(e) => {
                 e.preventDefault();
                 const container = e.currentTarget;
                 container.classList.add('tooltip-active');
               }}
               onClick={(e) => {
                 const container = e.currentTarget;
                 if (container.classList.contains('tooltip-active')) {
                   container.classList.remove('tooltip-active');
                 }
               }}
             >
               <span className="info-item">
                 {opdrachtTypeIconen[huidigeOpdracht.opdracht.opdrachtType || 'Onbekend']}
               </span>
               <div className="tooltip tooltip-top">
                 <div className="tooltip-content">
                   <strong>Type</strong>
                   <p>{huidigeOpdracht.opdracht.opdrachtType || 'Onbekend'}</p>
                 </div>
               </div>
             </div>
          </div>
        )}
        
        {/* Pauze knop - alleen tonen na beoordeling in Leitner modus */}
        {(gamePhase === 'ended' || gamePhase === 'idle') && (huidigeOpdracht || laatsteBeoordeeldeOpdracht) && isSerieuzeLeerModusActief && leermodusType === 'leitner' && onPauseOpdracht && (
          <div className="pause-opdracht-footer">
            <TooltipButton
              onClick={onPauseOpdracht}
              tooltipContent="Pauzeer deze opdracht — deze komt niet terug tot de pauze wordt gestopt"
              className="pause-opdracht-footer-knop"
            >
              ⏸️ Pauzeer deze opdracht
            </TooltipButton>

            {/* Leitner context & acties */}
            {(() => {
              const mgr = getLeerDataManager();
              const op = (huidigeOpdracht || laatsteBeoordeeldeOpdracht)?.opdracht;
              if (!op) return null;
              const hoofdcategorie = op.Hoofdcategorie || 'Overig';
              const opdrachtId = `${hoofdcategorie}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
              const boxId = mgr.getOpdrachtBoxId(opdrachtId);
              if (boxId === null) return null;
              const volgende = mgr.getVolgendeHerhalingTekst(opdrachtId);

              const kanNaarB0 = boxId >= 1;
              const kanNaarB1 = boxId >= 2;
              const intervalMin = mgr.getBoxIntervalMin(boxId);
              const pinnedCount = mgr.getPinnedCount();
              const allowAdjust = boxId >= 2; // pas vanaf B2 zinvol

              return (
                <div className="leitner-footer-blok">
                  <div className="leitner-footer-meta">
                    Box: B{boxId} • Volgende herhaling: {volgende}
                  </div>
                  <div className="leitner-footer-actions">
                    {kanNaarB0 && (
                      <>
                        <TooltipButton
                          onClick={() => { 
                            mgr.setOpdrachtBox(opdrachtId, 0); 
                            const nextTxt = mgr.getVolgendeHerhalingTekst(opdrachtId);
                           window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: `Opdracht verplaatst naar Box 0 • Volgende herhaling: ${nextTxt}`, type: 'succes', timeoutMs: 5000 } }));
                          }}
                          tooltipContent="Zet terug naar Box 0"
                          className="pause-opdracht-footer-knop"
                        >
                          ↩️ Zet naar Box 0
                        </TooltipButton>
                      </>
                    )}
                    {kanNaarB1 && (
                      <>
                        <TooltipButton
                          onClick={() => { 
                            mgr.setOpdrachtBox(opdrachtId, 1);
                            const nextTxt = mgr.getVolgendeHerhalingTekst(opdrachtId);
                           window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: `Opdracht verplaatst naar Box 1 • Volgende herhaling: ${nextTxt}`, type: 'succes', timeoutMs: 5000 } }));
                          }}
                          tooltipContent="Zet terug naar Box 1"
                          className="pause-opdracht-footer-knop"
                        >
                          ↩️ Zet naar Box 1
                        </TooltipButton>
                      </>
                    )}
                    {allowAdjust && (
                      <>
                        <TooltipButton
                          onClick={() => { 
                            mgr.adjustVolgendeReview(opdrachtId, -Math.round(intervalMin / 2)); 
                            const nextTxt = mgr.getVolgendeHerhalingTekst(opdrachtId);
                           window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: `Volgende herhaling vervroegd • ${nextTxt}`, type: 'succes', timeoutMs: 6000 } }));
                          }}
                          tooltipContent="Versnel volgende herhaling (ongeveer halve interval eerder)"
                          className="pause-opdracht-footer-knop"
                        >
                          ⏩ Herhaling sneller
                        </TooltipButton>
                      </>
                    )}
                    {allowAdjust && (
                      <>
                        <TooltipButton
                          onClick={() => { 
                            mgr.adjustVolgendeReview(opdrachtId, Math.round(intervalMin / 2)); 
                            const nextTxt = mgr.getVolgendeHerhalingTekst(opdrachtId);
                           window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: `Volgende herhaling later gepland • ${nextTxt}`, type: 'succes', timeoutMs: 6000 } }));
                          }}
                          tooltipContent="Vertraag volgende herhaling (ongeveer halve interval later)"
                          className="pause-opdracht-footer-knop"
                        >
                          ⏸️ Herhaling later
                        </TooltipButton>
                      </>
                    )}
                    <>
                      <TooltipButton
                        onClick={() => {
                          const pinned = mgr.isPinnedOpdracht(opdrachtId);
                          if (pinned) { 
                            mgr.removePinnedOpdracht(opdrachtId);
                          window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Opdracht ont‑pinned voor focus.', type: 'succes', timeoutMs: 5000 } }));
                          } else { 
                            mgr.addPinnedOpdracht(opdrachtId);
                          window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Opdracht pinned voor focus-sessie.', type: 'succes', timeoutMs: 5000 } }));
                          }
                        }}
                        disabled={mgr.isFocusNowActive()}
                        tooltipContent={mgr.isFocusNowActive() ? 'Focussessie bezig. Gepinde opdrachten worden nu achter elkaar aangeboden.' : 'Oefen alle gepinde opdrachten nu direct achter elkaar'}
                        className="pause-opdracht-footer-knop"
                      >
                        📌 Pin voor focus
                      </TooltipButton>
                    </>
                  {pinnedCount > 0 && (
                      <>
                        {mgr.isFocusNowActive() ? (
                          <TooltipButton
                            onClick={() => {
                              mgr.startFocusNow();
                              window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: `Focus nu gestart (${pinnedCount} opdracht(en))`, type: 'succes', timeoutMs: 6000 } }));
                            }}
                            tooltipContent={`Focus nu gestart (${pinnedCount} opdracht(en))`}
                            className={`pause-opdracht-footer-knop focus-now-knop is-active`}
                            disabled
                          >
                            🎯 Focusmodus actief — {pinnedCount} resterend
                          </TooltipButton>
                        ) : (
                          <TooltipButton
                            onClick={() => {
                              mgr.startFocusNow();
                              window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: `Focus nu gestart (${pinnedCount} opdracht(en))`, type: 'succes', timeoutMs: 6000 } }));
                            }}
                            tooltipContent={`Focus nu (${pinnedCount})`}
                            className={`pause-opdracht-footer-knop focus-now-knop`}
                          >
                            🎯 Focus nu ({pinnedCount})
                          </TooltipButton>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}; 