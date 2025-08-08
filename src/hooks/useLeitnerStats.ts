import { useCallback, useEffect, useRef, useState } from 'react';
import { getLeerDataManager } from '../data/leerDataManager';
import type { Opdracht } from '../data/types';

export type LeitnerStats = {
  totaalOpdrachten: number;
  vandaagBeschikbaar: number;
  reguliereHerhalingenBeschikbaar: number;
};

type LeermodusType = 'normaal' | 'leitner';

export function useLeitnerStats(params: {
  leermodusType: LeermodusType;
  isSerieuzeLeerModusActief: boolean;
  opdrachten: Opdracht[];
  opdrachtenVoorSelectie: Opdracht[];
  geselecteerdeLeitnerCategorieenGefilterd: string[];
  negeerBox0Wachttijd: boolean;
  // Extra deps die een herberekening moeten triggeren (bv. filters)
  extraRecalcDeps?: unknown[];
}) {
  const {
    leermodusType,
    isSerieuzeLeerModusActief,
    opdrachten,
    opdrachtenVoorSelectie,
    geselecteerdeLeitnerCategorieenGefilterd,
    negeerBox0Wachttijd,
    extraRecalcDeps = [],
  } = params;

  const [leitnerStats, setLeitnerStats] = useState<LeitnerStats>({
    totaalOpdrachten: 0,
    vandaagBeschikbaar: 0,
    reguliereHerhalingenBeschikbaar: 0,
  });
  const [aantalNieuweLeitnerOpdrachten, setAantalNieuweLeitnerOpdrachten] = useState(0);
  const [isBox0OverrideActief, setIsBox0OverrideActief] = useState(false);

  const computeRef = useRef<() => void>(() => {});

  const computeNow = useCallback(() => {
    if (leermodusType === 'leitner' && isSerieuzeLeerModusActief && opdrachten.length > 0) {
      const leerDataManager = getLeerDataManager();
      const nieuweOpdrachtenCount = leerDataManager.getNieuweLeitnerOpdrachtenCount(
        opdrachtenVoorSelectie,
        geselecteerdeLeitnerCategorieenGefilterd
      );
      setAantalNieuweLeitnerOpdrachten(nieuweOpdrachtenCount);

      const reguliereStats = leerDataManager.getLeitnerStatistiekenVoorCategorieen(
        geselecteerdeLeitnerCategorieenGefilterd,
        { negeerBox0WachttijdAlsLeeg: false }
      );
      const moetOverrideActiefZijn =
        negeerBox0Wachttijd &&
        nieuweOpdrachtenCount === 0 &&
        reguliereStats.reguliereHerhalingenBeschikbaar === 0;
      setIsBox0OverrideActief(moetOverrideActiefZijn);

      const stats = leerDataManager.getLeitnerStatistiekenVoorCategorieen(
        geselecteerdeLeitnerCategorieenGefilterd,
        { negeerBox0WachttijdAlsLeeg: moetOverrideActiefZijn }
      );
      setLeitnerStats(stats);
    } else {
      setLeitnerStats({ totaalOpdrachten: 0, vandaagBeschikbaar: 0, reguliereHerhalingenBeschikbaar: 0 });
      setAantalNieuweLeitnerOpdrachten(0);
      setIsBox0OverrideActief(false);
    }
  }, [
    leermodusType,
    isSerieuzeLeerModusActief,
    opdrachten.length,
    opdrachtenVoorSelectie,
    geselecteerdeLeitnerCategorieenGefilterd,
    negeerBox0Wachttijd,
  ]);

  // Bewaar de compute functie in ref zodat refresh dezelfde referentie kan gebruiken
  useEffect(() => {
    computeRef.current = computeNow;
  }, [computeNow]);

  // Init + interval updates
  useEffect(() => {
    computeNow();
    const id = window.setInterval(computeNow, 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeNow, ...extraRecalcDeps]);

  const refreshLeitnerStats = useCallback(() => {
    computeRef.current();
  }, []);

  const setLeitnerStatsDirect = useCallback((stats: LeitnerStats) => {
    setLeitnerStats(stats);
  }, []);

  return {
    leitnerStats,
    aantalNieuweLeitnerOpdrachten,
    isBox0OverrideActief,
    refreshLeitnerStats,
    setLeitnerStatsDirect,
  } as const;
}


