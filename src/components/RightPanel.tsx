import React from 'react';
import type { RefObject } from 'react';
import type { Opdracht, Speler, GamePhase } from '../data/types';
import { Fruitautomaat } from './Fruitautomaat';
import { ActieDashboard } from './ActieDashboard';
import { NotificatieBanner } from './NotificatieBanner';

type Props = {
  notificatie: { zichtbaar: boolean; type: 'succes' | 'fout'; bericht: string };
  warning?: string | null;
  DevPanelSlot?: React.ReactNode;

  // Fruitautomaat props
  titel: string;
  opdrachten: Opdracht[];
  spelers: Speler[];
  isSpinning: boolean;
  resultaat: { jackpot: number[]; categorie: number; opdracht: number; naam: number };
  fruitDisplayItems: { symbool: string; img?: string; className?: string }[];
  onSpin: () => void;
  isSpinButtonDisabled: boolean;
  spinAnalyse: any;
  isGeluidActief: boolean;
  gamePhase: GamePhase;
  huidigeOpdracht: { opdracht: Opdracht; type: 'herhaling' | 'nieuw' | 'geen'; box?: number } | null;
  laatsteBeoordeeldeOpdracht: any;
  isSerieuzeLeerModusActief: boolean;
  leermodusType: 'normaal' | 'leitner';
  onPauseOpdracht: () => void;
  isBeoordelingDirect: boolean;
  isKaleModusActief: boolean;
  welcomeMessage?: React.ReactNode;

  // ActieDashboard props
  actieDashboardRef: RefObject<HTMLDivElement | null>;
  handleBeoordeling: (prestatie: 'Heel Goed' | 'Redelijk' | 'Niet Goed') => void;
  isTimerActief: boolean;
  huidigeSpeler: Speler | null;
  onPartnerKies: (partnerNaam: string) => void;
  onGebruikExtraSpin: () => void;
  isJokerSpinActief: boolean;
  puntenVoorVerdubbeling: number;
  onKopOfMunt: (keuze: 'kop' | 'munt') => { uitkomst: 'kop' | 'munt'; gewonnen: boolean };
  huidigeBonusOpdracht: { opdracht: string; punten: number[] } | null;
  opgespaardeBonusPunten: number;
  onBonusRondeVoltooid: (geslaagd: boolean) => void;
  onKopOfMuntVoltooid: () => void;
};

export const RightPanel: React.FC<Props> = ({
  notificatie,
  warning,
  DevPanelSlot,
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
  huidigeOpdracht,
  laatsteBeoordeeldeOpdracht,
  isSerieuzeLeerModusActief,
  leermodusType,
  onPauseOpdracht,
  isBeoordelingDirect,
  isKaleModusActief,
  welcomeMessage,
  actieDashboardRef,
  handleBeoordeling,
  isTimerActief,
  huidigeSpeler,
  onPartnerKies,
  onGebruikExtraSpin,
  isJokerSpinActief,
  puntenVoorVerdubbeling,
  onKopOfMunt,
  huidigeBonusOpdracht,
  opgespaardeBonusPunten,
  onBonusRondeVoltooid,
  onKopOfMuntVoltooid,
}) => {
  return (
    <main className="right-panel">
      <NotificatieBanner
        zichtbaar={notificatie.zichtbaar}
        type={notificatie.type}
        bericht={notificatie.bericht}
      />
      {DevPanelSlot}
      {warning && <div className="app-warning">{warning}</div>}

      <Fruitautomaat
        titel={titel}
        key={opdrachten.length}
        opdrachten={opdrachten}
        spelers={spelers}
        isSpinning={isSpinning}
        resultaat={resultaat}
        fruitDisplayItems={fruitDisplayItems}
        onSpin={onSpin}
        isSpinButtonDisabled={isSpinButtonDisabled}
        spinAnalyse={spinAnalyse}
        isGeluidActief={isGeluidActief}
        gamePhase={gamePhase}
        huidigeOpdracht={huidigeOpdracht}
        laatsteBeoordeeldeOpdracht={laatsteBeoordeeldeOpdracht}
        isSerieuzeLeerModusActief={isSerieuzeLeerModusActief}
        leermodusType={leermodusType}
        onPauseOpdracht={onPauseOpdracht}
        isBeoordelingDirect={isBeoordelingDirect}
        isKaleModusActief={isKaleModusActief}
        welcomeMessage={welcomeMessage}
      >
        {gamePhase !== 'idle' && gamePhase !== 'spinning' && huidigeOpdracht && (
          <ActieDashboard
            ref={actieDashboardRef}
            huidigeOpdracht={huidigeOpdracht}
            spinAnalyse={spinAnalyse}
            handleBeoordeling={handleBeoordeling}
            isTimerActief={gamePhase === 'assessment' && isTimerActief}
            gamePhase={gamePhase}
            spelers={spelers}
            huidigeSpeler={huidigeSpeler}
            onPartnerKies={onPartnerKies}
            isGeluidActief={isGeluidActief}
            onGebruikExtraSpin={onGebruikExtraSpin}
            isJokerSpinActief={isJokerSpinActief}
            puntenVoorVerdubbeling={puntenVoorVerdubbeling}
            onKopOfMunt={onKopOfMunt}
            huidigeBonusOpdracht={huidigeBonusOpdracht}
            opgespaardeBonusPunten={opgespaardeBonusPunten}
            onBonusRondeVoltooid={onBonusRondeVoltooid}
            onKopOfMuntVoltooid={onKopOfMuntVoltooid}
          />
        )}
      </Fruitautomaat>
    </main>
  );
};


