import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { LeerData, Achievement, LeitnerData, LeitnerAchievement } from '../data/types';
import { getLeerDataManager } from '../data/leerDataManager';
import { doughnutChartConfig } from '../utils/chartConfigs';
import OverzichtTab from './leeranalyse/OverzichtTab';
import CategorieenTab from './leeranalyse/CategorieenTab';
import TijdlijnTab from './leeranalyse/TijdlijnTab';
import AchievementsTab from './leeranalyse/AchievementsTab';
import LeitnerTab from './leeranalyse/LeitnerTab';
import './Leeranalyse.css';

interface LeeranalyseProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFocusSessie?: (categorie: string, leermodusType?: 'normaal' | 'leitner') => void;
  openToAchievements?: boolean;
}

export const Leeranalyse = React.memo(({ isOpen, onClose, onStartFocusSessie, openToAchievements = false }: LeeranalyseProps) => {
  const [leerData, setLeerData] = useState<LeerData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leitnerData, setLeitnerData] = useState<LeitnerData | null>(null);
  const [achievementDefs, setAchievementDefs] = useState<{ algemeen: Omit<Achievement, 'behaaldOp'>[], leitner: Omit<LeitnerAchievement, 'behaaldOp'>[] }>({ algemeen: [], leitner: [] });
  const [activeTab, setActiveTab] = useState<'overzicht' | 'categorieen' | 'achievements' | 'leitner' | 'tijdlijn'>(openToAchievements ? 'achievements' : 'overzicht');
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });

  const leerDataManager = useMemo(() => getLeerDataManager(), [isOpen]);

  const { hoofdcategorieRanking, subcategorieRanking } = useMemo(() => {
    if (!isOpen) return { hoofdcategorieRanking: null, subcategorieRanking: null };
    return {
      hoofdcategorieRanking: leerDataManager.getCategorieRanking('hoofd'),
      subcategorieRanking: leerDataManager.getCategorieRanking('sub')
    };
  }, [isOpen, leerDataManager]);

  const activiteitData = useMemo(() => {
    if (!leerData) return null;
        return leerDataManager.getDagelijkseActiviteitData(30);
  }, [leerData, leerDataManager]);

  const prestatieData = useMemo(() => {
    if (!leerData) return null;
    return leerDataManager.getPrestatieDagelijkseData(30);
  }, [leerData, leerDataManager]);

  const focusData = useMemo(() => {
    if (!leerData) return null;
    return leerDataManager.getFocusDagelijkseData(30, 'tijd');
  }, [leerData, leerDataManager]);

  const sessieKwaliteitData = useMemo(() => {
    if (!leerData) return null;
    return leerDataManager.getSessieKwaliteitDagelijkseData(30);
  }, [leerData, leerDataManager]);

  const topCategorieData = useMemo(() => {
    if (!leerData) return null;
        return leerDataManager.getTopCategorieDagelijkseData(30);
  }, [leerData, leerDataManager]);

  const leerpatronenData = useMemo(() => {
    if (!leerData) return null;
    return leerDataManager.getLeitnerTijdlijnData(30);
  }, [leerData, leerDataManager]);

  const sessiePatronenData = useMemo(() => {
    if (!leerData) return null;
    return leerDataManager.getSessiePatronenData();
  }, [leerData, leerDataManager]);

  const leitnerBoxHerhalingenData = useMemo(() => {
    if (!leerData) return null;
    return leerDataManager.getLeitnerBoxHerhalingenTijdlijnData(30);
  }, [leerData, leerDataManager]);

  const streakData = useMemo(() => {
    if (!leerData) return null;
    return leerDataManager.getStreakData();
  }, [leerData, leerDataManager]);

  useEffect(() => {
    if (isOpen) {
    const leerDataManager = getLeerDataManager();
      const data = leerDataManager.loadLeerData();
      const achievementsData = leerDataManager.loadAchievements();
      const leitnerData = leerDataManager.loadLeitnerData();
      const defs = leerDataManager.getAchievementDefinitions();
      
      setLeerData(data);
      setAchievements(achievementsData);
      setLeitnerData(leitnerData);
      setAchievementDefs(defs);
    }
  }, [isOpen]);

  // Leitner statistieken
  const leitnerStats = useMemo(() => {
    if (!isOpen) return null;
    
    const leerDataManager = getLeerDataManager();
    return leerDataManager.getLeitnerStatistieken();
  }, [isOpen, leerDataManager]);

  const leitnerBoxData = useMemo(() => {
    if (!leitnerStats) return null;

    const boxLabels = [
      'Box 0 (10 min)', 
      'Box 1 (1 dag)', 
      'Box 2 (2 dagen)', 
      'Box 3 (4 dagen)', 
      'Box 4 (7 dagen)', 
      'Box 5 (14 dagen)',
      'Box 6 (1,5 maand)',
      'Beheerst'
    ];
    
    const colors = [
      '#bbf7d0', // Box 0 - groen 200
      '#86efac', // Box 1 - groen 300
      '#4ade80', // Box 2 - groen 400
      '#22c55e', // Box 3 - groen 500
      '#16a34a', // Box 4 - groen 600
      '#15803d', // Box 5 - groen 700
      '#166534', // Box 6 - groen 800 (donker)
      '#fbbf24'  // Beheerst - goud/amber
    ];

    const datasets = boxLabels.map((label, index) => {
      const boxId = index;
      return {
        label: label,
        data: boxLabels.map((_, dataIndex) => 
          dataIndex === index ? leitnerStats.opdrachtenPerBox[boxId] || 0 : 0
        ),
        backgroundColor: colors[index],
        borderColor: colors[index],
        borderWidth: 1,
        stack: 'leitner' // Zorgt ervoor dat de staven op dezelfde plek worden "gestapeld"
      };
    });

    return {
      labels: boxLabels,
      datasets: datasets
    };
  }, [leitnerStats]);

  const algemeneAchievementData = useMemo(() => {
    if (!achievementDefs.algemeen.length) return null;

    const categorieNamen = {
      onboarding: 'Onboarding',
      progressie: 'Voortgang',
      kwaliteit: 'Kwaliteit',
      consistentie: 'Consistentie',
      exploratie: 'Exploratie',
      speciaal: 'Speciaal'
    };
    
    const categorieKleuren = {
        onboarding: '#10B981',   // Groen
        progressie: '#F59E0B',   // Amber
        kwaliteit: '#3B82F6',    // Blauw
        consistentie: '#EF4444', // Rood
        exploratie: '#8B5CF6',   // Violet
        speciaal: '#D946EF',     // Fuchsia
        overig: '#6B7280'        // Grijs
    };

    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColors: string[] = [];
    const totals: number[] = [];

    let totaalBehaald = 0;
    
    Object.keys(categorieNamen).forEach(catKey => {
      const categorie = catKey as keyof typeof categorieNamen;
      const behaaldeCount = achievements.filter(a => a.categorie === categorie).length;
      
      if (behaaldeCount > 0) {
        labels.push(categorieNamen[categorie]);
        data.push(behaaldeCount);
        backgroundColors.push(categorieKleuren[categorie]);
        const totaalVoorCat = achievementDefs.algemeen.filter(def => def.categorie === categorie).length;
        totals.push(totaalVoorCat);
        totaalBehaald += behaaldeCount;
      }
    });

    const totaalMogelijk = achievementDefs.algemeen.length;
    const nogNietBehaald = totaalMogelijk - totaalBehaald;

    if (nogNietBehaald > 0) {
      labels.push('Nog te behalen');
      data.push(nogNietBehaald);
      backgroundColors.push(categorieKleuren.overig);
      totals.push(totaalMogelijk);
    }
    
    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 2,
        customData: {
          totals: totals,
          behaald: data
        }
      }]
    };
  }, [achievements, achievementDefs.algemeen]);

  const leitnerAchievementData = useMemo(() => {
    if (!achievementDefs.leitner.length) return null;
    
    const categorieNamen = {
      herhaling: 'Herhaling',
      promotie: 'Promotie',
      consistentie: 'Streak'
    };
    
    const categorieKleuren = {
        herhaling: '#06B6D4',    // Cyaan
        promotie: '#F6E05E',    // Geel (aangepast voor zichtbaarheid)
        consistentie: '#EC4899', // Roze
        overig: '#6B7280'        // Grijs
    };

    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColors: string[] = [];
    const totals: number[] = [];

    let totaalBehaald = 0;
    const behaaldeLeitnerAchievements = leitnerData?.achievements || [];

    Object.keys(categorieNamen).forEach(catKey => {
      const categorie = catKey as keyof typeof categorieNamen;
      const behaaldeCount = behaaldeLeitnerAchievements.filter(a => a.categorie === categorie).length;
      
      if (behaaldeCount > 0) {
        labels.push(categorieNamen[categorie]);
        data.push(behaaldeCount);
        backgroundColors.push(categorieKleuren[categorie]);
        const totaalVoorCat = achievementDefs.leitner.filter(def => def.categorie === categorie).length;
        totals.push(totaalVoorCat);
        totaalBehaald += behaaldeCount;
      }
    });

    const totaalMogelijk = achievementDefs.leitner.length;
    const nogNietBehaald = totaalMogelijk - totaalBehaald;

    if (nogNietBehaald > 0) {
      labels.push('Nog te behalen');
      data.push(nogNietBehaald);
      backgroundColors.push(categorieKleuren.overig);
      totals.push(totaalMogelijk);
    }

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 2,
        customData: {
          totals: totals,
          behaald: data
        }
      }]
    };
  }, [leitnerData, achievementDefs.leitner]);

  const aangepasteDoughnutConfig = useMemo(() => ({
    ...doughnutChartConfig,
    plugins: {
      ...doughnutChartConfig.plugins,
      tooltip: {
        ...doughnutChartConfig.plugins?.tooltip,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const dataset = context.dataset;
            const dataIndex = context.dataIndex;
            
            if (label === 'Nog te behalen') {
              const value = dataset.data[dataIndex];
              return `${label}: ${value}`;
            }

            const behaald = dataset.customData.behaald[dataIndex];
            const totaal = dataset.customData.totals[dataIndex];
            return `${label}: ${behaald} van ${totaal}`;
          }
        }
      }
    }
  }), []);

  const showInfoModal = useCallback((title: string, content: string) => {
    setInfoModal({ isOpen: true, title, content });
  }, []);

  const closeInfoModal = useCallback(() => {
    setInfoModal({ isOpen: false, title: '', content: '' });
  }, []);

  const formatTijd = useCallback((minuten: number): string => {
    const uren = Math.floor(minuten / 60);
    const restMinuten = minuten % 60;
    return uren > 0 ? `${uren}u ${restMinuten}m` : `${restMinuten}m`;
  }, []);

  const formatDatum = useCallback((datumString: string): string => {
    return new Date(datumString).toLocaleDateString('nl-NL');
  }, []);

  const exportData = useCallback(() => {
    const leerDataManager = getLeerDataManager();
    const data = leerDataManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leerdata_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportToExcel = useCallback(() => {
    if (!leerData) return;

    import('xlsx').then((XLSX) => {
      const workbook = XLSX.utils.book_new();

      const overzichtData = [
        {
          'Totaal Opdrachten': leerData.statistieken.totaalOpdrachten,
          'Totaal Speeltijd (minuten)': leerData.statistieken.totaalSpeeltijd,
          'Gemiddelde Score': leerData.statistieken.gemiddeldeScore.toFixed(1),
          'Favoriete Categorie': leerData.statistieken.favorieteCategorie || 'N/A',
          'Zwakste Categorie': leerData.statistieken.zwaksteCategorie || 'N/A',
          'Consistentie Score (%)': leerData.statistieken.consistentieScore,
          'Export Datum': new Date().toISOString().split('T')[0]
        }
      ];
      const overzichtSheet = XLSX.utils.json_to_sheet(overzichtData);
      XLSX.utils.book_append_sheet(workbook, overzichtSheet, "Overzicht");

      const opdrachtenData = Object.values(leerData.opdrachten).map(opdracht => ({
        'Categorie': opdracht.categorie,
        'Laatste Datum': formatDatum(opdracht.laatsteDatum),
        'Aantal Keer Gedaan': opdracht.aantalKeerGedaan,
        'Gemiddelde Score': opdracht.gemiddeldeScore.toFixed(1),
        'Hoogste Score': opdracht.hoogsteScore,
        'Laagste Score': opdracht.laagsteScore,
        'Totale Tijd (minuten)': Math.round(opdracht.totaleTijd / 60)
      }));
      const opdrachtenSheet = XLSX.utils.json_to_sheet(opdrachtenData);
      XLSX.utils.book_append_sheet(workbook, opdrachtenSheet, "Opdrachten");

      const categorieenData = Object.values(leerData.statistieken.categorieStatistieken).map(stats => ({
        'Categorie': stats.categorie,
        'Aantal Opdrachten': stats.aantalOpdrachten,
        'Gemiddelde Score': stats.gemiddeldeScore.toFixed(1),
        'Sterkste Punt': stats.sterkstePunt,
        'Verbeterpunt': stats.verbeterpunt,
        'Laatste Activiteit': formatDatum(stats.laatsteActiviteit)
      }));
      const categorieenSheet = XLSX.utils.json_to_sheet(categorieenData);
      XLSX.utils.book_append_sheet(workbook, categorieenSheet, "Categorieën");

      const sessiesData = Object.values(leerData.sessies).map(sessie => ({
        'Sessie ID': sessie.sessieId,
        'Start Datum': formatDatum(sessie.startTijd),
        'Eind Datum': sessie.eindTijd ? formatDatum(sessie.eindTijd) : 'N/A',
        'Duur (minuten)': sessie.duur || 'N/A',
        'Opdrachten Gedaan': sessie.opdrachtenGedaan,
        'Gemiddelde Score': sessie.gemiddeldeScore.toFixed(1),
        'Serieuze Modus': sessie.serieuzeModus ? 'Ja' : 'Nee',
        'Categorieën': sessie.categorieen.join(', ')
      }));
      const sessiesSheet = XLSX.utils.json_to_sheet(sessiesData);
      XLSX.utils.book_append_sheet(workbook, sessiesSheet, "Sessies");

      if (leitnerData && leitnerData.isLeitnerActief) {
        const leitnerSheetData = [
          {
            'Totaal Opdrachten': leitnerData.boxes.reduce((sum: number, box: any) => sum + box.opdrachten.length, 0),
            'Box 0': leitnerData.boxes.find((b: any) => b.boxId === 0)?.opdrachten.length || 0,
            'Box 1': leitnerData.boxes.find((b: any) => b.boxId === 1)?.opdrachten.length || 0,
            'Box 2': leitnerData.boxes.find((b: any) => b.boxId === 2)?.opdrachten.length || 0,
            'Box 3': leitnerData.boxes.find((b: any) => b.boxId === 3)?.opdrachten.length || 0,
            'Box 4': leitnerData.boxes.find((b: any) => b.boxId === 4)?.opdrachten.length || 0,
            'Box 5': leitnerData.boxes.find((b: any) => b.boxId === 5)?.opdrachten.length || 0,
            'Box 6': leitnerData.boxes.find((b: any) => b.boxId === 6)?.opdrachten.length || 0,
            'Box 7': leitnerData.boxes.find((b: any) => b.boxId === 7)?.opdrachten.length || 0,
            'Export Datum': new Date().toISOString().split('T')[0]
          }
        ];
        const leitnerSheet = XLSX.utils.json_to_sheet(leitnerSheetData);
        XLSX.utils.book_append_sheet(workbook, leitnerSheet, "Leitner");
      }

      XLSX.writeFile(workbook, `leeranalyse_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }, [leerData, leitnerData, formatDatum]);

  if (!isOpen) return null;

  if (!leerData || Object.keys(leerData.opdrachten).length === 0) {
    return (
      <div className="leeranalyse-overlay" onClick={onClose}>
        <div className="leeranalyse-modal" onClick={(e) => e.stopPropagation()}>
          <div className="leeranalyse-header">
            <h2>📊 Leeranalyse</h2>
            <button 
              className="modal-close"
              aria-label="Sluiten"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
            >
              ×
            </button>
          </div>
          <div className="leeranalyse-body">
            <div className="geen-data-melding">
              <h3>📝 Nog geen leerdata beschikbaar</h3>
              <p>
                Er is nog geen leerdata beschikbaar omdat je nog geen opdrachten hebt voltooid 
                in de vrije leermodus of Leitner leermodus.
              </p>
              <p>
                <strong>Om leerdata te verzamelen:</strong>
              </p>
              <ul>
                <li>✅ Speel opdrachten in de <strong>vrije leermodus</strong></li>
                <li>✅ Gebruik de <strong>Leitner leermodus</strong> voor gestructureerd leren</li>
                <li>✅ Voltooi opdrachten om je voortgang bij te houden</li>
              </ul>
              <p>
                Zodra je je eerste opdracht hebt voltooid, wordt hier je leeranalyse getoond 
                met statistieken, grafieken en inzichten over je leervoortgang.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="leeranalyse-overlay" onClick={onClose}>
      <div className="leeranalyse-modal" onClick={(e) => e.stopPropagation()}>
        <div className="leeranalyse-header">
          <h2>📊 Leeranalyse (Leer Modus)</h2>
          <button 
            className="modal-close"
            aria-label="Sluiten"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            &times;
          </button>
        </div>

        <div className="leeranalyse-tabs">
          <button 
            className={`tab ${activeTab === 'overzicht' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('overzicht');
            }}
          >
            📈 Overzicht
          </button>
          <button 
            className={`tab ${activeTab === 'categorieen' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('categorieen');
            }}
          >
            🎯 Categorieën
          </button>

          <button 
            className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('achievements');
            }}
          >
            🏆 Achievements
          </button>
          <button 
            className={`tab ${activeTab === 'leitner' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('leitner');
            }}
          >
            📚 Leitner boxen
          </button>
          <button 
            className={`tab ${activeTab === 'tijdlijn' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab('tijdlijn');
            }}
          >
            📅 Tijdlijn
          </button>
        </div>

        <div className="leeranalyse-content">
          {!leerData ? (
            <div className="geen-data">
              <p>Nog geen leerdata beschikbaar.</p>
              <p>Start een sessie in serieuze leer-modus om data te verzamelen.</p>
            </div>
          ) : (
            <>
              {activeTab === 'overzicht' && (
                <OverzichtTab
                  leerData={leerData}
                  achievements={achievements}
                  leitnerData={leitnerData}
                  achievementDefs={achievementDefs}
                  onStartFocusSessie={onStartFocusSessie}
                  showInfoModal={showInfoModal}
                  formatTijd={formatTijd}
                />
              )}

              {activeTab === 'categorieen' && (
                <CategorieenTab
                  leerData={leerData}
                  achievements={achievements}
                  leitnerData={leitnerData}
                  achievementDefs={achievementDefs}
                  onStartFocusSessie={onStartFocusSessie}
                  showInfoModal={showInfoModal}
                  hoofdcategorieRanking={hoofdcategorieRanking}
                  subcategorieRanking={subcategorieRanking}
                />
              )}

              {activeTab === 'achievements' && (
                <AchievementsTab
                  leerData={leerData}
                  achievements={achievements}
                  leitnerData={leitnerData}
                  achievementDefs={achievementDefs}
                  algemeneAchievementData={algemeneAchievementData}
                  leitnerAchievementData={leitnerAchievementData}
                  aangepasteDoughnutConfig={aangepasteDoughnutConfig}
                />
              )}

              {activeTab === 'leitner' && (
                <LeitnerTab
                  leerData={leerData}
                  achievements={achievements}
                  leitnerData={leitnerData}
                  achievementDefs={achievementDefs}
                  leitnerStats={leitnerStats}
                  leitnerBoxData={leitnerBoxData}
                />
              )}

              {activeTab === 'tijdlijn' && (
                <TijdlijnTab
                  leerData={leerData}
                  activiteitData={activiteitData}
                  prestatieData={prestatieData}
                  focusData={focusData}
                  sessieKwaliteitData={sessieKwaliteitData}
                  topCategorieData={topCategorieData}
                  leerpatronenData={leerpatronenData}
                  sessiePatronenData={sessiePatronenData}
                  leitnerBoxHerhalingenData={leitnerBoxHerhalingenData}
                  streakData={streakData}
                  achievements={achievements} 
                  leitnerData={leitnerData}
                  achievementDefs={achievementDefs}
                />
              )}
            </>
          )}
        </div>

        <div className="leeranalyse-footer">
          <div className="export-buttons">
            <button 
              className="export-button json-export" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                exportData();
              }}
            >
              📄 Export JSON
            </button>
            <button 
              className="export-button excel-export" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                exportToExcel();
              }}
            >
              📊 Export Excel
            </button>
          </div>
        </div>
      </div>

      {infoModal.isOpen && (
        <div className="info-modal-overlay" onClick={closeInfoModal}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>{infoModal.title}</h3>
              <button className="info-modal-close" onClick={closeInfoModal}>
                ✕
              </button>
            </div>
            <div className="info-modal-content">
              <p>{infoModal.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}); 