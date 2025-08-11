import { useCallback, useState } from 'react';
import type { Opdracht, Speler, SpinResultaatAnalyse, GamePhase } from '../data/types';
import { getLeerDataManager } from '../data/leerDataManager';
import { getTipForCombination } from '../data/tipsEngine';
import { useSettings } from '../context/SettingsContext';

// Helper functie voor het shufflen van arrays
export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useGameEngine = () => {
  const { maxNewLeitnerQuestionsPerDay, isMaxNewQuestionsLimitActief, negeerBox0Wachttijd, devForceOnlyNew, devMaxOnlyNewPerDay } = useSettings();

  // Game state
  const [spelers, setSpelers] = useState<Speler[]>([]);
  const [huidigeSpeler, setHuidigeSpeler] = useState<Speler | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
  const [huidigeOpdracht, setHuidigeOpdracht] = useState<{ opdracht: Opdracht; type: 'herhaling' | 'nieuw' | 'geen'; box?: number } | null>(null);
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
        const feedback = getTipForCombination('drie_jokers');
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
              feedback = getTipForCombination(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '🍋': 
              combinatie = 'drie_citroenen';
              feedback = getTipForCombination(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '🍉': 
              combinatie = 'drie_meloenen';
              feedback = getTipForCombination(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '7️⃣': 
              combinatie = 'drie_lucky_7s';
              feedback = getTipForCombination(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '❓': 
              combinatie = 'gemengd';
              feedback = getTipForCombination(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
            case '🔔': 
              combinatie = 'drie_bellen';
              feedback = getTipForCombination(combinatie);
              return { bonusPunten: 0, actie: 'geen', beschrijving: feedback, winnendeSymbolen, verdiendeSpins: 0 };
          }
        }
      }
      
      // Controleer voor 2 kersen
      if ((counts['🍒'] || 0) + jokerCount === 2) {
        const winnendeSymbolen = jokerCount > 0 ? ['🍒', '🃏'] : ['🍒'];
        const feedback = getTipForCombination('twee_kersen');
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
    gameMode: 'single' | 'multi',
    limietGenegeerd: boolean // Nieuwe parameter
  ): { opdracht: Opdracht | null; type: 'herhaling' | 'nieuw' | 'geen', box?: number, limietBereikt?: boolean } => {
    if (isSerieuzeLeerModusActief && gameMode === 'single') {
      const leerDataManager = getLeerDataManager();

      // Bepaal herhalingen en nieuwe opdrachten specifiek voor de GESELECTEERDE categorieën
      const alleHerhalingenVandaag = leerDataManager.getLeitnerOpdrachtenVoorVandaag();
      const herhalingenVoorVandaagGeselecteerd = alleHerhalingenVandaag.filter(item => {
        const hoofdcategorie = item.opdrachtId.split('_')[0];
        return geselecteerdeCategorieen.some(cat => cat.startsWith(hoofdcategorie));
      });

      const aantalNieuweGeselecteerd = leerDataManager.getNieuweOpdrachten(opdrachten, geselecteerdeCategorieen).length;

      // Dev-only: Forceer eerst nieuwe totdat devMaxOnlyNewPerDay is bereikt
      if (devForceOnlyNew && aantalNieuweGeselecteerd > 0) {
        const newToday = leerDataManager.getNewQuestionsTodayCount();
        if (newToday < devMaxOnlyNewPerDay) {
          // Negeer herhalingen, zodat selectLeitnerOpdracht de 'nieuw'-tak pakt
          const resultOnlyNew = leerDataManager.selectLeitnerOpdracht(opdrachten, [], geselecteerdeCategorieen);
          if (resultOnlyNew.type === 'nieuw') {
            return { ...resultOnlyNew, limietBereikt: false };
          }
          // Als om wat voor reden dan ook geen nieuw gekozen kon worden, val terug op normale flow
        }
      }

      // Override: alleen negeren als er voor de GESELECTEERDE categorieën geen reguliere herhalingen zijn
      // en er ook geen nieuwe opdrachten beschikbaar zijn in die selectie
      const moetNegeren = negeerBox0Wachttijd && herhalingenVoorVandaagGeselecteerd.length === 0 && aantalNieuweGeselecteerd === 0;

      const effectieveHerhalingenOngefilterd = moetNegeren
        ? leerDataManager.getLeitnerOpdrachtenVoorVandaag(true)
        : alleHerhalingenVandaag;

      // Focus-now: indien actief, serveer eerst gepinde opdrachten
      if (leerDataManager.isFocusNowActive()) {
        const nextPinned = leerDataManager.shiftNextPinned();
        if (nextPinned) {
          const gekozenOpdracht = opdrachten.find(op => {
            const hoofdcategorie = op.Hoofdcategorie || 'Overig';
            const generatedId = `${hoofdcategorie}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
            return generatedId === nextPinned;
          });
          if (gekozenOpdracht) {
            return { opdracht: gekozenOpdracht, type: 'herhaling', box: leerDataManager.getOpdrachtBoxId(nextPinned) ?? undefined, limietBereikt: false };
          }
        } else {
          // Lijst leeg: focus-modus uitzetten
          leerDataManager.stopFocusNow();
        }
      }

      const gefilterdeHerhalingen = effectieveHerhalingenOngefilterd.filter(item => {
        const hoofdcategorie = item.opdrachtId.split('_')[0];
        return geselecteerdeCategorieen.some(cat => cat.startsWith(hoofdcategorie));
      });
      
      const result = leerDataManager.selectLeitnerOpdracht(opdrachten, gefilterdeHerhalingen, geselecteerdeCategorieen);
      
      // Check of we een nieuwe opdracht willen en of de limiet is bereikt
      if (result.type === 'nieuw') {
        const newQuestionsToday = leerDataManager.getNewQuestionsTodayCount();
        if (isMaxNewQuestionsLimitActief && newQuestionsToday >= maxNewLeitnerQuestionsPerDay) {
          if (limietGenegeerd) {
            // Limiet is genegeerd, ga door met het selecteren van de opdracht.
            return { ...result, limietBereikt: false }; 
          } else {
            // Limiet is bereikt en NIET genegeerd. Blokkeer en toon modal.
            return { ...result, opdracht: null, type: 'geen', limietBereikt: true };
          }
        }
      }
      
      return { ...result, limietBereikt: false };
    } else {
      // Standaard selectie voor multiplayer of niet-serieuze modus
      const beschikbareOpdrachten = opdrachten.filter(
        op => geselecteerdeCategorieen.includes(op.Categorie)
      );
      const teKiezenLijst = beschikbareOpdrachten.length > 0 ? beschikbareOpdrachten : opdrachten;
      
      const gekozenOpdracht = teKiezenLijst[Math.floor(Math.random() * teKiezenLijst.length)];
      return { opdracht: gekozenOpdracht, type: 'nieuw' };
    }
  }, [maxNewLeitnerQuestionsPerDay, isMaxNewQuestionsLimitActief, negeerBox0Wachttijd, devForceOnlyNew, devMaxOnlyNewPerDay]);

  const checkSpelEinde = useCallback((
    effectieveMaxRondes: number,
    gameMode: 'single' | 'multi'
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