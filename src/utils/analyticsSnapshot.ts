import { getLeerDataManager } from '../data/leerDataManager';

export type TipsAnalyticsSnapshot = {
  // Tijdslijn dekking
  totalDaysWithData?: number;
  // Categorie-snapshots per hoofdcategorie
  coveragePercentPerHoofdcategorie?: { [hoofdcategorie: string]: number };
  masteryPercentPerHoofdcategorie?: { [hoofdcategorie: string]: number };
  avgBoxPerHoofdcategorie?: { [hoofdcategorie: string]: number };
};

// Bouw een compacte snapshot voor de tips-engine op basis van leerdata.
// Ontkoppeld van UI-tegels, zodat tips stabiel blijven bij UI-wijzigingen.
export function buildTipsAnalyticsSnapshot(): TipsAnalyticsSnapshot {
  const dm = getLeerDataManager();

  // totalDaysWithData: tel dagen met enige activiteit in opgeslagen statistieken
  let totalDaysWithData: number | undefined;
  try {
    const leerData = dm.loadLeerData();
    const dagObj = leerData?.statistieken?.dagelijkseActiviteit ?? {};
    totalDaysWithData = Object.keys(dagObj).length || undefined;
  } catch {
    // ignore
  }

  // Per-hoofdcategorie: coverage %, mastery %, gemiddelde box
  const coverage: Record<string, number> = {};
  const mastery: Record<string, number> = {};
  const avgBox: Record<string, number> = {};

  try {
    const hcStats = dm.getHoofdcategorieStatistieken?.();
    const hoofdcategorieen: string[] = hcStats ? Object.keys(hcStats) : [];

    hoofdcategorieen.forEach((hc) => {
      // Dekking
      try {
        const d = dm.getCategorieDekking(hc);
        if (typeof d?.dekkingsPercentage === 'number' && isFinite(d.dekkingsPercentage)) {
          coverage[hc] = Math.max(0, Math.min(100, d.dekkingsPercentage));
        }
      } catch {/* ignore één categorie fout */}

      // Beheersing + Gemiddelde box
      try {
        const b = dm.getCategorieBeheersing(hc);
        if (typeof b?.beheersingPercentage === 'number' && isFinite(b.beheersingPercentage)) {
          mastery[hc] = Math.max(0, Math.min(100, b.beheersingPercentage));
        }
        if (typeof b?.gemiddeldeBox === 'number' && isFinite(b.gemiddeldeBox)) {
          avgBox[hc] = Math.max(0, Math.min(7, b.gemiddeldeBox));
        }
      } catch {/* ignore */}
    });
  } catch {
    // ignore – geen hoofdcategorie stats beschikbaar
  }

  const snapshot: TipsAnalyticsSnapshot = {
    totalDaysWithData,
  };
  if (Object.keys(coverage).length > 0) snapshot.coveragePercentPerHoofdcategorie = coverage;
  if (Object.keys(mastery).length > 0) snapshot.masteryPercentPerHoofdcategorie = mastery;
  if (Object.keys(avgBox).length > 0) snapshot.avgBoxPerHoofdcategorie = avgBox;

  return snapshot;
}


