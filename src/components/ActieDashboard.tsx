import { SpelActies } from './SpelActies';
import { Beoordeling } from './Beoordeling';
import type { Opdracht, Speler, SpinResultaatAnalyse, GamePhase } from '../data/types';
import { useState, useCallback, forwardRef } from 'react';
import { KopOfMunt } from './KopOfMunt';
import { BonusRonde } from './BonusRonde';
import { Timer } from './Timer'; // Timer direct importeren
import './ActieDashboard.css'; // Zorg ervoor dat de CSS wordt geladen

interface ActieDashboardProps {
  huidigeOpdracht: { opdracht: Opdracht; type: string; box?: number } | null;
  spinAnalyse: SpinResultaatAnalyse;
  handleBeoordeling: (prestatie: 'Heel Goed' | 'Redelijk' | 'Niet Goed') => void;
  isTimerActief: boolean;
  gamePhase: GamePhase;
  spelers: Speler[];
  huidigeSpeler: Speler | null;
  onPartnerKies: (partnerNaam: string) => void;
  onGebruikExtraSpin: () => void;
  isJokerSpinActief: boolean;
  puntenVoorVerdubbeling: number;
  onKopOfMunt: (keuze: 'kop' | 'munt') => { uitkomst: 'kop' | 'munt', gewonnen: boolean };
  huidigeBonusOpdracht: { opdracht: string, punten: number[] } | null;
  onBonusRondeVoltooid: (geslaagd: boolean) => void;
  onKopOfMuntVoltooid: () => void;
  isGeluidActief: boolean;
  opgespaardeBonusPunten: number;
  isSerieuzeLeerModusActief?: boolean;
  aantalBeurtenGespeeld?: number;
}

export const ActieDashboard = forwardRef<HTMLDivElement, ActieDashboardProps>(({
  huidigeOpdracht,
  spinAnalyse,
  handleBeoordeling,
  isTimerActief,
  gamePhase,
  spelers,
  huidigeSpeler,
  onPartnerKies,
  puntenVoorVerdubbeling,
  onKopOfMunt,
  huidigeBonusOpdracht,
  onBonusRondeVoltooid,
  onKopOfMuntVoltooid,
  isGeluidActief,
  opgespaardeBonusPunten,
  onGebruikExtraSpin,
  isJokerSpinActief,
  isSerieuzeLeerModusActief = false,
  aantalBeurtenGespeeld = 0
}, ref) => {

  const [gekozenPartner, setGekozenPartner] = useState('');

  const andereSpelers = spelers.filter(p => p.naam !== huidigeSpeler?.naam);

  const handleTimeUp = useCallback(() => {
    // Lege functie, de beoordelingknoppen blijven zichtbaar.
  }, []);

  if (gamePhase === 'partner_choice') {
    if (andereSpelers.length === 0) {
      return <div ref={ref}><Beoordeling onBeoordeel={handleBeoordeling} isLeerModus={isSerieuzeLeerModusActief} /></div>
    }
    return (
      <div className="actie-dashboard" ref={ref}>
        <h4>{spinAnalyse.beschrijving}</h4>
        <p><strong>{huidigeSpeler?.naam}</strong>, kies je partner:</p>
        <select onChange={(e) => setGekozenPartner(e.target.value)} value={gekozenPartner}>
          <option value="">-- Selecteer een speler --</option>
          {andereSpelers.map(p => <option key={p.naam} value={p.naam}>{p.naam}</option>)}
        </select>
        <button onClick={() => onPartnerKies(gekozenPartner)} disabled={!gekozenPartner}>
          Bevestig Partner & Start Opdracht
        </button>
      </div>
    );
  }

  if (gamePhase === 'double_or_nothing') {
    return (
      <div className="actie-dashboard" ref={ref}>
        <KopOfMunt onKeuze={onKopOfMunt} punten={puntenVoorVerdubbeling} onVoltooid={onKopOfMuntVoltooid} isGeluidActief={isGeluidActief} />
      </div>
    );
  }

  if (gamePhase === 'bonus_round' && huidigeBonusOpdracht) {
    return <div ref={ref}><BonusRonde bonusOpdracht={huidigeBonusOpdracht} onVoltooid={onBonusRondeVoltooid} /></div>;
  }

  if (!huidigeOpdracht) {
    return null;
  }

  const extraPunten = Math.min(Number(huidigeOpdracht.opdracht.Extra_Punten) || 0, 2);
  const opdrachtWaarde = 1 + extraPunten;

  const spinBeschrijving = spinAnalyse.bonusPunten > 0 || (spinAnalyse.actie !== 'geen' && spinAnalyse.bonusPunten === 0)
    ? spinAnalyse.beschrijving
    : 'Geen combinatie, geen bonuspunten.';

  return (
    <div className="actie-dashboard" ref={ref}>
      <div className="jackpot-notificatie">
        <p>
          {isSerieuzeLeerModusActief ? (
            <>
              <span>Al {aantalBeurtenGespeeld} opdracht{aantalBeurtenGespeeld !== 1 ? 'en' : ''} gedaan deze sessie</span>
              <span className={`opdracht-type-indicator ${huidigeOpdracht.type}`}>
                {' • '}
                {huidigeOpdracht.type === 'herhaling' 
                  ? `🔄 Herhaling (uit Box ${huidigeOpdracht.box})` 
                  : '✨ Nieuw (start in leersysteem)'}
              </span>
              {spinAnalyse.beschrijving && spinAnalyse.beschrijving !== 'Geen combinatie.' && spinAnalyse.beschrijving !== 'Blijf leren en groeien!' && (
                <>
                  {' • '}
                  <span className="bonus-punten-animatie">{spinAnalyse.beschrijving}</span>
                </>
              )}
            </>
          ) : (
            <>
              <span className={spinAnalyse.bonusPunten > 0 ? "bonus-punten-animatie" : ""}>
                {spinBeschrijving}
              </span>
              {' • '}
              <span>Opdracht is {opdrachtWaarde} {opdrachtWaarde > 1 ? 'punten' : 'punt'} waard.</span>
              {opgespaardeBonusPunten > 0 && (
                <span className="bonus-punten-animatie"> +{opgespaardeBonusPunten} uit bonus!</span>
              )}
              {isJokerSpinActief && spinAnalyse.verdiendeSpins > 0 && (
                <span className="verdiende-spin-notificatie">
                  {' • '}
                  +{spinAnalyse.verdiendeSpins} extra spin! <img src="/images/joker.png" alt="Joker" className="joker-icon" />
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {gamePhase === 'assessment' && (
        <div className="assessment-grid">
          {/* Bovenste rij */}
          <div className="top-row">
            <div className="timer-wrapper">
              <Timer isActief={isTimerActief} tijdslimiet={huidigeOpdracht.opdracht.Tijdslimiet} onTimeUp={handleTimeUp} isGeluidActief={isGeluidActief} isTimerActief={isTimerActief} />
            </div>
            {isJokerSpinActief && huidigeSpeler && huidigeSpeler.extraSpins > 0 && (
              <div className="extra-spin-wrapper">
                <button onClick={onGebruikExtraSpin} className="joker-spin-knop">
                  Gebruik Extra Spin ({huidigeSpeler.extraSpins})
                </button>
              </div>
            )}
          </div>

          {/* Onderste rij */}
          <div className="bottom-row">
            <div className="action-buttons-wrapper">
              <SpelActies opdracht={huidigeOpdracht.opdracht} />
            </div>
            <div className="assessment-wrapper">
              <h3>Beoordeel de prestatie:</h3>
              <Beoordeling onBeoordeel={handleBeoordeling} isLeerModus={isSerieuzeLeerModusActief} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}); 