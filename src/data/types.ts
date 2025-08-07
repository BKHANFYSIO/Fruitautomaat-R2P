export type GamePhase = 'idle' | 'spinning' | 'assessment' | 'partner_choice' | 'double_or_nothing' | 'bonus_round' | 'ended';

export interface Opdracht {
  id?: string;
  Hoofdcategorie?: string;
  Categorie: string;
  Opdracht: string;
  Antwoordsleutel: string;
  Tijdslimiet: number;
  Extra_Punten: number;
  bron?: 'systeem' | 'gebruiker';
  opdrachtType?: string;
}

export interface Speler {
  naam: string;
  score: number;
  extraSpins: number;
  beurten: number;
}

export interface SpinResultaatAnalyse {
  bonusPunten: number;
  actie: 'geen' | 'partner_kiezen' | 'kop_of_munt' | 'bonus_opdracht';
  beschrijving: string;
  winnendeSymbolen?: string[];
  verdiendeSpins: number;
}

// Leeranalyse Types
export interface OpdrachtData {
  opdrachtId: string;
  hoofdcategorie?: string;
  categorie: string;
  aantalKeerGedaan: number;
  laatsteDatum: string;
  gemiddeldeScore: number;
  hoogsteScore: number;
  laagsteScore: number;
  totaleTijd: number; // in seconden
  scoreGeschiedenis?: { score: number; datum: string }[];
  modusGeschiedenis?: { modus: 'normaal' | 'leitner'; datum: string }[];
}

export interface SessieData {
  sessieId: string;
  startTijd: string;
  eindTijd?: string;
  duur?: number; // in minuten
  opdrachtenGedaan: number;
  gemiddeldeScore: number;
  serieuzeModus: boolean;
  leermodusType?: 'normaal' | 'leitner';
  categorieen: string[];
}

export interface CategorieStatistiek {
  categorie: string;
  aantalOpdrachten: number;
  gemiddeldeScore: number;
  sterkstePunt: string;
  verbeterpunt: string;
  laatsteActiviteit: string;
}

export interface DagelijkseActiviteit {
  datum: string;
  opdrachten: number;
  speeltijd: number; // in minuten
  gemiddeldeScore: number;
  sessies: number;
}

export interface LeerStatistieken {
  // Basis statistieken
  totaalOpdrachten: number;
  totaalSessies: number;
  totaalSpeeltijd: number; // in minuten
  gemiddeldeSessieDuur: number;
  
  // Prestatie statistieken
  gemiddeldeScore: number;
  hoogsteScore: number;
  laagsteScore: number;
  consistentieScore: number; // % van sessies met score > 3
  
  // Categorie analyse
  categorieStatistieken: {
    [categorie: string]: CategorieStatistiek;
  };
  
  // Tijdlijn data
  dagelijkseActiviteit: {
    [datum: string]: DagelijkseActiviteit;
  };
  
  // Voortgang tracking
  favorieteCategorie: string;
  zwaksteCategorie: string;
  laatsteActiviteit: string;
}

export interface LeerData {
  spelerId: string;
  laatsteUpdate: string;
  statistieken: LeerStatistieken;
  opdrachten: {
    [opdrachtId: string]: OpdrachtData;
  };
  sessies: {
    [sessieId: string]: SessieData;
  };
}

export interface Achievement {
  id: string;
  naam: string;
  beschrijving: string;
  behaaldOp: string;
  icon: string;
  categorie: 'onboarding' | 'progressie' | 'streak' | 'categorie_mastery' | 'leertijd' | 'dagelijkse_streak' | 'speciaal';
}

export interface LeitnerAchievement {
  id: string;
  naam: string;
  beschrijving: string;
  behaaldOp: string;
  icon: string;
  categorie: 'herhaling' | 'promotie' | 'consistentie';
  level?: 'Brons' | 'Zilver' | 'Goud';
}

export interface LeerDataCache {
  spelerId: string;
  laatsteUpdate: string;
  data: LeerData;
  achievements: Achievement[];
}

// Leitner-systeem Types
export interface LeitnerBox {
  boxId: number; // 0-6 (0 = 10 minuten, 1 = dagelijks, 2 = elke 2 dagen, etc.)
  opdrachten: string[]; // opdrachtIds
  lastReview: string; // Blijft voor compatibiliteit, maar logica verhuist naar individuele timers
}

export interface LeitnerData {
  boxes: LeitnerBox[];
  opdrachtReviewTimes: { [opdrachtId: string]: string };
  isLeitnerActief: boolean;
  boxIntervallen: number[]; // [10, 1440, 2880, 5760, 10080, 20160, 64800] minuten (10min, 1dag, 2dagen, 4dagen, 7dagen, 14dagen, 45dagen)
  herhalingStrategie: 'alleen_moeilijk' | 'volledig' | 'hybride';
  laatsteUpdate: string;
  achievements: LeitnerAchievement[];
  // Velden voor het bijhouden van voltooiingen en streaks
  voltooiingen: number;
  huidigeStreak: number;
  langsteStreak: number;
  laatsteVoltooiingsDatum: string;
  newQuestionsToday: { date: string; count: number };
  // Pauze functionaliteit
  pausedOpdrachten: string[]; // Array van opdrachtIds die gepauzeerd zijn
  opdrachtPauseTimes: { [opdrachtId: string]: string }; // Wanneer de pauze is gestart
}

export interface LeitnerOpdrachtInfo {
  opdrachtId: string;
  huidigeBox: number;
  laatsteHerhaling: string;
  volgendeHerhaling: string;
  isVandaagBeschikbaar: boolean;
} 