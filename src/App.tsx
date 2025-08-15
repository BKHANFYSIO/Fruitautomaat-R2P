import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

// Data and types
import { useOpdrachten } from './data/useOpdrachten';
import type { Opdracht, Speler, Achievement, GamePhase } from './data/types';
import { getHighScore, saveHighScore, getPersonalBest, savePersonalBest, getHighScoreLibrary, type HighScore } from './data/highScoreManager';
import { getLeerDataManager } from './data/leerDataManager';
import { getHybridTipRich } from './data/tipsEngine';
import { TIPS_CONFIG } from './data/tipsConfig';
import { buildTipsAnalyticsSnapshot } from './utils/analyticsSnapshot';
import { BONUS_OPDRACHTEN, SYMBOLEN } from './data/constants';

// Components
// left panel subcomponents worden via LeftPanel gebruikt
// Fruitautomaat en ActieDashboard zijn via RightPanel ingepakt
import { OrientatieMelding } from './components/OrientatieMelding';
import { Eindscherm } from './components/Eindscherm';
// SessieSamenvatting zit in AppModals
import { AchievementNotificatie } from './components/AchievementNotificatie';
// Leeranalyse en overige modals zitten in AppModals
// import { DevPanel } from './components/DevPanel';
// FilterDashboard zit in LeftPanel
import { LeftPanel } from './components/LeftPanel';
import { MobileControls } from './components/MobileControls';
import { AppModals } from './components/AppModals';
import { RightPanel } from './components/RightPanel';
import { DevPanelModal } from './components/DevPanelModal';


// Hooks
import { useAudio } from './hooks/useAudio';
import { useWindowSize } from './hooks/useWindowSize';
import { useSwipe } from './hooks/useSwipe';
import { useMobileScoreLade } from './hooks/useMobileScoreLade';
import { useLeitnerStats } from './hooks/useLeitnerStats';
import { useGameEngine } from './hooks/useGameEngine';
import { useSettings } from './context/SettingsContext';
import { useCategorieSelectie } from './hooks/useCategorieSelectie';
import type { ModeKey } from './hooks/useCategorieSelectie';
import { useNotificatie } from './hooks/useNotificatie';
import { useSessie } from './hooks/useSessie';
import { useFullscreen } from './hooks/useFullscreen';
import { useScrollToTop } from './hooks/useScrollToTop';
import { useBestandsUpload } from './hooks/useBestandsUpload';
// import { useSpinFlow } from './hooks/useSpinFlow';

// Styles
import './App.css';


// Notificatie type en beheer verplaatst naar useNotificatie

// type OpdrachtBronFilter = 'alle' | 'systeem' | 'gebruiker'; // Niet gebruikt

function App() {
  // Testtrigger voor ErrorBoundary in dev: voeg ?forceError=1 toe aan de URL
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('forceError')) {
    throw new Error('Geforceerde testfout voor ErrorBoundary');
  }
  // Refs
  const mainContentRef = useRef<HTMLDivElement>(null);
  const actieDashboardRef = useRef<HTMLDivElement>(null);

  // Data hooks
  // Je kunt hier meerdere paden opgeven; alle geldige bestanden worden samengevoegd
  // Je kunt óf expliciete paden geven, óf een simpele glob: '/opdrachten*.xlsx'
  const { opdrachten, loading, warning, laadNieuweOpdrachten, parseExcelData, verwijderGebruikerOpdrachten } = useOpdrachten('/opdrachten*.xlsx');

  // Maak waarschuwing wegklikbaar: luister naar event en wis waarschuwing lokaal
  const [dismissedWarning, setDismissedWarning] = useState<string | null>(null);
  useEffect(() => {
    const handler = () => setDismissedWarning(warning || '');
    window.addEventListener('app:clear-warning' as any, handler);
    return () => window.removeEventListener('app:clear-warning' as any, handler);
  }, [warning]);
  
  // Effect om opdrachten door te geven aan de data manager
  useEffect(() => {
    if (opdrachten.length > 0) {
      const leerDataManager = getLeerDataManager();
      leerDataManager.setAlleOpdrachten(opdrachten);
    }
  }, [opdrachten]);

  




  
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
    isHulpElementenZichtbaar,
    setIsJokerSpinActief,
    isBonusOpdrachtenActief,
    isSpinVergrendelingActief,
    setIsSpinVergrendelingActief,
    isAutomatischScorebordActief,
    bonusKans,
    forceerMobieleWeergave,
    isSerieuzeLeerModusActief,
    setIsSerieuzeLeerModusActief,
    setIsLeerFeedbackActief,
    leermodusType,
    setLeermodusType,
    maxNewLeitnerQuestionsPerDay,
    isBox0IntervalVerkort,
    setIsBox0IntervalVerkort,
    negeerBox0Wachttijd,
    // Kale modus instellingen
    isKaleModusActiefVrijeLeermodus,
    isKaleModusActiefLeitnerLeermodus,
    // Gegroepeerde per-modus settings (read-only)
    actieveLeermodusInstellingen,
    // Tips per modus
    isLeerstrategietipsActiefVrijeLeermodus,
    isLeerstrategietipsActiefLeitnerLeermodus,
    // Focus-stand per modus
    isFocusStandActiefHighscore,
    isFocusStandActiefMultiplayer,
    // Selectie op niveau per modus
    selectieOpNiveauHighscore,
    ongedefinieerdGedragHighscore,
    selectieOpNiveauMultiplayer,
    ongedefinieerdGedragMultiplayer,
    selectieOpNiveauVrije,
    ongedefinieerdGedragVrije,
  } = useSettings();

  // Bepaal mode-key voor filters per modus
  const activeModeKey: ModeKey = useMemo(() => {
    if (gameMode === 'multi') return 'multiplayer';
    if (isSerieuzeLeerModusActief) return leermodusType === 'leitner' ? 'leitner' : 'normaal';
    return 'highscore';
  }, [gameMode, isSerieuzeLeerModusActief, leermodusType]);

  // Categorie selectie en filters (uitgelicht in aparte hook)
  const {
    filters,
    setFilters,
    geselecteerdeCategorieen,
    setGeselecteerdeCategorieen,
    geselecteerdeLeitnerCategorieen,
    setGeselecteerdeLeitnerCategorieen,
    geselecteerdeMultiplayerCategorieen,
    setGeselecteerdeMultiplayerCategorieen,
    geselecteerdeHighscoreCategorieen,
    setGeselecteerdeHighscoreCategorieen,
    opdrachtenVoorSelectie,
    alleUniekeCategorieen,
  } = useCategorieSelectie(opdrachten, activeModeKey);

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

  // Bepaal focus-stand per huidige modus
  const isFocusHighscore = gameMode === 'single' && !isSerieuzeLeerModusActief && isFocusStandActiefHighscore;
  const isFocusMultiplayer = gameMode === 'multi' && isFocusStandActiefMultiplayer;

  // Bepaal of kale modus actief is voor de hele component
  const isKaleModusActiefGlobal = Boolean(
    actieveLeermodusInstellingen?.isKaleModusActief ||
    isFocusHighscore ||
    isFocusMultiplayer
  );

  // Bepaal de huidige spelmodus voor automatische tab selectie
  const getCurrentGameMode = (): 'highscore' | 'multiplayer' | 'vrijeleermodus' | 'leitnerleermodus' => {
    if (gameMode === 'multi') {
      return 'multiplayer';
    } else if (isSerieuzeLeerModusActief) {
      if (leermodusType === 'leitner') {
        return 'leitnerleermodus';
      } else {
        return 'vrijeleermodus';
      }
    } else {
      return 'highscore';
    }
  };
// (verplaatst naar useCategorieSelectie)
const [isInstellingenOpen, setIsInstellingenOpen] = useState(false);
  const [isUitlegOpen, setIsUitlegOpen] = useState(false);
  const [isLeerstrategienOpen, setIsLeerstrategienOpen] = useState(false);
  const [isScoreLadeOpen, setIsScoreLadeOpen] = useState(false);
  const [isModeSelectedThisSession, setIsModeSelectedThisSession] = useState(false);
  const { toggleFullscreen } = useFullscreen();
  const { notificatie, showNotificatie, hideNotificatie } = useNotificatie();
  const [isAntwoordVergrendeld, setIsAntwoordVergrendeld] = useState(false);
  const [isCategorieBeheerOpen, setIsCategorieBeheerOpen] = useState(false);
  const [isCategorieSelectieOpen, setIsCategorieSelectieOpen] = useState(false);

  const [categorieSelectieActiveTab, setCategorieSelectieActiveTab] = useState<'highscore' | 'multiplayer' | 'normaal' | 'leitner'>('normaal');
  const [categorieSelectieInnerTab, setCategorieSelectieInnerTab] = useState<'categories' | 'filters' | 'saved' | undefined>(undefined);
  const [isLimietModalOpen, setIsLimietModalOpen] = useState(false);
  const [isOpdrachtenVoltooidModalOpen, setIsOpdrachtenVoltooidModalOpen] = useState(false);
const [limietWaarschuwingGenegeerd, setLimietWaarschuwingGenegeerd] = useState(false);

  // Globale notificatie-listener zodat subcomponenten via window events meldingen kunnen tonen
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ message: string; type?: 'succes' | 'fout'; timeoutMs?: number }>;
      if (ev.detail && ev.detail.message) {
        showNotificatie(ev.detail.message, ev.detail.type || 'succes', ev.detail.timeoutMs ?? 4000);
        // Toon optionele footer-links wanneer relevant
        if (ev.detail.message.includes('Leerstrategieën')) {
          const el = document.getElementById('footer-link-leerstrategien');
          if (el) el.style.display = 'inline';
        }
        if (ev.detail.message.includes('Leeranalyse')) {
          const el = document.getElementById('footer-link-leeranalyse');
          if (el) el.style.display = 'inline';
        }
      }
    };
    window.addEventListener('app:notify', handler as EventListener);
    return () => window.removeEventListener('app:notify', handler as EventListener);
  }, [showNotificatie]);

  // Luister naar modus-selectie in deze sessie (voor stap-animaties)
  useEffect(() => {
    const markSelected = () => setIsModeSelectedThisSession(true);
    window.addEventListener('modeSelectedThisSession', markSelected as EventListener);
    return () => window.removeEventListener('modeSelectedThisSession', markSelected as EventListener);
  }, []);

  // Globale event listener om leerstrategieën modal te openen
  useEffect(() => {
    const open = () => setIsLeerstrategienOpen(true);
    window.addEventListener('openLeerstrategien', open);
    return () => window.removeEventListener('openLeerstrategien', open);
  }, []);

  // State om bij te houden of de multiplayer waarschuwing al is getoond
  const [multiplayerWaarschuwingGetoond, setMultiplayerWaarschuwingGetoond] = useState(false);

  // File upload state verplaatst naar useBestandsUpload

  // High score state
  const [currentHighScore, setCurrentHighScore] = useState<HighScore | null>(null);
  const [isNieuwRecord, setIsNieuwRecord] = useState(false);
  const [currentPersonalBest, setCurrentPersonalBest] = useState<HighScore | null>(null);
  const [isNieuwPersoonlijkRecord, setIsNieuwPersoonlijkRecord] = useState(false);
  const [highScoreLibrary, setHighScoreLibrary] = useState(() => getHighScoreLibrary());

  // Dev mode state
  // const [isDevMode, setIsDevMode] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [forceResult, setForceResult] = useState<(string | null)[]>([null, null, null]);
  const [isBeoordelingDirect] = useState(false);

  const { width } = useWindowSize();
  const isMobieleWeergave = forceerMobieleWeergave || width <= 1280;
  const { scrollToTop, scrollToDashboard } = useScrollToTop(mainContentRef as unknown as React.RefObject<HTMLElement | null>);

  // Handlers voor kop-of-munt, partnerkeuze en bonus worden na state-declaraties geïnitialiseerd

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

  // Centrale helper voor score-lade in mobiel
  const { autoShow: autoShowScoreLade } = useMobileScoreLade(
    isMobieleWeergave,
    isAutomatischScorebordActief,
    setIsScoreLadeOpen
  );

  // Effect om de spelerslijst te resetten bij het wisselen naar single-player
  useEffect(() => {
    // Als je van modus wisselt, begin je altijd met een schone lei.
    if (spelers.length > 0) {
      setSpelers([]); // Verwijder alle spelers
    }
  }, [gameMode]);

  // Effect om highscore library bij te werken wanneer er een naam wordt gewijzigd
  useEffect(() => {
    const handleHighscoreLibraryUpdate = () => {
      setHighScoreLibrary(getHighScoreLibrary());
    };

    window.addEventListener('highscoreLibraryUpdated', handleHighscoreLibraryUpdate);
    return () => {
      window.removeEventListener('highscoreLibraryUpdated', handleHighscoreLibraryUpdate);
    };
  }, []);

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

  // Leerdata sessiebeheer
  const { huidigeSessieId, setHuidigeSessieId, startSessie, endSessie } = useSessie({ isSerieuzeLeerModusActief, gameMode });
  const [opdrachtStartTijd, setOpdrachtStartTijd] = useState<number | null>(null);
  
  // Sessie controle
  const [isSessieSamenvattingOpen, setIsSessieSamenvattingOpen] = useState(false);
  const [eindigdeSessieData, setEindigdeSessieData] = useState<any>(null);
  const [isLeeranalyseOpen, setIsLeeranalyseOpen] = useState(false);
  const [openLeeranalyseToAchievements, setOpenLeeranalyseToAchievements] = useState(false);
  const [nieuweAchievement, setNieuweAchievement] = useState<Achievement | null>(null);
  const [laatsteBeoordeeldeOpdracht, setLaatsteBeoordeeldeOpdracht] = useState<{ opdracht: any; type: string; box?: number } | null>(null);
  // Tips-ritme state (serieuze leermodus)
  const [tipsShownThisSession, setTipsShownThisSession] = useState(0);
  const [eligibleWinsSinceLastTip, setEligibleWinsSinceLastTip] = useState(0);

  // gefilterdeGeselecteerdeLeitnerCategorieen stond al lager; deze versie vervangt die en wordt boven gebruikt door de hook
  const gefilterdeGeselecteerdeLeitnerCategorieen = useMemo(() => {
    return geselecteerdeLeitnerCategorieen.filter(cat => alleUniekeCategorieen.includes(cat));
  }, [geselecteerdeLeitnerCategorieen, alleUniekeCategorieen]);

  const {
    leitnerStats,
    aantalNieuweLeitnerOpdrachten,
    isBox0OverrideActief,
    // refreshLeitnerStats,
    setLeitnerStatsDirect,
  } = useLeitnerStats({
    leermodusType,
    isSerieuzeLeerModusActief,
    opdrachten,
    opdrachtenVoorSelectie,
    geselecteerdeLeitnerCategorieenGefilterd: gefilterdeGeselecteerdeLeitnerCategorieen,
    negeerBox0Wachttijd,
    extraRecalcDeps: [filters],
  });

  // --- DEV PANEL FUNCTIES ---
  const handleSimuleerVoltooiing = () => {
    const leerDataManager = getLeerDataManager();
    const nieuweAchievements = leerDataManager.updateHerhalingAchievements();
    
    nieuweAchievements.forEach((achievement, index) => {
      setTimeout(() => setNieuweAchievement(achievement as unknown as Achievement), index * 1000);
    });
    
    // Forceer een re-render om stats bij te werken
    const stats = leerDataManager.getLeitnerStatistiekenVoorCategorieen(geselecteerdeCategorieen);
    setLeitnerStatsDirect(stats);
    
    showNotificatie('Dagelijkse herhalingen voltooid en achievements gecontroleerd!', 'succes', 6000);
  };

  const handleForcePromotie = (boxNummer: number) => {
    const leerDataManager = getLeerDataManager();
    // Deze functie is een placeholder. We moeten een manier vinden om een opdracht te promoten.
    // Voor nu roepen we de check direct aan voor de demo.
    const leitnerData = leerDataManager.loadLeitnerData();
    const nieuweAchievement = leerDataManager['checkPromotieAchievement'](boxNummer, leitnerData);
    
    if (nieuweAchievement) {
      setNieuweAchievement(nieuweAchievement as unknown as Achievement);
      showNotificatie(`Achievement voor het bereiken van Box ${boxNummer} geforceerd!`, 'succes', 6000);
    } else {
      showNotificatie(`Kon geen achievement forceren voor Box ${boxNummer}. Mogelijk al behaald.`, 'fout', 4000);
    }
  };

  const handleResetLeitner = () => {
    const leerDataManager = getLeerDataManager();
    localStorage.removeItem('fruitautomaat_leitner_' + leerDataManager.getSpelerId());
    // Forceer re-render van stats
    setLeitnerStatsDirect({ totaalOpdrachten: 0, vandaagBeschikbaar: 0, reguliereHerhalingenBeschikbaar: 0 });
      showNotificatie('Leitner data en pogingen zijn gereset. Herlaad de pagina om de wijzigingen volledig te zien.', 'succes', 7000);
  };

  const handleForceHerhalingen = (boxId: number, aantal: number) => {
    // Stap 1: Forceer de data en krijg de relevante categorieën direct terug.
    const leerDataManager = getLeerDataManager();
    const { toegevoegd, categorieen } = leerDataManager.forceerHerhalingenInBox(opdrachten, aantal, boxId);

    if (toegevoegd === 0) {
      showNotificatie('Kon geen nieuwe opdrachten forceren. Mogelijk zijn alle opdrachten al in het leersysteem.', 'fout', 7000);
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
    setLeitnerStatsDirect(stats);
    
    showNotificatie(`${toegevoegd} opdrachten geforceerd naar Box ${boxId}. Leermodus is actief en categorieën zijn gezet.`, 'succes', 7000);
  };

  const handleToggleBox0Interval = () => {
    const leerDataManager = getLeerDataManager();
    const leitnerData = leerDataManager.loadLeitnerData();
    const huidigeInterval = leitnerData.boxIntervallen[0];
    
    if (huidigeInterval === 10) {
      // Verander naar 15 seconden (0.25 minuten)
      leerDataManager.setTijdelijkInterval(0, 0.25);
      setIsBox0IntervalVerkort(true);
      showNotificatie('Box 0 interval gewijzigd naar 15 seconden voor snelle herhaling.', 'succes', 6000);
    } else {
      // Reset naar 10 minuten
      leerDataManager.setTijdelijkInterval(0, 10);
      setIsBox0IntervalVerkort(false);
      showNotificatie('Box 0 interval gereset naar 10 minuten.', 'succes', 6000);
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

  // Effect om de 'd' toets te gebruiken voor DevPanelModal (geen in-page devpanel meer)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'd') {
          setIsDevPanelOpen(prev => !prev);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // Effect om categorie selectie te openen via custom event
  useEffect(() => {
    const handleOpenCategorieSelectie = (e: Event) => {
      const ce = e as CustomEvent<any>;
      const tab = ce?.detail?.tab as 'highscore' | 'multiplayer' | 'normaal' | 'leitner' | undefined;
      const inner = ce?.detail?.innerTab as 'categories' | 'filters' | 'saved' | undefined;
      // Stel eerst de gewenste tab in voordat we openen
      if (tab) setCategorieSelectieActiveTab(tab);
      if (inner) setCategorieSelectieInnerTab(inner);
      // Sluit Leitner modal en open de categorie-selectie modal in een microtask
      setIsCategorieBeheerOpen(false);
      queueMicrotask(() => setIsCategorieSelectieOpen(true));
    };
    window.addEventListener('openCategorieSelectie', handleOpenCategorieSelectie as EventListener);
    return () => window.removeEventListener('openCategorieSelectie', handleOpenCategorieSelectie as EventListener);
  }, []);

  // Effect om leeranalyse te openen via custom event
  useEffect(() => {
    const handleOpenLeeranalyse = (e: Event) => {
      const ce = e as CustomEvent<{ tab?: 'overzicht'|'categorieen'|'achievements'|'leitner'|'tijdlijn' }>;
      setIsScoreLadeOpen(false);
      setOpenLeeranalyseToAchievements(Boolean(ce?.detail?.tab && ce.detail.tab === 'achievements'));
      setIsLeeranalyseOpen(true);
    };

    window.addEventListener('openLeeranalyse', handleOpenLeeranalyse as EventListener);
    return () => window.removeEventListener('openLeeranalyse', handleOpenLeeranalyse as EventListener);
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

  // Effect om de high score te laden voor HIGHscore-modus (single, niet-serieuze leer-modus)
  useEffect(() => {
    if (gameMode === 'single' && !isSerieuzeLeerModusActief) {
      const categories = geselecteerdeHighscoreCategorieen;
      if (categories.length > 0) {
        setCurrentHighScore(getHighScore(categories));
      } else {
        setCurrentHighScore(null);
      }
    } else {
      setCurrentHighScore(null);
    }
  }, [gameMode, isSerieuzeLeerModusActief, geselecteerdeHighscoreCategorieen, highScoreLibrary]);



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
    // Reset tips-ritme
    setTipsShownThisSession(0);
    setEligibleWinsSinceLastTip(0);
  };

  // Volledig gefilterde opdrachten op basis van bron en type
  // (verplaatst naar useCategorieSelectie)

  const gefilterdeGeselecteerdeCategorieen = useMemo(() => {
    return geselecteerdeCategorieen.filter(cat => alleUniekeCategorieen.includes(cat));
  }, [geselecteerdeCategorieen, alleUniekeCategorieen]);

  const gefilterdeGeselecteerdeHighscoreCategorieen = useMemo(() => {
    return geselecteerdeHighscoreCategorieen.filter(cat => alleUniekeCategorieen.includes(cat));
  }, [geselecteerdeHighscoreCategorieen, alleUniekeCategorieen]);

  const gefilterdeGeselecteerdeMultiplayerCategorieen = useMemo(() => {
    return geselecteerdeMultiplayerCategorieen.filter(cat => alleUniekeCategorieen.includes(cat));
  }, [geselecteerdeMultiplayerCategorieen, alleUniekeCategorieen]);

  // Leitner statistieken effect is verplaatst naar useLeitnerStats

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

  // (opslaan debounced verplaatst naar useCategorieSelectie)



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
      showNotificatie('Deze speler bestaat al.', 'fout', 6000);
      return;
    }
    const nieuweSpeler: Speler = { naam, score: 0, extraSpins: 0, beurten: 0 };
    setSpelers([...spelers, nieuweSpeler]);
  };

  // Sessie controle functies
  const handleEindigSessie = () => {
    if (!huidigeSessieId) return;
    const sessieData = endSessie();
      if (sessieData) {
        setEindigdeSessieData(sessieData);
        setIsSessieSamenvattingOpen(true);
      }
      setIsSpelGestart(false);
    setIsAntwoordVergrendeld(false);
  };

  // Reset fruitautomaat state voor schone start
  const resetFruitautomaatState = () => {
    setHuidigeOpdracht(null);
    setLaatsteBeoordeeldeOpdracht(null);
    setHuidigeSpinAnalyse(null);
    setGamePhase('idle');
    setIsAntwoordVergrendeld(false);
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
        
      showNotificatie(`Geen opdrachten beschikbaar. ${melding}`, 'fout', 7000);
      return;
    }

    // Specifieke checks voor spelmodi
    if (gameMode === 'single' && !isSerieuzeLeerModusActief && !isFocusHighscore && gefilterdeOpdrachten.length < 10) {
      showNotificatie(`Highscore modus vereist minimaal 10 unieke opdrachten. Je hebt er nu ${gefilterdeOpdrachten.length} geselecteerd. Selecteer meer categorieën.`, 'fout', 8000);
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
      // Scroll naar het dashboard zodat scorebord/leer-dashboard zichtbaar is
      scrollToDashboard();
      
      // Toon sessie start melding bij eerste spin in serieuze leer-modus
      if (isSerieuzeLeerModusActief && gameMode === 'single') {
        showNotificatie('📚 Sessie gestart! Vergeet niet je sessie te eindigen voor een samenvatting.', 'succes', 7000);
      }
    }
    
    // Start nieuwe sessie als er geen actieve sessie is en we in serieuze leer-modus zijn
    if (isSerieuzeLeerModusActief && gameMode === 'single' && !huidigeSessieId) {
      const nieuwe = startSessie(leermodusType);
      if (nieuwe) {
        showNotificatie('📚 Nieuwe sessie gestart!', 'succes', 6000);
        // Scroll naar het dashboard bij start van een sessie
        scrollToDashboard();
        // Reset tip-ritme bij start van een nieuwe sessie
        setTipsShownThisSession(0);
        setEligibleWinsSinceLastTip(0);
      }
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
      
      // Scroll naar het dashboard zodat dashboard zichtbaar is
      scrollToDashboard();
    }
  };

  const voerSpinUit = (gekozenSpeler: Speler) => {
    // Bepaal of kale modus actief is
    const isKaleModusActief = (
      (isSerieuzeLeerModusActief && gameMode === 'single' && leermodusType === 'leitner' && isKaleModusActiefLeitnerLeermodus) ||
      (isSerieuzeLeerModusActief && gameMode === 'single' && leermodusType === 'normaal' && isKaleModusActiefVrijeLeermodus) ||
      isFocusHighscore ||
      isFocusMultiplayer
    );
    
      // Alleen geluid en animatie spelen als kale modus niet actief is
  if (!isKaleModusActief) {
    playSpinStart();
  }
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
        setIsOpdrachtenVoltooidModalOpen(true);
        setIsAanHetSpinnen(false);
        setGamePhase('idle');
        return;
      }
    } else {
      // Niet-Leitner selectie (single normaal, highscore, multiplayer): pas niveau-strategie toe
      const strategienaam = ((): 'random' | 'ascending' => {
        if (gameMode === 'multi') return selectieOpNiveauMultiplayer;
        if (!isSerieuzeLeerModusActief) return selectieOpNiveauHighscore; // single highscore
        return selectieOpNiveauVrije; // single normaal serieuze modus
      })();
      const undefGedrag = ((): 'mix' | 'last' => {
        if (gameMode === 'multi') return ongedefinieerdGedragMultiplayer;
        if (!isSerieuzeLeerModusActief) return ongedefinieerdGedragHighscore;
        return ongedefinieerdGedragVrije;
      })();

      const poolRecentGefilterd = gefilterdeOpdrachten.filter(
        op => !recentGebruikteOpdrachten.find(ruo => ruo.Opdracht === op.Opdracht)
      );
      const basisPool = poolRecentGefilterd.length > 0 ? poolRecentGefilterd : gefilterdeOpdrachten;

      let kiesPool = basisPool;
      if (strategienaam === 'ascending') {
        const g1 = basisPool.filter(op => (op as any).niveau === 1);
        const g2 = basisPool.filter(op => (op as any).niveau === 2);
        const g3 = basisPool.filter(op => (op as any).niveau === 3);
        const undef = basisPool.filter(op => (op as any).niveau === undefined);
        const basis = ([] as typeof basisPool).concat(...[g1, g2, g3].filter(g => g.length > 0));
        if (basis.length > 0) {
          kiesPool = basis;
          if (undefGedrag === 'mix' && undef.length > 0) {
            kiesPool = [...basis, ...undef];
          }
        } else {
          // geen gedefinieerde niveaus beschikbaar → alleen undef over
          kiesPool = undef.length > 0 ? undef : basisPool;
        }
      } else if (strategienaam === 'random') {
        if (undefGedrag === 'last') {
          const metNiv = basisPool.filter(op => (op as any).niveau !== undefined);
          kiesPool = metNiv.length > 0 ? metNiv : basisPool;
        }
      }

      gekozenOpdracht = kiesPool[Math.floor(Math.random() * kiesPool.length)];
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
    const timeoutDuration = isKaleModusActief ? 100 : 3600; // Korte timeout voor kale modus
    
    setTimeout(() => {
      setHuidigeOpdracht({ opdracht: gekozenOpdracht!, type: opdrachtType, box: boxNummer });
      setHuidigeSpeler(gekozenSpeler);
      const jackpotSymbols = nieuweJackpotIndices.map(i => SYMBOLEN[i].symbool);
      
      // Gebruik de juiste speler array voor analyse
      const spelerArrayVoorAnalyse = isSerieuzeLeerModusActief && gameMode === 'single' 
        ? [gekozenSpeler] // Gebruik alleen de virtuele speler
        : spelers; // Gebruik normale speler array
      
      // In focus-stand (highscore/multiplayer) zijn bonusmechanieken uit
      const effectiveBonusActief = isBonusOpdrachtenActief && !isFocusHighscore && !isFocusMultiplayer;
      const analyse = analyseerSpin(jackpotSymbols, spelerArrayVoorAnalyse, gameMode, isSerieuzeLeerModusActief, effectiveBonusActief);
      setHuidigeSpinAnalyse(analyse);
      setIsAanHetSpinnen(false);

      // Toon tips rustig en alleen bij sterke combinaties: drie dezelfde zonder joker
      const tipsActiefVoorHuidigeModus = leermodusType === 'leitner' ? isLeerstrategietipsActiefLeitnerLeermodus : isLeerstrategietipsActiefVrijeLeermodus;
      if (!isKaleModusActief && gameMode === 'single' && isSerieuzeLeerModusActief && tipsActiefVoorHuidigeModus) {
        const STRONG_SYMBOLS = new Set(['🍒','🍋','🍉','7️⃣','🔔']);
        const isDrieHetzelfde = jackpotSymbols.length === 3 && jackpotSymbols.every(s => s === jackpotSymbols[0]);
        const sym = jackpotSymbols[0];
        const isZonderJoker = !jackpotSymbols.includes('🃏');
        const isSterkeCombinatie = isDrieHetzelfde && isZonderJoker && STRONG_SYMBOLS.has(sym);

        if (isSterkeCombinatie && analyse.beschrijving && analyse.beschrijving !== 'Geen combinatie.' && analyse.beschrijving !== 'Blijf leren en groeien!') {
          const TIP_INTERVAL = TIPS_CONFIG.tipInterval;
          const MAX_TIPS_PER_SESSIE = TIPS_CONFIG.maxTipsPerSession;
          const magNogTippen = tipsShownThisSession < MAX_TIPS_PER_SESSIE;
          const isTipBeurt = (eligibleWinsSinceLastTip + 1) >= TIP_INTERVAL;

          if (magNogTippen && isTipBeurt) {
            // Bepaal combinatie-key voor tipsEngine
            let comboKey: string | undefined = undefined;
            switch (sym) {
              case '🍒': comboKey = 'drie_kersen'; break;
              case '🍋': comboKey = 'drie_citroenen'; break;
              case '🍉': comboKey = 'drie_meloenen'; break;
              case '7️⃣': comboKey = 'drie_lucky_7s'; break;
              case '🔔': comboKey = 'drie_bellen'; break;
            }
            const analytics = buildTipsAnalyticsSnapshot();
            const rich = getHybridTipRich(comboKey, {
              leermodusType,
              sessionId: huidigeSessieId ?? undefined,
              spinsSoFar: aantalBeurtenGespeeld,
              selectedCategoriesCount: actieveCategorieSelectie.length,
              // Analyse snapshot
              ...analytics,
            });
            const tipText = rich?.tekst || analyse.beschrijving;
            if (rich?.cta?.event === 'openLeeranalyse') {
              showNotificatie(tipText, 'succes', 8000, {
                label: 'Bekijk leeranalyse',
                onClick: () => window.dispatchEvent(new CustomEvent('openLeeranalyse')),
              });
            } else {
              showNotificatie(tipText, 'succes', 8000);
            }
            // Optioneel: toon link in footer wanneer een leerstrategie-tip 3x gezien is in deze sessie
            if (rich?.bron === 'modus') {
              const key = 'tips_strategie_herhaling_sessie';
              const count = Number(sessionStorage.getItem(key) || '0') + 1;
              sessionStorage.setItem(key, String(count));
              if (count === 3) {
                window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Meer weten over leerstrategieën? Klik hieronder op “Leerstrategieën”.', type: 'succes', timeoutMs: 6000 } }));
              }
            }
            setTipsShownThisSession(prev => prev + 1);
            setEligibleWinsSinceLastTip(0);
          } else {
            // Heldere voortgang naar eerstvolgende tip
            if (!magNogTippen) {
              showNotificatie('Tiplimiet bereikt voor deze sessie.', 'succes', 4000);
            } else {
              const currentCount = eligibleWinsSinceLastTip + 1; // na deze winst
              const remaining = TIP_INTERVAL - currentCount;
              const msg = remaining === 1
                ? `Nog 1 winnende fruitcombinatie voor een tip (${currentCount}/${TIP_INTERVAL}).`
                : `Nog ${remaining} winnende fruitcombinaties voor een tip (${currentCount}/${TIP_INTERVAL}).`;
              showNotificatie(msg, 'succes', 3500);
            }
            setEligibleWinsSinceLastTip(prev => prev + 1);
          }
        }
      }

      const effectiveJokerActief = isJokerSpinActief && !isFocusHighscore && !isFocusMultiplayer;
      if (effectiveJokerActief && analyse.verdiendeSpins > 0) {
        playJokerWin(); // Speel joker win geluid
        setVerdiendeSpinsDezeBeurt(analyse.verdiendeSpins); // Sla op in tijdelijke state
        showNotificatie(`${gekozenSpeler.naam} verdient ${analyse.verdiendeSpins} extra spin(s)! Deze kan vanaf de volgende beurt ingezet worden.`, 'succes', 8000);
      }

      if (!isFocusHighscore && !isFocusMultiplayer && analyse.actie === 'bonus_opdracht' && isBonusOpdrachtenActief) {
        playBonusStart(); // Speel bonus start geluid
        const bonusOpdracht = bonusOpdrachten[Math.floor(Math.random() * bonusOpdrachten.length)];
        setHuidigeBonusOpdracht(bonusOpdracht);
        setGamePhase('bonus_round');
      } else if (!isFocusHighscore && !isFocusMultiplayer && analyse.actie === 'partner_kiezen') {
        setGamePhase('partner_choice');
      } else {
        setGamePhase('assessment');
      }
      if (isSpinVergrendelingActief) {
        setIsAntwoordVergrendeld(true);
      }
    }, timeoutDuration);
  };


  // (verplaatst naar useSpinFlow)

  useEffect(() => {
    if (gameMode === 'single' && !isSerieuzeLeerModusActief && spelers.length === 1) {
      const spelerNaam = spelers[0].naam;
      const categories = geselecteerdeHighscoreCategorieen;
      if (categories.length > 0) {
        setCurrentPersonalBest(getPersonalBest(categories, spelerNaam));
      } else {
        setCurrentPersonalBest(null);
      }
    } else {
      setCurrentPersonalBest(null);
    }
  }, [gameMode, isSerieuzeLeerModusActief, geselecteerdeHighscoreCategorieen, spelers]);

  const checkSpelEinde = useCallback((speler?: Speler) => {
    if (gameMode === 'single' && speler) {
      if (isFocusHighscore) {
        // Geen highscore opslag en geen nieuw-record geluid in focus-stand
        setIsNieuwRecord(false);
        setIsNieuwPersoonlijkRecord(false);
        playGameEnd();
      } else {
        // Gebruik de juiste categorieën voor highscore modus
        // Voor highscore modus, gebruik altijd de categorieën die daadwerkelijk zijn geselecteerd
        let categoriesToUse: string[];
        if (isFocusHighscore) {
          // Probeer eerst geselecteerdeHighscoreCategorieen, anders probeer localStorage
          if (geselecteerdeHighscoreCategorieen.length > 0) {
            categoriesToUse = geselecteerdeHighscoreCategorieen;
          } else {
            try {
              const saved = localStorage.getItem('geselecteerdeCategorieen_highscore');
              categoriesToUse = saved ? JSON.parse(saved) : [];
            } catch {
              categoriesToUse = [];
            }
          }
        } else {
          categoriesToUse = geselecteerdeCategorieen;
        }
        
        const wasNieuwRecord = saveHighScore(categoriesToUse, speler.score, speler.naam);
        const wasNieuwPb = savePersonalBest(categoriesToUse, speler.score, speler.naam);
        setIsNieuwRecord(wasNieuwRecord);
        setIsNieuwPersoonlijkRecord(wasNieuwPb);
        

        
        // Update highscore library als er een nieuwe highscore is opgeslagen
        if (wasNieuwRecord) {
          const newLibrary = getHighScoreLibrary();
          setHighScoreLibrary(newLibrary);
        }
        
        // Als categoriesToUse leeg is maar er wel categorieën in localStorage staan, gebruik die
        if (categoriesToUse.length === 0) {
          try {
            const saved = localStorage.getItem('geselecteerdeCategorieen_highscore');
            if (saved) {
              const parsedCategories = JSON.parse(saved);
              if (parsedCategories.length > 0) {
                // Probeer de highscore opnieuw op te slaan met de geladen categorieën
                const wasNieuwRecordRetry = saveHighScore(parsedCategories, speler.score, speler.naam);
                const wasNieuwPbRetry = savePersonalBest(parsedCategories, speler.score, speler.naam);
                setIsNieuwRecord(wasNieuwRecordRetry);
                setIsNieuwPersoonlijkRecord(wasNieuwPbRetry);
                
                // Update highscore library als er een nieuwe highscore is opgeslagen
                if (wasNieuwRecordRetry) {
                  const newLibrary = getHighScoreLibrary();
                  setHighScoreLibrary(newLibrary);
                }
              }
            }
          } catch (error) {
            console.error('Fout bij het laden van categorieën uit localStorage:', error);
          }
        }
        
        // Speel geluid op basis van resultaat
        if (wasNieuwRecord) {
          playNewRecord(); // Nieuw record geluid
        } else {
          playGameEnd(); // Normaal einde geluid
        }
      }
    } else {
      // Multiplayer einde
      playMultiplayerEnd(); // Feestelijk einde geluid
    }
    setGamePhase('ended');
  }, [gameMode, geselecteerdeCategorieen, geselecteerdeHighscoreCategorieen, playNewRecord, playGameEnd, playMultiplayerEnd, isFocusHighscore]);

  const handlePauseOpdracht = useCallback(() => {
    const opdrachtOmTePauzeren = huidigeOpdracht || laatsteBeoordeeldeOpdracht;
    if (opdrachtOmTePauzeren && isSerieuzeLeerModusActief && leermodusType === 'leitner') {
      const leerDataManager = getLeerDataManager();
      const opdrachtId = `${opdrachtOmTePauzeren.opdracht.Hoofdcategorie || 'Overig'}_${opdrachtOmTePauzeren.opdracht.Categorie}_${opdrachtOmTePauzeren.opdracht.Opdracht.substring(0, 20)}`;
      leerDataManager.pauseOpdracht(opdrachtId);
      
      // Reset de laatste beoordeelde opdracht
      setLaatsteBeoordeeldeOpdracht(null);
      
      // Toon notificatie
      showNotificatie('Opdracht gepauzeerd! Deze komt niet terug tot de pauze wordt gestopt.', 'succes', 6000);
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
        leermodusType
      );
      
      // Toon notificatie voor nieuwe achievements
      if (nieuweAchievements.length > 0) {
        setNieuweAchievement(nieuweAchievements[0]); // Toon de eerste nieuwe achievement
      }

      // Forceer een re-render om stats bij te werken
      setLeitnerStatsDirect(leerDataManager.getLeitnerStatistiekenVoorCategorieen(geselecteerdeLeitnerCategorieen));
      
      setOpdrachtStartTijd(null);
      // Focus-sessie afronden wanneer laatste pinned item net beoordeeld is
      if (leermodusType === 'leitner' && leerDataManager.isFocusNowActive() && leerDataManager.getPinnedCount() === 0) {
        leerDataManager.stopFocusNow();
        showNotificatie('Focussessie voltooid! Je kunt weer pinnen of normaal doorgaan.', 'succes', 6000);
      }
    }

    // In serieuze leer-modus en in focus-stand (highscore/multiplayer) worden geen punten gegeven
    if ((gameMode === 'single' && isSerieuzeLeerModusActief) || isFocusHighscore || isFocusMultiplayer) {
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
    if (!isEinde) {
      autoShowScoreLade(3000);
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

    scrollToTop();
  }, [huidigeOpdracht, huidigeSpeler, huidigeSpinAnalyse, spelers, gekozenPartner, isMobieleWeergave, opgespaardeBonusPunten, effectieveMaxRondes, huidigeRonde, aantalBeurtenGespeeld, verdiendeSpinsDezeBeurt, gameMode, checkSpelEinde, playMultiplayerEnd, isAutomatischScorebordActief, isSerieuzeLeerModusActief, huidigeSessieId, opdrachtStartTijd]);

  const { 
    geselecteerdBestand,
    isBusy: _isUploadBusy,
    handleFileSelected,
    handleAnnuleerUpload,
    handleVerwerkBestand
  } = useBestandsUpload(parseExcelData, laadNieuweOpdrachten, showNotificatie);

  // Handlers voor kop-of-munt en bonus zijn verplaatst naar useSpinFlow

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
    // Sluit andere overlays en open Leitner beheer (voorkomt dubbele overlays)
    setIsScoreLadeOpen(false);
    setIsCategorieSelectieOpen(false);
    setIsCategorieBeheerOpen(true);
  }

  const handleOpenUitleg = () => {
    setIsScoreLadeOpen(false);
    setIsUitlegOpen(true);
  };

  // Handlers voor directe tab navigatie
  const handleOpenHighscoreCategorieSelectie = () => {
    setCategorieSelectieActiveTab('highscore');
    setCategorieSelectieInnerTab('categories');
    setIsCategorieSelectieOpen(true);
    setIsCategorieBeheerOpen(false); // Sluit Leitner modal
    setIsScoreLadeOpen(false); // Sluit mobiele menu
    scrollToDashboard();
  };

  const handleOpenMultiplayerCategorieSelectie = () => {
    setCategorieSelectieActiveTab('multiplayer');
    setCategorieSelectieInnerTab('categories');
    setIsCategorieSelectieOpen(true);
    setIsCategorieBeheerOpen(false); // Sluit Leitner modal
    setIsScoreLadeOpen(false); // Sluit mobiele menu
    scrollToTop();
  };

  const handleOpenNormaleLeermodusCategorieSelectie = () => {
    setCategorieSelectieActiveTab('normaal');
    setCategorieSelectieInnerTab('categories');
    setIsCategorieSelectieOpen(true);
    setIsCategorieBeheerOpen(false); // Sluit Leitner modal
    setIsScoreLadeOpen(false); // Sluit mobiele menu
    scrollToDashboard();
  };

  // full screen toggle is now provided by useFullscreen

  const handleStartFocusSessie = (categorie: string, leermodusType: 'normaal' | 'leitner' = 'normaal') => {
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

    // Focus sessie voor de gekozen leermodus
    setGeselecteerdeCategorieen(uniekeGeselecteerdeIds);
    setGameMode('single');
    setIsSerieuzeLeerModusActief(true);
    setLeermodusType(leermodusType);

    setIsLeeranalyseOpen(false);
    // Scroll naar het dashboard bij start sessie
    scrollToDashboard();
    // Optioneel: toon een notificatie (via hook)
    const leermodusNaam = leermodusType === 'leitner' ? 'Leitner Leermodus' : 'Vrije Leermodus';
    showNotificatie(`${leermodusNaam} gestart voor: ${categorie}`, 'succes', 7000);
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
          onOpenHighscoreRecords={() => {
            // Gebruik één pad voor openen: via custom event dat ook innerTab doorgeeft
            window.dispatchEvent(new CustomEvent('openCategorieSelectie', { detail: { tab: 'highscore', innerTab: 'saved' } } as any));
          }}
        />
      )}
      <AchievementNotificatie 
        achievement={nieuweAchievement}
        onClose={() => setNieuweAchievement(null)}
        onOpenLeeranalyse={() => handleOpenLeeranalyse(true)}
      />
      {import.meta.env.DEV && (
        <DevPanelModal
          isOpen={isDevPanelOpen}
          onClose={() => setIsDevPanelOpen(false)}
          forceResult={forceResult}
          setForceResult={setForceResult}
          simuleerVoltooiing={handleSimuleerVoltooiing}
          forcePromotie={handleForcePromotie}
          resetLeitner={handleResetLeitner}
          forceHerhalingen={handleForceHerhalingen}
          toggleBox0Interval={handleToggleBox0Interval}
          isBox0IntervalVerkort={isBox0IntervalVerkort}
          opdrachtenVoorSelectie={opdrachtenVoorSelectie.map(o => ({ Antwoordsleutel: o.Antwoordsleutel, Opdracht: o.Opdracht }))}
        />
      )}
      <OrientatieMelding isMobiel={isMobieleWeergave} />
      <AppModals
        isInstellingenOpen={isInstellingenOpen}
        onCloseInstellingen={() => setIsInstellingenOpen(false)}
          onVerwijderGebruikerOpdrachten={verwijderGebruikerOpdrachten}
          bonusOpdrachten={bonusOpdrachten}
          setBonusOpdrachten={setBonusOpdrachten}
          basisBonusOpdrachten={BONUS_OPDRACHTEN}
          isSpelGestart={isSpelGestart}
          onSpelReset={resetSpelState}
          onOpenCategorieBeheer={handleOpenLeitnerCategorieBeheer}
          onOpenCategorieSelectie={() => setIsCategorieSelectieOpen(true)}
          currentGameMode={getCurrentGameMode()}
          hoofdcategorieen={Array.from(new Set(opdrachten.map(o => o.Hoofdcategorie).filter((v): v is string => Boolean(v)))).sort((a,b) => a.localeCompare(b))}
            onFileSelected={handleFileSelected}
        onAnnuleerUpload={handleAnnuleerUpload}
        onVerwerkBestand={handleVerwerkBestand}
            geselecteerdBestand={geselecteerdBestand}
        isUitlegOpen={isUitlegOpen}
        onCloseUitleg={() => setIsUitlegOpen(false)}
        isLeerstrategienOpen={isLeerstrategienOpen}
        onCloseLeerstrategien={() => setIsLeerstrategienOpen(false)}
        isSessieSamenvattingOpen={isSessieSamenvattingOpen}
        onCloseSessieSamenvatting={() => {
          setIsSessieSamenvattingOpen(false);
          resetFruitautomaatState(); // Reset fruitautomaat voor schone start
        }}
        eindigdeSessieData={eindigdeSessieData}
        onOpenLeeranalyse={handleOpenLeeranalyse}
        isLeeranalyseOpen={isLeeranalyseOpen}
        onCloseLeeranalyse={() => { setIsLeeranalyseOpen(false); setOpenLeeranalyseToAchievements(false); }}
        onStartFocusSessie={handleStartFocusSessie}
        openLeeranalyseToAchievements={openLeeranalyseToAchievements}
        isCategorieSelectieOpen={isCategorieSelectieOpen}
        onCloseCategorieSelectie={() => { setIsCategorieSelectieOpen(false); setIsCategorieBeheerOpen(false); }}
        opdrachten={opdrachten}
        geselecteerdeCategorieen={geselecteerdeCategorieen}
        onCategorieSelectie={handleCategorieSelectie}
        onBulkCategorieSelectie={handleBulkCategorieSelectie}
        onOpenLeitnerBeheer={handleOpenLeitnerCategorieBeheer}
        highScoreLibrary={highScoreLibrary}
        setGeselecteerdeHighscoreCategorieen={setGeselecteerdeHighscoreCategorieen}
        geselecteerdeLeitnerCategorieen={geselecteerdeLeitnerCategorieen}
        setGeselecteerdeLeitnerCategorieen={setGeselecteerdeLeitnerCategorieen}
        geselecteerdeMultiplayerCategorieen={geselecteerdeMultiplayerCategorieen}
        setGeselecteerdeMultiplayerCategorieen={setGeselecteerdeMultiplayerCategorieen}
        geselecteerdeHighscoreCategorieen={geselecteerdeHighscoreCategorieen}
        initialActiveTab={categorieSelectieActiveTab}
        initialInnerTabForCategorieSelectie={categorieSelectieInnerTab}
        filters={filters}
        setFilters={setFilters}
        isCategorieBeheerOpen={isCategorieBeheerOpen}
        onCloseCategorieBeheer={() => { setIsCategorieBeheerOpen(false); setIsCategorieSelectieOpen(false); }}
        alleUniekeCategorieen={alleUniekeCategorieen}
        isLimietModalOpen={isLimietModalOpen}
        onCloseLimietModal={() => setIsLimietModalOpen(false)}
        onConfirmLimiet={() => { setLimietWaarschuwingGenegeerd(true); setIsLimietModalOpen(false); }}
        maxVragen={maxNewLeitnerQuestionsPerDay}
        onOpenInstellingenFromLimiet={() => { setIsLimietModalOpen(false); setIsInstellingenOpen(true); }}
        isOpdrachtenVoltooidModalOpen={isOpdrachtenVoltooidModalOpen}
        onCloseOpdrachtenVoltooid={() => setIsOpdrachtenVoltooidModalOpen(false)}
        onOpenCategorieSelectieFromVoltooid={() => { setIsOpdrachtenVoltooidModalOpen(false); setIsCategorieBeheerOpen(true); }}
      />



      {isMobieleWeergave && (
        <MobileControls
          isMobieleWeergave={isMobieleWeergave}
          isScoreLadeOpen={isScoreLadeOpen}
          setIsScoreLadeOpen={setIsScoreLadeOpen}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      <div className="main-layout" {...swipeHandlers}>
        <LeftPanel
          isScoreLadeOpen={isScoreLadeOpen}
                isSpelGestart={isSpelGestart}
          gameMode={gameMode}
            spelers={spelers}
            huidigeSpeler={huidigeSpeler}
            huidigeRonde={huidigeRonde}
          effectieveMaxRondes={effectieveMaxRondes}
            isSerieuzeLeerModusActief={isSerieuzeLeerModusActief}
          leermodusType={leermodusType}
            aantalBeurtenGespeeld={aantalBeurtenGespeeld}
          isFocusStandActief={isFocusHighscore || isFocusMultiplayer}
          currentHighScore={currentHighScore}
          currentPersonalBest={currentPersonalBest}
          alleUniekeCategorieen={alleUniekeCategorieen}
          gefilterdeGeselecteerdeHighscoreCategorieen={gefilterdeGeselecteerdeHighscoreCategorieen}
          gefilterdeGeselecteerdeMultiplayerCategorieen={gefilterdeGeselecteerdeMultiplayerCategorieen}
          gefilterdeGeselecteerdeLeitnerCategorieen={gefilterdeGeselecteerdeLeitnerCategorieen}
          gefilterdeGeselecteerdeCategorieen={gefilterdeGeselecteerdeCategorieen}
          aantalOpdrachtenHighscore={aantalOpdrachtenHighscore}
          aantalOpdrachtenMultiplayer={aantalOpdrachtenMultiplayer}
          aantalOpdrachtenLeitner={aantalOpdrachtenLeitner}
          aantalOpdrachtenNormaal={aantalOpdrachtenNormaal}
          aantalNieuweLeitnerOpdrachten={aantalNieuweLeitnerOpdrachten}
          isBox0OverrideActief={isBox0OverrideActief}
          vandaagBeschikbaar={leitnerStats.vandaagBeschikbaar}
          isModeSelectedThisSession={isModeSelectedThisSession}
          onSpelerToevoegen={handleSpelerToevoegen}
          setGameMode={setGameMode}
          isSpelerInputDisabled={isSpelerInputDisabled}
          setIsSerieuzeLeerModusActief={setIsSerieuzeLeerModusActief}
          setLeermodusType={setLeermodusType}
          onSpelReset={resetSpelState}
          onOpenHighscoreCategorieSelectie={handleOpenHighscoreCategorieSelectie}
          onOpenHighscoreSaved={() => {
            setCategorieSelectieActiveTab('highscore');
            setIsCategorieBeheerOpen(false);
            setIsCategorieSelectieOpen(true);
            sessionStorage.setItem('categorieSelectie.initialInnerTab', 'saved');
          }}
          onOpenMultiplayerCategorieSelectie={handleOpenMultiplayerCategorieSelectie}
          onOpenNormaleLeermodusCategorieSelectie={handleOpenNormaleLeermodusCategorieSelectie}
          onOpenLeitnerCategorieBeheer={handleOpenLeitnerCategorieBeheer}
          onEindigSessie={handleEindigSessie}
          onEindigSpel={handleEindigSpel}
          onOpenInstellingen={handleOpenInstellingen}
          onOpenUitleg={handleOpenUitleg}
            filters={filters}
            setFilters={setFilters}
            opdrachten={opdrachten}
            actieveCategorieSelectie={actieveCategorieSelectie}
          />

        <RightPanel
          notificatie={notificatie}
          warning={dismissedWarning ? null : warning}
          DevPanelSlot={null}
            titel="Return2Performance"
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
            isKaleModusActief={isKaleModusActiefGlobal}
            aantalBeurtenGespeeld={aantalBeurtenGespeeld}
            canStart={(() => {
              if (isSerieuzeLeerModusActief && gameMode === 'single') {
                return gefilterdeOpdrachten.length > 0;
              }
              if (gameMode === 'single' && !isSerieuzeLeerModusActief) {
                return spelers.length >= 1 && gefilterdeOpdrachten.length >= 10;
              }
              if (gameMode === 'multi') {
                return spelers.length >= 2 && gefilterdeOpdrachten.length > 0;
              }
              return false;
            })()}
            onEindigSessie={handleEindigSessie}
          welcomeMessage={gamePhase === 'idle' && !heeftVoldoendeSpelers() && isHulpElementenZichtbaar ? (
              <div className="welkomst-bericht">
                <h3>Welkom!</h3>
                {isSerieuzeLeerModusActief && gameMode === 'single' ? (
                  <>
                  <p><strong>📚 Leer Modus</strong></p>
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
          ) : undefined}
          actieDashboardRef={actieDashboardRef}
                handleBeoordeling={handleBeoordeling}
          isTimerActief={isTimerActief}
                huidigeSpeler={huidigeSpeler}
          onPartnerKies={(partnerNaam) => {
            const partner = spelers.find(p => p.naam === partnerNaam);
            if (partner) {
              playPartnerChosen();
              setGekozenPartner(partner);
              setGamePhase('assessment');
            }
          }}
                onGebruikExtraSpin={handleGebruikExtraSpin}
            isJokerSpinActief={isJokerSpinActief && !isFocusHighscore && !isFocusMultiplayer}
                puntenVoorVerdubbeling={puntenVoorVerdubbeling}
          onKopOfMunt={(keuze) => {
            const uitkomst = Math.random() < 0.5 ? 'kop' : 'munt';
            const gewonnen = keuze === uitkomst;
            if (huidigeSpeler) {
              if (gewonnen) {
                const gewonnenPunten = puntenVoorVerdubbeling * 2;
               showNotificatie(`Het is ${uitkomst}! Je wint ${gewonnenPunten} punten!`, 'succes', 6000);
                setSpelers(spelers.map(speler => speler.naam === huidigeSpeler.naam ? { ...speler, score: speler.score + gewonnenPunten } : speler));
              } else {
               showNotificatie(`Het is ${uitkomst}! Helaas, geen extra punten.`, 'fout', 6000);
              }
              setTimeout(() => {
                mainContentRef.current?.scrollTo(0, 0);
                window.scrollTo(0, 0);
              }, 100);
            }
            return { uitkomst, gewonnen };
          }}
                huidigeBonusOpdracht={huidigeBonusOpdracht}
                opgespaardeBonusPunten={opgespaardeBonusPunten}
          onBonusRondeVoltooid={(geslaagd) => {
            if (!huidigeSpeler || !huidigeBonusOpdracht) return;
            if (geslaagd) {
              const { punten } = huidigeBonusOpdracht;
              const gewonnenPunten = punten[Math.floor(Math.random() * punten.length)];
             showNotificatie(`Goed gedaan! Je kunt ${gewonnenPunten} extra punt(en) verdienen met de hoofdopdracht.`, 'succes', 6000);
              setOpgespaardeBonusPunten(gewonnenPunten);
            } else {
             showNotificatie('Helaas, geen extra punten deze keer.', 'fout', 6000);
            }
            setTimeout(() => {
              hideNotificatie();
              setHuidigeBonusOpdracht(null);
              setGamePhase('assessment');
              mainContentRef.current?.scrollTo(0, 0);
              window.scrollTo(0, 0);
            }, 3000);
          }}
          onKopOfMuntVoltooid={() => {
            setTimeout(() => {
              hideNotificatie();
              setPuntenVoorVerdubbeling(0);
              setGamePhase('idle');
              setIsAntwoordVergrendeld(false);
              if (gamePhase !== 'ended') {
                autoShowScoreLade(3000);
              }
              mainContentRef.current?.scrollTo(0, 0);
              window.scrollTo(0, 0);
            }, 2500);
          }}
            isFocusStandActief={isFocusHighscore || isFocusMultiplayer}
          />
      </div>
    </div>
  );
}

export default App;
