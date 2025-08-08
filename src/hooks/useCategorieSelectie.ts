import { useEffect, useMemo, useState } from 'react';
import type { Opdracht } from '../data/types';

export type OpdrachtBron = 'systeem' | 'gebruiker';

export interface Filters {
  bronnen: OpdrachtBron[];
  opdrachtTypes: string[];
}

export interface CategorieSelectieState {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  geselecteerdeCategorieen: string[];
  setGeselecteerdeCategorieen: React.Dispatch<React.SetStateAction<string[]>>;
  geselecteerdeLeitnerCategorieen: string[];
  setGeselecteerdeLeitnerCategorieen: React.Dispatch<React.SetStateAction<string[]>>;
  geselecteerdeMultiplayerCategorieen: string[];
  setGeselecteerdeMultiplayerCategorieen: React.Dispatch<React.SetStateAction<string[]>>;
  geselecteerdeHighscoreCategorieen: string[];
  setGeselecteerdeHighscoreCategorieen: React.Dispatch<React.SetStateAction<string[]>>;
  opdrachtenVoorSelectie: Opdracht[];
  alleUniekeCategorieen: string[];
}

export function useCategorieSelectie(opdrachten: Opdracht[]): CategorieSelectieState {
  const [filters, setFilters] = useState<Filters>(() => {
    const saved = localStorage.getItem('opdrachtFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.bronnen) && Array.isArray(parsed.opdrachtTypes)) {
          if (parsed.bronnen.length === 0) parsed.bronnen = ['systeem'];
          return parsed;
        }
      } catch {
        // ignore parse errors
      }
    }
    return { bronnen: ['systeem'], opdrachtTypes: [] };
  });

  // Debounced save van filters
  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('opdrachtFilters', JSON.stringify(filters));
    }, 200);
    return () => clearTimeout(id);
  }, [filters]);

  const opdrachtenVoorSelectie = useMemo(() => {
    return opdrachten.filter(op => {
      const bronMatch = filters.bronnen.length === 0 || filters.bronnen.includes((op.bron as OpdrachtBron) || 'systeem');
      if (!bronMatch) return false;
      if (filters.opdrachtTypes.length === 0) return true;
      return filters.opdrachtTypes.includes(op.opdrachtType || 'Onbekend');
    });
  }, [opdrachten, filters]);

  const alleUniekeCategorieen = useMemo(() => {
    const unieke = new Set<string>();
    opdrachtenVoorSelectie.forEach(op => {
      const id = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
      unieke.add(id);
    });
    return [...unieke];
  }, [opdrachtenVoorSelectie]);

  // Geselecteerde sets per modus
  const [geselecteerdeCategorieen, setGeselecteerdeCategorieen] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('geselecteerdeCategorieen_normaal');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [geselecteerdeLeitnerCategorieen, setGeselecteerdeLeitnerCategorieen] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('geselecteerdeCategorieen_leitner');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [geselecteerdeMultiplayerCategorieen, setGeselecteerdeMultiplayerCategorieen] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('geselecteerdeCategorieen_multiplayer');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [geselecteerdeHighscoreCategorieen, setGeselecteerdeHighscoreCategorieen] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('geselecteerdeCategorieen_highscore');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Debounced saves
  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('geselecteerdeCategorieen_normaal', JSON.stringify(geselecteerdeCategorieen));
    }, 200);
    return () => clearTimeout(id);
  }, [geselecteerdeCategorieen]);

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('geselecteerdeCategorieen_leitner', JSON.stringify(geselecteerdeLeitnerCategorieen));
    }, 200);
    return () => clearTimeout(id);
  }, [geselecteerdeLeitnerCategorieen]);

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('geselecteerdeCategorieen_multiplayer', JSON.stringify(geselecteerdeMultiplayerCategorieen));
    }, 200);
    return () => clearTimeout(id);
  }, [geselecteerdeMultiplayerCategorieen]);

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('geselecteerdeCategorieen_highscore', JSON.stringify(geselecteerdeHighscoreCategorieen));
    }, 200);
    return () => clearTimeout(id);
  }, [geselecteerdeHighscoreCategorieen]);

  return {
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
  };
}



