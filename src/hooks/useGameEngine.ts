import { useCallback, useState } from 'react';
import type { Opdracht, Speler, SpinResultaatAnalyse, GamePhase } from '../data/types';
import { getLeerDataManager } from '../data/leerDataManager';
import { getLeerFeedback } from '../data/leerFeedback';
import { useSettings } from '../context/SettingsContext';

// Helper functie voor het shufflen van arrays
const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useGameEngine = () => {
  const { maxNewLeitnerQuestionsPerDay } = useSettings();

  // Game state
  const [spelers, setSpelers] = useState<Speler[]>([]);
  const [huidigeSpeler, setHuidigeSpeler] = useState<Speler | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
  const [huidigeOpdracht, setHuidigeOpdracht] = useState<{ opdracht: Opdracht; type: string; box?: number } | null>(null);
  const [spinResultaat, setSpinResultaat] = useState({
    jackpot: [0, 0, 0], // Start met 3 kersen (index 0)
    categorie: -1,
    opdracht: -1,
    naam: -1,
  });
  const [huidigeSpinAnalyse, setHuidigeSpinAnalyse] = useState<SpinResultaatAnalyse | null>(null);
  const [aantalBeurtenGespeeld, setAantalBeurtenGespeeld] = useState(0);
  const [isSpelGestart, setIsSpelGestart] = useState(false);
  const [verdiendeSpinsDezeBeurt, setVerdiendeSpinsDezeBeurt] = useState(0);
  
  // Spellogica functies
  const analyseerSpin = useCallback((symbolen: string[], spelersgroep: Speler[], gameMode: 'single' | 'multi', isSerieuzeLeerModusActief: boolean, isBonusOpdrachtenActief: boolean): SpinResultaatAnalyse => {
    const counts: { [key: string]: number } = {};
    let jokerCount = 0;
    symbolen.forEach(s => {
      if (s === '🃏') {
        jokerCount++;
      } else {
        counts[s] = (counts[s] || 0) + 1;
      }
    });
    const verdiendeSpins = jokerCount;

    // Serieuze leer-modus voor single player
    if (gameMode === 'single' && isSerieuzeLeerModusActief) {
      if (jokerCount === 3) {
        const feedback = getLeerFeedback('drie_jokers');
        return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen: ['🃏'], verdiendeSpins: 0 };
      }

      for (const sym in counts) {
        if (counts[sym] + jokerCount === 3) {
          const winnendeSymbolen = jokerCount > 0 ? [sym, '🃏'] : [sym];
          let combinatie = '';
          let feedback = '';
          
          switch (sym) {
            case '🍒': 
              combinatie = 'drie_kersen';
              feedback = getLeerFeedback(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '🍋': 
              combinatie = 'drie_citroenen';
              feedback = getLeerFeedback(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '🍉': 
              combinatie = 'drie_meloenen';
              feedback = getLeerFeedback(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '7️⃣': 
              combinatie = 'drie_lucky_7s';
              feedback = getLeerFeedback(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '❓': 
              combinatie = 'gemengd';
              feedback = getLeerFeedback(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '🔔': 
              combinatie = 'drie_bellen';
              feedback = getLeerFeedback(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
          }
        }
      }
      
      // Controleer voor 2 kersen
      if ((counts['🍒'] || 0) + jokerCount === 2) {
        const winnendeSymbolen = jokerCount > 0 ? ['🍒', '🃏'] : ['🍒'];
        const feedback = getLeerFeedback('twee_kersen');
        return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
      }

      return { bonusPunten: 0, actie: 'geen', beschrijving: 'Blijf leren en groeien!', verdiendeSpins: 0 };
    }

    // Normale modus (multiplayer of single player zonder serieuze leer-modus)
    if (jokerCount === 3) {
      if (spelersgroep.length >= 3) {
        return { bonusPunten: 5, actie: 'partner_kiezen', beschrijving: '3 Jokers! Kies een partner en krijg beiden 5 bonuspunten.', winnendeSymbolen: ['🃏'], verdiendeSpins };
      } else {
        return { bonusPunten: 5, actie: 'geen', beschrijving: '3 Jokers! Je krijgt 5 bonuspunten.', winnendeSymbolen: ['🃏'], verdiendeSpins };
      }
    }

    for (const sym in counts) {
      if (counts[sym] + jokerCount === 3) {
        const winnendeSymbolen = jokerCount > 0 ? [sym, '🃏'] : [sym];
        switch (sym) {
          case '🍒': return { bonusPunten: 3, actie: 'geen', beschrijving: '3 Kersen! (+3 bonuspunten)', winnendeSymbolen, verdiendeSpins };
          case '🍋': return { bonusPunten: 3, actie: 'geen', beschrijving: '3 Citroenen! (+3 bonuspunten)', winnendeSymbolen, verdiendeSpins };
          case '🍉': return { bonusPunten: 5, actie: 'geen', beschrijving: '3 Meloenen! (+5 bonuspunten)', winnendeSymbolen, verdiendeSpins };
          case '7️⃣': return { bonusPunten: 7, actie: 'geen', beschrijving: '3x Lucky 7! (+7 bonuspunten)', winnendeSymbolen, verdiendeSpins };
          case '❓': 
            if (isBonusOpdrachtenActief && spelersgroep.length >= 3) {
              return { bonusPunten: 0, actie: 'bonus_opdracht', beschrijving: '3 Vraagtekens! Tijd voor een bonusopdracht.', winnendeSymbolen, verdiendeSpins: 0 };
            } else {
              const willekeurigePunten = Math.floor(Math.random() * 10) + 1;
              return { bonusPunten: willekeurigePunten, actie: 'geen', beschrijving: `3 Vraagtekens! Je krijgt ${willekeurigePunten} willekeurige bonuspunten.`, winnendeSymbolen, verdiendeSpins: 0 };
            }
          case '🔔': return { bonusPunten: 0, actie: 'kop_of_munt', beschrijving: '3 Bellen! Kans om je opdrachtpunten te verdubbelen.', winnendeSymbolen, verdiendeSpins: 0 };
        }
      }
    }
    
    // Controleer voor 2 kersen, alleen als er geen 3-op-een-rij is
    if ((counts['🍒'] || 0) + jokerCount === 2) {
      const winnendeSymbolen = jokerCount > 0 ? ['🍒', '🃏'] : ['🍒'];
      return { bonusPunten: 1, actie: 'geen', beschrijving: '2 Kersen! (+1 bonuspunt)', winnendeSymbolen, verdiendeSpins };
    }

    return { bonusPunten: 0, actie: 'geen', beschrijving: 'Geen combinatie.', verdiendeSpins };
  }, []);

  const selectLeitnerOpdracht = useCallback((
    opdrachten: Opdracht[],
    geselecteerdeCategorieen: string[],
    isSerieuzeLeerModusActief: boolean,
    gameMode: 'single' | 'multi'
  ): { opdracht: Opdracht | null; type: 'herhaling' | 'nieuw' | 'geen', box?: number, limietBereikt?: boolean } => {
    if (isSerieuzeLeerModusActief && gameMode === 'single') {
      const leerDataManager = getLeerDataManager();
      
      const herhalingenVoorVandaag = leerDataManager.getLeitnerOpdrachtenVoorVandaag();
      const gefilterdeHerhalingen = herhalingenVoorVandaag.filter(item => 
        _geselecteerdeCategorieen.includes(item.opdrachtId.split('_')[0])
      );
      
      const result = leerDataManager.selectLeitnerOpdracht(opdrachten, gefilterdeHerhalingen, _geselecteerdeCategorieen);
      
      // Check of we een nieuwe opdracht willen en of de limiet is bereikt
      if (result.type === 'nieuw') {
        const newQuestionsToday = leerDataManager.getNewQuestionsTodayCount();
        if (newQuestionsToday >= maxNewLeitnerQuestionsPerDay) {
          // Limiet bereikt, geef geen nieuwe opdracht.
          return { ...result, opdracht: null, type: 'geen', limietBereikt: true };
        }
      }
      
      return result;
    } else {
      // Standaard selectie voor multiplayer of niet-serieuze modus
      const beschikbareOpdrachten = opdrachten.filter(
        op => _geselecteerdeCategorieen.includes(op.Categorie)
      );
      const teKiezenLijst = beschikbareOpdrachten.length > 0 ? beschikbareOpdrachten : opdrachten;
      
      const gekozenOpdracht = teKiezenLijst[Math.floor(Math.random() * teKiezenLijst.length)];
      return { opdracht: gekozenOpdracht, type: 'nieuw' };
    }
  }, [maxNewLeitnerQuestionsPerDay]);

  const checkSpelEinde = useCallback((
    effectieveMaxRondes: number,
    gameMode: 'single' | 'multi',
    _geselecteerdeCategorieen: string[]
  ): boolean => {
    if (gameMode === 'single' && huidigeSpeler) {
      // Single player einde logica
      return false; // Voor nu return false, de echte logica blijft in App.tsx
    } else {
      // Multiplayer einde
      const isEinde = effectieveMaxRondes > 0 && aantalBeurtenGespeeld >= effectieveMaxRondes * spelers.length;
      return isEinde;
    }
  }, [aantalBeurtenGespeeld, spelers.length, huidigeSpeler]);

  return {
    // State
    spelers,
    setSpelers,
    huidigeSpeler,
    setHuidigeSpeler,
    gamePhase,
    setGamePhase,
    huidigeOpdracht,
    setHuidigeOpdracht,
    spinResultaat,
    setSpinResultaat,
    huidigeSpinAnalyse,
    setHuidigeSpinAnalyse,
    aantalBeurtenGespeeld,
    setAantalBeurtenGespeeld,
    isSpelGestart,
    setIsSpelGestart,
    verdiendeSpinsDezeBeurt,
    setVerdiendeSpinsDezeBeurt,
    
    // Functions
    analyseerSpin,
    selectLeitnerOpdracht,
    checkSpelEinde,
    shuffle
  };
}; 