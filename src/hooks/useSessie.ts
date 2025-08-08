import { useCallback, useEffect, useState } from 'react';
import { getLeerDataManager } from '../data/leerDataManager';

type LeermodusType = 'normaal' | 'leitner';

interface UseSessieParams {
  isSerieuzeLeerModusActief: boolean;
  gameMode: 'single' | 'multi';
}

export function useSessie({ isSerieuzeLeerModusActief, gameMode }: UseSessieParams) {
  const [huidigeSessieId, setHuidigeSessieId] = useState<string | null>(null);

  const startSessie = useCallback((leermodusType: LeermodusType): string | null => {
    if (isSerieuzeLeerModusActief && gameMode === 'single' && !huidigeSessieId) {
      const manager = getLeerDataManager();
      const nieuweId = manager.startSessie(true, leermodusType);
      setHuidigeSessieId(nieuweId);
      return nieuweId;
    }
    return null;
  }, [isSerieuzeLeerModusActief, gameMode, huidigeSessieId]);

  const endSessie = useCallback(() => {
    if (!huidigeSessieId) return null;
    const manager = getLeerDataManager();
    manager.endSessie(huidigeSessieId);
    const leerData = manager.loadLeerData();
    const sessieData = leerData?.sessies[huidigeSessieId] ?? null;
    setHuidigeSessieId(null);
    return sessieData;
  }, [huidigeSessieId]);

  // Cleanup bij unmount/uitschakelen leer-modus
  useEffect(() => {
    return () => {
      if (huidigeSessieId && isSerieuzeLeerModusActief && gameMode === 'single') {
        const manager = getLeerDataManager();
        manager.endSessie(huidigeSessieId);
      }
    };
  }, [huidigeSessieId, isSerieuzeLeerModusActief, gameMode]);

  return { huidigeSessieId, setHuidigeSessieId, startSessie, endSessie };
}



