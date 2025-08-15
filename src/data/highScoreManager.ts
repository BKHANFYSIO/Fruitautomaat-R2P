export type HighScore = {
  score: number;
  timestamp: number;
  spelerNaam: string;
  customNaam?: string; // Optionele eigen naam voor de highscore
  verbeteringVan?: string; // ID van de oorspronkelijke highscore die verbeterd wordt
  origineleSpelerNaam?: string; // Naam van de speler die de oorspronkelijke highscore had
  isVerbetering?: boolean; // Boolean om aan te geven of dit een verbetering is
  aantalPogingen?: number; // Aantal keer dat deze categorie combinatie is geprobeerd
};

export type HighScoreLibrary = {
  [categoryKey: string]: HighScore;
};

const HIGH_SCORE_KEY = 'fruitautomaat_highScores';

/**
 * Genereert een consistente, gesorteerde sleutel van een array van categorieën.
 */
const createCategoryKey = (categories: string[]): string => {
  return [...categories].sort().join(',');
};

/**
 * Leest de volledige high-score bibliotheek uit localStorage.
 */
export const getHighScoreLibrary = (): HighScoreLibrary => {
  try {
    const libraryJson = localStorage.getItem(HIGH_SCORE_KEY);
    return libraryJson ? JSON.parse(libraryJson) : {};
  } catch (error) {
    console.error("Fout bij het lezen van high scores:", error);
    return {};
  }
};

/**
 * Haalt de high score op voor een specifieke combinatie van categorieën.
 */
export const getHighScore = (categories: string[]): HighScore | null => {
  const library = getHighScoreLibrary();
  const key = createCategoryKey(categories);
  return library[key] || null;
};

/**
 * Slaat een nieuwe high score op als deze hoger is dan de vorige.
 */
export const saveHighScore = (categories: string[], newScore: number, spelerNaam: string, customNaam?: string): boolean => {
  if (categories.length === 0) return false;

  const library = getHighScoreLibrary();
  const key = createCategoryKey(categories);
  const existingScore = library[key];

  // Tel altijd de poging mee, ongeacht of de score hoger is
  const nieuweAantalPogingen = (existingScore?.aantalPogingen || 0) + 1;

  if (newScore > (existingScore?.score || 0)) {
    // Bepaal of dit een verbetering is van een bestaande highscore
    const isVerbetering = existingScore && existingScore.spelerNaam !== spelerNaam;
    
    library[key] = {
      score: newScore,
      timestamp: Date.now(),
      spelerNaam: spelerNaam,
      customNaam: customNaam,
      verbeteringVan: isVerbetering ? `${existingScore.spelerNaam}_${existingScore.timestamp}` : undefined,
      origineleSpelerNaam: isVerbetering ? existingScore.spelerNaam : undefined,
      isVerbetering: isVerbetering,
      aantalPogingen: nieuweAantalPogingen,
    };
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(library));
      return true; // Score is opgeslagen
    } catch (error) {
      console.error("Fout bij het opslaan van high score:", error);
      return false;
    }
  } else {
    // Score was niet hoger, maar tel wel de poging mee
    if (existingScore) {
      // Maak een kopie van de bestaande score om mutatie te voorkomen
      library[key] = {
        ...existingScore,
        aantalPogingen: nieuweAantalPogingen,
      };
      try {
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(library));
      } catch (error) {
        console.error("Fout bij het bijwerken van aantal pogingen:", error);
      }
    } else {
      // Eerste poging met deze categorieën, maak een nieuwe entry
      library[key] = {
        score: newScore,
        timestamp: Date.now(),
        spelerNaam: spelerNaam,
        customNaam: customNaam,
        aantalPogingen: nieuweAantalPogingen,
      };
      try {
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(library));
      } catch (error) {
        console.error("Fout bij het opslaan van eerste poging:", error);
      }
    }
    return false; // Score was niet hoger
  }
};

const PERSONAL_BEST_KEY = 'fruitautomaat_personalBests';

export type PersonalBestLibrary = {
  [spelerNaam: string]: {
    [categoryKey: string]: HighScore;
  };
};

export const getPersonalBestLibrary = (): PersonalBestLibrary => {
  try {
    const libraryJson = localStorage.getItem(PERSONAL_BEST_KEY);
    return libraryJson ? JSON.parse(libraryJson) : {};
  } catch (error) {
    console.error("Fout bij het lezen van personal bests:", error);
    return {};
  }
};

export const getPersonalBest = (categories: string[], spelerNaam: string): HighScore | null => {
  const library = getPersonalBestLibrary();
  const key = createCategoryKey(categories);
  return library[spelerNaam]?.[key] || null;
};

export const savePersonalBest = (categories: string[], newScore: number, spelerNaam: string, customNaam?: string): boolean => {
  if (categories.length === 0 || !spelerNaam) return false;

  const library = getPersonalBestLibrary();
  const key = createCategoryKey(categories);
  
  if (!library[spelerNaam]) {
    library[spelerNaam] = {};
  }

  const existingScore = library[spelerNaam][key];

  // Tel altijd de poging mee, ongeacht of de score hoger is
  const nieuweAantalPogingen = (existingScore?.aantalPogingen || 0) + 1;

  if (newScore > (existingScore?.score || 0)) {
    // Bepaal of dit een verbetering is van een bestaande personal best
    const isVerbetering = existingScore && existingScore.score > 0;
    
    library[spelerNaam][key] = {
      score: newScore,
      timestamp: Date.now(),
      spelerNaam: spelerNaam,
      customNaam: customNaam,
      verbeteringVan: isVerbetering ? `personal_${spelerNaam}_${existingScore.timestamp}` : undefined,
      origineleSpelerNaam: isVerbetering ? spelerNaam : undefined,
      isVerbetering: isVerbetering,
      aantalPogingen: nieuweAantalPogingen,
    };
    try {
      localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(library));
      return true; // Nieuw persoonlijk record
    } catch (error) {
      console.error("Fout bij het opslaan van personal best:", error);
      return false;
    }
  } else {
    // Score was niet hoger, maar tel wel de poging mee
    if (existingScore) {
      // Maak een kopie van de bestaande score om mutatie te voorkomen
      library[spelerNaam][key] = {
        ...existingScore,
        aantalPogingen: nieuweAantalPogingen,
      };
      try {
        localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(library));
      } catch (error) {
        console.error("Fout bij het bijwerken van aantal pogingen:", error);
      }
    } else {
      // Eerste poging met deze categorieën, maak een nieuwe entry
      library[spelerNaam][key] = {
        score: newScore,
        timestamp: Date.now(),
        spelerNaam: spelerNaam,
        customNaam: customNaam,
        aantalPogingen: nieuweAantalPogingen,
      };
      try {
        localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(library));
      } catch (error) {
        console.error("Fout bij het opslaan van eerste poging:", error);
      }
    }
    return false;
  }
};

/**
 * Werkt de custom naam van een highscore bij.
 */
export const updateHighScoreName = (categories: string[], newName: string): boolean => {
  if (categories.length === 0) return false;

  const library = getHighScoreLibrary();
  const key = createCategoryKey(categories);
  const existingScore = library[key];

  if (existingScore) {
    library[key] = {
      ...existingScore,
      customNaam: newName,
    };
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(library));
      return true;
    } catch (error) {
      console.error("Fout bij het bijwerken van highscore naam:", error);
      return false;
    }
  }
  return false;
};

/**
 * Verwijdert een highscore record.
 */
export const deleteHighScore = (categories: string[]): boolean => {
  if (categories.length === 0) return false;

  const library = getHighScoreLibrary();
  const key = createCategoryKey(categories);

  if (library[key]) {
    delete library[key];
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(library));
      return true;
    } catch (error) {
      console.error("Fout bij het verwijderen van highscore:", error);
      return false;
    }
  }
  return false;
};

/**
 * Sorteert highscores op verschillende criteria
 */
export type SortOption = 'laatstBehaald' | 'alfabetisch' | 'scoreHoogLaag' | 'scoreLaagHoog';

export const sortHighScores = (highScores: [string, HighScore][], sortBy: SortOption = 'laatstBehaald'): [string, HighScore][] => {
  const sorted = [...highScores];
  
  switch (sortBy) {
    case 'laatstBehaald':
      // Standaard: nieuwste eerst
      return sorted.sort(([, a], [, b]) => b.timestamp - a.timestamp);
      
    case 'alfabetisch':
      // Sorteer op categorienaam (eerste categorie)
      return sorted.sort(([a], [b]) => {
        const aFirst = a.split(',')[0];
        const bFirst = b.split(',')[0];
        return aFirst.localeCompare(bFirst, 'nl-NL');
      });
      
    case 'scoreHoogLaag':
      // Hoogste score eerst
      return sorted.sort(([, a], [, b]) => b.score - a.score);
      
    case 'scoreLaagHoog':
      // Laagste score eerst
      return sorted.sort(([, a], [, b]) => a.score - b.score);
      
    default:
      return sorted;
  }
};

/**
 * Haalt alle highscores op en sorteert ze
 */
export const getSortedHighScores = (sortBy: SortOption = 'laatstBehaald'): [string, HighScore][] => {
  const library = getHighScoreLibrary();
  const entries = Object.entries(library);
  return sortHighScores(entries, sortBy);
}; 