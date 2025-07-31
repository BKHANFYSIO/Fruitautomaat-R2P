export type HighScore = {
  score: number;
  timestamp: number;
  spelerNaam: string;
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
export const saveHighScore = (categories: string[], newScore: number, spelerNaam: string): boolean => {
  if (categories.length === 0) return false;

  const library = getHighScoreLibrary();
  const key = createCategoryKey(categories);
  const existingScore = library[key]?.score || 0;

  if (newScore > existingScore) {
    library[key] = {
      score: newScore,
      timestamp: Date.now(),
      spelerNaam: spelerNaam,
    };
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(library));
      return true; // Score is opgeslagen
    } catch (error) {
      console.error("Fout bij het opslaan van high score:", error);
      return false;
    }
  }
  return false; // Score was niet hoger
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

export const savePersonalBest = (categories: string[], newScore: number, spelerNaam: string): boolean => {
  if (categories.length === 0 || !spelerNaam) return false;

  const library = getPersonalBestLibrary();
  const key = createCategoryKey(categories);
  
  if (!library[spelerNaam]) {
    library[spelerNaam] = {};
  }

  const existingScore = library[spelerNaam][key]?.score || 0;

  if (newScore > existingScore) {
    library[spelerNaam][key] = {
      score: newScore,
      timestamp: Date.now(),
      spelerNaam: spelerNaam,
    };
    try {
      localStorage.setItem(PERSONAL_BEST_KEY, JSON.stringify(library));
      return true; // Nieuw persoonlijk record
    } catch (error) {
      console.error("Fout bij het opslaan van personal best:", error);
      return false;
    }
  }
  return false;
}; 