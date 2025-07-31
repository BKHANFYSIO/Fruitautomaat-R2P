import { useState, useEffect, useMemo } from 'react';
import type { Opdracht, Speler, SpinResultaatAnalyse, GamePhase } from '../data/types';
import Rol from './Rol';
import { Hendel } from './Hendel'; // Importeer Hendel
import { useAudio } from '../hooks/useAudio';
import './Fruitautomaat.css';

type RolItem = { symbool?: string; img?: string };

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
  welcomeMessage
}: FruitautomaatProps) => {
  const [activeSpin, setActiveSpin] = useState({
    jackpot1: false, jackpot2: false, jackpot3: false,
    categorie: false, opdracht: false, naam: false,
  });

  const [playRolStop] = useAudio('/sounds/rol-stop.mp3', isGeluidActief);

  useEffect(() => {
    if (isSpinning) {
      setActiveSpin({
        jackpot1: true, jackpot2: true, jackpot3: true,
        categorie: true, opdracht: true, naam: true,
      });

      setTimeout(() => { setActiveSpin(s => ({ ...s, jackpot1: false })); playRolStop(); }, 1000);
      setTimeout(() => { setActiveSpin(s => ({ ...s, jackpot2: false })); playRolStop(); }, 1500);
      setTimeout(() => { setActiveSpin(s => ({ ...s, jackpot3: false })); playRolStop(); }, 2000);
      setTimeout(() => { setActiveSpin(s => ({ ...s, categorie: false })); playRolStop(); }, 2500);
      setTimeout(() => { setActiveSpin(s => ({ ...s, opdracht: false })); playRolStop(); }, 3000);
      setTimeout(() => { setActiveSpin(s => ({ ...s, naam: false })); playRolStop(); }, 3500);
    }
  }, [isSpinning, playRolStop]);

  const categorieen = useMemo(() => [...new Set(opdrachten.map(o => o.Categorie))], [opdrachten]);
  const opdrachtTeksten = useMemo(() => opdrachten.map(o => o.Opdracht), [opdrachten]);
  const spelerNamen = useMemo(() => {
    return spelers.map(s => s.naam);
  }, [spelers]);
  
  const isBonusRondeActief = gamePhase === 'bonus_round';

  return (
    <div className="fruitautomaat-machine">
      <header className="fruitautomaat-header">
        <h1>{titel}</h1>
      </header>
      {welcomeMessage}
      <div className="fruitautomaat-body">
        <div className="fruitautomaat-rollen-wrapper">
          <div className="jackpot-rij">
            <Rol items={fruitDisplayItems} stopAt={resultaat.jackpot[0]} isSpinning={activeSpin.jackpot1} className="jackpot-rol-item" isWinnend={!isSpinning && spinAnalyse?.winnendeSymbolen?.includes(fruitDisplayItems[resultaat.jackpot[0]]?.symbool || '')} />
            <Rol items={fruitDisplayItems} stopAt={resultaat.jackpot[1]} isSpinning={activeSpin.jackpot2} className="jackpot-rol-item" isWinnend={!isSpinning && spinAnalyse?.winnendeSymbolen?.includes(fruitDisplayItems[resultaat.jackpot[1]]?.symbool || '')} />
            <Rol items={fruitDisplayItems} stopAt={resultaat.jackpot[2]} isSpinning={activeSpin.jackpot3} className="jackpot-rol-item" isWinnend={!isSpinning && spinAnalyse?.winnendeSymbolen?.includes(fruitDisplayItems[resultaat.jackpot[2]]?.symbool || '')} />
          </div>

          <div className="opdracht-rij">
            <div className="opdracht-rol categorie-rol">
              <Rol items={resultaat.categorie === -1 ? ['Categorie'] : categorieen} stopAt={resultaat.categorie === -1 ? 0 : resultaat.categorie} isSpinning={activeSpin.categorie} height={120} />
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
        

      </div>
    </div>
  );
}; 