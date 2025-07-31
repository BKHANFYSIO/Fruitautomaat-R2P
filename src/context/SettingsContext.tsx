import React, { createContext, useContext, useState } from 'react';
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

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // Game settings
  const [gameMode, setGameMode] = useState<GameMode>('multi');
  const [maxRondes, setMaxRondes] = useState(0); // 0 = oneindig
  
  // UI settings
  const [isGeluidActief, setIsGeluidActief] = useState(true);
  const [isTimerActief, setIsTimerActief] = useState(true);
  const [isEerlijkeSelectieActief, setIsEerlijkeSelectieActief] = useState(true);
  const [isJokerSpinActief, setIsJokerSpinActief] = useState(true);
  const [isBonusOpdrachtenActief, setIsBonusOpdrachtenActief] = useState(true);
  const [isSpinVergrendelingActief, setIsSpinVergrendelingActief] = useState(true);
  const [isAutomatischScorebordActief, setIsAutomatischScorebordActief] = useState(true);
  
  // Advanced settings
  const [bonusKans, setBonusKans] = useState<BonusKans>('standaard');
  const [forceerMobieleWeergave, setForceerMobieleWeergave] = useState(false);
  
  // Learning mode settings
  const [isSerieuzeLeerModusActief, setIsSerieuzeLeerModusActief] = useState(false);
  const [isLeerFeedbackActief, setIsLeerFeedbackActief] = useState(true);
  const [leermodusType, setLeermodusType] = useState<'normaal' | 'leitner'>('normaal');
  
  // Bonus settings
  const [isLokaleBonusOpslagActief, setIsLokaleBonusOpslagActief] = useState(false);

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