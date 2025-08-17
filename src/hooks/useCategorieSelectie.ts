import { useEffect, useMemo, useState, useCallback } from 'react';
import type { Opdracht } from '../data/types';

export type OpdrachtBron = 'systeem' | 'gebruiker';

export interface Filters {
  bronnen: OpdrachtBron[];
  opdrachtTypes: string[];
  niveaus?: Array<1 | 2 | 3 | 'undef'>; // leeg of undefined = geen niveau-filter
  // vervang boolean door tri-status filter
  tekenen?: Array<'ja' | 'mogelijk' | 'nee'>; // leeg of undefined = geen teken-filter
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

export type ModeKey = 'highscore' | 'multiplayer' | 'normaal' | 'leitner';

export function useCategorieSelectie(opdrachten: Opdracht[], currentMode: ModeKey = 'normaal'): CategorieSelectieState {
  // Per-modus filters in localStorage
  const [filtersByMode, setFiltersByMode] = useState<Record<ModeKey, Filters>>(() => {
    const normalize = (f: Partial<Filters> | undefined): Filters => {
      const base: Filters = { bronnen: ['systeem', 'gebruiker'], opdrachtTypes: [], niveaus: [], tekenen: [] };
      if (!f) return base;
      const bronnen = Array.isArray(f.bronnen) && f.bronnen.length === 2 ? (f.bronnen as any) : ['systeem', 'gebruiker'];
      const opdrachtTypes = Array.isArray(f.opdrachtTypes) ? f.opdrachtTypes : [];
      const niveaus = Array.isArray(f.niveaus) ? f.niveaus : [];
      const tekenen = Array.isArray(f.tekenen) ? f.tekenen : [];
      return { bronnen, opdrachtTypes, niveaus, tekenen };
    };
    // Try new structured storage first
    const savedByMode = localStorage.getItem('opdrachtFiltersByMode');
    if (savedByMode) {
      try {
        const parsed = JSON.parse(savedByMode);
        return {
          highscore: normalize(parsed.highscore),
          multiplayer: normalize(parsed.multiplayer),
          normaal: normalize(parsed.normaal),
          leitner: normalize(parsed.leitner),
        } as Record<ModeKey, Filters>;
      } catch {}
    }
    // Backwards compat: old single key → copy to all modes
    const oldSaved = localStorage.getItem('opdrachtFilters');
    let fallback: Filters = { bronnen: ['systeem', 'gebruiker'], opdrachtTypes: [], niveaus: [], tekenen: [] };
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        fallback = normalize(parsed);
      } catch {}
    }
    return {
      highscore: fallback,
      multiplayer: fallback,
      normaal: fallback,
      leitner: fallback,
    } as Record<ModeKey, Filters>;
  });

  const filters = filtersByMode[currentMode] || filtersByMode.normaal;
  const setFilters: React.Dispatch<React.SetStateAction<Filters>> = useCallback((updater) => {
    setFiltersByMode(prev => {
      const current = prev[currentMode] || prev.normaal;
      const nextFilters = typeof updater === 'function' ? (updater as any)(current) : updater;
      return { ...prev, [currentMode]: nextFilters } as Record<ModeKey, Filters>;
    });
  }, [currentMode]);

  // Debounced save van filters per modus
  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem('opdrachtFiltersByMode', JSON.stringify(filtersByMode));
    }, 200);
    return () => clearTimeout(id);
  }, [filtersByMode]);

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

  const opdrachtenVoorSelectie = useMemo(() => {
    let gefilterdeOpdrachten = opdrachten.filter(op => {
      const bronMatch = filters.bronnen.length === 0 || filters.bronnen.includes((op.bron as OpdrachtBron) || 'systeem');
      if (!bronMatch) return false;
      const typeMatch = filters.opdrachtTypes.length === 0 || filters.opdrachtTypes.includes(op.opdrachtType || 'Onbekend');
      if (!typeMatch) return false;
      if (Array.isArray(filters.tekenen) && filters.tekenen.length > 0) {
        const status = (op as any).tekenStatus || ((op as any).isTekenen ? 'ja' : 'nee');
        if (!filters.tekenen.includes(status)) return false;
      }
      const nivs = filters.niveaus || [];
      if (nivs.length === 0) return true; // geen niveau-filter
      const niv = (op as any).niveau as (1|2|3|undefined);
      if (typeof niv === 'number') return nivs.includes(niv);
      return nivs.includes('undef');
    });

    // Alleen in highscore-modus beperken op highscore-categorieën
    if (currentMode === 'highscore' && geselecteerdeHighscoreCategorieen.length > 0) {
      gefilterdeOpdrachten = gefilterdeOpdrachten.filter(op => {
        const opdrachtCategorie = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
        return geselecteerdeHighscoreCategorieen.includes(opdrachtCategorie);
      });
    }

    return gefilterdeOpdrachten;
  }, [opdrachten, filters, geselecteerdeHighscoreCategorieen]);

  const alleUniekeCategorieen = useMemo(() => {
    const unieke = new Set<string>();
    opdrachtenVoorSelectie.forEach(op => {
      const id = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
      unieke.add(id);
    });
    return [...unieke];
  }, [opdrachtenVoorSelectie]);

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



