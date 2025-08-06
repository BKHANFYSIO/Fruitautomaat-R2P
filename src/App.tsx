import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

// Data and types
import { useOpdrachten } from './data/useOpdrachten';
import type { Opdracht, Speler, Achievement, GamePhase } from './data/types';
import { getHighScore, saveHighScore, getPersonalBest, savePersonalBest, getHighScoreLibrary, type HighScore } from './data/highScoreManager';
import { getLeerDataManager } from './data/leerDataManager';
import { BONUS_OPDRACHTEN, SYMBOLEN } from './data/constants';

// Components
import { SpelerInput } from './components/SpelerInput';
import { Scorebord } from './components/Scorebord';
import { Fruitautomaat } from './components/Fruitautomaat';

import { BestandsUploader } from './components/BestandsUploader';
import { CategorieSelectieModal } from './components/CategorieSelectieModal';
import { Instellingen } from './components/Instellingen';
import { Uitleg } from './components/Uitleg';
import { ActieDashboard } from './components/ActieDashboard';
import { OrientatieMelding } from './components/OrientatieMelding';
import { Eindscherm } from './components/Eindscherm';
import { SessieSamenvatting } from './components/SessieSamenvatting';
import { AchievementNotificatie } from './components/AchievementNotificatie';
import { Leeranalyse } from './components/Leeranalyse';
import { LeitnerCategorieBeheer } from './components/LeitnerCategorieBeheer';
import { DevPanel } from './components/DevPanel';
import { LimietBereiktModal } from './components/LimietBereiktModal';
import { FilterDashboard } from './components/FilterDashboard';


// Hooks
import { useAudio } from './hooks/useAudio';
import { useWindowSize } from './hooks/useWindowSize';
import { useSwipe } from './hooks/useSwipe';
import { useGameEngine } from './hooks/useGameEngine';
import { useSettings } from './context/SettingsContext';

// Styles
import './App.css';


type Notificatie = {
  zichtbaar: boolean;
  bericht: string;
  type: 'succes' | 'fout';
}

// type OpdrachtBronFilter = 'alle' | 'systeem' | 'gebruiker'; // Niet gebruikt

interface Filters {
  bronnen: ('systeem' | 'gebruiker')[];
  opdrachtTypes: string[];
}

function App() {
  // Refs
  const mainContentRef = useRef<HTMLDivElement>(null);
  const actieDashboardRef = useRef<HTMLDivElement>(null);

  // Data hooks
  const { opdrachten, loading, warning, laadNieuweOpdrachten, parseExcelData, verwijderGebruikerOpdrachten } = useOpdrachten('/opdrachten.xlsx');
  
  // Effect om opdrachten door te geven aan de data manager
  useEffect(() => {
    if (opdrachten.length > 0) {
      const leerDataManager = getLeerDataManager();
      leerDataManager.setAlleOpdrachten(opdrachten);
    }
  }, [opdrachten]);

  // Filters state
  const [filters, setFilters] = useState<Filters>(() => {
    const savedFilters = localStorage.getItem('opdrachtFilters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        // Zorg ervoor dat de structuur klopt en minimaal één bron geselecteerd is
        if (parsed && Array.isArray(parsed.bronnen) && Array.isArray(parsed.opdrachtTypes)) {
          // Zorg ervoor dat er minimaal één bron geselecteerd is
          if (parsed.bronnen.length === 0) {
            parsed.bronnen = ['systeem'];
          }
          return parsed;
        }
      } catch (e) {
        console.error("Fout bij het parsen van filters uit localStorage", e);
      }
    }
    return { bronnen: ['systeem'], opdrachtTypes: [] };
  });

  // Effect to save filters to localStorage
  useEffect(() => {
    localStorage.setItem('opdrachtFilters', JSON.stringify(filters));
  }, [filters]);




  
  // Settings context
  const {
    gameMode,
    setGameMode,
    maxRondes,
    isGeluidActief,
    isTimerActief,
    setIsTimerActief,
    isEerlijkeSelectieActief,
    isJokerSpinActief,
    setIsJokerSpinActief,
    isBonusOpdrachtenActief,
    isSpinVergrendelingActief,
    setIsSpinVergrendelingActief,
    isAutomatischScorebordActief,
    bonusKans,
    forceerMobieleWeergave,
    isSerieuzeLeerModusActief,
    setIsSerieuzeLeerModusActief,
    isLeerFeedbackActief,
    setIsLeerFeedbackActief,
    leermodusType,
    setLeermodusType,
    maxNewLeitnerQuestionsPerDay,
    isBox0IntervalVerkort,
    setIsBox0IntervalVerkort,
    negeerBox0Wachttijd,
  } = useSettings();

  // Game engine hook
  const {
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
    analyseerSpin,
    selectLeitnerOpdracht,
    shuffle
  } = useGameEngine();

  // UI state
const [geselecteerdeCategorieen, setGeselecteerdeCategorieen] = useState<string[]>(() => {
  try {
    const saved = localStorage.getItem('geselecteerdeCategorieen_normaal');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to parse geselecteerdeCategorieen_normaal from localStorage", error);
    return [];
  }
});
const [geselecteerdeLeitnerCategorieen, setGeselecteerdeLeitnerCategorieen] = useState<string[]>(() => {
  try {
    const saved = localStorage.getItem('geselecteerdeCategorieen_leitner');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to parse geselecteerdeCategorieen_leitner from localStorage", error);
    return [];
  }
});
const [geselecteerdeMultiplayerCategorieen, setGeselecteerdeMultiplayerCategorieen] = useState<string[]>(() => {
  try {
    const saved = localStorage.getItem('geselecteerdeCategorieen_multiplayer');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to parse geselecteerdeCategorieen_multiplayer from localStorage", error);
    return [];
  }
});
const [geselecteerdeHighscoreCategorieen, setGeselecteerdeHighscoreCategorieen] = useState<string[]>(() => {
  try {
    const saved = localStorage.getItem('geselecteerdeCategorieen_highscore');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to parse geselecteerdeCategorieen_highscore from localStorage", error);
    return [];
  }
});
const [isInstellingenOpen, setIsInstellingenOpen] = useState(false);
  const [isUitlegOpen, setIsUitlegOpen] = useState(false);
  const [isScoreLadeOpen, setIsScoreLadeOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notificatie, setNotificatie] = useState<Notificatie>({ zichtbaar: false, bericht: '', type: 'succes' });
  const [isAntwoordVergrendeld, setIsAntwoordVergrendeld] = useState(false);
  const [isCategorieBeheerOpen, setIsCategorieBeheerOpen] = useState(false);
  const [isCategorieSelectieOpen, setIsCategorieSelectieOpen] = useState(false);

  const [categorieSelectieActiveTab, setCategorieSelectieActiveTab] = useState<'highscore' | 'multiplayer' | 'normaal' | 'leitner'>('normaal');
const [isLimietModalOpen, setIsLimietModalOpen] = useState(false);
const [limietWaarschuwingGenegeerd, setLimietWaarschuwingGenegeerd] = useState(false);

  // State om bij te houden of de multiplayer waarschuwing al is getoond
  const [multiplayerWaarschuwingGetoond, setMultiplayerWaarschuwingGetoond] = useState(false);

  // File upload state
  const [geselecteerdBestand, setGeselecteerdBestand] = useState<File | null>(null);

  // High score state
  const [currentHighScore, setCurrentHighScore] = useState<HighScore | null>(null);
  const [isNieuwRecord, setIsNieuwRecord] = useState(false);
  const [currentPersonalBest, setCurrentPersonalBest] = useState<HighScore | null>(null);
  const [isNieuwPersoonlijkRecord, setIsNieuwPersoonlijkRecord] = useState(false);

  // Dev mode state
  const [isDevMode, setIsDevMode] = useState(false);
  const [forceResult, setForceResult] = useState<(string | null)[]>([null, null, null]);
  const [isBeoordelingDirect] = useState(false);

  const { width } = useWindowSize();
  const isMobieleWeergave = forceerMobieleWeergave || width <= 1280;

  // Swipe functionaliteit voor mobiele weergave
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (isMobieleWeergave && isScoreLadeOpen) {
        setIsScoreLadeOpen(false);
      }
    },
    onSwipeRight: () => {
      if (isMobieleWeergave && !isScoreLadeOpen) {
        setIsScoreLadeOpen(true);
      }
    }
  }, {
    minSwipeDistance: 60, // Iets lager voor betere detectie
    maxSwipeTime: 800 // Meer tijd voor comfort
  });

  // Effect om de spelerslijst te resetten bij het wisselen naar single-player
  useEffect(() => {
    // Als je van modus wisselt, begin je altijd met een schone lei.
    if (spelers.length > 0) {
      setSpelers([]); // Verwijder alle spelers
    }
  }, [gameMode]);

  // Bepaal de effectieve max rondes gebaseerd op de game mode
  const effectieveMaxRondes = gameMode === 'single' ? 10 : maxRondes;
  
  // Logica om de speler input uit te schakelen
  const isSpelerInputDisabled = gameMode === 'single' && spelers.length >= 1;

  // Helper functie om te controleren of er voldoende spelers zijn
  const heeftVoldoendeSpelers = () => {
    if (isSerieuzeLeerModusActief && gameMode === 'single') {
      return true; // Geen spelers nodig in serieuze leermodus
    }
    if (gameMode === 'single') {
      return spelers.length >= 1;
    } else {
      return spelers.length >= 2;
    }
  };

  const huidigeRonde = spelers.length > 0 ? Math.ceil(aantalBeurtenGespeeld / spelers.length) || 1 : 1;

  const [playSpinStart] = useAudio('/sounds/spin-start.mp3', isGeluidActief);
  const [playJokerWin] = useAudio('/sounds/joker-win.mp3', isGeluidActief);
  const [playGameEnd] = useAudio('/sounds/game-end.mp3', isGeluidActief);
  const [playNewRecord] = useAudio('/sounds/new-record.mp3', isGeluidActief);
  const [playMultiplayerEnd] = useAudio('/sounds/multiplayer-end.mp3', isGeluidActief);
  const [playBonusStart] = useAudio('/sounds/bonus-start.mp3', isGeluidActief);
  const [playPartnerChosen] = useAudio('/sounds/partner-chosen.mp3', isGeluidActief);


  // State voor de 'eerlijke' selectie
  const [spelerWachtrij, setSpelerWachtrij] = useState<Speler[]>([]);
  const [recentGebruikteOpdrachten, setRecentGebruikteOpdrachten] = useState<Opdracht[]>([]);

  // State voor de fruitautomaat animatie
  const [isAanHetSpinnen, setIsAanHetSpinnen] = useState(false);
  const [gekozenPartner, setGekozenPartner] = useState<Speler | null>(null);
  const [puntenVoorVerdubbeling, setPuntenVoorVerdubbeling] = useState<number>(0);
  const [huidigeBonusOpdracht, setHuidigeBonusOpdracht] = useState<{ opdracht: string, punten: number[] } | null>(null);
  const [bonusOpdrachten, setBonusOpdrachten] = useState<typeof BONUS_OPDRACHTEN>(BONUS_OPDRACHTEN);
  const [opgespaardeBonusPunten, setOpgespaardeBonusPunten] = useState<number>(0);

  // Effect om serieuze leer-modus uit te schakelen bij wisselen naar multiplayer
  useEffect(() => {
    if (gameMode === 'multi' && isSerieuzeLeerModusActief) {
      setIsSerieuzeLeerModusActief(false);
      setIsLeerFeedbackActief(false);
      // Reset spel state bij overschakelen naar multiplayer
      setHuidigeSessieId(null);
      setIsSpelGestart(false);
    }
  }, [gameMode, isSerieuzeLeerModusActief]);

  // Effect om automatisch leerfeedback aan te zetten bij serieuze leer-modus
  useEffect(() => {
    if (isSerieuzeLeerModusActief && gameMode === 'single') {
      setIsLeerFeedbackActief(true);
    }
  }, [isSerieuzeLeerModusActief, gameMode]);

  // Effect om automatisch Leitner te activeren bij serieuze leer-modus
  useEffect(() => {
    if (isSerieuzeLeerModusActief && gameMode === 'single') {
      setLeermodusType('leitner');
    }
  }, [isSerieuzeLeerModusActief, gameMode]);

  // Effect om spelverloop instellingen aan te passen bij serieuze leer-modus
  useEffect(() => {
    if (isSerieuzeLeerModusActief && gameMode === 'single') {
      setIsTimerActief(false);
      // Alleen standaard AAN zetten als er geen opgeslagen voorkeur is
      const leerDataManager = getLeerDataManager();
      const preferences = leerDataManager.loadPreferences();
      // Veranderd naar een expliciete boolean check voor meer robuustheid
      if (typeof preferences.spinVergrendelingActief !== 'boolean') {
        setIsSpinVergrendelingActief(true); // Standaard AAN in leermodus
      }
      setIsJokerSpinActief(false);
    }
  }, [isSerieuzeLeerModusActief, gameMode]);

  // Effect om spelverloop instellingen aan te zetten bij normale single player modus
  useEffect(() => {
    if (!isSerieuzeLeerModusActief && gameMode === 'single') {
      setIsTimerActief(true);
      setIsSpinVergrendelingActief(true);
      setIsJokerSpinActief(true);
    }
  }, [isSerieuzeLeerModusActief, gameMode]);

  // Effect om Leitner instelling te synchroniseren
  useEffect(() => {
    const leerDataManager = getLeerDataManager();
    const leitnerData = leerDataManager.loadLeitnerData();
            setLeermodusType(leitnerData.isLeitnerActief ? 'leitner' : 'normaal');
  }, []);

  // Effect om preferences te laden
  useEffect(() => {
    const leerDataManager = getLeerDataManager();
    const preferences = leerDataManager.loadPreferences();
    
    // Laad spin vergrendeling voorkeur als deze bestaat
    if (preferences.spinVergrendelingActief !== undefined) {
      setIsSpinVergrendelingActief(preferences.spinVergrendelingActief);
    }
  }, []);

  // Effect om Leitner instelling op te slaan wanneer deze verandert
  useEffect(() => {
    const leerDataManager = getLeerDataManager();
    const leitnerData = leerDataManager.loadLeitnerData();
    if (leitnerData.isLeitnerActief !== (leermodusType === 'leitner')) {
      leitnerData.isLeitnerActief = leermodusType === 'leitner';
      leerDataManager.saveLeitnerData(leitnerData);
    }
  }, [leermodusType]);

  // Effect om spin vergrendeling voorkeur op te slaan wanneer deze verandert
  useEffect(() => {
    const leerDataManager = getLeerDataManager();
    const preferences = leerDataManager.loadPreferences();
    preferences.spinVergrendelingActief = isSpinVergrendelingActief;
    leerDataManager.savePreferences(preferences);
  }, [isSpinVergrendelingActief]);

  // Leerdata tracking
  const [huidigeSessieId, setHuidigeSessieId] = useState<string | null>(null);
  const [opdrachtStartTijd, setOpdrachtStartTijd] = useState<number | null>(null);
  
  // Sessie controle
  const [isSessieSamenvattingOpen, setIsSessieSamenvattingOpen] = useState(false);
  const [eindigdeSessieData, setEindigdeSessieData] = useState<any>(null);
  const [isLeeranalyseOpen, setIsLeeranalyseOpen] = useState(false);
  const [openLeeranalyseToAchievements, setOpenLeeranalyseToAchievements] = useState(false);
  const [nieuweAchievement, setNieuweAchievement] = useState<Achievement | null>(null);
  const [laatsteBeoordeeldeOpdracht, setLaatsteBeoordeeldeOpdracht] = useState<{ opdracht: any; type: string; box?: number } | null>(null);

  const [leitnerStats, setLeitnerStats] = useState({ totaalOpdrachten: 0, vandaagBeschikbaar: 0, reguliereHerhalingenBeschikbaar: 0 });
  const [aantalNieuweLeitnerOpdrachten, setAantalNieuweLeitnerOpdrachten] = useState(0);
  const [isBox0OverrideActief, setIsBox0OverrideActief] = useState(false);

  // --- DEV PANEL FUNCTIES ---
  const handleSimuleerVoltooiing = () => {
    const leerDataManager = getLeerDataManager();
    const nieuweAchievements = leerDataManager.updateHerhalingAchievements();
    
    nieuweAchievements.forEach((achievement, index) => {
      setTimeout(() => setNieuweAchievement(achievement as unknown as Achievement), index * 1000);
    });
    
    // Forceer een re-render om stats bij te werken
    const stats = leerDataManager.getLeitnerStatistiekenVoorCategorieen(geselecteerdeCategorieen);
    setLeitnerStats(stats);
    
    alert('Dagelijkse herhalingen voltooid en achievements gecontroleerd!');
  };

  const handleForcePromotie = (boxNummer: number) => {
    const leerDataManager = getLeerDataManager();
    // Deze functie is een placeholder. We moeten een manier vinden om een opdracht te promoten.
    // Voor nu roepen we de check direct aan voor de demo.
    const leitnerData = leerDataManager.loadLeitnerData();
    const nieuweAchievement = leerDataManager['checkPromotieAchievement'](boxNummer, leitnerData);
    
    if (nieuweAchievement) {
      setNieuweAchievement(nieuweAchievement as unknown as Achievement);
      alert(`Achievement voor het bereiken van Box ${boxNummer} geforceerd!`);
    } else {
      alert(`Kon geen achievement forceren voor Box ${boxNummer}. Mogelijk al behaald.`);
    }
  };

  const handleResetLeitner = () => {
    const leerDataManager = getLeerDataManager();
    localStorage.removeItem('fruitautomaat_leitner_' + leerDataManager.getSpelerId());
    // Forceer re-render van stats
    setLeitnerStats({ totaalOpdrachten: 0, vandaagBeschikbaar: 0, reguliereHerhalingenBeschikbaar: 0 });
    alert('Leitner data en pogingen zijn gereset. Herlaad de pagina om de wijzigingen volledig te zien.');
  };

  const handleForceHerhalingen = (boxId: number, aantal: number) => {
    // Stap 1: Forceer de data en krijg de relevante categorieën direct terug.
    const leerDataManager = getLeerDataManager();
    const { toegevoegd, categorieen } = leerDataManager.forceerHerhalingenInBox(opdrachten, aantal, boxId);

    if (toegevoegd === 0) {
      alert("Kon geen nieuwe opdrachten forceren. Mogelijk zijn alle opdrachten al in het leersysteem.");
      return;
    }

    // Stap 2: Update de state met de ZEKER correcte categorieën.
    setGeselecteerdeCategorieen(categorieen);
    setGameMode('single');
    setIsSerieuzeLeerModusActief(true);
          setLeermodusType('leitner');

    // Stap 3: Forceer een handmatige, synchrone update van de teller.
    // Dit omzeilt de asynchrone aard van useEffect voor een directe UI-update.
    const stats = leerDataManager.getLeitnerStatistiekenVoorCategorieen(categorieen);
    setLeitnerStats(stats);
    
    alert(`${toegevoegd} opdrachten geforceerd naar Box ${boxId}. De app is nu in Leermodus en de juiste categorieën zijn geselecteerd. Start een opdracht om een herhaling te krijgen.`);
  };

  const handleToggleBox0Interval = () => {
    const leerDataManager = getLeerDataManager();
    const leitnerData = leerDataManager.loadLeitnerData();
    const huidigeInterval = leitnerData.boxIntervallen[0];
    
    if (huidigeInterval === 10) {
      // Verander naar 15 seconden (0.25 minuten)
      leerDataManager.setTijdelijkInterval(0, 0.25);
      setIsBox0IntervalVerkort(true);
      alert("Box 0 interval gewijzigd van 10 minuten naar 15 seconden. Opdrachten in box 0 zijn nu klaar voor herhaling na 15 seconden.");
    } else {
      // Reset naar 10 minuten
      leerDataManager.setTijdelijkInterval(0, 10);
      setIsBox0IntervalVerkort(false);
      alert("Box 0 interval gereset naar 10 minuten.");
    }
  };
  // --- EINDE DEV PANEL FUNCTIES ---



  // Effect om de wachtrij te vullen/resetten als spelers veranderen
  useEffect(() => {
    if (spelers.length > 0) {
      setSpelerWachtrij(shuffle(spelers));
    } else {
      setSpelerWachtrij([]);
    }
  }, [spelers.length]); // <-- DE WIJZIGING: reageer alleen op het AANTAL spelers

  // Effect om de 'd' toets te detecteren voor dev mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'd') {
          setIsDevMode(prev => !prev);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // Effect om categorie selectie te openen via custom event
  useEffect(() => {
    const handleOpenCategorieSelectie = () => {
      setIsCategorieBeheerOpen(false);
      setIsCategorieSelectieOpen(true);
    };
    window.addEventListener('openCategorieSelectie', handleOpenCategorieSelectie);
    return () => window.removeEventListener('openCategorieSelectie', handleOpenCategorieSelectie);
  }, []);

  // Effect om leeranalyse te openen via custom event
  useEffect(() => {
    const handleOpenLeeranalyse = () => {
      setIsScoreLadeOpen(false);
      setIsLeeranalyseOpen(true);
    };

    window.addEventListener('openLeeranalyse', handleOpenLeeranalyse);
    return () => window.removeEventListener('openLeeranalyse', handleOpenLeeranalyse);
  }, []);

  // Effect om LeitnerCategorieBeheer te openen via custom event
  useEffect(() => {
      const handleOpenLeitnerCategorieBeheer = () => {
    setIsCategorieBeheerOpen(true);
    setIsCategorieSelectieOpen(false); // Sluit categorie selectie modal
    setIsScoreLadeOpen(false); // Sluit mobiele menu
  };

    window.addEventListener('openLeitnerCategorieBeheer', handleOpenLeitnerCategorieBeheer);
    return () => window.removeEventListener('openLeitnerCategorieBeheer', handleOpenLeitnerCategorieBeheer);
  }, []);

  // Effect om te scrollen naar de beoordelingssectie na een spin
  useEffect(() => {
    const scrollStates: GamePhase[] = ['assessment', 'partner_choice', 'double_or_nothing', 'bonus_round'];

    if (scrollStates.includes(gamePhase)) {
      const vertraging = isBeoordelingDirect ? 0 : 2000;
      
      const timer = setTimeout(() => {
        const element = actieDashboardRef.current;
        if (element) {
          const rect = element.getBoundingClientRect();
          // Scroll alleen als het element niet volledig zichtbaar is.
          const isVolledigZichtbaar = rect.top >= 0 && rect.bottom <= window.innerHeight;
          if (!isVolledigZichtbaar) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, vertraging);

      return () => clearTimeout(timer);
    }
  }, [gamePhase, isBeoordelingDirect]);


  // Effect om te waarschuwen bij het verlaten van de pagina
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Toon alleen de waarschuwing als er spelers zijn of als de bonusopdrachten zijn aangepast
      const heeftSpelers = spelers.length > 0;
      const heeftAangepasteBonusOpdrachten = JSON.stringify(bonusOpdrachten) !== JSON.stringify(BONUS_OPDRACHTEN);

      if (heeftSpelers || heeftAangepasteBonusOpdrachten) {
        e.preventDefault();
        e.returnValue = 'Ben je zeker dat je de pagina wil verlaten? Alle voortgang, zoals scores en aangepaste opdrachten, gaat verloren.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [spelers, bonusOpdrachten]);

  // Effect om de high score te laden wanneer categorieën veranderen in single player mode
  useEffect(() => {
    if (gameMode === 'single' && geselecteerdeCategorieen.length > 0) {
      const score = getHighScore(geselecteerdeCategorieen);
      setCurrentHighScore(score);
    } else {
      setCurrentHighScore(null);
    }
  }, [gameMode, geselecteerdeCategorieen]);



  // Effect voor leerdata sessie tracking - alleen cleanup bij uitschakelen
  useEffect(() => {
    return () => {
      // Cleanup: eindig sessie bij unmount of uitschakelen van serieuze leer-modus
      if (huidigeSessieId && isSerieuzeLeerModusActief && gameMode === 'single') {
        const leerDataManager = getLeerDataManager();
        leerDataManager.endSessie(huidigeSessieId);
      }
    };
  }, [huidigeSessieId, isSerieuzeLeerModusActief, gameMode]);

  // Uitgebreide reset functie voor alle spel state
  const resetSpelState = () => {
    setIsSpelGestart(false);
    setAantalBeurtenGespeeld(0);
    setSpelers([]); // Spelers wissen voor volledige reset
    setHuidigeSpeler(null);
    setSpelerWachtrij([]);
    setRecentGebruikteOpdrachten([]);
    setIsAanHetSpinnen(false);
    setSpinResultaat({
      jackpot: [0, 0, 0],
      categorie: -1,
      opdracht: -1,
      naam: -1,
    });
    setHuidigeSpinAnalyse(null);
    setGekozenPartner(null);
    setPuntenVoorVerdubbeling(0);
    setHuidigeBonusOpdracht(null);
    setOpgespaardeBonusPunten(0);
    setHuidigeSessieId(null); // Wis sessie ID bij reset
    setOpdrachtStartTijd(null);
    setGamePhase('idle');
    setIsAntwoordVergrendeld(false); // Reset antwoord vergrendeling bij spel reset
    setLimietWaarschuwingGenegeerd(false); // Reset limiet waarschuwing
    setMultiplayerWaarschuwingGetoond(false); // Reset multiplayer waarschuwing state
  };

  // Volledig gefilterde opdrachten op basis van bron en type
  const opdrachtenVoorSelectie = useMemo(() => {
    return opdrachten.filter(op => {
      // Stap 1: Filter op bron
      const bronMatch = filters.bronnen.length === 0 || filters.bronnen.includes(op.bron as 'systeem' | 'gebruiker');
      if (!bronMatch) return false;

      // Stap 2: Filter op opdrachtType
      // Als er geen types zijn geselecteerd, tonen we alles (van de gekozen bron)
      if (filters.opdrachtTypes.length === 0) return true;
      
      // Anders, controleer of het type van de opdracht in de geselecteerde lijst staat
      return filters.opdrachtTypes.includes(op.opdrachtType || 'Onbekend');
    });
  }, [opdrachten, filters]);

  const alleUniekeCategorieen = useMemo(() => {
    const uniekeNamen = new Set<string>();
    opdrachtenVoorSelectie.forEach(op => {
      const uniekeIdentifier = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
      uniekeNamen.add(uniekeIdentifier);
    });
    return [...uniekeNamen];
  }, [opdrachtenVoorSelectie]);

  // Filter geselecteerde categorieën op basis van beschikbare categorieën na filtering
  const gefilterdeGeselecteerdeLeitnerCategorieen = useMemo(() => {
    return geselecteerdeLeitnerCategorieen.filter(cat => alleUniekeCategorieen.includes(cat));
  }, [geselecteerdeLeitnerCategorieen, alleUniekeCategorieen]);

  const gefilterdeGeselecteerdeCategorieen = useMemo(() => {
    return geselecteerdeCategorieen.filter(cat => alleUniekeCategorieen.includes(cat));
  }, [geselecteerdeCategorieen, alleUniekeCategorieen]);

  const gefilterdeGeselecteerdeHighscoreCategorieen = useMemo(() => {
    return geselecteerdeHighscoreCategorieen.filter(cat => alleUniekeCategorieen.includes(cat));
  }, [geselecteerdeHighscoreCategorieen, alleUniekeCategorieen]);

  const gefilterdeGeselecteerdeMultiplayerCategorieen = useMemo(() => {
    return geselecteerdeMultiplayerCategorieen.filter(cat => alleUniekeCategorieen.includes(cat));
  }, [geselecteerdeMultiplayerCategorieen, alleUniekeCategorieen]);

  // Effect om Leitner statistieken te berekenen
  useEffect(() => {
    const updateStats = () => {
      if (leermodusType === 'leitner' && isSerieuzeLeerModusActief && opdrachten.length > 0) {
        const leerDataManager = getLeerDataManager();
        
        // Haal altijd het aantal nieuwe opdrachten op
        const nieuweOpdrachtenCount = leerDataManager.getNieuweLeitnerOpdrachtenCount(opdrachtenVoorSelectie, gefilterdeGeselecteerdeLeitnerCategorieen);
        setAantalNieuweLeitnerOpdrachten(nieuweOpdrachtenCount);

        // Bepaal of de Box 0 override actief moet zijn
        const reguliereStats = leerDataManager.getLeitnerStatistiekenVoorCategorieen(gefilterdeGeselecteerdeLeitnerCategorieen, { negeerBox0WachttijdAlsLeeg: false });
        const moetOverrideActiefZijn = negeerBox0Wachttijd && nieuweOpdrachtenCount === 0 && reguliereStats.reguliereHerhalingenBeschikbaar === 0;
        setIsBox0OverrideActief(moetOverrideActiefZijn);
        
        // Haal de uiteindelijke statistieken op, met de override-logica indien nodig
        const stats = leerDataManager.getLeitnerStatistiekenVoorCategorieen(gefilterdeGeselecteerdeLeitnerCategorieen, { negeerBox0WachttijdAlsLeeg: moetOverrideActiefZijn });
        setLeitnerStats(stats);
      } else {
        setLeitnerStats({ totaalOpdrachten: 0, vandaagBeschikbaar: 0, reguliereHerhalingenBeschikbaar: 0 });
        setAantalNieuweLeitnerOpdrachten(0);
        setIsBox0OverrideActief(false);
      }
    };

    updateStats();
    const intervalId = setInterval(updateStats, 5000); 
    return () => clearInterval(intervalId);
  }, [leermodusType, isSerieuzeLeerModusActief, gefilterdeGeselecteerdeLeitnerCategorieen, opdrachten, negeerBox0Wachttijd, filters]);

  const berekenAantalOpdrachten = (geselecteerde: string[]) => {
    return opdrachtenVoorSelectie.filter(op => {
      const uniekeIdentifier = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
      return geselecteerde.includes(uniekeIdentifier);
    }).length;
  };

  const aantalOpdrachtenHighscore = useMemo(() => berekenAantalOpdrachten(geselecteerdeHighscoreCategorieen), [geselecteerdeHighscoreCategorieen, opdrachtenVoorSelectie]);
  const aantalOpdrachtenMultiplayer = useMemo(() => berekenAantalOpdrachten(geselecteerdeMultiplayerCategorieen), [geselecteerdeMultiplayerCategorieen, opdrachtenVoorSelectie]);
  const aantalOpdrachtenLeitner = useMemo(() => berekenAantalOpdrachten(geselecteerdeLeitnerCategorieen), [geselecteerdeLeitnerCategorieen, opdrachtenVoorSelectie]);
  const aantalOpdrachtenNormaal = useMemo(() => berekenAantalOpdrachten(geselecteerdeCategorieen), [geselecteerdeCategorieen, opdrachtenVoorSelectie]);

  // De staat voor geselecteerde categorieën is nu de enige 'source of truth'.
  // We verwijderen niet langer categorieën wanneer filters veranderen.
  // De UI-componenten zijn verantwoordelijk voor het tonen van de juiste (gefilterde) weergave.

  // Effect om normale categorie-selectie op te slaan
  useEffect(() => {
      localStorage.setItem('geselecteerdeCategorieen_normaal', JSON.stringify(geselecteerdeCategorieen));
  }, [geselecteerdeCategorieen]);

  // Effect om Leitner categorie-selectie op te slaan
  useEffect(() => {
    localStorage.setItem('geselecteerdeCategorieen_leitner', JSON.stringify(geselecteerdeLeitnerCategorieen));
  }, [geselecteerdeLeitnerCategorieen]);

  // Effect om multiplayer categorie-selectie op te slaan
  useEffect(() => {
    localStorage.setItem('geselecteerdeCategorieen_multiplayer', JSON.stringify(geselecteerdeMultiplayerCategorieen));
  }, [geselecteerdeMultiplayerCategorieen]);

  // Effect om highscore categorie-selectie op te slaan
  useEffect(() => {
    localStorage.setItem('geselecteerdeCategorieen_highscore', JSON.stringify(geselecteerdeHighscoreCategorieen));
  }, [geselecteerdeHighscoreCategorieen]);



  const handleCategorieSelectie = (categorie: string) => {
    setGeselecteerdeCategorieen((prev) =>
      prev.includes(categorie)
        ? prev.filter((c) => c !== categorie)
        : [...prev, categorie]
    );
  };

  const handleBulkCategorieSelectie = (bulkCategorieen: string[], type: 'select' | 'deselect') => {
    setGeselecteerdeCategorieen(prev => {
      const categorieenSet = new Set(prev);
      if (type === 'select') {
        bulkCategorieen.forEach(cat => categorieenSet.add(cat));
      } else {
        bulkCategorieen.forEach(cat => categorieenSet.delete(cat));
      }
      return Array.from(categorieenSet);
    });
  };

  // Filter opdrachten op basis van de juiste selectie
  const gefilterdeOpdrachten = useMemo(() => {
    let actieveSelectie: string[];

    switch (gameMode) {
      case 'multi':
        actieveSelectie = geselecteerdeMultiplayerCategorieen;
        break;
      case 'single':
        if (isSerieuzeLeerModusActief) {
          if (leermodusType === 'leitner') {
            actieveSelectie = geselecteerdeLeitnerCategorieen;
    } else {
            // Normale leermodus
            actieveSelectie = geselecteerdeCategorieen;
          }
      } else {
          // Highscore modus
          actieveSelectie = geselecteerdeHighscoreCategorieen;
        }
        break;
      default:
        actieveSelectie = geselecteerdeCategorieen;
    }
    
    // Als de selectie leeg is, zijn er geen opdrachten
    if (actieveSelectie.length === 0) {
      return [];
    }

    return opdrachtenVoorSelectie.filter((opdracht) => {
      const uniekeIdentifier = `${opdracht.Hoofdcategorie || 'Overig'} - ${opdracht.Categorie}`;
      return actieveSelectie.includes(uniekeIdentifier);
    });
  }, [
    opdrachtenVoorSelectie,
    gameMode,
    isSerieuzeLeerModusActief,
    leermodusType,
    geselecteerdeCategorieen, 
    geselecteerdeLeitnerCategorieen, 
    geselecteerdeMultiplayerCategorieen, 
    geselecteerdeHighscoreCategorieen
  ]);

  const actieveCategorieSelectie = useMemo(() => {
    switch (gameMode) {
      case 'multi':
        return geselecteerdeMultiplayerCategorieen;
      case 'single':
        if (isSerieuzeLeerModusActief) {
          return leermodusType === 'leitner' ? geselecteerdeLeitnerCategorieen : geselecteerdeCategorieen;
        } else {
          return geselecteerdeHighscoreCategorieen;
        }
      default:
        return geselecteerdeCategorieen;
    }
  }, [gameMode, isSerieuzeLeerModusActief, leermodusType, geselecteerdeCategorieen, geselecteerdeLeitnerCategorieen, geselecteerdeMultiplayerCategorieen, geselecteerdeHighscoreCategorieen]);

  // Effect om de beurt te resetten als de huidige opdracht ongeldig wordt door categoriewijziging
  useEffect(() => {
    if (huidigeOpdracht && !gefilterdeOpdrachten.some(op => op.Opdracht === huidigeOpdracht.opdracht.Opdracht)) {
      // De huidige opdracht is niet langer in de lijst van geldige opdrachten.
      // Reset de beurt om een 'stuck' state te voorkomen.
      setHuidigeOpdracht(null);
      setHuidigeSpinAnalyse(null);
      setIsAntwoordVergrendeld(false);
      setGamePhase('idle');
    }
  }, [gefilterdeOpdrachten, huidigeOpdracht]);

  const handleSpelerToevoegen = (naam: string) => {
    if (spelers.find((speler) => speler.naam.toLowerCase() === naam.toLowerCase())) {
      alert('Deze speler bestaat al.');
      return;
    }
    const nieuweSpeler: Speler = { naam, score: 0, extraSpins: 0, beurten: 0 };
    setSpelers([...spelers, nieuweSpeler]);
  };

  // Sessie controle functies
  const handleEindigSessie = () => {
    if (huidigeSessieId) {
      const leerDataManager = getLeerDataManager();
      leerDataManager.endSessie(huidigeSessieId);
      
      // Haal sessie data op voor samenvatting
      const leerData = leerDataManager.loadLeerData();
      const sessieData = leerData?.sessies[huidigeSessieId];
      
      if (sessieData) {
        setEindigdeSessieData(sessieData);
        setIsSessieSamenvattingOpen(true);
      }
      
      // Reset spel state zodat gebruiker kan overschakelen naar multiplayer
      setHuidigeSessieId(null);
      setIsSpelGestart(false);
      setIsAntwoordVergrendeld(false); // Reset antwoord vergrendeling bij sessie eindigen
    }
  };

  const handleOpenLeeranalyse = (openToAchievements = false) => {
    setIsScoreLadeOpen(false);
    setIsLeeranalyseOpen(true);
    setOpenLeeranalyseToAchievements(openToAchievements);
  };

  // Maak de display items voor de fruit rollen
  const fruitDisplayItems = SYMBOLEN.map(s => ({ 
    symbool: s.symbool, 
    img: s.img, 
    className: s.className 
  }));

  const handleSpin = () => {
    // Vang het geval af waar geen opdrachten beschikbaar zijn
    if (gefilterdeOpdrachten.length === 0) {
      const melding = isSerieuzeLeerModusActief && leermodusType === 'leitner' 
        ? 'Selecteer eerst de categorieën die je wilt leren. Dit kan via de knop "Categorieën aanpassen" in het menu of via "Instellingen".'
        : 'Selecteer eerst categorieën. Dit kan via de knop "Categorieën aanpassen" in het menu of via "Instellingen".';
        
      setNotificatie({ 
        zichtbaar: true, 
        bericht: `Geen opdrachten beschikbaar. ${melding}`,
        type: 'fout' 
      });
      setTimeout(() => setNotificatie(prev => ({ ...prev, zichtbaar: false })), 5000);
      return;
    }

    // Specifieke checks voor spelmodi
    if (gameMode === 'single' && !isSerieuzeLeerModusActief && gefilterdeOpdrachten.length < 10) {
      setNotificatie({ 
        zichtbaar: true, 
        bericht: `Highscore modus vereist minimaal 10 unieke opdrachten. Je hebt er nu ${gefilterdeOpdrachten.length} geselecteerd. Selecteer meer categorieën.`,
        type: 'fout' 
      });
      setTimeout(() => setNotificatie(prev => ({ ...prev, zichtbaar: false })), 6000);
      return;
    }

    if (gameMode === 'multi' && gefilterdeOpdrachten.length < 20 && !multiplayerWaarschuwingGetoond) {
      if (!window.confirm(`Let op: je hebt minder dan 20 opdrachten (${gefilterdeOpdrachten.length}) geselecteerd. Voor de beste spelervaring raden we meer aan. Wil je toch doorgaan?`)) {
        return; // Stop als de gebruiker annuleert
      }
      setMultiplayerWaarschuwingGetoond(true); // Markeer dat de waarschuwing is getoond
    }

    if (!isSpelGestart) {
      setIsSpelGestart(true);
      
      // Toon sessie start melding bij eerste spin in serieuze leer-modus
      if (isSerieuzeLeerModusActief && gameMode === 'single') {
        setNotificatie({ 
          zichtbaar: true, 
          bericht: '📚 Sessie gestart! Vergeet niet je sessie te eindigen voor een samenvatting.', 
          type: 'succes' 
        });
        setTimeout(() => setNotificatie(prev => ({ ...prev, zichtbaar: false })), 5000);
      }
    }
    
    // Start nieuwe sessie als er geen actieve sessie is en we in serieuze leer-modus zijn
    if (isSerieuzeLeerModusActief && gameMode === 'single' && !huidigeSessieId) {
      const leerDataManager = getLeerDataManager();
      const nieuweSessieId = leerDataManager.startSessie(true, leermodusType);
      setHuidigeSessieId(nieuweSessieId);
      
      setNotificatie({ 
        zichtbaar: true, 
        bericht: '📚 Nieuwe sessie gestart!', 
        type: 'succes' 
      });
      setTimeout(() => setNotificatie(prev => ({ ...prev, zichtbaar: false })), 3000);
    }
    
    if (isAanHetSpinnen || gefilterdeOpdrachten.length === 0 || !heeftVoldoendeSpelers()) return;

    // Reset de laatste beoordeelde opdracht bij een nieuwe spin
    setLaatsteBeoordeeldeOpdracht(null);

    // 1. Kies speler
    let gekozenSpeler: Speler;
    if (isSerieuzeLeerModusActief && gameMode === 'single') {
      // In serieuze leermodus: gebruik een virtuele speler
      gekozenSpeler = { naam: "Jij", score: 0, extraSpins: 0, beurten: 0 };
    } else {
      if (isEerlijkeSelectieActief && spelers.length > 1) {
        let wachtrij = [...spelerWachtrij];
        if (wachtrij.length === 0) {
          wachtrij = shuffle(spelers);
        }
        gekozenSpeler = wachtrij.shift()!;
        setSpelerWachtrij(wachtrij);
      } else {
        const randomIndex = Math.floor(Math.random() * spelers.length);
        gekozenSpeler = spelers[randomIndex];
      }
      
      // Verhoog de beurtenteller voor de gekozen speler
      setSpelers(prevSpelers =>
        prevSpelers.map(p =>
          p.naam === gekozenSpeler.naam ? { ...p, beurten: p.beurten + 1 } : p
        )
      );
    }

    voerSpinUit(gekozenSpeler);
  };

  const handleGebruikExtraSpin = () => {
    if (!huidigeSpeler || huidigeSpeler.extraSpins <= 0) return;

    const nieuweSpelersLijst = spelers.map(p => 
      p.naam === huidigeSpeler.naam ? { ...p, extraSpins: p.extraSpins - 1 } : p
    );
    const bijgewerkteHuidigeSpeler = nieuweSpelersLijst.find(p => p.naam === huidigeSpeler.naam);

    setSpelers(nieuweSpelersLijst);

    // Voer een nieuwe spin uit voor dezelfde speler, met de bijgewerkte state
    if (bijgewerkteHuidigeSpeler) {
      setHuidigeSpeler(bijgewerkteHuidigeSpeler);
      voerSpinUit(bijgewerkteHuidigeSpeler);
      
      // Scroll naar boven voor mobiele weergave
      if (isMobieleWeergave) {
        mainContentRef.current?.scrollTo(0, 0);
        window.scrollTo(0, 0);
      }
    }
  };

  const voerSpinUit = (gekozenSpeler: Speler) => {
    playSpinStart();
    setIsAanHetSpinnen(true);
    setGamePhase('spinning');

    let gekozenOpdracht: Opdracht | null = null;
    let opdrachtType: 'herhaling' | 'nieuw' | 'geen' = 'geen';
    let boxNummer: number | undefined = undefined;

    if (isSerieuzeLeerModusActief && gameMode === 'single' && leermodusType === 'leitner') {
      const result = selectLeitnerOpdracht(gefilterdeOpdrachten, gefilterdeGeselecteerdeLeitnerCategorieen, isSerieuzeLeerModusActief, gameMode, limietWaarschuwingGenegeerd);
      
      if (result.limietBereikt && !limietWaarschuwingGenegeerd) {
        setIsLimietModalOpen(true);
        setIsAanHetSpinnen(false);
        setGamePhase('idle');
        return;
      }

      gekozenOpdracht = result.opdracht;
      opdrachtType = result.type;
      boxNummer = result.box;

      if (!gekozenOpdracht) {
        alert('Alle opdrachten (zowel nieuw als te herhalen) in de geselecteerde categorieën zijn voltooid. Selecteer andere categorieën om verder te gaan.');
        setIsAanHetSpinnen(false);
        setGamePhase('idle');
        return;
      }
    } else {
      // Standaard selectie voor multiplayer of niet-serieuze modus
      const beschikbareOpdrachten = gefilterdeOpdrachten.filter(
        op => !recentGebruikteOpdrachten.find(ruo => ruo.Opdracht === op.Opdracht)
      );
      
      if (beschikbareOpdrachten.length === 0) {
        // Als er geen opdrachten meer zijn na het filteren van recent gebruikte,
        // gebruik dan de volledige gefilterde lijst.
        gekozenOpdracht = gefilterdeOpdrachten[Math.floor(Math.random() * gefilterdeOpdrachten.length)];
      } else {
        gekozenOpdracht = beschikbareOpdrachten[Math.floor(Math.random() * beschikbareOpdrachten.length)];
      }
      opdrachtType = 'nieuw';
    }

    setRecentGebruikteOpdrachten(prev => {
      if (!gekozenOpdracht) return prev;
      const updatedList = [gekozenOpdracht, ...prev];
      return updatedList.slice(0, 10);
    });

    // Leerdata tracking - record opdracht start
    if (isSerieuzeLeerModusActief && gameMode === 'single' && gekozenOpdracht) {
      const leerDataManager = getLeerDataManager();
      leerDataManager.recordOpdrachtStart(gekozenOpdracht);
      setOpdrachtStartTijd(Date.now());
    }

    // 3. Kies Jackpot
    const kansNiveaus = {
      standaard: 0, // Geen extra kans, volgt de natuurlijke flow
      verhoogd: 0.10, // 10% kans
      fors_verhoogd: 0.25 // 25% kans
    };

    const moetBonusForceren = Math.random() < kansNiveaus[bonusKans];
    
    const jackpotSymbols = moetBonusForceren 
      ? ['❓', '❓', '❓']
      : [
          forceResult[0] || SYMBOLEN[Math.floor(Math.random() * SYMBOLEN.length)].symbool,
          forceResult[1] || SYMBOLEN[Math.floor(Math.random() * SYMBOLEN.length)].symbool,
          forceResult[2] || SYMBOLEN[Math.floor(Math.random() * SYMBOLEN.length)].symbool,
        ];

    const nieuweJackpotIndices = jackpotSymbols.map(sym => SYMBOLEN.findIndex(s => s.symbool === sym));
    
    // Bepaal de indices voor de rollen
    const categorieItems = [
      ...new Set(
        gefilterdeOpdrachten.map(o => 
          o.Hoofdcategorie 
            ? `${o.Hoofdcategorie}: ${o.Categorie}` 
            : o.Categorie
        )
      )
    ];
    const gekozenCategorieString = gekozenOpdracht.Hoofdcategorie 
      ? `${gekozenOpdracht.Hoofdcategorie}: ${gekozenOpdracht.Categorie}` 
      : gekozenOpdracht.Categorie;
    
    const opdrachtTeksten = gefilterdeOpdrachten.map(o => o.Opdracht);
    
    // Bepaal speler naam index
    let spelerNaamIndex: number;
    if (isSerieuzeLeerModusActief && gameMode === 'single') {
      spelerNaamIndex = 0; // "Jij" is altijd index 0 in de rol
    } else {
      const spelerNamen = spelers.map(s => s.naam);
      spelerNaamIndex = spelerNamen.indexOf(gekozenSpeler.naam);
    }

    setSpinResultaat({
      jackpot: nieuweJackpotIndices,
      categorie: categorieItems.indexOf(gekozenCategorieString),
      opdracht: opdrachtTeksten.indexOf(gekozenOpdracht.Opdracht),
      naam: spelerNaamIndex,
    });

    // Wacht tot de animatie klaar is en update dan de state
    setTimeout(() => {
      setHuidigeOpdracht({ opdracht: gekozenOpdracht!, type: opdrachtType, box: boxNummer });
      setHuidigeSpeler(gekozenSpeler);
      const jackpotSymbols = nieuweJackpotIndices.map(i => SYMBOLEN[i].symbool);
      
      // Gebruik de juiste speler array voor analyse
      const spelerArrayVoorAnalyse = isSerieuzeLeerModusActief && gameMode === 'single' 
        ? [gekozenSpeler] // Gebruik alleen de virtuele speler
        : spelers; // Gebruik normale speler array
      
      const analyse = analyseerSpin(jackpotSymbols, spelerArrayVoorAnalyse, gameMode, isSerieuzeLeerModusActief, isBonusOpdrachtenActief);
      setHuidigeSpinAnalyse(analyse);
      setIsAanHetSpinnen(false);

      // Toon leerfeedback in serieuze leer-modus bij combinaties
      if (gameMode === 'single' && isSerieuzeLeerModusActief && isLeerFeedbackActief && analyse.beschrijving && analyse.beschrijving !== 'Geen combinatie.' && analyse.beschrijving !== 'Blijf leren en groeien!') {
        setNotificatie({ 
          zichtbaar: true, 
          bericht: analyse.beschrijving, 
          type: 'succes' 
        });
        setTimeout(() => setNotificatie(prev => ({ ...prev, zichtbaar: false })), 6000);
      }

      if (isJokerSpinActief && analyse.verdiendeSpins > 0) {
        playJokerWin(); // Speel joker win geluid
        setVerdiendeSpinsDezeBeurt(analyse.verdiendeSpins); // Sla op in tijdelijke state
        setNotificatie({ 
          zichtbaar: true, 
          bericht: `${gekozenSpeler.naam} verdient ${analyse.verdiendeSpins} extra spin(s)! Deze kan vanaf de volgende beurt ingezet worden.`, 
          type: 'succes' 
        });
        setTimeout(() => setNotificatie(prev => ({ ...prev, zichtbaar: false })), 6000);
      }

      if (analyse.actie === 'bonus_opdracht' && isBonusOpdrachtenActief) {
        playBonusStart(); // Speel bonus start geluid
        const bonusOpdracht = bonusOpdrachten[Math.floor(Math.random() * bonusOpdrachten.length)];
        setHuidigeBonusOpdracht(bonusOpdracht);
        setGamePhase('bonus_round');
      } else if (analyse.actie === 'partner_kiezen') {
        setGamePhase('partner_choice');
      } else {
        setGamePhase('assessment');
      }
      if (isSpinVergrendelingActief) {
        setIsAntwoordVergrendeld(true);
      }
    }, 3600); // Net iets langer dan de langste rol animatie
  };


  const handlePartnerKies = useCallback((partnerNaam: string) => {
    const partner = spelers.find(p => p.naam === partnerNaam);
    if (partner) {
      playPartnerChosen(); // Speel partner gekozen geluid
      setGekozenPartner(partner);
      setGamePhase('assessment'); // Ga nu naar de beoordelingsfase
    }
  }, [spelers, playPartnerChosen]);

  useEffect(() => {
    if (gameMode === 'single' && geselecteerdeCategorieen.length > 0 && spelers.length === 1) {
      const spelerNaam = spelers[0].naam;
      const pb = getPersonalBest(geselecteerdeCategorieen, spelerNaam);
      setCurrentPersonalBest(pb);
    } else {
      setCurrentPersonalBest(null);
    }
  }, [gameMode, geselecteerdeCategorieen, spelers]);

  const checkSpelEinde = useCallback((speler?: Speler) => {
    if (gameMode === 'single' && speler) {
      const wasNieuwRecord = saveHighScore(geselecteerdeCategorieen, speler.score, speler.naam);
      const wasNieuwPb = savePersonalBest(geselecteerdeCategorieen, speler.score, speler.naam);
      setIsNieuwRecord(wasNieuwRecord);
      setIsNieuwPersoonlijkRecord(wasNieuwPb);
      
      // Speel geluid op basis van resultaat
      if (wasNieuwRecord) {
        playNewRecord(); // Nieuw record geluid
      } else {
        playGameEnd(); // Normaal einde geluid
      }
    } else {
      // Multiplayer einde
      playMultiplayerEnd(); // Feestelijk einde geluid
    }
    setGamePhase('ended');
  }, [gameMode, geselecteerdeCategorieen, playNewRecord, playGameEnd, playMultiplayerEnd]);

  const handlePauseOpdracht = useCallback(() => {
    const opdrachtOmTePauzeren = huidigeOpdracht || laatsteBeoordeeldeOpdracht;
    if (opdrachtOmTePauzeren && isSerieuzeLeerModusActief && leermodusType === 'leitner') {
      const leerDataManager = getLeerDataManager();
      const opdrachtId = `${opdrachtOmTePauzeren.opdracht.Hoofdcategorie || 'Overig'}_${opdrachtOmTePauzeren.opdracht.Categorie}_${opdrachtOmTePauzeren.opdracht.Opdracht.substring(0, 20)}`;
      leerDataManager.pauseOpdracht(opdrachtId);
      
      // Reset de laatste beoordeelde opdracht
      setLaatsteBeoordeeldeOpdracht(null);
      
      // Toon notificatie
      setNotificatie({
        zichtbaar: true,
        bericht: 'Opdracht gepauzeerd! Deze komt niet terug tot de pauze wordt gestopt.',
        type: 'succes'
      });
      
      setTimeout(() => {
        setNotificatie(prev => ({ ...prev, zichtbaar: false }));
      }, 3000);
    }
  }, [huidigeOpdracht, laatsteBeoordeeldeOpdracht, isSerieuzeLeerModusActief, leermodusType]);

  const handleBeoordeling = useCallback((prestatie: 'Heel Goed' | 'Redelijk' | 'Niet Goed') => {
    if (!huidigeOpdracht || !huidigeSpeler || !huidigeSpinAnalyse) {
      setGamePhase('idle');
      return;
    }

    // Leerdata tracking - record opdracht voltooid
    if (isSerieuzeLeerModusActief && gameMode === 'single' && huidigeOpdracht) {
      const leerDataManager = getLeerDataManager();
      const score = prestatie === 'Heel Goed' ? 5 : prestatie === 'Redelijk' ? 3 : 1;
      const tijdGenomen = opdrachtStartTijd ? Math.round((Date.now() - opdrachtStartTijd) / 1000) : undefined;
      
      const nieuweAchievements = leerDataManager.recordOpdrachtVoltooid(
        huidigeOpdracht.opdracht,
        score,
        prestatie,
        huidigeSessieId || undefined,
        tijdGenomen,
        isSerieuzeLeerModusActief
      );
      
      // Toon notificatie voor nieuwe achievements
      if (nieuweAchievements.length > 0) {
        setNieuweAchievement(nieuweAchievements[0]); // Toon de eerste nieuwe achievement
      }

      // Forceer een re-render om stats bij te werken
      setLeitnerStats(leerDataManager.getLeitnerStatistiekenVoorCategorieen(geselecteerdeLeitnerCategorieen));
      
      setOpdrachtStartTijd(null);
    }

    // In serieuze leer-modus worden geen punten gegeven
    if (gameMode === 'single' && isSerieuzeLeerModusActief) {
      // Sla de laatste beoordeelde opdracht op voor pauze functionaliteit
      setLaatsteBeoordeeldeOpdracht(huidigeOpdracht);
      
      // Ga direct naar volgende beurt zonder punten
      const volgendeBeurtNummer = aantalBeurtenGespeeld + 1;
      setAantalBeurtenGespeeld(volgendeBeurtNummer);
      
      setGamePhase('idle');
      setIsAntwoordVergrendeld(false);

      mainContentRef.current?.scrollTo(0, 0);
      window.scrollTo(0, 0);
      
      return;
    }

    // Normale modus met punten
    if (prestatie !== 'Niet Goed') {
      const standaardPunt = 1;
      const extraPunten = Math.min(Number(huidigeOpdracht.opdracht.Extra_Punten) || 0, 2);
      const maximalePunten = standaardPunt + extraPunten;
      
      let opdrachtPunten: number;
      if (prestatie === 'Heel Goed') {
        opdrachtPunten = maximalePunten; // 100% van de punten
      } else if (prestatie === 'Redelijk') {
        opdrachtPunten = maximalePunten * 0.5; // 50% van de punten
      } else {
        opdrachtPunten = 0; // Niet Goed
      }

      if (huidigeSpinAnalyse.actie === 'kop_of_munt') {
        setPuntenVoorVerdubbeling(opdrachtPunten);
        setGamePhase('double_or_nothing');
        return;
      }

      // Bereken bonuspunten op basis van beoordeling
      let bonusPunten: number;
      if (prestatie === 'Heel Goed') {
        bonusPunten = huidigeSpinAnalyse.bonusPunten + opgespaardeBonusPunten; // 100% van de bonuspunten
      } else if (prestatie === 'Redelijk') {
        bonusPunten = (huidigeSpinAnalyse.bonusPunten + opgespaardeBonusPunten) * 0.5; // 50% van de bonuspunten
      } else {
        bonusPunten = 0; // Niet Goed - geen bonuspunten
      }

      const totaalGewonnenPunten = opdrachtPunten + bonusPunten;

      setSpelers(spelers.map(speler => {
        if (speler.naam === huidigeSpeler.naam || (gekozenPartner && speler.naam === gekozenPartner.naam)) {
          return { ...speler, score: speler.score + totaalGewonnenPunten };
        }
        return speler;
      }));
    }

    // Voeg verdiende spins van DEZE beurt toe aan het totaal voor de VOLGENDE beurt.
    if (verdiendeSpinsDezeBeurt > 0 && huidigeSpeler) {
      setSpelers(prevSpelers => prevSpelers.map(p => 
        p.naam === huidigeSpeler.naam 
          ? { ...p, extraSpins: p.extraSpins + verdiendeSpinsDezeBeurt }
          : p
      ));
    }
    setVerdiendeSpinsDezeBeurt(0); // Reset de tijdelijke state

    // Verhoog de algemene beurtenteller pas NADAT de beurt is afgerond.
    const volgendeBeurtNummer = aantalBeurtenGespeeld + 1;
    setAantalBeurtenGespeeld(volgendeBeurtNummer);

    const huidigeSpelerVoorUpdate = huidigeSpeler; // Sla de huidige speler op

    // Algemene afronding
    setGekozenPartner(null);
    setOpgespaardeBonusPunten(0);
    
    // Controleer einde met het VOLGENDE beurtnummer en de huidige spelerslengte
    const isEinde = effectieveMaxRondes > 0 && volgendeBeurtNummer >= effectieveMaxRondes * spelers.length;
    
    // Toon scorebord update alleen als het spel nog niet is afgelopen
    if (isMobieleWeergave && isAutomatischScorebordActief && !isEinde) {
      setIsScoreLadeOpen(true);
      setTimeout(() => setIsScoreLadeOpen(false), 3000);
    }
    
    if (isEinde) {
      // Roep checkSpelEinde aan met de juiste spelergegevens
      if (gameMode === 'single' && huidigeSpelerVoorUpdate) {
        const speler = spelers.find(p => p.naam === huidigeSpelerVoorUpdate.naam)!;
        checkSpelEinde(speler);
      } else {
        // Multiplayer einde zonder specifieke speler
        playMultiplayerEnd();
        setGamePhase('ended');
      }
    } else {
      setGamePhase('idle');
      setIsAntwoordVergrendeld(false);
    }

    mainContentRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [huidigeOpdracht, huidigeSpeler, huidigeSpinAnalyse, spelers, gekozenPartner, isMobieleWeergave, opgespaardeBonusPunten, effectieveMaxRondes, huidigeRonde, aantalBeurtenGespeeld, verdiendeSpinsDezeBeurt, gameMode, checkSpelEinde, playMultiplayerEnd, isAutomatischScorebordActief, isSerieuzeLeerModusActief, huidigeSessieId, opdrachtStartTijd]);

  const handleFileSelected = (file: File) => {
    setGeselecteerdBestand(file);
  };

  const handleAnnuleerUpload = () => {
    setGeselecteerdBestand(null);
  };

  const handleVerwerkBestand = (vervang: boolean) => {
    if (!geselecteerdBestand) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const nieuweOpdrachten = parseExcelData(arrayBuffer, 'gebruiker');
        // Tel het aantal unieke opdrachten dat daadwerkelijk wordt toegevoegd
        const huidigeOpdrachten = opdrachten.filter(o => o.bron === 'gebruiker');
        const bestaandeKeys = new Set(
          huidigeOpdrachten.map(o => `${o.Opdracht}|${o.Categorie}|${o.Hoofdcategorie}`)
        );
        const uniekeNieuweOpdrachten = nieuweOpdrachten.filter(o => {
          const key = `${o.Opdracht}|${o.Categorie}|${o.Hoofdcategorie}`;
          return !bestaandeKeys.has(key);
        });
        
        laadNieuweOpdrachten(nieuweOpdrachten, vervang);
        
        if (vervang) {
          alert(`${nieuweOpdrachten.length} opdrachten succesvol vervangen!`);
        } else {
          const overgeslagen = nieuweOpdrachten.length - uniekeNieuweOpdrachten.length;
          const bericht = overgeslagen > 0 
            ? `${uniekeNieuweOpdrachten.length} nieuwe opdrachten toegevoegd, ${overgeslagen} dubbelingen overgeslagen.`
            : `${uniekeNieuweOpdrachten.length} opdrachten succesvol toegevoegd!`;
          alert(bericht);
        }
        setGeselecteerdBestand(null); // Reset na succes
        setIsInstellingenOpen(false); // Sluit de instellingen na een succesvolle upload
      } catch (err) {
        alert('Fout bij het verwerken van het Excel-bestand. Controleer of het format correct is.');
        setGeselecteerdBestand(null); // Reset ook bij fout
      }
    };
    reader.onerror = () => {
      alert('Fout bij het lezen van het bestand.');
      setGeselecteerdBestand(null); // Reset bij leesfout
    };
    reader.readAsArrayBuffer(geselecteerdBestand);
  };

  const handleKopOfMunt = (keuze: 'kop' | 'munt'): { uitkomst: 'kop' | 'munt'; gewonnen: boolean } => {
    const uitkomst = Math.random() < 0.5 ? 'kop' : 'munt';
    const gewonnen = keuze === uitkomst;

    if (huidigeSpeler) {
      if (gewonnen) {
        const gewonnenPunten = puntenVoorVerdubbeling * 2;
        setNotificatie({
          zichtbaar: true,
          bericht: `Het is ${uitkomst}! Je wint ${gewonnenPunten} punten!`,
          type: 'succes',
        });
        setSpelers(spelers.map(speler =>
          speler.naam === huidigeSpeler.naam
            ? { ...speler, score: speler.score + gewonnenPunten }
            : speler
        ));
      } else {
        setNotificatie({
          zichtbaar: true,
          bericht: `Het is ${uitkomst}! Helaas, geen extra punten.`,
          type: 'fout',
        });
      }
      
      // Scroll naar boven om de notificatie zichtbaar te maken op mobiel
      setTimeout(() => {
        mainContentRef.current?.scrollTo(0, 0);
        window.scrollTo(0, 0);
      }, 100); // Korte vertraging om de notificatie eerst te tonen
    }
    return { uitkomst, gewonnen };
  };

  const handleKopOfMuntVoltooid = () => {
    setTimeout(() => {
      setNotificatie(prev => ({ ...prev, zichtbaar: false }));
      setPuntenVoorVerdubbeling(0);
      
      // Ga terug naar idle state in plaats van spel beëindigen
      setGamePhase('idle');
      setIsAntwoordVergrendeld(false);
      
      // Open de score lade op mobiel om de update te tonen
      if (isMobieleWeergave && isAutomatischScorebordActief && gamePhase !== 'ended') {
        setIsScoreLadeOpen(true);
        setTimeout(() => setIsScoreLadeOpen(false), 3000); // Sluit na 3 seconden
      }
      mainContentRef.current?.scrollTo(0, 0);
      window.scrollTo(0, 0); // Extra scroll voor mobiele browsers
    }, 2500); // Wachttijd om de notificatie te lezen
  };

  const handleBonusRondeVoltooid = useCallback((geslaagd: boolean) => {
    if (!huidigeSpeler || !huidigeBonusOpdracht) return;

    if (geslaagd) {
      const { punten } = huidigeBonusOpdracht;
      const gewonnenPunten = punten[Math.floor(Math.random() * punten.length)];
      setNotificatie({ 
        zichtbaar: true, 
        bericht: `Goed gedaan! Je kunt ${gewonnenPunten} extra punt(en) verdienen met de hoofdopdracht.`, 
        type: 'succes' 
      });
      setOpgespaardeBonusPunten(gewonnenPunten);
    } else {
      setNotificatie({ 
        zichtbaar: true, 
        bericht: 'Helaas, geen extra punten deze keer.', 
        type: 'fout' 
      });
    }

    setTimeout(() => {
      setNotificatie(prev => ({ ...prev, zichtbaar: false }));
      setHuidigeBonusOpdracht(null);
      setGamePhase('assessment'); // Ga nu door naar de hoofdopdracht
      mainContentRef.current?.scrollTo(0, 0);
      window.scrollTo(0, 0); // Extra scroll voor mobiele browsers
    }, 3000);

}, [huidigeSpeler, huidigeBonusOpdracht]);

  const handleHerstart = () => {
    setSpelers(spelers.map(speler => ({ ...speler, score: 0, extraSpins: 0, beurten: 0 })));
    setAantalBeurtenGespeeld(0);
    setHuidigeOpdracht(null);
    setHuidigeSpeler(null);
    setGekozenPartner(null);
    setHuidigeSpinAnalyse(null);
    setIsAntwoordVergrendeld(false);
    setGamePhase('idle');
    setIsSpelGestart(false);
    setIsNieuwRecord(false);
    setVerdiendeSpinsDezeBeurt(0);
    setIsNieuwPersoonlijkRecord(false);
  };

  const handleEindigSpel = () => {
    // Vraag om bevestiging voordat het spel wordt beëindigd
    const bevestiging = window.confirm(
      'Weet je zeker dat je het huidige spel wilt beëindigen? Alle scores en voortgang gaan verloren.'
    );

    if (bevestiging) {
      resetSpelState(); // Gebruik de uitgebreide reset functie
    }
  };

  const handleOpenInstellingen = () => {
    setIsScoreLadeOpen(false);
    setIsInstellingenOpen(true);
  };

  const handleOpenLeitnerCategorieBeheer = () => {
    setIsScoreLadeOpen(false);
    setIsCategorieBeheerOpen(true);
  }

  const handleOpenUitleg = () => {
    setIsScoreLadeOpen(false);
    setIsUitlegOpen(true);
  };

  // Handlers voor directe tab navigatie
  const handleOpenHighscoreCategorieSelectie = () => {
    setCategorieSelectieActiveTab('highscore');
    setIsCategorieSelectieOpen(true);
    setIsCategorieBeheerOpen(false); // Sluit Leitner modal
    setIsScoreLadeOpen(false); // Sluit mobiele menu
  };

  const handleOpenMultiplayerCategorieSelectie = () => {
    setCategorieSelectieActiveTab('multiplayer');
    setIsCategorieSelectieOpen(true);
    setIsCategorieBeheerOpen(false); // Sluit Leitner modal
    setIsScoreLadeOpen(false); // Sluit mobiele menu
  };

  const handleOpenNormaleLeermodusCategorieSelectie = () => {
    setCategorieSelectieActiveTab('normaal');
    setIsCategorieSelectieOpen(true);
    setIsCategorieBeheerOpen(false); // Sluit Leitner modal
    setIsScoreLadeOpen(false); // Sluit mobiele menu
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleStartFocusSessie = (categorie: string) => {
    // Deze functie verwacht nu een "Hoofdcategorie - Subcategorie" of alleen "Hoofdcategorie"
    const isHoofdcategorie = !categorie.includes(' - ');

    let geselecteerdeIds: string[];

    if (isHoofdcategorie) {
      geselecteerdeIds = opdrachten
        .filter(op => op.Hoofdcategorie === categorie)
        .map(op => `${op.Hoofdcategorie} - ${op.Categorie}`);
    } else {
      geselecteerdeIds = [categorie];
    }

    const uniekeGeselecteerdeIds = [...new Set(geselecteerdeIds)];

    // Focus sessie geldt voor 'normale' leermodus
    setGeselecteerdeCategorieen(uniekeGeselecteerdeIds);
    setGameMode('single');
    setIsSerieuzeLeerModusActief(true);
    setLeermodusType('normaal');

    setIsLeeranalyseOpen(false);
    // Optioneel: toon een notificatie
    setNotificatie({
      zichtbaar: true,
      bericht: `Focus modus gestart voor: ${categorie}`,
      type: 'succes',
    });
    setTimeout(() => setNotificatie(prev => ({ ...prev, zichtbaar: false })), 4000);
  };

  if (loading) {
    return <div>Laden...</div>;
  }

  return (
    <div className={`app-container ${isMobieleWeergave ? 'mobile-view-active' : ''}`}>
      {gamePhase === 'ended' && (
        <Eindscherm
          spelers={spelers}
          onHerstart={handleHerstart}
          gameMode={gameMode}
          isNieuwRecord={isNieuwRecord}
          highScore={currentHighScore}
          personalBest={currentPersonalBest}
          isNieuwPersoonlijkRecord={isNieuwPersoonlijkRecord}
        />
      )}
      <AchievementNotificatie 
        achievement={nieuweAchievement}
        onClose={() => setNieuweAchievement(null)}
        onOpenLeeranalyse={() => handleOpenLeeranalyse(true)}
      />
      <OrientatieMelding isMobiel={isMobieleWeergave} />
      {/* De instellingen modal staat buiten de hoofdlayout voor een correcte weergave */}
      {isInstellingenOpen && (
        <Instellingen
          isOpen={isInstellingenOpen}
          onClose={() => setIsInstellingenOpen(false)}
          onVerwijderGebruikerOpdrachten={verwijderGebruikerOpdrachten}
          // Geavanceerd
          bonusOpdrachten={bonusOpdrachten}
          setBonusOpdrachten={setBonusOpdrachten}
          basisBonusOpdrachten={BONUS_OPDRACHTEN}
          isSpelGestart={isSpelGestart}
          onSpelReset={resetSpelState}
          // Categorie beheer
          onOpenCategorieBeheer={handleOpenLeitnerCategorieBeheer}
          onOpenCategorieSelectie={() => setIsCategorieSelectieOpen(true)}
        >
          {/* Opdrachtenbeheer Content */}
          <BestandsUploader
            onFileSelected={handleFileSelected}
            onAnnuleer={handleAnnuleerUpload}
            onVerwerk={handleVerwerkBestand}
            geselecteerdBestand={geselecteerdBestand}
          />
          <p className="setting-description" style={{ marginLeft: 0, marginTop: '20px', marginBottom: '15px' }}>
              <strong>Categorieën selectie:</strong> Categorieën kunnen nu worden aangepast via de knoppen in het linker menu. 
              Elke spelmodus heeft zijn eigen categorie selectie.
          </p>
        </Instellingen>
      )}
      
      <Uitleg isOpen={isUitlegOpen} onClose={() => setIsUitlegOpen(false)} />
      
      {/* Sessie samenvatting modal */}
      <SessieSamenvatting
        isOpen={isSessieSamenvattingOpen}
        onClose={() => setIsSessieSamenvattingOpen(false)}
        sessieData={eindigdeSessieData}
        onOpenLeeranalyse={handleOpenLeeranalyse}
      />
      
      {/* Leeranalyse modal */}
      <Leeranalyse
        isOpen={isLeeranalyseOpen}
        onClose={() => {
          setIsLeeranalyseOpen(false);
          setOpenLeeranalyseToAchievements(false);
        }}
        key={isLeeranalyseOpen ? 'open' : 'closed'}
        onStartFocusSessie={handleStartFocusSessie}
        openToAchievements={openLeeranalyseToAchievements}
      />

              <CategorieSelectieModal
          isOpen={isCategorieSelectieOpen}
          onClose={() => {
            setIsCategorieSelectieOpen(false);
            setIsCategorieBeheerOpen(false); // Reset Leitner modal state
          }}
        opdrachten={opdrachten}
        geselecteerdeCategorieen={geselecteerdeCategorieen}
        onCategorieSelectie={handleCategorieSelectie}
        onBulkCategorieSelectie={handleBulkCategorieSelectie}
        onOpenLeitnerBeheer={handleOpenLeitnerCategorieBeheer}
        highScoreLibrary={getHighScoreLibrary()}
        onHighScoreSelect={setGeselecteerdeHighscoreCategorieen}
        geselecteerdeLeitnerCategorieen={geselecteerdeLeitnerCategorieen}
        setGeselecteerdeLeitnerCategorieen={setGeselecteerdeLeitnerCategorieen}
        geselecteerdeMultiplayerCategorieen={geselecteerdeMultiplayerCategorieen}
        setGeselecteerdeMultiplayerCategorieen={setGeselecteerdeMultiplayerCategorieen}
        geselecteerdeHighscoreCategorieen={geselecteerdeHighscoreCategorieen}
        setGeselecteerdeHighscoreCategorieen={setGeselecteerdeHighscoreCategorieen}
        initialActiveTab={categorieSelectieActiveTab}
        filters={filters}
        setFilters={setFilters}
      />

      {isCategorieBeheerOpen && (
        <LeitnerCategorieBeheer
          isOpen={isCategorieBeheerOpen}
          onClose={() => {
            setIsCategorieBeheerOpen(false);
            setIsCategorieSelectieOpen(false); // Reset categorie modal state
          }}
          geselecteerdeCategorieen={geselecteerdeLeitnerCategorieen}
          setGeselecteerdeCategorieen={setGeselecteerdeLeitnerCategorieen}
          alleCategorieen={alleUniekeCategorieen}
          alleOpdrachten={opdrachten}
          filters={filters}
          setFilters={setFilters}
        />
      )}

      <LimietBereiktModal
        isOpen={isLimietModalOpen}
        onClose={() => setIsLimietModalOpen(false)}
        onConfirm={() => {
          setLimietWaarschuwingGenegeerd(true);
          setIsLimietModalOpen(false);
        }}
        maxVragen={maxNewLeitnerQuestionsPerDay}
      />



      {isMobieleWeergave && (
        <>
          <button className="score-lade-knop" onClick={() => setIsScoreLadeOpen(prev => !prev)}>
            <div className="hamburger-menu">
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </div>
          </button>
          <button className="fullscreen-knop" onClick={toggleFullscreen}>
            {isFullscreen ? '⛶' : '⛶'} {/* Fullscreen iconen */}
          </button>
          <div 
            className={`score-lade-overlay ${isScoreLadeOpen ? 'open' : ''}`} 
            onClick={() => setIsScoreLadeOpen(false)}
          ></div>
        </>
      )}

      <div className="main-layout" {...swipeHandlers}>
        <aside className={`left-panel ${isScoreLadeOpen ? 'open' : ''}`}>
          {/* Setup knoppen - alleen zichtbaar als spel niet gestart is */}
          {!isSpelGestart && (
            <>
              <SpelerInput 
                onSpelerToevoegen={handleSpelerToevoegen}
                gameMode={gameMode}
                setGameMode={setGameMode}
                isSpelerInputDisabled={isSpelerInputDisabled}
                isSpelGestart={isSpelGestart}
                isSerieuzeLeerModusActief={isSerieuzeLeerModusActief}
                setIsSerieuzeLeerModusActief={setIsSerieuzeLeerModusActief}
                leermodusType={leermodusType}
                setLeermodusType={setLeermodusType}
                onSpelReset={resetSpelState}
              />
            </>
          )}

          {/* Scorebord - altijd zichtbaar */}
          <Scorebord
            spelers={spelers}
            huidigeSpeler={huidigeSpeler}
            huidigeRonde={huidigeRonde}
            maxRondes={effectieveMaxRondes}
            gameMode={gameMode}
            highScore={currentHighScore}
            personalBest={currentPersonalBest}
            isSerieuzeLeerModusActief={isSerieuzeLeerModusActief}
            aantalBeurtenGespeeld={aantalBeurtenGespeeld}
          />

          {/* Highscore informatie - alleen zichtbaar in highscore modus */}
          {gameMode === 'single' && !isSerieuzeLeerModusActief && (
            <div className="highscore-sectie">
              <div className="highscore-header">
                <h5>🏆 Highscore Modus</h5>
              </div>
              <div className="highscore-info">
                <button 
                  onClick={handleOpenHighscoreCategorieSelectie}
                  className="categorie-beheer-knop"
                  disabled={isSpelGestart}
                >
                  <span className="knop-titel">Categorieën Aanpassen</span>
                                        <span className="knop-details">{gefilterdeGeselecteerdeHighscoreCategorieen.length}/{alleUniekeCategorieen.length} Cat. | {aantalOpdrachtenHighscore} Opdr.</span>
                  {isSpelGestart && <span className="disabled-hint"> - Spel is bezig</span>}
                </button>
                <div className="highscore-info-text">
                  <p>Probeer je beste score te behalen met de geselecteerde categorieën!</p>
                </div>
              </div>
            </div>
          )}

          {/* Multiplayer informatie - alleen zichtbaar in multiplayer modus */}
          {gameMode === 'multi' && (
            <div className="multiplayer-sectie">
              <div className="multiplayer-header">
                <h5>🎮 Multiplayer Modus</h5>
              </div>
              <div className="multiplayer-info">
                <button 
                  onClick={handleOpenMultiplayerCategorieSelectie}
                  className="categorie-beheer-knop"
                  disabled={isSpelGestart}
                >
                  <span className="knop-titel">Categorieën Aanpassen</span>
                                        <span className="knop-details">{gefilterdeGeselecteerdeMultiplayerCategorieen.length}/{alleUniekeCategorieen.length} Cat. | {aantalOpdrachtenMultiplayer} Opdr.</span>
                  {isSpelGestart && <span className="disabled-hint"> - Spel is bezig</span>}
                </button>
                <div className="multiplayer-info-text">
                  <p>Speel samen met vrienden en familie!</p>
                </div>
              </div>
            </div>
          )}

          {/* Leermodus informatie - alleen zichtbaar in leermodus */}
          {gameMode === 'single' && isSerieuzeLeerModusActief && (
            <div className="serieuze-leermodus-uitleg">
              {leermodusType === 'leitner' && (
                <div className="leitner-sectie">
                  <div className="leitner-header">
                    <h5>🔄 Leitner</h5>
                  </div>
                  <div className="leitner-stats">
                    <button 
                      onClick={handleOpenLeitnerCategorieBeheer}
                      className="categorie-beheer-knop"
                    >
                      <span className="knop-titel">Categorieën Aanpassen</span>
                      <span className="knop-details">{gefilterdeGeselecteerdeLeitnerCategorieen.length}/{alleUniekeCategorieen.length} Cat. | {aantalOpdrachtenLeitner} Opdr.</span>
                    </button>
                    <div className="leitner-stats-info">
                      <p>Nieuwe opdrachten: <strong>{aantalNieuweLeitnerOpdrachten}</strong></p>
                      <p>
                        {isBox0OverrideActief ? 'Box 0 (wachttijd genegeerd):' : 'Klaar voor herhaling:'}
                        <strong> {leitnerStats.vandaagBeschikbaar}</strong> opdrachten
                      </p>
                    </div>
                    {leitnerStats.vandaagBeschikbaar > 0 && (
                      <p className="leitner-priority">
                        ⭐ Prioriteit voor herhaling wordt gegeven aan opdrachten die vandaag herhaald moeten worden.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {leermodusType === 'normaal' && (
                <div className="vrije-leermodus-sectie">
                  <div className="vrije-leermodus-header">
                    <h5>📚 Vrije Leermodus</h5>
                  </div>
                  <div className="vrije-leermodus-info">
                    <button 
                      onClick={handleOpenNormaleLeermodusCategorieSelectie}
                      className="categorie-beheer-knop"
                    >
                      <span className="knop-titel">Categorieën Aanpassen</span>
                      <span className="knop-details">{gefilterdeGeselecteerdeCategorieen.length}/{alleUniekeCategorieen.length} Cat. | {aantalOpdrachtenNormaal} Opdr.</span>
                    </button>
                    <div className="vrije-leermodus-info-text">
                      <p>Je leert op basis van herhalingen met opslaan van data voor leeranalyses en certificaat.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <FilterDashboard 
            filters={filters}
            setFilters={setFilters}
            opdrachten={opdrachten}
    
            actieveCategorieSelectie={actieveCategorieSelectie}
          />

          {/* Sessie beëindigen knop - alleen in leermodus tijdens actief spel */}
          {isSpelGestart && gameMode === 'single' && isSerieuzeLeerModusActief && (
            <div className="spel-controle-knoppen">
              <button className="eindig-knop" onClick={handleEindigSessie}>
                🏁 Sessie Beëindigen
              </button>
              <p className="sessie-controle-tekst">
                Sluit je leersessie af voor een samenvatting.
              </p>
            </div>
          )}

          {/* Spel beëindigen knop - voor highscore en multiplayer tijdens actief spel */}
          {isSpelGestart && !isSerieuzeLeerModusActief && (
            <div className="spel-controle-knoppen">
              <button className="eindig-knop" onClick={handleEindigSpel}>
                🛑 Spel Beëindigen
              </button>
              <p className="sessie-controle-tekst">
                Hiermee reset je het spel en de scores.
              </p>
            </div>
          )}

          {/* Instellingen knoppen - altijd zichtbaar */}
          <div className="instellingen-knoppen">
            <button className="instellingen-knop" onClick={handleOpenInstellingen}>⚙️ Instellingen</button>
            <button className="instellingen-knop" onClick={handleOpenUitleg}>📖 Uitleg</button>
          </div>

          {/* HAN Logo - altijd zichtbaar */}
          <div className="han-logo-container">
            <img src="/images/Logo-HAN.webp" alt="Logo Hogeschool van Arnhem en Nijmegen" className="han-logo" />
            <p>Ontwikkeld door de opleiding Fysiotherapie van de Hogeschool van Arnhem en Nijmegen.</p>
          </div>
        </aside>

        <main className="right-panel" ref={mainContentRef}>
          <div className={`notificatie-popup ${notificatie.zichtbaar ? 'zichtbaar' : ''} ${notificatie.type}`}>
            {notificatie.bericht}
          </div>
          {isDevMode && import.meta.env.DEV && <DevPanel
            forceResult={forceResult}
            setForceResult={setForceResult}
            simuleerVoltooiing={handleSimuleerVoltooiing}
            forcePromotie={handleForcePromotie}
            resetLeitner={handleResetLeitner}
            forceHerhalingen={handleForceHerhalingen}
            toggleBox0Interval={handleToggleBox0Interval}
            isBox0IntervalVerkort={isBox0IntervalVerkort}
          />}
          {warning && <div className="app-warning">{warning}</div>}
          
          <Fruitautomaat
            titel="Return2Performance"
            key={opdrachtenVoorSelectie.length}
            opdrachten={opdrachtenVoorSelectie}
            spelers={spelers}
            isSpinning={isAanHetSpinnen}
            resultaat={spinResultaat}
            fruitDisplayItems={fruitDisplayItems}
            onSpin={handleSpin}
            isSpinButtonDisabled={isAanHetSpinnen || !heeftVoldoendeSpelers() || isAntwoordVergrendeld}
            spinAnalyse={huidigeSpinAnalyse}
            isGeluidActief={isGeluidActief}
            gamePhase={gamePhase}
            huidigeOpdracht={huidigeOpdracht}
            laatsteBeoordeeldeOpdracht={laatsteBeoordeeldeOpdracht}
            isSerieuzeLeerModusActief={isSerieuzeLeerModusActief}
            leermodusType={leermodusType}
            onPauseOpdracht={handlePauseOpdracht}
            isBeoordelingDirect={isBeoordelingDirect}
            welcomeMessage={gamePhase === 'idle' && !heeftVoldoendeSpelers() && (
              <div className="welkomst-bericht">
                <h3>Welkom!</h3>
                {isSerieuzeLeerModusActief && gameMode === 'single' ? (
                  <>
                    <p>
                      <strong>📚 Leer Modus</strong>
                    </p>
                    <p>Je leerdata wordt automatisch opgeslagen op dit device.</p>
                    <p>Geen naam vereist - focus op leren!</p>
                    <p><strong>Stap 1:</strong> Kies een spelmodus <span className="mobile-hint">(open menu via knop linksboven)</span></p>
                    <p><strong>Stap 2:</strong> Selecteer of pas geselecteerde categorieën aan</p>
                    <p><strong>Stap 3:</strong> Start het spel door rechts op de spin te klikken</p>
                    <p><strong>Tip:</strong> Gebruik de knop rechtsboven voor een volledige schermweergave.</p>
                  </>
                ) : (
                  <>
                    <p><strong>Stap 1:</strong> Kies een spelmodus <span className="mobile-hint">(open menu via knop linksboven)</span></p>
                    <p><strong>Stap 2:</strong> Voeg spelers toe (Highscore en Multiplayer)</p>
                    <p><strong>Stap 3:</strong> Selecteer of pas geselecteerde categorieën aan</p>
                    <p><strong>Stap 4:</strong> Start het spel door rechts op de spin te klikken</p>
                    <p><strong>Tip:</strong> Gebruik de knop rechtsboven voor een volledige schermweergave.</p>
                  </>
                )}
              </div>
            )}
          >
            {gamePhase !== 'idle' && gamePhase !== 'spinning' && huidigeOpdracht && huidigeSpinAnalyse && (
              <ActieDashboard
                ref={actieDashboardRef}
                huidigeOpdracht={huidigeOpdracht}
                spinAnalyse={huidigeSpinAnalyse}
                handleBeoordeling={handleBeoordeling}
                isTimerActief={gamePhase === 'assessment' && isTimerActief}
                gamePhase={gamePhase}
                spelers={spelers}
                huidigeSpeler={huidigeSpeler}
                onPartnerKies={handlePartnerKies}
                onGebruikExtraSpin={handleGebruikExtraSpin}
                isJokerSpinActief={isJokerSpinActief}
                puntenVoorVerdubbeling={puntenVoorVerdubbeling}
                onKopOfMunt={handleKopOfMunt}
                huidigeBonusOpdracht={huidigeBonusOpdracht}
                opgespaardeBonusPunten={opgespaardeBonusPunten}
                onBonusRondeVoltooid={handleBonusRondeVoltooid}
                onKopOfMuntVoltooid={handleKopOfMuntVoltooid}
                isGeluidActief={isGeluidActief}
                isSerieuzeLeerModusActief={isSerieuzeLeerModusActief}
                aantalBeurtenGespeeld={aantalBeurtenGespeeld}

              />
            )}
          </Fruitautomaat>
        </main>
      </div>
    </div>
  );
}

export default App;
