import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type GameMode = 'single' | 'multi';
type BonusKans = 'standaard' | 'verhoogd' | 'fors_verhoogd';

interface SettingsContextType {
  // Game settings
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  maxRondes: number;
  setMaxRondes: (rondes: number) => void;
  
  // UI settings
  isGeluidActief: boolean;
  setIsGeluidActief: (actief: boolean) => void;
  isTimerActief: boolean;
  setIsTimerActief: (actief: boolean) => void;
  isEerlijkeSelectieActief: boolean;
  setIsEerlijkeSelectieActief: (actief: boolean) => void;
  isJokerSpinActief: boolean;
  setIsJokerSpinActief: (actief: boolean) => void;
  isBonusOpdrachtenActief: boolean;
  setIsBonusOpdrachtenActief: (actief: boolean) => void;
  isSpinVergrendelingActief: boolean;
  setIsSpinVergrendelingActief: (actief: boolean) => void;
  isAutomatischScorebordActief: boolean;
  setIsAutomatischScorebordActief: (actief: boolean) => void;
  
  // Per-modus settings
  isSpinVergrendelingActiefHighscore: boolean;
  setIsSpinVergrendelingActiefHighscore: (actief: boolean) => void;
  isJokerSpinActiefHighscore: boolean;
  setIsJokerSpinActiefHighscore: (actief: boolean) => void;
  isSpinVergrendelingActiefMultiplayer: boolean;
  setIsSpinVergrendelingActiefMultiplayer: (actief: boolean) => void;
  isJokerSpinActiefMultiplayer: boolean;
  setIsJokerSpinActiefMultiplayer: (actief: boolean) => void;
  isSpinVergrendelingActiefVrijeLeermodus: boolean;
  setIsSpinVergrendelingActiefVrijeLeermodus: (actief: boolean) => void;
      isSpinVergrendelingActiefLeitnerLeermodus: boolean;
    setIsSpinVergrendelingActiefLeitnerLeermodus: (actief: boolean) => void;
    // Per-modus joker spin instellingen (niet meer gebruikt)
    // isJokerSpinActiefVrijeLeermodus: boolean;
    // setIsJokerSpinActiefVrijeLeermodus: (actief: boolean) => void;
    // isJokerSpinActiefLeitnerLeermodus: boolean;
    // setIsJokerSpinActiefLeitnerLeermodus: (actief: boolean) => void;
  
  // Advanced settings
  bonusKans: BonusKans;
  setBonusKans: (kans: BonusKans) => void;
  forceerMobieleWeergave: boolean;
  setForceerMobieleWeergave: (forceer: boolean) => void;
  
  // Learning mode settings
  isSerieuzeLeerModusActief: boolean;
  setIsSerieuzeLeerModusActief: (actief: boolean) => void;
  isLeerFeedbackActief: boolean;
  setIsLeerFeedbackActief: (actief: boolean) => void;
  leermodusType: 'normaal' | 'leitner';
  setLeermodusType: (type: 'normaal' | 'leitner') => void;
  maxNewLeitnerQuestionsPerDay: number;
  setMaxNewLeitnerQuestionsPerDay: (aantal: number) => void;
  isMaxNewQuestionsLimitActief: boolean;
  setIsMaxNewQuestionsLimitActief: (actief: boolean) => void;
  negeerBox0Wachttijd: boolean;
  setNegeerBox0Wachttijd: (negeer: boolean) => void;
  
  // Dev settings
  isBox0IntervalVerkort: boolean;
  setIsBox0IntervalVerkort: (verkort: boolean) => void;
  isRolTijdVerkort: boolean;
  setIsRolTijdVerkort: (verkort: boolean) => void;
  isKaleModusActiefVrijeLeermodus: boolean;
  setIsKaleModusActiefVrijeLeermodus: (actief: boolean) => void;
  isKaleModusActiefLeitnerLeermodus: boolean;
  setIsKaleModusActiefLeitnerLeermodus: (actief: boolean) => void;
  
  // Bonus settings
  isLokaleBonusOpslagActief: boolean;
  setIsLokaleBonusOpslagActief: (actief: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

// Helper functies voor localStorage
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(`fruitautomaat_settings_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading setting ${key}:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(`fruitautomaat_settings_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
  }
};

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // Game settings
  const [gameMode, setGameMode] = useState<GameMode>(() => loadFromStorage('gameMode', 'multi'));
  const [maxRondes, setMaxRondes] = useState(() => {
    const opgeslagenWaarde = loadFromStorage('maxRondes', 4);
    // Migratie: vervang 0 door 4 voor bestaande gebruikers
    if (opgeslagenWaarde === 0) {
      saveToStorage('maxRondes', 4);
      return 4;
    }
    return opgeslagenWaarde;
  });
  
  // UI settings
  const [isGeluidActief, setIsGeluidActief] = useState(() => loadFromStorage('isGeluidActief', true));
  const [isTimerActief, setIsTimerActief] = useState(() => loadFromStorage('isTimerActief', true));
  const [isEerlijkeSelectieActief, setIsEerlijkeSelectieActief] = useState(() => loadFromStorage('isEerlijkeSelectieActief', true));
  const [isJokerSpinActief, setIsJokerSpinActief] = useState(() => loadFromStorage('isJokerSpinActief', true));
  const [isBonusOpdrachtenActief, setIsBonusOpdrachtenActief] = useState(() => loadFromStorage('isBonusOpdrachtenActief', true));
  const [isSpinVergrendelingActief, setIsSpinVergrendelingActief] = useState(() => loadFromStorage('isSpinVergrendelingActief', true));
  const [isAutomatischScorebordActief, setIsAutomatischScorebordActief] = useState(() => loadFromStorage('isAutomatischScorebordActief', true));
  
  // Per-modus spin vergrendeling instellingen
  const [isSpinVergrendelingActiefHighscore, setIsSpinVergrendelingActiefHighscore] = useState(() => 
    loadFromStorage('isSpinVergrendelingActiefHighscore', true)
  );
  const [isSpinVergrendelingActiefMultiplayer, setIsSpinVergrendelingActiefMultiplayer] = useState(() => 
    loadFromStorage('isSpinVergrendelingActiefMultiplayer', true)
  );
  const [isSpinVergrendelingActiefVrijeLeermodus, setIsSpinVergrendelingActiefVrijeLeermodus] = useState(() => 
    loadFromStorage('isSpinVergrendelingActiefVrijeLeermodus', true)
  );
  const [isSpinVergrendelingActiefLeitnerLeermodus, setIsSpinVergrendelingActiefLeitnerLeermodus] = useState(() => 
    loadFromStorage('isSpinVergrendelingActiefLeitnerLeermodus', true)
  );

  // Per-modus joker spin instellingen
  const [isJokerSpinActiefHighscore, setIsJokerSpinActiefHighscore] = useState(() => 
    loadFromStorage('isJokerSpinActiefHighscore', false)
  );
  const [isJokerSpinActiefMultiplayer, setIsJokerSpinActiefMultiplayer] = useState(() => 
    loadFromStorage('isJokerSpinActiefMultiplayer', true)
  );
  // Per-modus joker spin instellingen (niet meer gebruikt)
  // const [isJokerSpinActiefVrijeLeermodus, setIsJokerSpinActiefVrijeLeermodus] = useState(() => 
  //   loadFromStorage('isJokerSpinActiefVrijeLeermodus', false)
  // );
  // const [isJokerSpinActiefLeitnerLeermodus, setIsJokerSpinActiefLeitnerLeermodus] = useState(() => 
  //   loadFromStorage('isJokerSpinActiefLeitnerLeermodus', false)
  // );
  
  // Advanced settings
  const [bonusKans, setBonusKans] = useState<BonusKans>(() => loadFromStorage('bonusKans', 'standaard'));
  const [forceerMobieleWeergave, setForceerMobieleWeergave] = useState(() => loadFromStorage('forceerMobieleWeergave', false));
  
  // Learning mode settings
  const [isSerieuzeLeerModusActief, setIsSerieuzeLeerModusActief] = useState(() => loadFromStorage('isSerieuzeLeerModusActief', false));
  const [isLeerFeedbackActief, setIsLeerFeedbackActief] = useState(() => loadFromStorage('isLeerFeedbackActief', true));
  const [leermodusType, setLeermodusType] = useState<'normaal' | 'leitner'>(() => loadFromStorage('leermodusType', 'leitner'));
  const [maxNewLeitnerQuestionsPerDay, setMaxNewLeitnerQuestionsPerDay] = useState(() => loadFromStorage('maxNewLeitnerQuestionsPerDay', 10));
  const [isMaxNewQuestionsLimitActief, setIsMaxNewQuestionsLimitActief] = useState(() => loadFromStorage('isMaxNewQuestionsLimitActief', true));
  const [negeerBox0Wachttijd, setNegeerBox0Wachttijd] = useState(() => loadFromStorage('negeerBox0Wachttijd', true));

  // Dev settings
  const [isBox0IntervalVerkort, setIsBox0IntervalVerkort] = useState(() => loadFromStorage('isBox0IntervalVerkort', false));
  const [isRolTijdVerkort, setIsRolTijdVerkort] = useState(() => loadFromStorage('isRolTijdVerkort', false));
  const [isKaleModusActiefVrijeLeermodus, setIsKaleModusActiefVrijeLeermodus] = useState(() => loadFromStorage('isKaleModusActiefVrijeLeermodus', false));
  const [isKaleModusActiefLeitnerLeermodus, setIsKaleModusActiefLeitnerLeermodus] = useState(() => loadFromStorage('isKaleModusActiefLeitnerLeermodus', false));

  // Bonus settings
  const [isLokaleBonusOpslagActief, setIsLokaleBonusOpslagActief] = useState(() => loadFromStorage('isLokaleBonusOpslagActief', false));

  // Effect om instellingen op te slaan wanneer ze veranderen
  useEffect(() => {
    saveToStorage('gameMode', gameMode);
  }, [gameMode]);

  useEffect(() => {
    saveToStorage('maxRondes', maxRondes);
  }, [maxRondes]);

  useEffect(() => {
    saveToStorage('isGeluidActief', isGeluidActief);
  }, [isGeluidActief]);

  useEffect(() => {
    saveToStorage('isTimerActief', isTimerActief);
  }, [isTimerActief]);

  useEffect(() => {
    saveToStorage('isEerlijkeSelectieActief', isEerlijkeSelectieActief);
  }, [isEerlijkeSelectieActief]);

  useEffect(() => {
    saveToStorage('isJokerSpinActief', isJokerSpinActief);
  }, [isJokerSpinActief]);

  useEffect(() => {
    saveToStorage('isBonusOpdrachtenActief', isBonusOpdrachtenActief);
  }, [isBonusOpdrachtenActief]);

  useEffect(() => {
    saveToStorage('isSpinVergrendelingActief', isSpinVergrendelingActief);
  }, [isSpinVergrendelingActief]);

  useEffect(() => {
    saveToStorage('isAutomatischScorebordActief', isAutomatischScorebordActief);
  }, [isAutomatischScorebordActief]);

  useEffect(() => {
    saveToStorage('isSpinVergrendelingActiefHighscore', isSpinVergrendelingActiefHighscore);
  }, [isSpinVergrendelingActiefHighscore]);

  useEffect(() => {
    saveToStorage('isJokerSpinActiefHighscore', isJokerSpinActiefHighscore);
  }, [isJokerSpinActiefHighscore]);

  useEffect(() => {
    saveToStorage('isSpinVergrendelingActiefMultiplayer', isSpinVergrendelingActiefMultiplayer);
  }, [isSpinVergrendelingActiefMultiplayer]);

  useEffect(() => {
    saveToStorage('isJokerSpinActiefMultiplayer', isJokerSpinActiefMultiplayer);
  }, [isJokerSpinActiefMultiplayer]);

  useEffect(() => {
    saveToStorage('isSpinVergrendelingActiefVrijeLeermodus', isSpinVergrendelingActiefVrijeLeermodus);
  }, [isSpinVergrendelingActiefVrijeLeermodus]);

  useEffect(() => {
    saveToStorage('isSpinVergrendelingActiefLeitnerLeermodus', isSpinVergrendelingActiefLeitnerLeermodus);
  }, [isSpinVergrendelingActiefLeitnerLeermodus]);

  useEffect(() => {
    saveToStorage('bonusKans', bonusKans);
  }, [bonusKans]);

  useEffect(() => {
    saveToStorage('forceerMobieleWeergave', forceerMobieleWeergave);
  }, [forceerMobieleWeergave]);

  useEffect(() => {
    saveToStorage('isSerieuzeLeerModusActief', isSerieuzeLeerModusActief);
  }, [isSerieuzeLeerModusActief]);

  useEffect(() => {
    saveToStorage('isLeerFeedbackActief', isLeerFeedbackActief);
  }, [isLeerFeedbackActief]);

  useEffect(() => {
    saveToStorage('leermodusType', leermodusType);
  }, [leermodusType]);

  useEffect(() => {
    saveToStorage('maxNewLeitnerQuestionsPerDay', maxNewLeitnerQuestionsPerDay);
  }, [maxNewLeitnerQuestionsPerDay]);

  useEffect(() => {
    saveToStorage('isMaxNewQuestionsLimitActief', isMaxNewQuestionsLimitActief);
  }, [isMaxNewQuestionsLimitActief]);

  useEffect(() => {
    saveToStorage('negeerBox0Wachttijd', negeerBox0Wachttijd);
  }, [negeerBox0Wachttijd]);

  useEffect(() => {
    saveToStorage('isBox0IntervalVerkort', isBox0IntervalVerkort);
  }, [isBox0IntervalVerkort]);

  useEffect(() => {
    saveToStorage('isRolTijdVerkort', isRolTijdVerkort);
  }, [isRolTijdVerkort]);

  useEffect(() => {
    saveToStorage('isKaleModusActiefVrijeLeermodus', isKaleModusActiefVrijeLeermodus);
  }, [isKaleModusActiefVrijeLeermodus]);

  useEffect(() => {
    saveToStorage('isKaleModusActiefLeitnerLeermodus', isKaleModusActiefLeitnerLeermodus);
  }, [isKaleModusActiefLeitnerLeermodus]);

  useEffect(() => {
    saveToStorage('isLokaleBonusOpslagActief', isLokaleBonusOpslagActief);
  }, [isLokaleBonusOpslagActief]);

  const value: SettingsContextType = {
    // Game settings
    gameMode,
    setGameMode,
    maxRondes,
    setMaxRondes,
    
    // UI settings
    isGeluidActief,
    setIsGeluidActief,
    isTimerActief,
    setIsTimerActief,
    isEerlijkeSelectieActief,
    setIsEerlijkeSelectieActief,
    isJokerSpinActief,
    setIsJokerSpinActief,
    isBonusOpdrachtenActief,
    setIsBonusOpdrachtenActief,
    isSpinVergrendelingActief,
    setIsSpinVergrendelingActief,
    isAutomatischScorebordActief,
    setIsAutomatischScorebordActief,
    
    // Per-modus settings
    isSpinVergrendelingActiefHighscore,
    setIsSpinVergrendelingActiefHighscore,
    isJokerSpinActiefHighscore,
    setIsJokerSpinActiefHighscore,
    isSpinVergrendelingActiefMultiplayer,
    setIsSpinVergrendelingActiefMultiplayer,
    isJokerSpinActiefMultiplayer,
    setIsJokerSpinActiefMultiplayer,
    isSpinVergrendelingActiefVrijeLeermodus,
    setIsSpinVergrendelingActiefVrijeLeermodus,
    isSpinVergrendelingActiefLeitnerLeermodus,
    setIsSpinVergrendelingActiefLeitnerLeermodus,
    
    // Advanced settings
    bonusKans,
    setBonusKans,
    forceerMobieleWeergave,
    setForceerMobieleWeergave,
    
    // Learning mode settings
    isSerieuzeLeerModusActief,
    setIsSerieuzeLeerModusActief,
    isLeerFeedbackActief,
    setIsLeerFeedbackActief,
    leermodusType,
    setLeermodusType,
    maxNewLeitnerQuestionsPerDay,
    setMaxNewLeitnerQuestionsPerDay,
    isMaxNewQuestionsLimitActief,
    setIsMaxNewQuestionsLimitActief,
    negeerBox0Wachttijd,
    setNegeerBox0Wachttijd,
    
    // Dev settings
    isBox0IntervalVerkort,
    setIsBox0IntervalVerkort,
    isRolTijdVerkort,
    setIsRolTijdVerkort,
    isKaleModusActiefVrijeLeermodus,
    setIsKaleModusActiefVrijeLeermodus,
    isKaleModusActiefLeitnerLeermodus,
    setIsKaleModusActiefLeitnerLeermodus,
    
    // Bonus settings
    isLokaleBonusOpslagActief,
    setIsLokaleBonusOpslagActief,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 