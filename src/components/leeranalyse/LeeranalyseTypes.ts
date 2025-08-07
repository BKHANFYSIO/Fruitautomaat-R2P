import type { LeerData, Achievement, LeitnerData } from '../../data/types';

export interface LeeranalyseProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFocusSessie?: (categorie: string, leermodusType?: 'normaal' | 'leitner') => void;
  openToAchievements?: boolean;
}

export interface TabProps {
  leerData: LeerData | null;
  achievements: Achievement[] | null;
  leitnerData: LeitnerData | null;
  achievementDefs: any;
  onStartFocusSessie?: (categorie: string, leermodusType?: 'normaal' | 'leitner') => void;
}

export type TijdsRange = 'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar';
export type GrafiekType = 'lijn' | 'staaf' | 'gestapeld';
export type FocusMetric = 'tijd' | 'aantal';

export interface SparklineData {
  score: number;
  datum: string;
}

export interface LeitnerVerdeling {
  [boxId: number]: number;
}

export interface RankingData {
  categorie: string;
  score: number;
  percentage: number;
}

export interface MasteryData {
  level: string;
  percentage: number;
}

// Tijdlijn specifieke types
export interface ActiviteitData {
  datum?: string;
  week?: string;
  maand?: string;
  opdrachten: number;
  speeltijd: number;
}

export interface PrestatieData {
  datum?: string;
  week?: string;
  maand?: string;
  gemiddeldeScore: number;
  gemiddeldeTijd: number;
}

export interface FocusData {
  datum?: string;
  week?: string;
  maand?: string;
  serieuzeModus: number;
  normaleModus: number;
}

export interface SessieKwaliteitData {
  datum?: string;
  week?: string;
  maand?: string;
  aantalSessies: number;
  gemiddeldeDuur: number;
}

export interface TopCategorieData {
  datum?: string;
  week?: string;
  maand?: string;
  [categorie: string]: number | string | undefined;
}

export interface LeerpatronenData {
  datum?: string;
  week?: string;
  maand?: string;
  nieuweOpdrachten: number;
  herhalingen: number;
}

export interface SessiePatronenData {
  uur: number;
  sessies: number;
  totaleTijd: number;
}

export interface LeitnerBoxHerhalingenData {
  datum?: string;
  week?: string;
  maand?: string;
  box0: number;
  box1: number;
  box2: number;
  box3: number;
  box4: number;
  box5: number;
  box6: number;
  box7: number;
  totaalHerhalingen: number;
}

export interface StreakData {
  huidigeStreak: number;
  langsteStreak: number;
  actieveDagen: string[];
}
