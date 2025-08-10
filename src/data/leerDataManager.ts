import type { 
  LeerData, 
  LeerDataCache, 
  SessieData, 
  Achievement,
  Opdracht,
  LeitnerData,
  LeitnerOpdrachtInfo,
  LeitnerAchievement,
  DagelijkseActiviteit
} from './types';

// LocalStorage sleutels
const LEER_DATA_KEYS = {
  SPELER_DATA: 'fruitautomaat_leerdata_',
  SESSIE_DATA: 'fruitautomaat_sessies_',
  PREFERENCES: 'fruitautomaat_preferences_',
  ACHIEVEMENTS: 'fruitautomaat_achievements_',
  LEITNER_DATA: 'fruitautomaat_leitner_'
};

// Helper functies
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getDatumString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const berekenGemiddeldeScore = (scores: number[]): number => {
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
};

const berekenConsistentieScore = (sessies: SessieData[]): number => {
  if (sessies.length === 0) return 0;
  const goedeSessies = sessies.filter(s => s.gemiddeldeScore > 3).length;
  return Math.round((goedeSessies / sessies.length) * 100);
};

// Achievement definities
const ACHIEVEMENTS: Omit<Achievement, 'behaaldOp'>[] = [
  // --- Onboarding Categorie (Nieuwe spelers) ---
  {
    id: 'eerste_opdracht',
    naam: 'Welkom!',
    beschrijving: 'Voltooid je eerste opdracht',
    icon: '🎉',
    categorie: 'onboarding'
  },
  {
    id: 'eerste_vlam',
    naam: 'Eerste Vlam',
    beschrijving: 'Voltooid 3 opdrachten',
    icon: '🔥',
    categorie: 'onboarding'
  },
  {
    id: 'snelle_starter',
    naam: 'Snelle Starter',
    beschrijving: 'Voltooid 5 opdrachten',
    icon: '⚡',
    categorie: 'onboarding'
  },
  {
    id: 'de_starter',
    naam: 'De Starter',
    beschrijving: 'Voltooid 10 opdrachten',
    icon: '🚀',
    categorie: 'onboarding'
  },

  // --- Progressie Categorie (Voortgang) ---
  {
    id: 'leergierig',
    naam: 'Leergierig',
    beschrijving: 'Voltooid 25 opdrachten',
    icon: '📚',
    categorie: 'progressie'
  },
  {
    id: 'doorzetter',
    naam: 'Doorzetter',
    beschrijving: 'Voltooid 50 opdrachten',
    icon: '💪',
    categorie: 'progressie'
  },
  {
    id: 'volhouder',
    naam: 'Volhouder',
    beschrijving: 'Voltooid 100 opdrachten',
    icon: '🏃',
    categorie: 'progressie'
  },
  {
    id: 'master',
    naam: 'Master',
    beschrijving: 'Voltooid 250 opdrachten',
    icon: '👑',
    categorie: 'progressie'
  },

  // --- Streak Categorie (Opeenvolgende dagen) ---
  {
    id: 'streak_7',
    naam: 'Week Warrior',
    beschrijving: '7 dagen achter elkaar geleerd',
    icon: '🔥',
    categorie: 'streak'
  },
  {
    id: 'streak_14',
    naam: 'Trouwe Leerling',
    beschrijving: '14 dagen achter elkaar geleerd',
    icon: '🔥🔥',
    categorie: 'streak'
  },
  {
    id: 'streak_30',
    naam: 'Maand Meester',
    beschrijving: '30 dagen achter elkaar geleerd',
    icon: '🔥🔥🔥',
    categorie: 'streak'
  },
  {
    id: 'streak_100',
    naam: 'Honderd Dagen Held',
    beschrijving: '100 dagen achter elkaar geleerd',
    icon: '👑',
    categorie: 'streak'
  },

  // --- Categorie Mastery Categorie ---
  {
    id: 'categorie_10',
    naam: 'Categorie Verkenner',
    beschrijving: '10 opdrachten in één categorie voltooid',
    icon: '📚',
    categorie: 'categorie_mastery'
  },
  {
    id: 'categorie_25',
    naam: 'Categorie Kenner',
    beschrijving: '25 opdrachten in één categorie voltooid',
    icon: '📚📚',
    categorie: 'categorie_mastery'
  },
  {
    id: 'categorie_50',
    naam: 'Categorie Expert',
    beschrijving: '50 opdrachten in één categorie voltooid',
    icon: '📚📚📚',
    categorie: 'categorie_mastery'
  },
  {
    id: 'categorie_complete',
    naam: 'Categorie Meester',
    beschrijving: 'Alle opdrachten in één categorie voltooid',
    icon: '👑',
    categorie: 'categorie_mastery'
  },

  // --- Leertijd Categorie ---
  {
    id: 'tijd_60',
    naam: 'Uur Leerling',
    beschrijving: '60 minuten totale leertijd',
    icon: '⏰',
    categorie: 'leertijd'
  },
  {
    id: 'tijd_300',
    naam: 'Uren Maker',
    beschrijving: '5 uur totale leertijd',
    icon: '⏰⏰',
    categorie: 'leertijd'
  },
  {
    id: 'tijd_1000',
    naam: 'Tijd Meester',
    beschrijving: '1000 minuten totale leertijd',
    icon: '⏰⏰⏰',
    categorie: 'leertijd'
  },

  // --- Dagelijkse Streak Categorie ---
  {
    id: 'dagelijkse_streak_7',
    naam: 'Week Warrior',
    beschrijving: '7 dagen achter elkaar geleerd',
    icon: '📅',
    categorie: 'dagelijkse_streak'
  },
  {
    id: 'dagelijkse_streak_30',
    naam: 'Maand Meester',
    beschrijving: '30 dagen achter elkaar geleerd',
    icon: '📅📅',
    categorie: 'dagelijkse_streak'
  },

  // --- Speciale Categorie (Unieke prestaties) ---
  {
    id: 'perfecte_sessie',
    naam: 'Perfecte Sessie',
    beschrijving: 'Voltooid een sessie met alle scores 5/5',
    icon: '🎯',
    categorie: 'speciaal'
  },
  {
    id: 'speed_runner',
    naam: 'Speed Runner',
    beschrijving: 'Voltooid 5 opdrachten in 10 minuten',
    icon: '⚡',
    categorie: 'speciaal'
  },
  {
    id: 'diepe_denker',
    naam: 'Diepe Denker',
    beschrijving: 'Behaalde gemiddelde 4+ over laatste 30 opdrachten',
    icon: '🧠',
    categorie: 'speciaal'
  },
  {
    id: 'showstopper',
    naam: 'Showstopper',
    beschrijving: 'Behaalde 10 perfecte scores op rij',
    icon: '🎪',
    categorie: 'speciaal'
  }
];

// Definities voor Leitner-specifieke achievements
const LEITNER_ACHIEVEMENTS: Omit<LeitnerAchievement, 'behaaldOp'>[] = [
  // --- De "Box Meester" Ladder ---
  {
    id: 'promotie_box_2',
    naam: 'De Klimmer',
    beschrijving: 'Promoveer een opdracht naar Box 2.',
    icon: '🧗',
    categorie: 'promotie'
  },
  {
    id: 'promotie_box_3',
    naam: 'De Strateeg',
    beschrijving: 'Promoveer een opdracht naar Box 3.',
    icon: '🗺️',
    categorie: 'promotie'
  },
  {
    id: 'promotie_box_4',
    naam: 'Box Meester',
    beschrijving: 'Promoveer een opdracht naar Box 4.',
    icon: '🥉',
    categorie: 'promotie',
    level: 'Brons'
  },
  {
    id: 'promotie_box_5',
    naam: 'Box Meester',
    beschrijving: 'Promoveer een opdracht naar Box 5.',
    icon: '🥈',
    categorie: 'promotie',
    level: 'Zilver'
  },
  {
    id: 'promotie_box_6',
    naam: 'Box Meester',
    beschrijving: 'Promoveer een opdracht naar de laatste box!',
    icon: '🥇',
    categorie: 'promotie',
    level: 'Goud'
  },
  {
    id: 'promotie_box_7',
    naam: 'Beheerst!',
    beschrijving: 'Beheers een opdracht door deze naar de laatste box te promoveren.',
    icon: '🏆',
    categorie: 'promotie',
    level: 'Goud'
  },
  
  // --- De "Herhaler" Ladder ---
  {
    id: 'herhaling_1',
    naam: 'Schoon Schip',
    beschrijving: 'Voltooi voor het eerst alle te herhalen opdrachten.',
    icon: '✨',
    categorie: 'herhaling'
  },
  {
    id: 'herhaling_5',
    naam: 'De Afmaker',
    beschrijving: 'Voltooi 5 keer een volledige set van herhalingen.',
    icon: '🥉',
    categorie: 'herhaling',
    level: 'Brons'
  },
  {
    id: 'herhaling_15',
    naam: 'De Wegwerker',
    beschrijving: 'Voltooi 15 keer een volledige set van herhalingen.',
    icon: '🥈',
    categorie: 'herhaling',
    level: 'Zilver'
  },
  {
    id: 'herhaling_30',
    naam: 'De Machine',
    beschrijving: 'Voltooi 30 keer een volledige set van herhalingen.',
    icon: '🥇',
    categorie: 'herhaling',
    level: 'Goud'
  },

  // --- De "Consistentie" Ladder ---
  {
    id: 'streak_2',
    naam: 'Op Dreef!',
    beschrijving: 'Voltooi 2 dagen op rij de te herhalen opdrachten.',
    icon: '🔥',
    categorie: 'consistentie'
  },
  {
    id: 'streak_3',
    naam: 'Trouwe Student',
    beschrijving: 'Voltooi 3 dagen op rij alle te herhalen opdrachten.',
    icon: '🥉',
    categorie: 'consistentie',
    level: 'Brons'
  },
  {
    id: 'streak_7',
    naam: 'De Gewoontebouwer',
    beschrijving: 'Voltooi 7 dagen op rij alle te herhalen opdrachten.',
    icon: '🥈',
    categorie: 'consistentie',
    level: 'Zilver'
  },
  {
    id: 'streak_14',
    naam: 'De Onverstoorbare',
    beschrijving: 'Voltooi 14 dagen op rij alle te herhalen opdrachten.',
    icon: '🥇',
    categorie: 'consistentie',
    level: 'Goud'
  }
];

// LeerData Manager Class
class LeerDataManager {
  private spelerId: string;
  private _alleOpdrachten: Opdracht[] = [];

  constructor(spelerId: string) {
    this.spelerId = spelerId;
  }

  public setAlleOpdrachten(opdrachten: Opdracht[]): void {
    this._alleOpdrachten = opdrachten;
  }

  getSpelerId(): string {
    return this.spelerId;
  }

  // Basis CRUD operaties
  private saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key + this.spelerId, JSON.stringify(data));
    } catch (error) {
      console.error('Fout bij opslaan naar localStorage:', error);
    }
  }

  private loadFromLocalStorage(key: string): any {
    try {
      const data = localStorage.getItem(key + this.spelerId);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Fout bij laden van localStorage:', error);
      return null;
    }
  }

  // LeerData management
  loadLeerData(): LeerData | null {
    const cached = this.loadFromLocalStorage(LEER_DATA_KEYS.SPELER_DATA);
    return cached?.data || null;
  }

  saveLeerData(data: LeerData): void {
    const cache: LeerDataCache = {
      spelerId: this.spelerId,
      laatsteUpdate: new Date().toISOString(),
      data,
      achievements: this.loadAchievements()
    };
    this.saveToLocalStorage(LEER_DATA_KEYS.SPELER_DATA, cache);
  }

  // Sessie management
  startSessie(serieuzeModus: boolean, leermodusType: 'normaal' | 'leitner'): string {
    const sessieId = generateId();
    const sessie: SessieData = {
      sessieId,
      startTijd: new Date().toISOString(),
      opdrachtenGedaan: 0,
      gemiddeldeScore: 0,
      serieuzeModus,
      leermodusType,
      categorieen: []
    };

    const leerData = this.loadLeerData() || this.createEmptyLeerData();
    leerData.sessies[sessieId] = sessie;
    this.saveLeerData(leerData);

    return sessieId;
  }

  endSessie(sessieId: string): Achievement[] {
    const leerData = this.loadLeerData();
    if (!leerData || !leerData.sessies[sessieId]) return [];

    const sessie = leerData.sessies[sessieId];
    sessie.eindTijd = new Date().toISOString();
    sessie.duur = Math.round(
      (new Date(sessie.eindTijd).getTime() - new Date(sessie.startTijd).getTime()) / 60000
    );

    this.updateStatistieken(leerData);
    this.saveLeerData(leerData);

    // Check voor herhaling/streak achievements aan het einde van de sessie
    return this.updateHerhalingAchievements() as unknown as Achievement[];
  }

  // Opdracht tracking
  recordOpdrachtStart(opdracht: Opdracht): void {
    const leerData = this.loadLeerData() || this.createEmptyLeerData();
    const hoofdcategorie = opdracht.Hoofdcategorie || 'Overig';
    const opdrachtId = `${hoofdcategorie}_${opdracht.Categorie}_${opdracht.Opdracht.substring(0, 20)}`;

    if (!leerData.opdrachten[opdrachtId]) {
      leerData.opdrachten[opdrachtId] = {
        opdrachtId,
        hoofdcategorie: opdracht.Hoofdcategorie || 'Overig',
        categorie: opdracht.Categorie,
        aantalKeerGedaan: 0,
        laatsteDatum: getDatumString(),
        gemiddeldeScore: 0,
        hoogsteScore: 0,
        laagsteScore: 0,
        totaleTijd: 0
      };
      
      // Voeg nieuwe opdracht toe aan Leitner systeem als deze nog niet bestaat
      const leitnerData = this.loadLeitnerData();
      const alleLeitnerIds = new Set(leitnerData.boxes.flatMap(box => box.opdrachten));
      if (leitnerData.isLeitnerActief && !alleLeitnerIds.has(opdrachtId)) {
        this.addOpdrachtToLeitner(opdrachtId);
      }
    }

    leerData.opdrachten[opdrachtId].laatsteDatum = getDatumString();
    this.saveLeerData(leerData);
  }

  recordOpdrachtVoltooid(
    opdracht: Opdracht, 
    score: number, 
    _feedback: string,
    sessieId?: string,
    tijdGenomen?: number,
    leermodus?: 'normaal' | 'leitner'
  ): Achievement[] {
    const leerData = this.loadLeerData();
    if (!leerData) return [];

    const hoofdcategorie = opdracht.Hoofdcategorie || 'Overig';
    const opdrachtId = `${hoofdcategorie}_${opdracht.Categorie}_${opdracht.Opdracht.substring(0, 20)}`;
    
    if (!leerData.opdrachten[opdrachtId]) {
      this.recordOpdrachtStart(opdracht);
    }

    const opdrachtData = leerData.opdrachten[opdrachtId];
    opdrachtData.aantalKeerGedaan++;
    opdrachtData.laatsteDatum = getDatumString();
    
    if (opdrachtData.gemiddeldeScore > 0) {
      // Bereken nieuwe gemiddelde
      const totaalScore = opdrachtData.gemiddeldeScore * (opdrachtData.aantalKeerGedaan - 1) + score;
      opdrachtData.gemiddeldeScore = Math.round((totaalScore / opdrachtData.aantalKeerGedaan) * 10) / 10;
    } else {
      opdrachtData.gemiddeldeScore = score;
    }

    opdrachtData.hoogsteScore = Math.max(opdrachtData.hoogsteScore, score);
    opdrachtData.laagsteScore = opdrachtData.laagsteScore === 0 ? score : Math.min(opdrachtData.laagsteScore, score);
    
    if (tijdGenomen) {
      opdrachtData.totaleTijd += tijdGenomen;
    }

    // Voeg score toe aan geschiedenis
    if (!opdrachtData.scoreGeschiedenis) {
      opdrachtData.scoreGeschiedenis = [];
    }
    opdrachtData.scoreGeschiedenis.push({ score, datum: new Date().toISOString() });
    // Beperk geschiedenis tot de laatste 20 scores voor prestatieredenen
    if (opdrachtData.scoreGeschiedenis.length > 20) {
      opdrachtData.scoreGeschiedenis.shift();
    }

    // Voeg modus toe aan geschiedenis als beschikbaar
    if (leermodus !== undefined) {
      if (!opdrachtData.modusGeschiedenis) {
        opdrachtData.modusGeschiedenis = [];
      }
      const modus = leermodus;
      opdrachtData.modusGeschiedenis.push({ modus, datum: new Date().toISOString() });
      // Beperk modus geschiedenis tot de laatste 50 entries
      if (opdrachtData.modusGeschiedenis.length > 50) {
        opdrachtData.modusGeschiedenis.shift();
      }
    }

    // Update sessie als beschikbaar
    if (sessieId && leerData.sessies[sessieId]) {
      const sessie = leerData.sessies[sessieId];
      sessie.opdrachtenGedaan++;
      
      // Update sessie gemiddelde score
      if (sessie.gemiddeldeScore > 0) {
        const totaalSessieScore = sessie.gemiddeldeScore * (sessie.opdrachtenGedaan - 1) + score;
        sessie.gemiddeldeScore = Math.round((totaalSessieScore / sessie.opdrachtenGedaan) * 10) / 10;
      } else {
        sessie.gemiddeldeScore = score;
      }

      // Voeg categorie toe aan sessie als nog niet aanwezig
      if (!sessie.categorieen.includes(opdracht.Categorie)) {
        sessie.categorieen.push(opdracht.Categorie);
      }
    }

    // Update Leitner systeem
    const leitnerData = this.loadLeitnerData();
    let nieuwePromotieAchievement: LeitnerAchievement | null = null;
    if (leitnerData.isLeitnerActief) {
      nieuwePromotieAchievement = this.updateLeitnerBox(opdrachtId, score);
    }
    
    this.updateStatistieken(leerData);
    
    // Check beide soorten achievements
    const nieuweAlgemeneAchievements = this.checkAchievements(leerData);
    const nieuweLeitnerAchievements = this.checkLeitnerAchievements(this.loadLeitnerData()); // Voor niet-promotie achievements

    // Sla de nieuwe Leitner achievements op
    if (nieuweLeitnerAchievements.length > 0) {
      const currentLeitnerData = this.loadLeitnerData();
      currentLeitnerData.achievements.push(...nieuweLeitnerAchievements);
      this.saveLeitnerData(currentLeitnerData);
    }

    this.saveLeerData(leerData);
    
    const alleNieuweAchievements = [...nieuweAlgemeneAchievements, ...nieuweLeitnerAchievements as unknown as Achievement[]];
    if (nieuwePromotieAchievement) {
      alleNieuweAchievements.push(nieuwePromotieAchievement as unknown as Achievement);
    }
    
    // Geef alle nieuwe achievements terug, zodat de UI ze kan tonen
    return alleNieuweAchievements;
  }

  // Statistieken berekening
  private updateStatistieken(leerData: LeerData): void {
    const alleOpdrachten = this._alleOpdrachten;
    const opdrachten = Object.values(leerData.opdrachten);
    const sessies = Object.values(leerData.sessies).filter(s => s.eindTijd);

    // Update dagelijkse activiteit
    this.updateDagelijkseActiviteit(leerData);

    // Maak een map van subcategorie naar hoofdcategorie
    const subNaarHoofdMap = new Map<string, string>();
    alleOpdrachten.forEach(op => {
        if (!subNaarHoofdMap.has(op.Categorie)) {
            subNaarHoofdMap.set(op.Categorie, op.Hoofdcategorie || 'Overig');
        }
    });

    // Basis statistieken
    leerData.statistieken.totaalOpdrachten = opdrachten.reduce((sum, op) => sum + op.aantalKeerGedaan, 0);
    leerData.statistieken.totaalSessies = sessies.length;
    leerData.statistieken.totaalSpeeltijd = sessies.reduce((sum, s) => sum + (s.duur || 0), 0);
    leerData.statistieken.gemiddeldeSessieDuur = sessies.length > 0 
      ? Math.round(leerData.statistieken.totaalSpeeltijd / sessies.length * 10) / 10 
      : 0;

    // Prestatie statistieken
    const alleScores = opdrachten.flatMap(op => 
      Array(op.aantalKeerGedaan).fill(op.gemiddeldeScore)
    );
    
    if (alleScores.length > 0) {
      leerData.statistieken.gemiddeldeScore = berekenGemiddeldeScore(alleScores);
      leerData.statistieken.hoogsteScore = Math.max(...alleScores);
      leerData.statistieken.laagsteScore = Math.min(...alleScores);
    }

    leerData.statistieken.consistentieScore = berekenConsistentieScore(sessies);

    // Categorie statistieken
    const categorieen = new Set(opdrachten.map(op => op.categorie));
    leerData.statistieken.categorieStatistieken = {};

    categorieen.forEach(categorie => {
      const categorieOpdrachten = opdrachten.filter(op => op.categorie === categorie);
      const totaalOpdrachten = categorieOpdrachten.reduce((sum, op) => sum + op.aantalKeerGedaan, 0);
      const gemiddeldeScore = categorieOpdrachten.length > 0 
        ? berekenGemiddeldeScore(categorieOpdrachten.map(op => op.gemiddeldeScore))
        : 0;

      leerData.statistieken.categorieStatistieken[categorie] = {
        categorie,
        aantalOpdrachten: totaalOpdrachten,
        gemiddeldeScore,
        sterkstePunt: this.bepaalSterkstePunt(categorie, gemiddeldeScore),
        verbeterpunt: this.bepaalVerbeterpunt(categorie, gemiddeldeScore),
        laatsteActiviteit: categorieOpdrachten.length > 0 
          ? categorieOpdrachten.sort((a, b) => new Date(b.laatsteDatum).getTime() - new Date(a.laatsteDatum).getTime())[0].laatsteDatum
          : ''
      };
    });

    // Voortgang tracking
    const categorieStatistieken = Object.values(leerData.statistieken.categorieStatistieken);
    if (categorieStatistieken.length > 0) {
      leerData.statistieken.favorieteCategorie = categorieStatistieken
        .sort((a, b) => b.aantalOpdrachten - a.aantalOpdrachten)[0].categorie;
      
      leerData.statistieken.zwaksteCategorie = categorieStatistieken
        .sort((a, b) => a.gemiddeldeScore - b.gemiddeldeScore)[0].categorie;
    }

    leerData.statistieken.laatsteActiviteit = getDatumString();
  }

  // Dagelijkse activiteit tracking (recompute over alle dagen)
  private updateDagelijkseActiviteit(leerData: LeerData): void {
    const opdrachten = Object.values(leerData.opdrachten || {});
    const sessies = Object.values(leerData.sessies || {}).filter(s => s.eindTijd);

    const toLocalDateString = (iso: string): string => {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const activiteiten: Record<string, {
      datum: string;
      opdrachten: number;
      speeltijd: number;
      gemiddeldeScore: number;
      sessies: number;
    }> = {};

    // Helper om entry te krijgen
    const ensure = (datumStr: string) => {
      if (!activiteiten[datumStr]) {
        activiteiten[datumStr] = { datum: datumStr, opdrachten: 0, speeltijd: 0, gemiddeldeScore: 0, sessies: 0 };
      }
      return activiteiten[datumStr];
    };

    // Verzamel score totalen per dag voor gemiddelde
    const scoreTotalen: Record<string, { som: number; n: number }> = {};
    const addScore = (datumStr: string, score: number) => {
      if (!scoreTotalen[datumStr]) scoreTotalen[datumStr] = { som: 0, n: 0 };
      scoreTotalen[datumStr].som += score;
      scoreTotalen[datumStr].n += 1;
    };

    // Verwerk sessies per dag
    sessies.forEach(s => {
      const datumStr = s.eindTijd ? toLocalDateString(s.eindTijd) : toLocalDateString(s.startTijd);
      const ent = ensure(datumStr);
      ent.sessies += 1;
      ent.speeltijd += s.duur || 0;
    });

    // Verwerk opdrachten op basis van scoreGeschiedenis (accurate per-dag telling)
    opdrachten.forEach(op => {
      const history = op.scoreGeschiedenis || [];
      history.forEach(entry => {
        if (!entry || !entry.datum) return;
        const datumStr = toLocalDateString(entry.datum);
        const ent = ensure(datumStr);
        ent.opdrachten += 1;
        addScore(datumStr, entry.score || 0);
      });
    });

    // Bereken gemiddelde score per dag
    Object.entries(scoreTotalen).forEach(([datum, { som, n }]) => {
      const ent = ensure(datum);
      ent.gemiddeldeScore = n > 0 ? Math.round((som / n) * 10) / 10 : 0;
    });

    // Toewijzen aan statistieken
    leerData.statistieken.dagelijkseActiviteit = activiteiten;
  }

  // Tijd-gebaseerde data methodes
  public getDagelijkseActiviteitData(aantalDagen: number = 30): DagelijkseActiviteit[] {
    const leerData = this.loadLeerData();
    if (!leerData) return [];

    const eindDatum = new Date();
    const startDatum = new Date(eindDatum.getTime() - (aantalDagen - 1) * 24 * 60 * 60 * 1000);

    // Maak snelle lookup per datum
    const byDate: { [datum: string]: DagelijkseActiviteit } = {};
    Object.values(leerData.statistieken.dagelijkseActiviteit).forEach((d) => {
      byDate[d.datum] = d;
    });

    const resultaat: DagelijkseActiviteit[] = [];
    for (let d = new Date(startDatum); d <= eindDatum; d.setDate(d.getDate() + 1)) {
      const datumString = d.toISOString().split('T')[0];
      const found = byDate[datumString];
      if (found) {
        resultaat.push(found);
      } else {
        resultaat.push({ datum: datumString, opdrachten: 0, speeltijd: 0, gemiddeldeScore: 0, sessies: 0 });
      }
    }

    return resultaat;
  }

  public getWeekelijkseData(aantalWeken: number = 12): {
    week: string;
    opdrachten: number;
    speeltijd: number;
    gemiddeldeScore: number;
    sessies: number;
  }[] {
    const dagelijkseData = this.getDagelijkseActiviteitData(aantalWeken * 7);
    const weekData: { [weekKey: string]: any } = {};

    dagelijkseData.forEach(dag => {
      const datum = new Date(dag.datum);
      const weekStart = new Date(datum);
      weekStart.setDate(datum.getDate() - datum.getDay()); // Begin van de week (zondag)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekData[weekKey]) {
        weekData[weekKey] = {
          week: weekKey,
          opdrachten: 0,
          speeltijd: 0,
          gemiddeldeScore: 0,
          sessies: 0,
          scoreTotaal: 0,
          scoreAantal: 0
        };
      }

      weekData[weekKey].opdrachten += dag.opdrachten;
      weekData[weekKey].speeltijd += dag.speeltijd;
      weekData[weekKey].sessies += dag.sessies;
      
      if (dag.gemiddeldeScore > 0) {
        weekData[weekKey].scoreTotaal += dag.gemiddeldeScore;
        weekData[weekKey].scoreAantal++;
      }
    });

    // Bereken gemiddelde scores
    Object.values(weekData).forEach(week => {
      week.gemiddeldeScore = week.scoreAantal > 0 
        ? Math.round((week.scoreTotaal / week.scoreAantal) * 10) / 10 
        : 0;
      delete week.scoreTotaal;
      delete week.scoreAantal;
    });

    return Object.values(weekData).sort((a, b) => 
      new Date(a.week).getTime() - new Date(b.week).getTime()
    );
  }

  public getMaandelijkseData(aantalMaanden: number = 12): {
    maand: string;
    opdrachten: number;
    speeltijd: number;
    gemiddeldeScore: number;
    sessies: number;
  }[] {
    const dagelijkseData = this.getDagelijkseActiviteitData(aantalMaanden * 31);
    const maandData: { [maandKey: string]: any } = {};

    dagelijkseData.forEach(dag => {
      const datum = new Date(dag.datum);
      const maandKey = `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`;

      if (!maandData[maandKey]) {
        maandData[maandKey] = {
          maand: maandKey,
          opdrachten: 0,
          speeltijd: 0,
          gemiddeldeScore: 0,
          sessies: 0,
          scoreTotaal: 0,
          scoreAantal: 0
        };
      }

      maandData[maandKey].opdrachten += dag.opdrachten;
      maandData[maandKey].speeltijd += dag.speeltijd;
      maandData[maandKey].sessies += dag.sessies;
      
      if (dag.gemiddeldeScore > 0) {
        maandData[maandKey].scoreTotaal += dag.gemiddeldeScore;
        maandData[maandKey].scoreAantal++;
      }
    });

    // Bereken gemiddelde scores
    Object.values(maandData).forEach(maand => {
      maand.gemiddeldeScore = maand.scoreAantal > 0 
        ? Math.round((maand.scoreTotaal / maand.scoreAantal) * 10) / 10 
        : 0;
      delete maand.scoreTotaal;
      delete maand.scoreAantal;
    });

    return Object.values(maandData).sort((a, b) => 
      new Date(a.maand).getTime() - new Date(b.maand).getTime()
    );
  }

  // Categorie Verdeling data methoden
  public getCategorieDagelijkseData(aantalDagen: number = 30): {
    datum: string;
    [categorie: string]: number | string;
  }[] {
    const leerData = this.loadLeerData();
    if (!leerData) return [];

    const data: { [datum: string]: { [categorie: string]: number } } = {};
    const eindDatum = new Date();
    const startDatum = new Date(eindDatum.getTime() - (aantalDagen - 1) * 24 * 60 * 60 * 1000);

    // Genereer alle datums
    for (let d = new Date(startDatum); d <= eindDatum; d.setDate(d.getDate() + 1)) {
      const datumString = d.toISOString().split('T')[0];
      data[datumString] = {};
    }

    // Verwerk opdracht data per categorie
    Object.values(leerData.opdrachten).forEach(opdracht => {
      if (opdracht.laatsteDatum) {
        const datum = new Date(opdracht.laatsteDatum).toISOString().split('T')[0];
        if (data[datum]) {
          data[datum][opdracht.categorie] = (data[datum][opdracht.categorie] || 0) + 1;
        }
      }
    });

    return Object.entries(data).map(([datum, categorieen]) => ({
      datum,
      ...categorieen
    }));
  }

  public getCategorieWeekelijkseData(aantalWeken: number = 12): {
    week: string;
    [categorie: string]: number | string;
  }[] {
    const dagelijkseData = this.getCategorieDagelijkseData(aantalWeken * 7);
    const weekData: { [weekKey: string]: { [categorie: string]: number } } = {};

    dagelijkseData.forEach(d => {
      const date = new Date(d.datum);
      const weekStart = new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekData[weekKey]) {
        weekData[weekKey] = {};
      }

      Object.entries(d).forEach(([key, value]) => {
        if (key !== 'datum' && typeof value === 'number') {
          weekData[weekKey][key] = (weekData[weekKey][key] || 0) + value;
        }
      });
    });

    return Object.entries(weekData).map(([week, categorieen]) => ({
      week,
      ...categorieen
    })).sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }

  public getCategorieMaandelijkseData(aantalMaanden: number = 12): {
    maand: string;
    [categorie: string]: number | string;
  }[] {
    const dagelijkseData = this.getCategorieDagelijkseData(aantalMaanden * 31);
    const maandData: { [maandKey: string]: { [categorie: string]: number } } = {};

    dagelijkseData.forEach(d => {
      const date = new Date(d.datum);
      const maandKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!maandData[maandKey]) {
        maandData[maandKey] = {};
      }

      Object.entries(d).forEach(([key, value]) => {
        if (key !== 'datum' && typeof value === 'number') {
          maandData[maandKey][key] = (maandData[maandKey][key] || 0) + value;
        }
      });
    });

    return Object.entries(maandData).map(([maand, categorieen]) => ({
      maand,
      ...categorieen
    })).sort((a, b) => new Date(a.maand).getTime() - new Date(b.maand).getTime());
  }

  // Prestatie Analyse data methoden
  public getPrestatieDagelijkseData(aantalDagen: number = 30): {
    datum: string;
    gemiddeldeScore: number;
    gemiddeldeTijd: number;
  }[] {
    const leerData = this.loadLeerData();
    if (!leerData) return [];

    const data: { [datum: string]: { scores: number[]; tijden: number[] } } = {};
    const eindDatum = new Date();
    const startDatum = new Date(eindDatum.getTime() - (aantalDagen - 1) * 24 * 60 * 60 * 1000);

    // Genereer alle datums
    for (let d = new Date(startDatum); d <= eindDatum; d.setDate(d.getDate() + 1)) {
      const datumString = d.toISOString().split('T')[0];
      data[datumString] = { scores: [], tijden: [] };
    }

    // Verwerk opdracht data
    Object.values(leerData.opdrachten).forEach(opdracht => {
      if (opdracht.laatsteDatum) {
        const datum = new Date(opdracht.laatsteDatum).toISOString().split('T')[0];
        if (data[datum]) {
          // Voeg score toe (gebruik gemiddelde score)
          data[datum].scores.push(opdracht.gemiddeldeScore);
          // Voeg tijd toe (gebruik totale tijd gedeeld door aantal keer gedaan)
          if (opdracht.aantalKeerGedaan > 0) {
            data[datum].tijden.push(opdracht.totaleTijd / opdracht.aantalKeerGedaan);
          }
        }
      }
    });

    return Object.entries(data).map(([datum, waarden]) => ({
      datum,
      gemiddeldeScore: waarden.scores.length > 0 ? 
        Math.round((waarden.scores.reduce((a, b) => a + b, 0) / waarden.scores.length) * 10) / 10 : 0,
      gemiddeldeTijd: waarden.tijden.length > 0 ? 
        Math.round((waarden.tijden.reduce((a, b) => a + b, 0) / waarden.tijden.length) / 60 * 10) / 10 : 0 // Convert to minutes
    }));
  }

  public getPrestatieWeekelijkseData(aantalWeken: number = 12): {
    week: string;
    gemiddeldeScore: number;
    gemiddeldeTijd: number;
  }[] {
    const dagelijkseData = this.getPrestatieDagelijkseData(aantalWeken * 7);
    const weekData: { [weekKey: string]: { scores: number[]; tijden: number[] } } = {};

    dagelijkseData.forEach(d => {
      const date = new Date(d.datum);
      const weekStart = new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekData[weekKey]) {
        weekData[weekKey] = { scores: [], tijden: [] };
      }

      weekData[weekKey].scores.push(d.gemiddeldeScore);
      weekData[weekKey].tijden.push(d.gemiddeldeTijd);
    });

    return Object.entries(weekData).map(([week, waarden]) => ({
      week,
      gemiddeldeScore: waarden.scores.length > 0 ? 
        Math.round((waarden.scores.reduce((a, b) => a + b, 0) / waarden.scores.length) * 10) / 10 : 0,
      gemiddeldeTijd: waarden.tijden.length > 0 ? 
        Math.round((waarden.tijden.reduce((a, b) => a + b, 0) / waarden.tijden.length) * 10) / 10 : 0
    })).sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }

  public getPrestatieMaandelijkseData(aantalMaanden: number = 12): {
    maand: string;
    gemiddeldeScore: number;
    gemiddeldeTijd: number;
  }[] {
    const dagelijkseData = this.getPrestatieDagelijkseData(aantalMaanden * 31);
    const maandData: { [maandKey: string]: { scores: number[]; tijden: number[] } } = {};

    dagelijkseData.forEach(d => {
      const date = new Date(d.datum);
      const maandKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!maandData[maandKey]) {
        maandData[maandKey] = { scores: [], tijden: [] };
      }

      maandData[maandKey].scores.push(d.gemiddeldeScore);
      maandData[maandKey].tijden.push(d.gemiddeldeTijd);
    });

    return Object.entries(maandData).map(([maand, waarden]) => ({
      maand,
      gemiddeldeScore: waarden.scores.length > 0 ? 
        Math.round((waarden.scores.reduce((a, b) => a + b, 0) / waarden.scores.length) * 10) / 10 : 0,
      gemiddeldeTijd: waarden.tijden.length > 0 ? 
        Math.round((waarden.tijden.reduce((a, b) => a + b, 0) / waarden.tijden.length) * 10) / 10 : 0
    })).sort((a, b) => new Date(a.maand).getTime() - new Date(b.maand).getTime());
  }

  // Sessie Kwaliteit data methoden
  public getSessieKwaliteitDagelijkseData(aantalDagen: number = 30): {
    datum: string;
    aantalSessies: number;
    gemiddeldeDuur: number;
  }[] {
    const leerData = this.loadLeerData();
    if (!leerData) return [];

    const data: { [datum: string]: { sessies: number[]; tijden: number[] } } = {};
    const eindDatum = new Date();
    const startDatum = new Date(eindDatum.getTime() - (aantalDagen - 1) * 24 * 60 * 60 * 1000);

    // Genereer alle datums
    for (let d = new Date(startDatum); d <= eindDatum; d.setDate(d.getDate() + 1)) {
      const datumString = d.toISOString().split('T')[0];
      data[datumString] = { sessies: [], tijden: [] };
    }

    // Verwerk sessie data
    Object.values(leerData.sessies).forEach(sessie => {
      if (sessie.eindTijd) {
        const datum = new Date(sessie.startTijd).toISOString().split('T')[0];
        if (data[datum]) {
          data[datum].sessies.push(1); // Tel elke sessie
          data[datum].tijden.push(sessie.duur || 0); // Voeg duur toe
        }
      }
    });

    return Object.entries(data).map(([datum, waarden]) => ({
      datum,
      aantalSessies: waarden.sessies.length,
      gemiddeldeDuur: waarden.tijden.length > 0 ? 
        Math.round((waarden.tijden.reduce((a, b) => a + b, 0) / waarden.tijden.length) / 60 * 10) / 10 : 0 // Convert to minutes
    }));
  }

  public getSessieKwaliteitWeekelijkseData(aantalWeken: number = 12): {
    week: string;
    aantalSessies: number;
    gemiddeldeDuur: number;
  }[] {
    const dagelijkseData = this.getSessieKwaliteitDagelijkseData(aantalWeken * 7);
    const weekData: { [weekKey: string]: { sessies: number[]; tijden: number[] } } = {};

    dagelijkseData.forEach(d => {
      const date = new Date(d.datum);
      const weekStart = new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekData[weekKey]) {
        weekData[weekKey] = { sessies: [], tijden: [] };
      }

      weekData[weekKey].sessies.push(d.aantalSessies);
      weekData[weekKey].tijden.push(d.gemiddeldeDuur);
    });

    return Object.entries(weekData).map(([week, waarden]) => ({
      week,
      aantalSessies: waarden.sessies.reduce((a, b) => a + b, 0),
      gemiddeldeDuur: waarden.tijden.length > 0 ? 
        Math.round((waarden.tijden.reduce((a, b) => a + b, 0) / waarden.tijden.length) * 10) / 10 : 0
    })).sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }

  public getSessieKwaliteitMaandelijkseData(aantalMaanden: number = 12): {
    maand: string;
    aantalSessies: number;
    gemiddeldeDuur: number;
  }[] {
    const dagelijkseData = this.getSessieKwaliteitDagelijkseData(aantalMaanden * 31);
    const maandData: { [maandKey: string]: { sessies: number[]; tijden: number[] } } = {};

    dagelijkseData.forEach(d => {
      const date = new Date(d.datum);
      const maandKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!maandData[maandKey]) {
        maandData[maandKey] = { sessies: [], tijden: [] };
      }

      maandData[maandKey].sessies.push(d.aantalSessies);
      maandData[maandKey].tijden.push(d.gemiddeldeDuur);
    });

    return Object.entries(maandData).map(([maand, waarden]) => ({
      maand,
      aantalSessies: waarden.sessies.reduce((a, b) => a + b, 0),
      gemiddeldeDuur: waarden.tijden.length > 0 ? 
        Math.round((waarden.tijden.reduce((a, b) => a + b, 0) / waarden.tijden.length) * 10) / 10 : 0
    })).sort((a, b) => new Date(a.maand).getTime() - new Date(b.maand).getTime());
  }

  // Top Categorieën data methoden
  public getTopCategorieDagelijkseData(aantalDagen: number = 30): {
    datum: string;
    [categorie: string]: number | string;
  }[] {
    const categorieData = this.getCategorieDagelijkseData(aantalDagen);
    
    // Bepaal top 5 categorieën over alle data
    const categorieTotaal: { [categorie: string]: number } = {};
    categorieData.forEach(d => {
      Object.entries(d).forEach(([key, value]) => {
        if (key !== 'datum' && typeof value === 'number') {
          categorieTotaal[key] = (categorieTotaal[key] || 0) + value;
        }
      });
    });

    const topCategorieen = Object.entries(categorieTotaal)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([categorie]) => categorie);

    // Filter data naar top categorieën
    return categorieData.map(d => {
      const filtered: any = { datum: d.datum };
      topCategorieen.forEach(categorie => {
        if (d[categorie]) {
          filtered[categorie] = d[categorie];
        }
      });
      return filtered;
    });
  }

  public getTopCategorieWeekelijkseData(aantalWeken: number = 12): {
    week: string;
    [categorie: string]: number | string;
  }[] {
    const categorieData = this.getCategorieWeekelijkseData(aantalWeken);
    
    // Bepaal top 5 categorieën over alle data
    const categorieTotaal: { [categorie: string]: number } = {};
    categorieData.forEach(d => {
      Object.entries(d).forEach(([key, value]) => {
        if (key !== 'week' && typeof value === 'number') {
          categorieTotaal[key] = (categorieTotaal[key] || 0) + value;
        }
      });
    });

    const topCategorieen = Object.entries(categorieTotaal)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([categorie]) => categorie);

    // Filter data naar top categorieën
    return categorieData.map(d => {
      const filtered: any = { week: d.week };
      topCategorieen.forEach(categorie => {
        if (d[categorie]) {
          filtered[categorie] = d[categorie];
        }
      });
      return filtered;
    });
  }

  public getTopCategorieMaandelijkseData(aantalMaanden: number = 12): {
    maand: string;
    [categorie: string]: number | string;
  }[] {
    const categorieData = this.getCategorieMaandelijkseData(aantalMaanden);
    
    // Bepaal top 5 categorieën over alle data
    const categorieTotaal: { [categorie: string]: number } = {};
    categorieData.forEach(d => {
      Object.entries(d).forEach(([key, value]) => {
        if (key !== 'maand' && typeof value === 'number') {
          categorieTotaal[key] = (categorieTotaal[key] || 0) + value;
        }
      });
    });

    const topCategorieen = Object.entries(categorieTotaal)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([categorie]) => categorie);

    // Filter data naar top categorieën
    return categorieData.map(d => {
      const filtered: any = { maand: d.maand };
      topCategorieen.forEach(categorie => {
        if (d[categorie]) {
          filtered[categorie] = d[categorie];
        }
      });
      return filtered;
    });
  }

  public getLeitnerTijdlijnData(aantalDagen: number = 30): {
    datum: string;
    nieuweOpdrachten: number;
    herhalingen: number;
    totaal: number;
  }[] {
    const leerData = this.loadLeerData();
    const leitnerData = this.loadLeitnerData();
    if (!leerData || !leitnerData.isLeitnerActief) return [];

    const toLocalDateString = (iso: string): string => {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const tijdlijnData: { [datum: string]: { datum: string; nieuweOpdrachten: number; herhalingen: number; totaal: number } } = {};
    const ensure = (datumStr: string) => {
      if (!tijdlijnData[datumStr]) {
        tijdlijnData[datumStr] = { datum: datumStr, nieuweOpdrachten: 0, herhalingen: 0, totaal: 0 };
      }
      return tijdlijnData[datumStr];
    };

    const eind = new Date();
    const start = new Date(eind.getTime() - (aantalDagen - 1) * 24 * 60 * 60 * 1000);

    // Voor-af: initialiseer alle dagen in venster met nulwaarden
    for (let d = new Date(start); d <= eind; d.setDate(d.getDate() + 1)) {
      ensure(toLocalDateString(d.toISOString()));
    }

    const opdrachten = Object.values(leerData.opdrachten);
    // Per opdracht, tel per score/modus entry op de juiste dag (alleen leitner)
    opdrachten.forEach(op => {
      const scores = op.scoreGeschiedenis || [];
      const modi = op.modusGeschiedenis || [];
      for (let i = 0; i < scores.length; i++) {
        const entry = scores[i];
        if (!entry || !entry.datum) continue;
        const datumStr = toLocalDateString(entry.datum);
        // Sla entries buiten het venster over
        const datum = new Date(datumStr);
        if (datum < start || datum > eind) continue;
        const modus = modi[i]?.modus;
        if (modus !== 'leitner') continue;
        const ent = ensure(datumStr);
        if (i === 0) ent.nieuweOpdrachten++;
        else ent.herhalingen++;
        ent.totaal++;
      }
    });

    // Retourneer in kalendervolgorde exacte vensterlengte
    const resultaat: { datum: string; nieuweOpdrachten: number; herhalingen: number; totaal: number }[] = [];
    for (let d = new Date(start); d <= eind; d.setDate(d.getDate() + 1)) {
      const datumStr = toLocalDateString(d.toISOString());
      resultaat.push(tijdlijnData[datumStr]);
    }
    return resultaat;
  }

  public getLeitnerWeekelijkseData(aantalWeken: number = 12): {
    week: string;
    nieuweOpdrachten: number;
    herhalingen: number;
    totaal: number;
  }[] {
    const dagelijkseData = this.getLeitnerTijdlijnData(aantalWeken * 7);
    const weekData: { [weekKey: string]: any } = {};

    dagelijkseData.forEach(dag => {
      const datum = new Date(dag.datum);
      const weekStart = new Date(datum);
      weekStart.setDate(datum.getDate() - datum.getDay()); // Begin van de week (zondag)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekData[weekKey]) {
        weekData[weekKey] = {
          week: weekKey,
          nieuweOpdrachten: 0,
          herhalingen: 0,
          totaal: 0
        };
      }

      weekData[weekKey].nieuweOpdrachten += dag.nieuweOpdrachten;
      weekData[weekKey].herhalingen += dag.herhalingen;
      weekData[weekKey].totaal += dag.totaal;
    });

    return Object.values(weekData).sort((a, b) => 
      new Date(a.week).getTime() - new Date(b.week).getTime()
    );
  }

  public getLeitnerMaandelijkseData(aantalMaanden: number = 12): {
    maand: string;
    nieuweOpdrachten: number;
    herhalingen: number;
    totaal: number;
  }[] {
    const dagelijkseData = this.getLeitnerTijdlijnData(aantalMaanden * 31);
    const maandData: { [maandKey: string]: any } = {};

    dagelijkseData.forEach(dag => {
      const datum = new Date(dag.datum);
      const maandKey = `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`;

      if (!maandData[maandKey]) {
        maandData[maandKey] = {
          maand: maandKey,
          nieuweOpdrachten: 0,
          herhalingen: 0,
          totaal: 0
        };
      }

      maandData[maandKey].nieuweOpdrachten += dag.nieuweOpdrachten;
      maandData[maandKey].herhalingen += dag.herhalingen;
      maandData[maandKey].totaal += dag.totaal;
    });

    return Object.values(maandData).sort((a, b) => 
      new Date(a.maand).getTime() - new Date(b.maand).getTime()
    );
  }

  public getSessiePatronenData(): {
    uur: number;
    sessies: number;
    totaleTijd: number;
  }[] {
    const leerData = this.loadLeerData();
    if (!leerData) return [];

    const sessies = Object.values(leerData.sessies).filter(s => s.eindTijd);
    const uurPatronen: { [uur: number]: any } = {};

    // Initialiseer alle uren
    for (let uur = 0; uur < 24; uur++) {
      uurPatronen[uur] = {
        uur,
        sessies: 0,
        totaleTijd: 0
      };
    }

    // Analyseer sessies
    sessies.forEach(sessie => {
      const startTijd = new Date(sessie.startTijd);
      const uur = startTijd.getHours();
      
      uurPatronen[uur].sessies++;
      if (sessie.duur) {
        uurPatronen[uur].totaleTijd += sessie.duur;
      }
    });

    return Object.values(uurPatronen);
  }

  public getStreakData(): {
    huidigeStreak: number;
    langsteStreak: number;
    actieveDagen: string[];
    laatsteActiviteit: string;
  } {
    const dagelijkseData = this.getDagelijkseActiviteitData(365);
    const actieveDagen = dagelijkseData
      .filter(dag => dag.opdrachten > 0)
      .map(dag => dag.datum)
      .sort();

    let huidigeStreak = 0;
    let langsteStreak = 0;
    let tempStreak = 0;

    // Bereken streaks
    for (let i = 0; i < actieveDagen.length; i++) {
      const huidigeDag = new Date(actieveDagen[i]);
      const vorigeDag = i > 0 ? new Date(actieveDagen[i - 1]) : null;
      
      if (!vorigeDag || (huidigeDag.getTime() - vorigeDag.getTime()) <= 24 * 60 * 60 * 1000) {
        tempStreak++;
        huidigeStreak = tempStreak;
        langsteStreak = Math.max(langsteStreak, tempStreak);
      } else {
        tempStreak = 1;
        huidigeStreak = 1;
      }
    }

    return {
      huidigeStreak,
      langsteStreak,
      actieveDagen,
      laatsteActiviteit: actieveDagen.length > 0 ? actieveDagen[actieveDagen.length - 1] : ''
    };
  }

  private bepaalSterkstePunt(_categorie: string, score: number): string {
    if (score >= 4.5) return "Uitstekende beheersing van dit onderwerp";
    if (score >= 4.0) return "Goede kennis van dit onderwerp";
    if (score >= 3.0) return "Basis begrip van dit onderwerp";
    return "Beginstadium van leren";
  }

  private bepaalVerbeterpunt(_categorie: string, score: number): string {
    if (score < 3.0) return "Meer oefening nodig in deze categorie";
    if (score < 4.0) return "Verder verdiepen in deze categorie";
    if (score < 4.5) return "Fijnafstemming van kennis";
    return "Behoud van huidige niveau";
  }

  // Nieuwe methode om alle opdracht-ID's in het Leitner-systeem op te halen
  private getAllLeitnerOpdrachtIds(): Set<string> {
    const leitnerData = this.loadLeitnerData();
    const allIds = new Set<string>();
    if (leitnerData.isLeitnerActief) {
      leitnerData.boxes.forEach(box => {
        box.opdrachten.forEach(id => allIds.add(id));
      });
    }
    return allIds;
  }



  // Achievement system
  private checkAchievements(leerData: LeerData): Achievement[] {
    const achievements = this.loadAchievements();
    const nieuweAchievements: Achievement[] = [];

    // Check voor nieuwe achievements
    ACHIEVEMENTS.forEach(achievementDef => {
      const alBehaald = achievements.some(a => a.id === achievementDef.id);
      if (alBehaald) return;

      let behaald = false;

      switch (achievementDef.id) {
        // Onboarding achievements
        case 'eerste_opdracht':
          behaald = leerData.statistieken.totaalOpdrachten >= 1;
          break;
        case 'eerste_vlam':
          behaald = leerData.statistieken.totaalOpdrachten >= 3;
          break;
        case 'snelle_starter':
          behaald = leerData.statistieken.totaalOpdrachten >= 5;
          break;
        case 'de_starter':
          behaald = leerData.statistieken.totaalOpdrachten >= 10;
          break;

        // Progressie achievements
        case 'leergierig':
          behaald = leerData.statistieken.totaalOpdrachten >= 25;
          break;
        case 'doorzetter':
          behaald = leerData.statistieken.totaalOpdrachten >= 50;
          break;
        case 'volhouder':
          behaald = leerData.statistieken.totaalOpdrachten >= 100;
          break;
        case 'master':
          behaald = leerData.statistieken.totaalOpdrachten >= 250;
          break;

        // Streak achievements (opeenvolgende dagen)
        case 'streak_7': {
          const streakData = this.getStreakData();
          behaald = streakData.huidigeStreak >= 7;
          break;
        }
        case 'streak_14': {
          const streakData = this.getStreakData();
          behaald = streakData.huidigeStreak >= 14;
          break;
        }
        case 'streak_30': {
          const streakData = this.getStreakData();
          behaald = streakData.huidigeStreak >= 30;
          break;
        }
        case 'streak_100': {
          const streakData = this.getStreakData();
          behaald = streakData.huidigeStreak >= 100;
          break;
        }

        // Categorie mastery achievements
        case 'categorie_10': {
          const categorieCounts = this.getCategorieOpdrachtCounts(leerData);
          behaald = Object.values(categorieCounts).some(count => count >= 10);
          break;
        }
        case 'categorie_25': {
          const categorieCounts = this.getCategorieOpdrachtCounts(leerData);
          behaald = Object.values(categorieCounts).some(count => count >= 25);
          break;
        }
        case 'categorie_50': {
          const categorieCounts = this.getCategorieOpdrachtCounts(leerData);
          behaald = Object.values(categorieCounts).some(count => count >= 50);
          break;
        }
        case 'categorie_complete': {
          const categorieCounts = this.getCategorieOpdrachtCounts(leerData);
          behaald = Object.entries(categorieCounts).some(([categorie, count]) => {
            const totaleOpdrachtenInCategorie = this.getTotaalOpdrachtenInCategorie(categorie);
            return count >= totaleOpdrachtenInCategorie;
          });
          break;
        }

        // Leertijd achievements
        case 'tijd_60':
          behaald = leerData.statistieken.totaalSpeeltijd >= 60;
          break;
        case 'tijd_300':
          behaald = leerData.statistieken.totaalSpeeltijd >= 300;
          break;
        case 'tijd_1000':
          behaald = leerData.statistieken.totaalSpeeltijd >= 1000;
          break;

        // Dagelijkse streak achievements
        case 'dagelijkse_streak_7': {
          const streakData = this.getStreakData();
          behaald = streakData.huidigeStreak >= 7;
          break;
        }
        case 'dagelijkse_streak_30': {
          const streakData = this.getStreakData();
          behaald = streakData.huidigeStreak >= 30;
          break;
        }

        // Speciale achievements
        case 'perfecte_sessie': {
          behaald = Object.values(leerData.sessies).some((s: SessieData) => s.gemiddeldeScore === 5);
          break;
        }
        case 'speed_runner': {
          behaald = Object.values(leerData.sessies).some((s: SessieData) => s.opdrachtenGedaan === 5 && (s.duur || 0) < 10);
          break;
        }
        case 'diepe_denker': {
          // Verzamel alle scores met datum informatie
          const scoresMetDatum: { score: number; datum: string }[] = [];
          
          Object.values(leerData.opdrachten).forEach(opdracht => {
            if (opdracht.scoreGeschiedenis) {
              scoresMetDatum.push(...opdracht.scoreGeschiedenis);
            }
          });
          
          // Sorteer op datum (nieuwste eerst) en neem laatste 30
          const laatste30Scores = scoresMetDatum
            .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
            .slice(0, 30);
          
          // Bereken gemiddelde van laatste 30 scores
          if (laatste30Scores.length >= 30) {
            const gemiddelde = laatste30Scores.reduce((sum, item) => sum + item.score, 0) / laatste30Scores.length;
            behaald = gemiddelde >= 4;
          }
          break;
        }
        case 'showstopper': {
          // Check voor 10 perfecte scores op rij
          const perfecteScores = Object.values(leerData.opdrachten)
            .flatMap(op => op.scoreGeschiedenis || [])
            .filter(score => score.score === 5)
            .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
          
          // Zoek naar 10 opeenvolgende perfecte scores
          let opeenvolgendePerfecteScores = 0;
          for (let i = 0; i < perfecteScores.length - 1; i++) {
            const huidigeDatum = new Date(perfecteScores[i].datum);
            const volgendeDatum = new Date(perfecteScores[i + 1].datum);
            const dagenVerschil = Math.abs(huidigeDatum.getTime() - volgendeDatum.getTime()) / (1000 * 60 * 60 * 24);
            
            if (dagenVerschil <= 1) {
              opeenvolgendePerfecteScores++;
            } else {
              opeenvolgendePerfecteScores = 0;
            }
            
            if (opeenvolgendePerfecteScores >= 9) { // 10 scores = 9 opeenvolgende
              behaald = true;
              break;
            }
          }
          break;
        }
      }

      if (behaald) {
        nieuweAchievements.push({
          ...achievementDef,
          behaaldOp: new Date().toISOString()
        });
      }
    });

    if (nieuweAchievements.length > 0) {
      this.saveAchievements([...achievements, ...nieuweAchievements]);
    }

    return nieuweAchievements;
  }

  loadAchievements(): Achievement[] {
    return this.loadFromLocalStorage(LEER_DATA_KEYS.ACHIEVEMENTS) || [];
  }

  private saveAchievements(achievements: Achievement[]): void {
    this.saveToLocalStorage(LEER_DATA_KEYS.ACHIEVEMENTS, achievements);
  }

  // Helper functies voor achievement checks
  private getCategorieOpdrachtCounts(leerData: LeerData): Record<string, number> {
    const counts: Record<string, number> = {};
    
    Object.values(leerData.opdrachten).forEach(opdracht => {
      if (opdracht.aantalKeerGedaan > 0) {
        counts[opdracht.categorie] = (counts[opdracht.categorie] || 0) + opdracht.aantalKeerGedaan;
      }
    });
    
    return counts;
  }



  private getTotaalOpdrachtenInCategorie(categorie: string): number {
    return this._alleOpdrachten.filter(opdracht => opdracht.Categorie === categorie).length;
  }

  getAchievementDefinitions(): { algemeen: Omit<Achievement, 'behaaldOp'>[], leitner: Omit<LeitnerAchievement, 'behaaldOp'>[] } {
    return {
      algemeen: ACHIEVEMENTS,
      leitner: LEITNER_ACHIEVEMENTS
    };
  }

  private checkLeitnerAchievements(leitnerData: LeitnerData): LeitnerAchievement[] {
    const behaaldeLeitnerAchievements = leitnerData.achievements;
    const nieuweLeitnerAchievements: LeitnerAchievement[] = [];

    LEITNER_ACHIEVEMENTS.forEach(achievementDef => {
      const alBehaald = behaaldeLeitnerAchievements.some(a => a.id === achievementDef.id);
      if (alBehaald) return;

      let behaald = false;
      switch (achievementDef.id) {
        // De promotie-achievements worden nu afgehandeld in `checkPromotieAchievement`.
        // We laten de structuur hier staan voor toekomstige, niet-promotie-gerelateerde achievements.
        
        // Voorbeeld:
        // case 'eerste_herhaling_voltooid': {
        //   ... logica ...
        //   break;
        // }
      }

      if (behaald) {
        nieuweLeitnerAchievements.push({
          ...achievementDef,
          behaaldOp: new Date().toISOString()
        });
      }
    });

    return nieuweLeitnerAchievements;
  }

  updateHerhalingAchievements(): LeitnerAchievement[] {
    const leitnerData = this.loadLeitnerData();
    if (!leitnerData.isLeitnerActief) return [];
  
    // Stap 1: Check of alle dagelijkse opdrachten zijn voltooid
    const opdrachtenVoorVandaag = this.getLeitnerOpdrachtenVoorVandaag();
    if (opdrachtenVoorVandaag.length > 0) {
      // Er zijn nog opdrachten over, dus geen voltooiing
      return [];
    }
  
    // Stap 2: Update voltooiingen en streaks
    const vandaag = getDatumString();
    if (leitnerData.laatsteVoltooiingsDatum === vandaag) {
      // Al voltooid vandaag, doe niets
      return [];
    }
  
    leitnerData.voltooiingen += 1;
    
    // Streak logica
    const gisteren = new Date();
    gisteren.setDate(gisteren.getDate() - 1);
    const gisterenString = gisteren.toISOString().split('T')[0];
  
    if (leitnerData.laatsteVoltooiingsDatum === gisterenString) {
      leitnerData.huidigeStreak += 1;
    } else {
      leitnerData.huidigeStreak = 1; // Nieuwe streak
    }
  
    leitnerData.langsteStreak = Math.max(leitnerData.langsteStreak, leitnerData.huidigeStreak);
    leitnerData.laatsteVoltooiingsDatum = vandaag;
  
    // Stap 3: Check voor nieuwe achievements
    const nieuweAchievements: LeitnerAchievement[] = [];
    const checkTargets = [
      { idPrefix: 'herhaling_', count: leitnerData.voltooiingen },
      { idPrefix: 'streak_', count: leitnerData.huidigeStreak }
    ];
  
    checkTargets.forEach(({ idPrefix, count }) => {
      const achievementDef = LEITNER_ACHIEVEMENTS.find(a => a.id === `${idPrefix}${count}`);
      if (achievementDef && !leitnerData.achievements.some(a => a.id === achievementDef.id)) {
        const nieuweAchievement: LeitnerAchievement = {
          ...achievementDef,
          behaaldOp: new Date().toISOString()
        };
        nieuweAchievements.push(nieuweAchievement);
        leitnerData.achievements.push(nieuweAchievement);
      }
    });
  
    this.saveLeitnerData(leitnerData);
    return nieuweAchievements;
  }

  // Helper functies
  private createEmptyLeerData(): LeerData {
    return {
      spelerId: this.spelerId,
      laatsteUpdate: new Date().toISOString(),
      statistieken: {
        totaalOpdrachten: 0,
        totaalSessies: 0,
        totaalSpeeltijd: 0,
        gemiddeldeSessieDuur: 0,
        gemiddeldeScore: 0,
        hoogsteScore: 0,
        laagsteScore: 0,
        consistentieScore: 0,
        categorieStatistieken: {},
        dagelijkseActiviteit: {},
        favorieteCategorie: '',
        zwaksteCategorie: '',
        laatsteActiviteit: ''
      },
      opdrachten: {},
      sessies: {}
    };
  }

  public getTotaalBeschikbareOpdrachten(): number {
    return this._alleOpdrachten.length;
  }

  public getAlleBeschikbareCategorieen(): Record<string, any> {
    if (!this._alleOpdrachten.length) {
      return {};
    }

    // Maak een map van subcategorie naar hoofdcategorie
    const subNaarHoofdMap = new Map<string, string>();
    const alleCategorieen = new Set<string>();
    
    this._alleOpdrachten.forEach(op => {
      if (!subNaarHoofdMap.has(op.Categorie)) {
        subNaarHoofdMap.set(op.Categorie, op.Hoofdcategorie || 'Overig');
      }
      alleCategorieen.add(op.Categorie);
    });

    // Groepeer categorieën per hoofdcategorie
    const categorieenPerHoofd: Record<string, string[]> = {};
    alleCategorieen.forEach(categorie => {
      const hoofdCat = subNaarHoofdMap.get(categorie) || 'Overig';
      if (!categorieenPerHoofd[hoofdCat]) {
        categorieenPerHoofd[hoofdCat] = [];
      }
      categorieenPerHoofd[hoofdCat].push(categorie);
    });

    return categorieenPerHoofd;
  }

  public getHoofdcategorieStatistieken(): Record<string, any> {
    const leerData = this.loadLeerData();
    if (!leerData || !this._alleOpdrachten.length) {
      return {};
    }

    // Haal alle beschikbare categorieën op
    const alleCategorieen = this.getAlleBeschikbareCategorieen();
    
    // Maak een map van subcategorie naar hoofdcategorie
    const subNaarHoofdMap = new Map<string, string>();
    this._alleOpdrachten.forEach(op => {
      if (!subNaarHoofdMap.has(op.Categorie)) {
        subNaarHoofdMap.set(op.Categorie, op.Hoofdcategorie || 'Overig');
      }
    });

    const hoofdCategorieStats: Record<string, any> = {};

    // Loop door alle beschikbare hoofdcategorieën
    for (const hoofdCat in alleCategorieen) {
      const subCategorieen = alleCategorieen[hoofdCat];
      
      hoofdCategorieStats[hoofdCat] = {
        categorie: hoofdCat,
        aantalOpdrachten: 0,
        gemiddeldeScore: [],
        laatsteActiviteit: '1970-01-01T00:00:00.000Z',
        subCategorieen: []
      };

      // Loop door alle subcategorieën van deze hoofdcategorie
      subCategorieen.forEach((subCat: string) => {
        const subStat = leerData.statistieken.categorieStatistieken[subCat];
        
        if (subStat) {
          // Er zijn statistieken voor deze subcategorie
          const hoofdStat = hoofdCategorieStats[hoofdCat];
          hoofdStat.aantalOpdrachten += subStat.aantalOpdrachten;
          hoofdStat.gemiddeldeScore.push(subStat.gemiddeldeScore);
          if (new Date(subStat.laatsteActiviteit) > new Date(hoofdStat.laatsteActiviteit)) {
            hoofdStat.laatsteActiviteit = subStat.laatsteActiviteit;
          }
          hoofdStat.subCategorieen.push(subStat);
        } else {
          // Geen statistieken voor deze subcategorie - maak een lege statistiek
          const legeSubStat = {
            categorie: subCat,
            aantalOpdrachten: 0,
            gemiddeldeScore: 0,
            laatsteActiviteit: '1970-01-01T00:00:00.000Z',
            totaalOpdrachten: this._alleOpdrachten.filter(op => op.Categorie === subCat).length
          };
          hoofdCategorieStats[hoofdCat].subCategorieen.push(legeSubStat);
        }
      });
    }
    
    // Bereken het uiteindelijke gemiddelde
    for (const hoofdCat in hoofdCategorieStats) {
      const scores = hoofdCategorieStats[hoofdCat].gemiddeldeScore;
      hoofdCategorieStats[hoofdCat].gemiddeldeScore = scores.length > 0
        ? berekenGemiddeldeScore(scores)
        : 0;
    }

    return hoofdCategorieStats;
  }

  // Export/Import functionaliteit
  exportData(): string {
    const leerData = this.loadLeerData();
    const achievements = this.loadAchievements();
    
    return JSON.stringify({
      leerData,
      achievements,
      exportDatum: new Date().toISOString(),
      versie: '1.0'
    }, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.leerData) {
        this.saveLeerData(data.leerData);
      }
      if (data.achievements) {
        this.saveAchievements(data.achievements);
      }
      return true;
    } catch (error) {
      console.error('Fout bij importeren van data:', error);
      return false;
    }
  }

  // Data cleanup
  clearData(): void {
    localStorage.removeItem(LEER_DATA_KEYS.SPELER_DATA + this.spelerId);
    localStorage.removeItem(LEER_DATA_KEYS.ACHIEVEMENTS + this.spelerId);
    localStorage.removeItem(LEER_DATA_KEYS.LEITNER_DATA + this.spelerId);
  }

  // Preferences management
  savePreferences(preferences: any): void {
    this.saveToLocalStorage(LEER_DATA_KEYS.PREFERENCES, preferences);
  }

  loadPreferences(): any {
    return this.loadFromLocalStorage(LEER_DATA_KEYS.PREFERENCES) || {};
  }

  // Leitner-systeem functionaliteit
  loadLeitnerData(): LeitnerData {
    let data = this.loadFromLocalStorage(LEER_DATA_KEYS.LEITNER_DATA);
    if (data) {
      // Zorg voor compatibiliteit met oude data
      if (!data.achievements) data.achievements = [];
      if (data.voltooiingen === undefined) data.voltooiingen = 0;
      if (data.huidigeStreak === undefined) data.huidigeStreak = 0;
      if (data.langsteStreak === undefined) data.langsteStreak = 0;
      if (data.laatsteVoltooiingsDatum === undefined) data.laatsteVoltooiingsDatum = '';
      if (!data.newQuestionsToday) {
        data.newQuestionsToday = { date: getDatumString(), count: 0 };
      }
      // Pauze functionaliteit compatibiliteit
      if (!data.pausedOpdrachten) data.pausedOpdrachten = [];
      if (!data.opdrachtPauseTimes) data.opdrachtPauseTimes = {};
      return data;
    }
    
    // Maak standaard Leitner data
    return this.createEmptyLeitnerData();
  }

  saveLeitnerData(data: LeitnerData): void {
    data.laatsteUpdate = new Date().toISOString();
    this.saveToLocalStorage(LEER_DATA_KEYS.LEITNER_DATA, data);
  }

  private   createEmptyLeitnerData(): LeitnerData {
    return {
      boxes: [
        { boxId: 0, opdrachten: [], lastReview: new Date().toISOString() },
        { boxId: 1, opdrachten: [], lastReview: new Date().toISOString() },
        { boxId: 2, opdrachten: [], lastReview: new Date().toISOString() },
        { boxId: 3, opdrachten: [], lastReview: new Date().toISOString() },
        { boxId: 4, opdrachten: [], lastReview: new Date().toISOString() },
        { boxId: 5, opdrachten: [], lastReview: new Date().toISOString() },
        { boxId: 6, opdrachten: [], lastReview: new Date().toISOString() },
        { boxId: 7, opdrachten: [], lastReview: new Date().toISOString() }
      ],
      opdrachtReviewTimes: {},
      isLeitnerActief: true,
      boxIntervallen: [10, 1440, 2880, 5760, 10080, 20160, 64800, Infinity], // minuten
      herhalingStrategie: 'hybride',
      laatsteUpdate: new Date().toISOString(),
      achievements: [],
      voltooiingen: 0,
      huidigeStreak: 0,
      langsteStreak: 0,
      laatsteVoltooiingsDatum: '',
      newQuestionsToday: { date: getDatumString(), count: 0 },
      // Pauze functionaliteit
      pausedOpdrachten: [],
      opdrachtPauseTimes: {}
    };
  }

  // Leitner opdracht management
  addOpdrachtToLeitner(opdrachtId: string): void {
    const leitnerData = this.loadLeitnerData();
    
    // Controleer of Leitner actief is
    if (!leitnerData.isLeitnerActief) {
      return;
    }
    
    // Verwijder opdracht uit alle boxen
    leitnerData.boxes.forEach(box => {
      box.opdrachten = box.opdrachten.filter(id => id !== opdrachtId);
    });
    
    // Voeg toe aan box 0 (10 minuten)
    const box0 = leitnerData.boxes.find(box => box.boxId === 0);
    if (box0) {
      box0.opdrachten.push(opdrachtId);
      // Stel de individuele timer in voor de nieuwe opdracht
      leitnerData.opdrachtReviewTimes[opdrachtId] = new Date().toISOString();
    }

    // Update de teller voor nieuwe vragen vandaag
    const vandaag = getDatumString();
    if (leitnerData.newQuestionsToday.date !== vandaag) {
      leitnerData.newQuestionsToday.date = vandaag;
      leitnerData.newQuestionsToday.count = 1;
    } else {
      leitnerData.newQuestionsToday.count++;
    }
    
    this.saveLeitnerData(leitnerData);
  }

  getNewQuestionsTodayCount(): number {
    const leitnerData = this.loadLeitnerData();
    const vandaag = getDatumString();

    if (leitnerData.newQuestionsToday.date !== vandaag) {
      // Reset de teller voor een nieuwe dag
      leitnerData.newQuestionsToday.date = vandaag;
      leitnerData.newQuestionsToday.count = 0;
      this.saveLeitnerData(leitnerData);
      return 0;
    }

    return leitnerData.newQuestionsToday.count;
  }


  updateLeitnerBox(opdrachtId: string, score: number): LeitnerAchievement | null {
    const leitnerData = this.loadLeitnerData();
    if (!leitnerData.isLeitnerActief) return null;

    let huidigeBoxId = -1;
    let huidigeBoxIndex = -1;
    leitnerData.boxes.forEach((box, index) => {
      if (box.opdrachten.includes(opdrachtId)) {
        huidigeBoxId = box.boxId;
        huidigeBoxIndex = index;
      }
    });

    if (huidigeBoxId === -1) return null;

    // Verwijder uit huidige box
    leitnerData.boxes[huidigeBoxIndex].opdrachten = leitnerData.boxes[huidigeBoxIndex].opdrachten.filter(id => id !== opdrachtId);

    // Bepaal nieuwe box
    let nieuweBoxId = huidigeBoxId;
    if (score >= 4) {
      nieuweBoxId = Math.min(huidigeBoxId + 1, 7);
    } else if (score <= 2) {
      nieuweBoxId = huidigeBoxId === 0 ? 0 : 1;
    }

    // Voeg toe aan nieuwe box en reset de individuele timer van de opdracht
    const targetBox = leitnerData.boxes.find(box => box.boxId === nieuweBoxId);
    if (targetBox) {
      targetBox.opdrachten.push(opdrachtId);
      leitnerData.opdrachtReviewTimes[opdrachtId] = new Date().toISOString();
    }

    this.saveLeitnerData(leitnerData);
    
    return this.checkPromotieAchievement(nieuweBoxId, leitnerData);
  }
  
  checkPromotieAchievement(bereikteBox: number, leitnerData: LeitnerData): LeitnerAchievement | null {
    const achievementId = `promotie_box_${bereikteBox}`;
    const achievementDef = LEITNER_ACHIEVEMENTS.find(a => a.id === achievementId);
    
    if (!achievementDef) return null; // Geen achievement voor deze box

    const alBehaald = leitnerData.achievements.some(a => a.id === achievementId);
    if (alBehaald) return null;

    // Nieuwe achievement behaald
    const nieuweAchievement: LeitnerAchievement = {
      ...achievementDef,
      behaaldOp: new Date().toISOString()
    };

    leitnerData.achievements.push(nieuweAchievement);
    this.saveLeitnerData(leitnerData);
    
    return nieuweAchievement;
  }

  getLeitnerOpdrachtenVoorVandaag(negeerBox0WachttijdAlsLeeg: boolean = false): { opdrachtId: string; boxId: number }[] {
    const leitnerData = this.loadLeitnerData();
    if (!leitnerData.isLeitnerActief) return [];

    const nu = new Date();
    const beschikbareOpdrachten: { opdrachtId: string; boxId: number }[] = [];

    leitnerData.boxes.forEach(box => {
      const intervalInMinuten = leitnerData.boxIntervallen[box.boxId] || 1440;
      
      box.opdrachten.forEach(opdrachtId => {
        // Sla gepauzeerde opdrachten over
        if (leitnerData.pausedOpdrachten && leitnerData.pausedOpdrachten.includes(opdrachtId)) {
          return;
        }
        
        const laatsteReviewString = leitnerData.opdrachtReviewTimes[opdrachtId];
        if (!laatsteReviewString) {
          return;
        }
        
        const laatsteReviewDatum = new Date(laatsteReviewString);

        if (box.boxId === 0) {
          const minutenSindsLaatsteReview = Math.floor((nu.getTime() - laatsteReviewDatum.getTime()) / (1000 * 60));
          if (minutenSindsLaatsteReview >= intervalInMinuten) {
            beschikbareOpdrachten.push({ opdrachtId, boxId: box.boxId });
          }
        } else {
          const dagenInMilliseconden = 1000 * 60 * 60 * 24;
          const verstrekenDagen = Math.floor((nu.getTime() - laatsteReviewDatum.getTime()) / dagenInMilliseconden);
          const intervalInDagen = Math.ceil(intervalInMinuten / 1440);

          if (verstrekenDagen >= intervalInDagen) {
            beschikbareOpdrachten.push({ opdrachtId, boxId: box.boxId });
          }
        }
      });
    });

    // Nieuwe logica: als er geen opdrachten zijn, en de instelling is aan, voeg Box 0 opdrachten toe.
    if (beschikbareOpdrachten.length === 0 && negeerBox0WachttijdAlsLeeg) {
      const box0 = leitnerData.boxes.find(box => box.boxId === 0);
      if (box0) {
        box0.opdrachten.forEach(opdrachtId => {
          if (!leitnerData.pausedOpdrachten || !leitnerData.pausedOpdrachten.includes(opdrachtId)) {
            beschikbareOpdrachten.push({ opdrachtId, boxId: box0.boxId });
          }
        });
      }
    }

    return beschikbareOpdrachten;
  }

  selectLeitnerOpdracht(
    alleOpdrachten: Opdracht[],
    herhalingItems: { opdrachtId: string; boxId: number }[],
    geselecteerdeCategorieen: string[]
  ): { opdracht: Opdracht | null; type: 'herhaling' | 'nieuw' | 'geen', box?: number } {
    // 1. Geef altijd voorrang aan de aangeleverde herhalingItems.
    if (herhalingItems.length > 0) {
      const shuffledHerhalingen = herhalingItems.sort(() => 0.5 - Math.random());

      for (const item of shuffledHerhalingen) {
        const idToMatch = item.opdrachtId;
        
        const gekozenOpdracht = alleOpdrachten.find(op => {
          const hoofdcategorie = op.Hoofdcategorie || 'Overig';
          const generatedId = `${hoofdcategorie}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
          return generatedId === idToMatch;
        });
        
        if (gekozenOpdracht) {
          return { opdracht: gekozenOpdracht, type: 'herhaling', box: item.boxId };
        }
      }
    }

    // 2. Als er GEEN herhalingen zijn, zoek dan naar een nieuwe opdracht.
    const nieuweOpdrachten = this.getNieuweOpdrachten(alleOpdrachten, geselecteerdeCategorieen);
    if (nieuweOpdrachten.length > 0) {
      const gekozenOpdracht = nieuweOpdrachten[Math.floor(Math.random() * nieuweOpdrachten.length)];
      return { opdracht: gekozenOpdracht, type: 'nieuw' };
    }

    // 3. Geen herhalingen en geen nieuwe opdrachten beschikbaar.
    return { opdracht: null, type: 'geen' };
  }

  getNieuweOpdrachten(
    alleOpdrachten: Opdracht[],
    geselecteerdeCategorieen: string[]
  ): Opdracht[] {
    const leitnerOpdrachtIds = this.getAllLeitnerOpdrachtIds();
    const leitnerData = this.loadLeitnerData();
    const pausedOpdrachten = leitnerData.pausedOpdrachten || [];
    
    return alleOpdrachten.filter(op => {
      const uniekeIdentifier = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
      if (!geselecteerdeCategorieen.includes(uniekeIdentifier)) {
        return false;
      }
      const hoofdcategorie = op.Hoofdcategorie || 'Overig';
      const opdrachtId = `${hoofdcategorie}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
      
      // Filter uit opdrachten die al in Leitner zitten
      if (leitnerOpdrachtIds.has(opdrachtId)) {
        return false;
      }
      
      // Filter uit gepauzeerde opdrachten
      if (pausedOpdrachten.includes(opdrachtId)) {
        return false;
      }
      
      return true;
    });
  }

  // Nieuwe, efficiënte functie om alleen het aantal te tellen
  getNieuweLeitnerOpdrachtenCount(
    alleOpdrachten: Opdracht[],
    geselecteerdeCategorieen: string[]
  ): number {
    const leitnerOpdrachtIds = this.getAllLeitnerOpdrachtIds();
    const leitnerData = this.loadLeitnerData();
    const pausedOpdrachten = leitnerData.pausedOpdrachten || [];
    
    let count = 0;
    for (const op of alleOpdrachten) {
      const uniekeIdentifier = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
      if (!geselecteerdeCategorieen.includes(uniekeIdentifier)) {
        continue;
      }
      const hoofdcategorie = op.Hoofdcategorie || 'Overig';
      const opdrachtId = `${hoofdcategorie}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
      
      if (leitnerOpdrachtIds.has(opdrachtId) || pausedOpdrachten.includes(opdrachtId)) {
        continue;
      }
      
      count++;
    }
    return count;
  }

  getLeitnerOpdrachtInfo(opdrachtId: string): LeitnerOpdrachtInfo | null {
    const leitnerData = this.loadLeitnerData();
    
    // Zoek opdracht in boxen
    let huidigeBox = 0;
    let laatsteHerhaling = '';
    
    leitnerData.boxes.forEach(box => {
      if (box.opdrachten.includes(opdrachtId)) {
        huidigeBox = box.boxId;
        laatsteHerhaling = box.lastReview;
      }
    });

    if (huidigeBox === 0) return null;

    const interval = leitnerData.boxIntervallen[huidigeBox] || 1440; // default 1 dag
    const laatsteReviewDate = new Date(laatsteHerhaling);
    const volgendeReviewDate = new Date(laatsteReviewDate);
    volgendeReviewDate.setMinutes(volgendeReviewDate.getMinutes() + interval);

    const vandaag = new Date();
    const isVandaagBeschikbaar = vandaag >= volgendeReviewDate;

    return {
      opdrachtId,
      huidigeBox,
      laatsteHerhaling,
      volgendeHerhaling: volgendeReviewDate.toISOString(),
      isVandaagBeschikbaar
    };
  }

  getLeitnerStatistieken(): {
    totaalOpdrachten: number;
    opdrachtenPerBox: { [boxId: number]: number };
    vandaagBeschikbaar: number;
  } {
    const leitnerData = this.loadLeitnerData();
    const opdrachtenPerBox: { [boxId: number]: number } = {};
    const pausedOpdrachten = leitnerData.pausedOpdrachten || [];
    
    // Initialiseer alle boxes
    for (let i = 0; i <= 7; i++) {
      opdrachtenPerBox[i] = 0;
    }
    
    // Tel opdrachten per box (exclusief gepauzeerde)
    if (leitnerData && leitnerData.boxes) {
      leitnerData.boxes.forEach(box => {
        const actieveOpdrachten = box.opdrachten.filter(opdrachtId => 
          !pausedOpdrachten.includes(opdrachtId)
        );
        opdrachtenPerBox[box.boxId] = actieveOpdrachten.length;
      });
    }
    
    const totaalOpdrachten = Object.values(opdrachtenPerBox).reduce((sum, count) => sum + count, 0);
    const vandaagBeschikbaar = this.getLeitnerOpdrachtenVoorVandaag().length;
    
    return {
      totaalOpdrachten,
      opdrachtenPerBox,
      vandaagBeschikbaar
    };
  }

  getStatistiekenPerModus(): {
    normaal: { sessies: number; gemiddeldeScore: number; speeltijd: number; categorieen: string[] };
    leitner: { sessies: number; gemiddeldeScore: number; speeltijd: number; categorieen: string[] };
  } {
    const leerData = this.loadLeerData();
    if (!leerData) {
      return {
        normaal: { sessies: 0, gemiddeldeScore: 0, speeltijd: 0, categorieen: [] },
        leitner: { sessies: 0, gemiddeldeScore: 0, speeltijd: 0, categorieen: [] }
      };
    }

    const normaalSessies = Object.values(leerData.sessies).filter(s => s.serieuzeModus && s.leermodusType === 'normaal' && s.eindTijd);
    const leitnerSessies = Object.values(leerData.sessies).filter(s => s.serieuzeModus && s.leermodusType === 'leitner' && s.eindTijd);

    const normaalStats = {
      sessies: normaalSessies.length,
      gemiddeldeScore: normaalSessies.length > 0 
        ? normaalSessies.reduce((sum, s) => sum + s.gemiddeldeScore, 0) / normaalSessies.length 
        : 0,
      speeltijd: normaalSessies.reduce((sum, s) => sum + (s.duur || 0), 0),
      categorieen: [...new Set(normaalSessies.flatMap(s => s.categorieen))]
    };

    const leitnerStats = {
      sessies: leitnerSessies.length,
      gemiddeldeScore: leitnerSessies.length > 0 
        ? leitnerSessies.reduce((sum, s) => sum + s.gemiddeldeScore, 0) / leitnerSessies.length 
        : 0,
      speeltijd: leitnerSessies.reduce((sum, s) => sum + (s.duur || 0), 0),
      categorieen: [...new Set(leitnerSessies.flatMap(s => s.categorieen))]
    };

    return { normaal: normaalStats, leitner: leitnerStats };
  }

  getOpdrachtenPerModus(modus: 'normaal' | 'leitner'): number {
    const leerData = this.loadLeerData();
    if (!leerData) return 0;

    // Tel op basis van opdrachtdata (consistent met totaalOpdrachten)
    const opdrachten = Object.values(leerData.opdrachten);
    let totaalOpdrachten = 0;

    opdrachten.forEach(opdracht => {
      if (opdracht.modusGeschiedenis) {
        // Tel op basis van modus geschiedenis
        const modusCount = opdracht.modusGeschiedenis.filter(entry => entry.modus === modus).length;
        totaalOpdrachten += modusCount;
      } else {
        // Fallback: gebruik sessie data voor oudere opdrachten
        const sessies = Object.values(leerData.sessies).filter(s => 
          (modus === 'normaal' ? !s.serieuzeModus : s.serieuzeModus) && s.eindTijd
        );
        
        // Schat het aantal opdrachten voor deze categorie in deze modus
        const categorieSessies = sessies.filter(s => s.categorieen.includes(opdracht.categorie));
        
        // Schat het aantal keer dat deze opdracht in deze modus is gedaan
        const geschatteCount = Math.round(opdracht.aantalKeerGedaan * (categorieSessies.length / Object.values(leerData.sessies).filter(s => s.eindTijd).length));
        totaalOpdrachten += Math.min(geschatteCount, opdracht.aantalKeerGedaan);
      }
    });

    return totaalOpdrachten;
  }

  // Focus Analyse data methoden
  public getFocusDagelijkseData(aantalDagen: number = 30, metric: 'tijd' | 'aantal' = 'tijd'): {
    datum: string;
    serieuzeModus: number;
    normaleModus: number;
  }[] {
    const leerData = this.loadLeerData();
    if (!leerData) return [];

    const data: { [datum: string]: { serieuze: number; normaal: number } } = {};
    const eindDatum = new Date();
    const startDatum = new Date(eindDatum.getTime() - (aantalDagen - 1) * 24 * 60 * 60 * 1000);

    // Genereer alle datums
    for (let d = new Date(startDatum); d <= eindDatum; d.setDate(d.getDate() + 1)) {
      const datumString = d.toISOString().split('T')[0];
      data[datumString] = { serieuze: 0, normaal: 0 };
    }

    // Verwerk sessie data
    Object.values(leerData.sessies).forEach(sessie => {
      if (!sessie.eindTijd) return;
      
      const sessieDatum = new Date(sessie.startTijd).toISOString().split('T')[0];
      if (!data[sessieDatum]) return;

      const waarde = metric === 'tijd' ? (sessie.duur || 0) : 1;
      
      if (sessie.serieuzeModus) {
        data[sessieDatum].serieuze += waarde;
      } else {
        data[sessieDatum].normaal += waarde;
      }
    });

    return Object.entries(data).map(([datum, waarden]) => ({
      datum,
      serieuzeModus: waarden.serieuze,
      normaleModus: waarden.normaal
    }));
  }

  public getFocusWeekelijkseData(aantalWeken: number = 12, metric: 'tijd' | 'aantal' = 'tijd'): {
    week: string;
    serieuzeModus: number;
    normaleModus: number;
  }[] {
    const dagelijkseData = this.getFocusDagelijkseData(aantalWeken * 7, metric);
    const weekData: { [weekKey: string]: any } = {};

    dagelijkseData.forEach(d => {
      const date = new Date(d.datum);
      const weekStart = new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekData[weekKey]) {
        weekData[weekKey] = { week: weekKey, serieuzeModus: 0, normaleModus: 0 };
      }

      weekData[weekKey].serieuzeModus += d.serieuzeModus;
      weekData[weekKey].normaleModus += d.normaleModus;
    });

    return Object.values(weekData).sort((a, b) => 
      new Date(a.week).getTime() - new Date(b.week).getTime()
    );
  }

  public getFocusMaandelijkseData(aantalMaanden: number = 12, metric: 'tijd' | 'aantal' = 'tijd'): {
    maand: string;
    serieuzeModus: number;
    normaleModus: number;
  }[] {
    const dagelijkseData = this.getFocusDagelijkseData(aantalMaanden * 31, metric);
    const maandData: { [maandKey: string]: any } = {};

    dagelijkseData.forEach(d => {
      const date = new Date(d.datum);
      const maandKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!maandData[maandKey]) {
        maandData[maandKey] = { maand: maandKey, serieuzeModus: 0, normaleModus: 0 };
      }

      maandData[maandKey].serieuzeModus += d.serieuzeModus;
      maandData[maandKey].normaleModus += d.normaleModus;
    });

    return Object.values(maandData).sort((a, b) => 
      new Date(a.maand).getTime() - new Date(b.maand).getTime()
    );
  }

  getPrestatieHighlights(): {
    besteSessie: { score: number; datum: string; modus: string };
    vooruitgang: { verbetering: number; periode: string };
    streak: { dagen: number; laatsteDatum: string; langste?: number };
    snelsteSessie: { tijd: number; datum: string };
  } {
    const leerData = this.loadLeerData();
    if (!leerData) {
      return {
        besteSessie: { score: 0, datum: '', modus: '' },
        vooruitgang: { verbetering: 0, periode: '' },
        streak: { dagen: 0, laatsteDatum: '' },
        snelsteSessie: { tijd: 0, datum: '' }
      };
    }

    // Beste sessie
    const sessies = Object.values(leerData.sessies);
    const besteSessie = sessies.reduce((best, current) => 
      current.gemiddeldeScore > best.gemiddeldeScore ? current : best
    );

    // Vooruitgang (laatste 5 sessies vs daarvoor)
    const gesorteerdeSessies = sessies.sort((a, b) => 
      new Date(a.startTijd).getTime() - new Date(b.startTijd).getTime()
    );
    const recenteSessies = gesorteerdeSessies.slice(-5);
    const oudereSessies = gesorteerdeSessies.slice(-10, -5);
    
    const recenteGemiddelde = recenteSessies.length > 0 
      ? recenteSessies.reduce((sum, s) => sum + s.gemiddeldeScore, 0) / recenteSessies.length 
      : 0;
    const oudereGemiddelde = oudereSessies.length > 0 
      ? oudereSessies.reduce((sum, s) => sum + s.gemiddeldeScore, 0) / oudereSessies.length 
      : 0;
    const vooruitgang = recenteGemiddelde - oudereGemiddelde;

    // Streak berekening – huidige streak t/m vandaag en langste streak (6 maanden)
    const sessieDagen = new Set<string>(gesorteerdeSessies.map(s => new Date(s.startTijd).toISOString().split('T')[0]));
    const vandaag = new Date();
    // Huidige streak
    let streak = 0;
    for (let d = new Date(vandaag); ; d.setDate(d.getDate() - 1)) {
      const key = d.toISOString().split('T')[0];
      if (sessieDagen.has(key)) streak++;
      else break;
    }
    // Langste streak laatste 6 maanden
    const start = new Date(vandaag.getTime() - 180 * 24 * 60 * 60 * 1000);
    let langste = 0;
    let huidige = 0;
    for (let d = new Date(start); d <= vandaag; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      if (sessieDagen.has(key)) { huidige++; langste = Math.max(langste, huidige); }
      else huidige = 0;
    }
    const laatsteDatum = gesorteerdeSessies.length > 0 ? gesorteerdeSessies[gesorteerdeSessies.length - 1].startTijd : '';

    // Snelste sessie
    const snelsteSessie = sessies.reduce((snelst, current) => {
      if (!current.duur) return snelst;
      if (!snelst.duur) return current;
      return current.duur < snelst.duur ? current : snelst;
    });

    return {
      besteSessie: {
        score: besteSessie.gemiddeldeScore,
        datum: besteSessie.startTijd,
        modus: besteSessie.serieuzeModus ? 'Leitner' : 'Normaal'
      },
      vooruitgang: {
        verbetering: Math.round(vooruitgang * 10) / 10,
        periode: 'laatste week'
      },
      streak: { dagen: streak, laatsteDatum, langste },
      snelsteSessie: {
        tijd: snelsteSessie.duur || 0,
        datum: snelsteSessie.startTijd
      }
    };
  }

  getLeitnerStatistiekenVoorCategorieen(
    geselecteerdeCategorieen: string[],
    opties: { negeerBox0WachttijdAlsLeeg?: boolean } = {}
  ): {
    totaalOpdrachten: number;
    opdrachtenPerBox: { [boxId: number]: number };
    vandaagBeschikbaar: number;
    reguliereHerhalingenBeschikbaar: number;
  } {
    const { negeerBox0WachttijdAlsLeeg = false } = opties;
    const leitnerData = this.loadLeitnerData();
    const opdrachtenPerBox: { [boxId: number]: number } = {};
    let totaalOpdrachten = 0;
    let vandaagBeschikbaar = 0;
    let reguliereHerhalingenBeschikbaar = 0;
    const nu = new Date();
    const pausedOpdrachten = leitnerData.pausedOpdrachten || [];

    leitnerData.boxes.forEach(box => {
      if (!Array.isArray(box.opdrachten)) return;

      const gefilterdeOpdrachten = box.opdrachten.filter(opdrachtId => {
        if (typeof opdrachtId !== 'string' || !opdrachtId.includes('_')) return false;
        if (pausedOpdrachten.includes(opdrachtId)) return false;
        
        const parts = opdrachtId.split('_');
        if (parts.length < 2) return false;

        const uniekeCategorieIdentifier = `${parts[0]} - ${parts[1]}`;
        return geselecteerdeCategorieen.includes(uniekeCategorieIdentifier);
      });
      
      opdrachtenPerBox[box.boxId] = gefilterdeOpdrachten.length;
      totaalOpdrachten += gefilterdeOpdrachten.length;

      const interval = leitnerData.boxIntervallen[box.boxId] || 1440;
      gefilterdeOpdrachten.forEach(opdrachtId => {
        const laatsteReview = new Date(leitnerData.opdrachtReviewTimes[opdrachtId] || 0);
        const minutenSindsLaatsteReview = Math.floor((nu.getTime() - laatsteReview.getTime()) / (1000 * 60));
        
        if (minutenSindsLaatsteReview >= interval) {
          vandaagBeschikbaar++;
          if (box.boxId > 0) {
            reguliereHerhalingenBeschikbaar++;
          }
        }
      });
    });

    // Speciale logica voor negeren van Box 0 wachttijd
    if (negeerBox0WachttijdAlsLeeg && reguliereHerhalingenBeschikbaar === 0) {
      const box0 = leitnerData.boxes.find(box => box.boxId === 0);
      if (box0) {
        const gefilterdeBox0Opdrachten = box0.opdrachten.filter(opdrachtId => {
            if (typeof opdrachtId !== 'string' || !opdrachtId.includes('_')) return false;
            if (pausedOpdrachten.includes(opdrachtId)) return false;
            const parts = opdrachtId.split('_');
            if (parts.length < 2) return false;
            const uniekeCategorieIdentifier = `${parts[0]} - ${parts[1]}`;
            return geselecteerdeCategorieen.includes(uniekeCategorieIdentifier);
        });
        vandaagBeschikbaar = gefilterdeBox0Opdrachten.length;
      }
    }

    return {
      totaalOpdrachten,
      opdrachtenPerBox,
      vandaagBeschikbaar,
      reguliereHerhalingenBeschikbaar
    };
  }

  getLeitnerBoxVerdelingVoorCategorie(categorie: string): { [boxId: number]: number } {
    const leitnerData = this.loadLeitnerData();
    const hoofdcategorieStatistieken = this.getHoofdcategorieStatistieken();
    const hoofdcategorie = hoofdcategorieStatistieken[categorie];
    const verdeling: { [boxId: number]: number } = {};

    // Initialiseer verdeling
    for (let i = 0; i <= 7; i++) {
      verdeling[i] = 0;
    }

    if (!leitnerData.isLeitnerActief) {
      return verdeling;
    }

    const pausedOpdrachten = new Set(leitnerData.pausedOpdrachten || []);

    if (hoofdcategorie && hoofdcategorie.subCategorieen.length > 0) {
      // Hoofdcategorie: aggregeer van subcategorieën
      hoofdcategorie.subCategorieen.forEach((subCat: { categorie: string }) => {
        const subVerdeling = this.getLeitnerBoxVerdelingVoorCategorie(subCat.categorie);
        Object.entries(subVerdeling).forEach(([boxId, count]) => {
          verdeling[parseInt(boxId)] += count;
        });
      });
    } else {
      // Subcategorie of op zichzelf staande categorie
      // Leid op basis van echte Leitner-opdrachtId structuur: `${Hoofdcategorie}_${Categorie}_...`
      const hoofdcategorieNaam = this._alleOpdrachten.find(op => op.Categorie === categorie)?.Hoofdcategorie || 'Overig';
      const expectedPrefix = `${hoofdcategorieNaam}_${categorie}_`;
      leitnerData.boxes.forEach(box => {
        const count = box.opdrachten.filter(opdrachtId => 
          typeof opdrachtId === 'string' &&
          opdrachtId.startsWith(expectedPrefix) &&
          !pausedOpdrachten.has(opdrachtId)
        ).length;
        verdeling[box.boxId] = (verdeling[box.boxId] || 0) + count;
      });
    }

    return verdeling;
  }

  getScoreGeschiedenisVoorCategorie(categorie: string): { score: number; datum: string }[] {
    const leerData = this.loadLeerData();
    if (!leerData) return [];

    const hoofdcategorieStatistieken = this.getHoofdcategorieStatistieken();
    const hoofdcategorie = hoofdcategorieStatistieken[categorie];

    let categorieen: string[] = [];
    if (hoofdcategorie && hoofdcategorie.subCategorieen.length > 0) {
      categorieen = hoofdcategorie.subCategorieen.map((sc: { categorie: string }) => sc.categorie);
    } else {
      categorieen = [categorie];
    }

    const categorieOpdrachten = Object.values(leerData.opdrachten).filter(
      op => categorieen.includes(op.categorie)
    );

    const scoreGeschiedenis = categorieOpdrachten.flatMap(op => 
      (op.scoreGeschiedenis || [])
        .map((scoreEntry, index) => ({ ...scoreEntry, poging: index + 1, modus: op.modusGeschiedenis?.[index]?.modus }))
        .filter(entry => entry.poging === 1 && entry.modus === 'normaal')
    );
    
    return scoreGeschiedenis.sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
  }

  getCategorieMastery(categorie: string): { level: 'Brons' | 'Zilver' | 'Goud' | 'Geen'; percentage: number } {
    const verdeling = this.getLeitnerBoxVerdelingVoorCategorie(categorie);
    const totaalOpdrachten = Object.values(verdeling).reduce((sum, count) => sum + count, 0);

    if (totaalOpdrachten === 0) {
      return { level: 'Geen', percentage: 0 };
    }

    const gewichten = { 0: 0, 1: 1, 2: 2, 3: 4, 4: 6, 5: 8, 6: 10, 7: 12 };
    
    let gewogenScore = 0;
    for (const boxId in verdeling) {
      const boxIndex = parseInt(boxId, 10);
      gewogenScore += verdeling[boxIndex] * (gewichten[boxIndex as keyof typeof gewichten] || 0);
    }

    const maximaalMogelijkeScore = totaalOpdrachten * gewichten[7];
    const percentage = maximaalMogelijkeScore > 0 ? Math.round((gewogenScore / maximaalMogelijkeScore) * 100) : 0;

    let level: 'Brons' | 'Zilver' | 'Goud' | 'Geen' = 'Geen';
    if (percentage > 80) {
      level = 'Goud';
    } else if (percentage > 50) {
      level = 'Zilver';
    } else if (percentage > 20) {
      level = 'Brons';
    }

    return { level, percentage };
  }

  getCategorieDekking(categorie: string): { dekkingsPercentage: number; geprobeerdeOpdrachten: number; totaalOpdrachten: number } {
    const leerData = this.loadLeerData();
    const hoofdcategorieStatistieken = this.getHoofdcategorieStatistieken();
    const hoofdcategorie = hoofdcategorieStatistieken[categorie];

    let totaalOpdrachten = 0;
    let geprobeerdeOpdrachten = 0;

    if (hoofdcategorie && hoofdcategorie.subCategorieen.length > 0) {
      hoofdcategorie.subCategorieen.forEach((subCat: { categorie: string; }) => {
        const subDekking = this.getCategorieDekking(subCat.categorie);
        totaalOpdrachten += subDekking.totaalOpdrachten;
        geprobeerdeOpdrachten += subDekking.geprobeerdeOpdrachten;
      });
    } else {
      totaalOpdrachten = this._alleOpdrachten.filter(op => op.Categorie === categorie).length;
      if (totaalOpdrachten > 0 && leerData && leerData.opdrachten) {
        const geprobeerdeIds = Object.values(leerData.opdrachten)
          .filter(op => op.categorie === categorie)
          .map(op => op.opdrachtId);
        geprobeerdeOpdrachten = new Set(geprobeerdeIds).size;
      }
    }

    if (totaalOpdrachten === 0) {
      return { dekkingsPercentage: 0, geprobeerdeOpdrachten: 0, totaalOpdrachten: 0 };
    }
    
    const dekkingsPercentage = (geprobeerdeOpdrachten / totaalOpdrachten) * 100;

    return {
      dekkingsPercentage,
      geprobeerdeOpdrachten,
      totaalOpdrachten,
    };
  }

  getCategorieBeheersing(categorie: string): {
    beheersingPercentage: number;
    beheerstOpdrachten: number;
    totaalOpdrachten: number;
    gemiddeldeBox: number;
    vandaagBeschikbaar: number;
    scoreTrend: 'stijgend' | 'dalend' | 'stabiel';
    consistentieScore: number;
  } {
    const leitnerData = this.loadLeitnerData();
    const leerData = this.loadLeerData();
    
    if (!leitnerData || !leerData) {
      return {
        beheersingPercentage: 0,
        beheerstOpdrachten: 0,
        totaalOpdrachten: 0,
        gemiddeldeBox: 0,
        vandaagBeschikbaar: 0,
        scoreTrend: 'stabiel',
        consistentieScore: 0
      };
    }

    const hoofdcategorieStatistieken = this.getHoofdcategorieStatistieken();
    const hoofdcategorie = hoofdcategorieStatistieken[categorie];
    
    const isHoofdcategorie = hoofdcategorie && hoofdcategorie.subCategorieen.length > 0;
    const categorieenLijst = isHoofdcategorie 
      ? hoofdcategorie.subCategorieen.map((sc: { categorie: string }) => sc.categorie)
      : [categorie];

    const boxVerdeling = this.getLeitnerBoxVerdelingVoorCategorie(categorie);
    const beheerstOpdrachten = boxVerdeling[7] || 0;
    
    let totaalOpdrachtenInCategorie = 0;
    if (isHoofdcategorie) {
      totaalOpdrachtenInCategorie = hoofdcategorie.subCategorieen.reduce((sum: number, sub: { aantalOpdrachten: number }) => sum + sub.aantalOpdrachten, 0);
    } else {
      totaalOpdrachtenInCategorie = this._alleOpdrachten.filter(op => op.Categorie === categorie).length;
    }
    
    const beheersingPercentage = totaalOpdrachtenInCategorie > 0 ? (beheerstOpdrachten / totaalOpdrachtenInCategorie) * 100 : 0;

    let totaalBoxScore = 0;
    let totaalOpdrachtenMetBox = 0;
    Object.entries(boxVerdeling).forEach(([boxId, count]) => {
      if (count > 0) {
        totaalBoxScore += parseInt(boxId) * count;
        totaalOpdrachtenMetBox += count;
      }
    });
    const gemiddeldeBox = totaalOpdrachtenMetBox > 0 ? totaalBoxScore / totaalOpdrachtenMetBox : 0;

    const alleVandaagBeschikbaar = this.getLeitnerOpdrachtenVoorVandaag();
    const vandaagBeschikbaar = alleVandaagBeschikbaar.filter(item => {
      // Haal categorie afgeleid uit Leitner-opdrachtId `${Hoofdcategorie}_${Categorie}_...`
      if (typeof item.opdrachtId !== 'string') return false;
      const parts = item.opdrachtId.split('_');
      if (parts.length < 2) return false;
      const itemCategorie = parts[1];
      return categorieenLijst.includes(itemCategorie);
    }).length;

    const scoreGeschiedenis = this.getScoreGeschiedenisVoorCategorie(categorie);
    let scoreTrend: 'stijgend' | 'dalend' | 'stabiel' = 'stabiel';
    if (scoreGeschiedenis.length >= 5) {
        const helft = Math.ceil(scoreGeschiedenis.length / 2);
        const eersteHelft = scoreGeschiedenis.slice(0, helft);
        const tweedeHelft = scoreGeschiedenis.slice(-helft);
        
        const avgEersteHelft = eersteHelft.reduce((sum, s) => sum + s.score, 0) / eersteHelft.length;
        const avgTweedeHelft = tweedeHelft.reduce((sum, s) => sum + s.score, 0) / tweedeHelft.length;

        if (avgTweedeHelft > avgEersteHelft + 0.2) scoreTrend = 'stijgend';
        else if (avgTweedeHelft < avgEersteHelft - 0.2) scoreTrend = 'dalend';
    }

    const scores = scoreGeschiedenis.map(s => s.score);
    let consistentieScore = -1;
    if (scores.length >= 5) {
      const gemiddeldeScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variantie = scores.reduce((sum, score) => sum + Math.pow(score - gemiddeldeScore, 2), 0) / scores.length;
      const standaardDeviatie = Math.sqrt(variantie);
      consistentieScore = Math.max(0, 100 - (standaardDeviatie * 20));
    }

    return {
      beheersingPercentage,
      beheerstOpdrachten,
      totaalOpdrachten: totaalOpdrachtenInCategorie,
      gemiddeldeBox,
      vandaagBeschikbaar,
      scoreTrend,
      consistentieScore
    };
  }

  getCategorieRanking(type: 'hoofd' | 'sub'): {
    besteCategorie: string;
    zwaksteCategorie: string;
    categorieRanking: { 
      categorie: string; 
      combiScore: number;
      dekking: number;
      gemBox: number;
      beheersing: number;
    }[];
  } {
    const hoofdcategorieStatistieken = this.getHoofdcategorieStatistieken();
    let categorieenLijst: string[] = [];

    if (type === 'hoofd') {
      categorieenLijst = Object.keys(hoofdcategorieStatistieken);
    } else {
      categorieenLijst = Object.values(hoofdcategorieStatistieken).flatMap((hc: any) => hc.subCategorieen.map((sc: any) => sc.categorie));
    }

    const ranking = categorieenLijst.map(categorie => {
      const dekkingData = this.getCategorieDekking(categorie);
      if (dekkingData.geprobeerdeOpdrachten === 0) {
        return null; // Filter deze later uit
      }

      const beheersingData = this.getCategorieBeheersing(categorie);
      
      const genormaliseerdeGemBox = (beheersingData.gemiddeldeBox / 7) * 100;
      const combiScore = (dekkingData.dekkingsPercentage * 0.4) + (genormaliseerdeGemBox * 0.4) + (beheersingData.beheersingPercentage * 0.2);
      
      return { 
        categorie, 
        combiScore,
        dekking: dekkingData.dekkingsPercentage,
        gemBox: beheersingData.gemiddeldeBox,
        beheersing: beheersingData.beheersingPercentage,
      };
    }).filter(item => item !== null) as { categorie: string; combiScore: number; dekking: number; gemBox: number; beheersing: number; }[];

    ranking.sort((a, b) => b.combiScore - a.combiScore);

    return {
      besteCategorie: ranking.length > 0 ? ranking[0].categorie : 'Nog geen data',
      zwaksteCategorie: ranking.length > 0 ? ranking[ranking.length - 1].categorie : 'Nog geen data',
      categorieRanking: ranking,
    };
  }

  public forceerHerhalingenInBox(alleOpdrachten: Opdracht[], aantal: number, boxId: number): { toegevoegd: number; categorieen: string[] } {
    const leitnerData = this.loadLeitnerData();
    if (!leitnerData.isLeitnerActief) {
      return { toegevoegd: 0, categorieen: [] };
    }

    const allLeitnerIds = this.getAllLeitnerOpdrachtIds();
    const nieuweOpdrachten = alleOpdrachten.filter(op => {
      const hoofdcategorie = op.Hoofdcategorie || 'Overig';
      const opdrachtId = `${hoofdcategorie}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
      return !allLeitnerIds.has(opdrachtId);
    });

    const tePlaatsenOpdrachten = nieuweOpdrachten.slice(0, aantal);
    if (tePlaatsenOpdrachten.length === 0) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Geen nieuwe opdrachten gevonden om toe te voegen voor de test.', type: 'fout', timeoutMs: 3500 } }));
      }
      return { toegevoegd: 0, categorieen: [] };
    }

    const targetBox = leitnerData.boxes.find(box => box.boxId === boxId);
    if (!targetBox) return { toegevoegd: 0, categorieen: [] };

    const verledenTijd = new Date();
    if (boxId === 0) {
      verledenTijd.setMinutes(verledenTijd.getMinutes() - 15);
    } else {
      const intervalInDagen = Math.ceil((leitnerData.boxIntervallen[boxId] || 1440) / 1440);
      verledenTijd.setDate(verledenTijd.getDate() - (intervalInDagen + 1));
    }

    const toegevoegdeCategorieen: string[] = [];
    tePlaatsenOpdrachten.forEach(op => {
      const hoofdcategorie = op.Hoofdcategorie || 'Overig';
      const opdrachtId = `${hoofdcategorie}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
      if (!targetBox.opdrachten.includes(opdrachtId)) {
        targetBox.opdrachten.push(opdrachtId);
        toegevoegdeCategorieen.push(op.Categorie);
      }
      leitnerData.opdrachtReviewTimes[opdrachtId] = verledenTijd.toISOString();
    });

    this.saveLeitnerData(leitnerData);

    return { toegevoegd: tePlaatsenOpdrachten.length, categorieen: [...new Set(toegevoegdeCategorieen)] };
  }

  // Reset alle opdrachten van een specifieke categorie uit het Leitner systeem
  public resetCategorieInLeitner(categorie: string): { gereset: number; opdrachten: string[] } {
    const leitnerData = this.loadLeitnerData();
    const geresetOpdrachten: string[] = [];
    
    // Converteer categorie naam naar het juiste format voor opdracht IDs
    // Van "Anatomie - Botten" naar "Anatomie_Botten"
    const categorieVoorOpdrachtId = categorie.replace(/ - /g, '_');
    
    // Zoek alle opdrachten van deze categorie in alle boxen
    leitnerData.boxes.forEach(box => {
      // Verwijder deze opdrachten uit de box
      box.opdrachten = box.opdrachten.filter(opdrachtId => {
        const isVanCategorie = opdrachtId.startsWith(categorieVoorOpdrachtId + '_');
        if (isVanCategorie) {
          geresetOpdrachten.push(opdrachtId);
        }
        return !isVanCategorie;
      });
    });
    
    // Verwijder ook uit opdrachtReviewTimes
    geresetOpdrachten.forEach(opdrachtId => {
      delete leitnerData.opdrachtReviewTimes[opdrachtId];
    });
    
    this.saveLeitnerData(leitnerData);
    
    return {
      gereset: geresetOpdrachten.length,
      opdrachten: geresetOpdrachten
    };
  }

  // Pauze functionaliteit
  public pauseOpdracht(opdrachtId: string): void {
    const leitnerData = this.loadLeitnerData();
    
    // Voeg toe aan gepauzeerde opdrachten als nog niet gepauzeerd
    if (!leitnerData.pausedOpdrachten.includes(opdrachtId)) {
      leitnerData.pausedOpdrachten.push(opdrachtId);
      leitnerData.opdrachtPauseTimes[opdrachtId] = new Date().toISOString();
      this.saveLeitnerData(leitnerData);
    }
  }

  public resumeOpdracht(opdrachtId: string): void {
    const leitnerData = this.loadLeitnerData();
    
    // Verwijder uit gepauzeerde opdrachten
    leitnerData.pausedOpdrachten = leitnerData.pausedOpdrachten.filter(id => id !== opdrachtId);
    delete leitnerData.opdrachtPauseTimes[opdrachtId];
    
    this.saveLeitnerData(leitnerData);
  }

  public isOpdrachtPaused(opdrachtId: string): boolean {
    const leitnerData = this.loadLeitnerData();
    return leitnerData.pausedOpdrachten.includes(opdrachtId);
  }

  public getPausedOpdrachten(): string[] {
    const leitnerData = this.loadLeitnerData();
    return leitnerData.pausedOpdrachten;
  }

  public getPauseTime(opdrachtId: string): string | null {
    const leitnerData = this.loadLeitnerData();
    return leitnerData.opdrachtPauseTimes[opdrachtId] || null;
  }

  // Dev tool functie om interval aan te passen
  public setTijdelijkInterval(boxId: number, minuten: number): void {
    const leitnerData = this.loadLeitnerData();
    if (boxId < leitnerData.boxIntervallen.length) {
      leitnerData.boxIntervallen[boxId] = minuten;
      this.saveLeitnerData(leitnerData);
    }
  }

  public getLeitnerBoxHerhalingenTijdlijnData(aantalDagen: number = 30): {
    datum: string;
    box0: number;
    box1: number;
    box2: number;
    box3: number;
    box4: number;
    box5: number;
    box6: number;
    box7: number; // Aantal vragen in box 7 (niet herhalingen)
    totaalHerhalingen: number; // Som van box0-box6
  }[] {
    const leerData = this.loadLeerData();
    const leitnerData = this.loadLeitnerData();
    if (!leerData || !leitnerData.isLeitnerActief) return [];

    const toLocalDateString = (iso: string): string => {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    type Dag = { datum: string; box0: number; box1: number; box2: number; box3: number; box4: number; box5: number; box6: number; box7: number; totaalHerhalingen: number };
    const perDag: Record<string, Dag> = {};
    const deltaBox7: Record<string, number> = {};
    const ensure = (datumStr: string): Dag => {
      if (!perDag[datumStr]) {
        perDag[datumStr] = { datum: datumStr, box0: 0, box1: 0, box2: 0, box3: 0, box4: 0, box5: 0, box6: 0, box7: 0, totaalHerhalingen: 0 };
      }
      return perDag[datumStr];
    };

    const opdrachten = Object.values(leerData.opdrachten);
    opdrachten.forEach(op => {
      const scores: Array<{ score: number; datum: string }> = op.scoreGeschiedenis || [];
      const modi: Array<{ modus: 'normaal' | 'leitner'; datum: string }> = op.modusGeschiedenis || [];
      if (scores.length === 0) return;

      // Simuleer box-verloop vanaf 0
      let box = 0;
      for (let i = 0; i < scores.length; i++) {
        const sc = scores[i];
        const md = modi[i]?.modus;
        if (!sc || !sc.datum) continue;
        const datumStr = toLocalDateString(sc.datum);
        if (md !== 'leitner') {
          // Vrije modus telt niet mee voor deze grafiek
          continue;
        }
        if (i > 0) {
          const dag = ensure(datumStr);
          const key = `box${box}` as keyof Dag;
          // tel herhaling in actuele box vóór promotie/demotie
          (dag[key] as unknown as number)++;
          dag.totaalHerhalingen++;
        }
        // Update box op basis van score
        const prevBox = box;
        if (sc.score >= 4) box = Math.min(box + 1, 7);
        else if (sc.score <= 2) box = box === 0 ? 0 : 1;
        // score==3 -> blijft in zelfde box
        if (box === 7 && prevBox !== 7) {
          deltaBox7[datumStr] = (deltaBox7[datumStr] || 0) + 1;
        }
      }
    });

    // Maak een continue reeks over de laatste N dagen
    const nu = new Date();
    const start = new Date(nu.getTime() - (aantalDagen - 1) * 24 * 60 * 60 * 1000);
    let cumulBox7 = 0;
    const resultaat: Dag[] = [];
    for (let d = new Date(start); d <= nu; d.setDate(d.getDate() + 1)) {
      const datumStr = toLocalDateString(d.toISOString());
      const dag = ensure(datumStr);
      cumulBox7 += deltaBox7[datumStr] || 0;
      dag.box7 = cumulBox7; // cumulatief aantal in box 7
      resultaat.push(dag);
    }

    return resultaat;
  }

  public getLeitnerBoxHerhalingenWeekelijkseData(aantalWeken: number = 12): {
    week: string;
    box0: number;
    box1: number;
    box2: number;
    box3: number;
    box4: number;
    box5: number;
    box6: number;
    box7: number;
    totaalHerhalingen: number;
  }[] {
    const dagelijkseData = this.getLeitnerBoxHerhalingenTijdlijnData(aantalWeken * 7);
    const weekData: { [weekKey: string]: any } = {};

    dagelijkseData.forEach(dag => {
      const datum = new Date(dag.datum);
      const weekStart = new Date(datum);
      weekStart.setDate(datum.getDate() - datum.getDay()); // Begin van de week (zondag)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekData[weekKey]) {
        weekData[weekKey] = {
          week: weekKey,
          box0: 0,
          box1: 0,
          box2: 0,
          box3: 0,
          box4: 0,
          box5: 0,
          box6: 0,
          box7: 0,
          totaalHerhalingen: 0
        };
      }

      weekData[weekKey].box0 += dag.box0;
      weekData[weekKey].box1 += dag.box1;
      weekData[weekKey].box2 += dag.box2;
      weekData[weekKey].box3 += dag.box3;
      weekData[weekKey].box4 += dag.box4;
      weekData[weekKey].box5 += dag.box5;
      weekData[weekKey].box6 += dag.box6;
      weekData[weekKey].box7 = Math.max(weekData[weekKey].box7, dag.box7); // Gebruik max voor box 7
      weekData[weekKey].totaalHerhalingen += dag.totaalHerhalingen;
    });

    return Object.values(weekData).sort((a, b) => 
      new Date(a.week).getTime() - new Date(b.week).getTime()
    );
  }

  public getLeitnerBoxHerhalingenMaandelijkseData(aantalMaanden: number = 12): {
    maand: string;
    box0: number;
    box1: number;
    box2: number;
    box3: number;
    box4: number;
    box5: number;
    box6: number;
    box7: number;
    totaalHerhalingen: number;
  }[] {
    const dagelijkseData = this.getLeitnerBoxHerhalingenTijdlijnData(aantalMaanden * 31);
    const maandData: { [maandKey: string]: any } = {};

    dagelijkseData.forEach(dag => {
      const datum = new Date(dag.datum);
      const maandKey = `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`;

      if (!maandData[maandKey]) {
        maandData[maandKey] = {
          maand: maandKey,
          box0: 0,
          box1: 0,
          box2: 0,
          box3: 0,
          box4: 0,
          box5: 0,
          box6: 0,
          box7: 0,
          totaalHerhalingen: 0
        };
      }

      maandData[maandKey].box0 += dag.box0;
      maandData[maandKey].box1 += dag.box1;
      maandData[maandKey].box2 += dag.box2;
      maandData[maandKey].box3 += dag.box3;
      maandData[maandKey].box4 += dag.box4;
      maandData[maandKey].box5 += dag.box5;
      maandData[maandKey].box6 += dag.box6;
      maandData[maandKey].box7 = Math.max(maandData[maandKey].box7, dag.box7); // Gebruik max voor box 7
      maandData[maandKey].totaalHerhalingen += dag.totaalHerhalingen;
    });

    return Object.values(maandData).sort((a, b) => 
      new Date(a.maand).getTime() - new Date(b.maand).getTime()
    );
  }
}

// Factory functie
export const createLeerDataManager = (spelerId: string): LeerDataManager => {
  return new LeerDataManager(spelerId);
};

// Singleton voor huidige speler (kan later uitgebreid worden voor multi-user)
let currentLeerDataManager: LeerDataManager | null = null;

export const getLeerDataManager = (spelerId?: string): LeerDataManager => {
  if (!currentLeerDataManager || (spelerId && currentLeerDataManager.getSpelerId() !== spelerId)) {
    currentLeerDataManager = createLeerDataManager(spelerId || 'default');
  }
  return currentLeerDataManager;
};