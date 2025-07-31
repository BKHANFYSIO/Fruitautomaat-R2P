import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { LeerData, Achievement, LeitnerData, LeitnerAchievement } from '../data/types';
import { getLeerDataManager } from '../data/leerDataManager';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  lineChartConfig, 
  barChartConfig, 
  doughnutChartConfig,
  chartColors,
  formatChartDate
} from '../utils/chartConfigs';
import './Leeranalyse.css';

interface LeeranalyseProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFocusSessie?: (categorie: string) => void;
  openToAchievements?: boolean;
}

const ScoreTrendSparkline = ({ data }: { data: { score: number; datum: string }[] }) => {
  if (data.length < 2) {
    return null; // Geen trend te tonen met minder dan 2 datapunten
  }

  const chartData = {
    labels: data.map(d => new Date(d.datum).toLocaleDateString()),
    datasets: [
      {
        data: data.map(d => d.score),
        borderColor: '#63b3ed',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0, // Geen punten op de lijn
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        min: 1,
        max: 5,
      },
    },
  };

  return (
    <div className="sparkline-container">
      <strong>Score Trend:</strong>
      <div className="sparkline-chart">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

const LeitnerVerdelingBar = ({ verdeling }: { verdeling: { [boxId: number]: number } }) => {
  const totaal = Object.values(verdeling).reduce((sum, count) => sum + count, 0);
  if (totaal === 0) {
    return <div className="verdeling-bar-leeg">Leitner data niet beschikbaar</div>;
  }

  const boxKleuren = [
    '#805ad5', // Box 0
    '#ff6b6b', // Box 1
    '#feca57', // Box 2
    '#48dbfb', // Box 3
    '#0abde3', // Box 4
    '#54a0ff', // Box 5
    '#2c3e50', // Box 6
    '#ffd700'  // Box 7 (Beheerst)
  ];

  return (
    <div className="verdeling-bar-container">
      <strong>Kennis Verankering:</strong>
      <div className="verdeling-bar">
        {Object.entries(verdeling).map(([boxId, count]) => {
          if (count === 0) return null;
          const percentage = (count / totaal) * 100;
          return (
            <div
              key={boxId}
              className="verdeling-segment"
              style={{ width: `${percentage}%`, backgroundColor: boxKleuren[parseInt(boxId, 10)] }}
              title={`Box ${boxId}: ${count} opdracht(en)`}
            />
          );
        })}
      </div>
    </div>
  );
};

const MasteryIndicator = ({ level, percentage }: { level: string, percentage: number }) => {
  if (level === 'Geen') return null;

  const levelInfo = {
    'Brons': { icon: '🥉', color: '#cd7f32' },
    'Zilver': { icon: '🥈', color: '#c0c0c0' },
    'Goud': { icon: '🥇', color: '#ffd700' }
  };

  const info = levelInfo[level as keyof typeof levelInfo];

  return (
    <div className="mastery-indicator" title={`Beheersingsniveau: ${percentage}%`}>
      <span className="mastery-icon" style={{ color: info.color }}>{info.icon}</span>
      <span className="mastery-level">{level}</span>
    </div>
  );
};

export const Leeranalyse = React.memo(({ isOpen, onClose, onStartFocusSessie, openToAchievements = false }: LeeranalyseProps) => {
  const [leerData, setLeerData] = useState<LeerData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leitnerData, setLeitnerData] = useState<LeitnerData | null>(null);
  const [achievementDefs, setAchievementDefs] = useState<{ algemeen: Omit<Achievement, 'behaaldOp'>[], leitner: Omit<LeitnerAchievement, 'behaaldOp'>[] }>({ algemeen: [], leitner: [] });
  const [activeTab, setActiveTab] = useState<'overzicht' | 'categorieen' | 'achievements' | 'leitner'>(openToAchievements ? 'achievements' : 'overzicht');
  const [openAnalyseCategorieen, setOpenAnalyseCategorieen] = useState<Record<string, boolean>>({});
  const [showLeitnerUitleg, setShowLeitnerUitleg] = useState(false);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });

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

  // const gefilterdeLeitnerAchievements = useMemo(() => {
  //   if (!leitnerData || !leitnerData.achievements) return [];

  //   const getHoogsteAchievement = (achievements: LeitnerAchievement[], categorie: string, order: string[]): LeitnerAchievement | null => {
  //     const gefilterd = achievements.filter(a => a.categorie === categorie);
  //     for (const id of order) {
  //       const found = gefilterd.find(a => a.id === id);
  //       if (found) return found;
  //     }
  //     return null;
  //   };
    
  //   const promotieOrder = ['promotie_box_6', 'promotie_box_5', 'promotie_box_4', 'promotie_box_3', 'promotie_box_2'];
  //   const herhalingOrder = ['herhaling_30', 'herhaling_15', 'herhaling_5', 'herhaling_1'];
  //   const consistentieOrder = ['streak_14', 'streak_7', 'streak_3', 'streak_2'];

  //   const hoogstePromotie = getHoogsteAchievement(leitnerData.achievements, 'promotie', 'promotie', promotieOrder);
  //   const hoogsteHerhaling = getHoogsteAchievement(leitnerData.achievements, 'herhaling', 'herhaling', herhalingOrder);
  //   const hoogsteConsistentie = getHoogsteAchievement(leitnerData.achievements, 'consistentie', 'consistentie', consistentieOrder);
    
  //   const teTonenAchievements = [hoogstePromotie, hoogsteHerhaling, hoogsteConsistentie].filter(Boolean) as LeitnerAchievement[];

  //   // Sorteer de uiteindelijke lijst op behaaldatum
  //   return teTonenAchievements.sort((a, b) => new Date(b.behaaldOp).getTime() - new Date(a.behaaldOp).getTime());
  // }, [leitnerData]);


  // Chart data generatie - alle useMemo hooks bovenaan
  const scoreTrendData = useMemo(() => {
    if (!leerData) return null;

    const opdrachten = Object.values(leerData.opdrachten);
    const sortedOpdrachten = opdrachten
      .sort((a, b) => new Date(a.laatsteDatum).getTime() - new Date(b.laatsteDatum).getTime())
      .slice(-10); // Laatste 10 opdrachten

    return {
      labels: sortedOpdrachten.map(op => formatChartDate(op.laatsteDatum)),
      datasets: [
        {
          label: 'Score per Opdracht',
          data: sortedOpdrachten.map(op => op.gemiddeldeScore),
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primary + '20',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }, [leerData]);



  const beheersingBarData = useMemo(() => {
    if (!leerData) return null;

    const leerDataManager = getLeerDataManager();
    const categorieen = Object.keys(leerData.statistieken.categorieStatistieken);
    
    // Sorteer categorieën op beheersing percentage (hoogste eerst)
    const categorieBeheersing = categorieen.map(categorie => {
      const beheersing = leerDataManager.getCategorieBeheersing(categorie);
      return {
        categorie,
        beheersingPercentage: beheersing.beheersingPercentage,
        gemiddeldeBox: beheersing.gemiddeldeBox
      };
    }).sort((a, b) => b.beheersingPercentage - a.beheersingPercentage);

    return {
      labels: categorieBeheersing.map(cat => cat.categorie),
      datasets: [
        {
          label: 'Beheersing Percentage',
          data: categorieBeheersing.map(cat => cat.beheersingPercentage),
          backgroundColor: categorieBeheersing.map((cat) => {
            // Kleur op basis van beheersing niveau
            if (cat.beheersingPercentage >= 80) return '#28a745'; // Groen voor hoog
            if (cat.beheersingPercentage >= 50) return '#ffc107'; // Geel voor medium
            return '#dc3545'; // Rood voor laag
          }),
          borderColor: chartColors.primary,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    };
  }, [leerData]);

  // Leitner statistieken
  const leitnerStats = useMemo(() => {
    if (!isOpen) return null;
    
    const leerDataManager = getLeerDataManager();
    return leerDataManager.getLeitnerStatistieken();
  }, [isOpen]);

  const leitnerBoxData = useMemo(() => {
    if (!leitnerStats) return null;

    const boxLabels = ['Box 1 (Dagelijks)', 'Box 2 (2 dagen)', 'Box 3 (4 dagen)', 'Box 4 (7 dagen)', 'Box 5 (14 dagen)'];
    
    return {
      labels: boxLabels,
      datasets: [
        {
          label: 'Aantal Opdrachten per Box',
          data: [
            leitnerStats.opdrachtenPerBox[1] || 0,
            leitnerStats.opdrachtenPerBox[2] || 0,
            leitnerStats.opdrachtenPerBox[3] || 0,
            leitnerStats.opdrachtenPerBox[4] || 0,
            leitnerStats.opdrachtenPerBox[5] || 0
          ],
          backgroundColor: [
            '#ff6b6b', // Rood voor box 1
            '#feca57', // Oranje voor box 2
            '#48dbfb', // Blauw voor box 3
            '#0abde3', // Donkerblauw voor box 4
            '#54a0ff'  // Lichtblauw voor box 5
          ],
          borderColor: chartColors.primary,
          borderWidth: 1
        }
      ]
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
      onboarding: chartColors.success,
      progressie: chartColors.warning,
      kwaliteit: chartColors.info,
      consistentie: chartColors.danger,
      exploratie: chartColors.secondary,
      speciaal: chartColors.primary,
      overig: '#ccc'
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
        // Custom property om totalen op te slaan
        customData: {
          totals: totals,
          behaald: data // behaalde aantallen per categorie
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
      herhaling: '#06B6D4',
      promotie: '#F6E05E',
      consistentie: '#EC4899',
      overig: '#ccc'
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
        // Custom property om totalen op te slaan
        customData: {
          totals: totals,
          behaald: data
        }
      }]
    };
  }, [leitnerData, achievementDefs.leitner]);

  // Aangepaste afronding van de tooltips
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

  if (!isOpen) return null;

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

    // Import XLSX dynamisch
    import('xlsx').then((XLSX) => {
      const workbook = XLSX.utils.book_new();

      // 1. Overzicht sheet
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

      // 2. Opdrachten sheet
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

      // 3. Categorieën sheet
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

      // 4. Sessies sheet
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

      // 5. Achievements sheet
      const leerDataManager = getLeerDataManager();
      const achievements = leerDataManager.loadAchievements();
      const achievementsData = achievements.map((achievement: any) => ({
        'Achievement': achievement.naam,
        'Beschrijving': achievement.beschrijving,
        'Icon': achievement.icon,
        'Categorie': achievement.categorie,
        'Behaald Op': formatDatum(achievement.behaaldOp)
      }));
      const achievementsSheet = XLSX.utils.json_to_sheet(achievementsData);
      XLSX.utils.book_append_sheet(workbook, achievementsSheet, "Achievements");

      // Download het Excel bestand
      XLSX.writeFile(workbook, `leeranalyse_${new Date().toISOString().split('T')[0]}.xlsx`);
    }).catch(error => {
      console.error('Fout bij Excel export:', error);
      alert('Fout bij het exporteren naar Excel. Probeer het opnieuw.');
    });
  }, [leerData, formatDatum]);



  return (
    <div className="leeranalyse-overlay" onClick={onClose}>
      <div className="leeranalyse-modal" onClick={(e) => e.stopPropagation()}>
        <div className="leeranalyse-header">
          <h2>📊 Leeranalyse (Leer Modus)</h2>
          <button 
            className="close-button"
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
            📚 Leitner
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
                <div className="overzicht-tab">
                  {/* Info Box */}
                  <div className="leeranalyse-info-box">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-content">
                      <h4>Over deze analyse</h4>
                      <p>Deze leeranalyse toont je prestaties van <strong>Leer Modus sessies</strong>. Highscore Modus en multiplayer data worden niet meegenomen in deze analyse.</p>
                    </div>
                  </div>

                  {/* Spelmodus Overzicht */}
                  <div className="spelmodus-overzicht">
                    <h3>🎮 Spelmodus Overzicht</h3>
                    <div className="spelmodus-grid">
                      {(() => {
                        const leerDataManager = getLeerDataManager();
                        const modusStats = leerDataManager.getStatistiekenPerModus();
                        return (
                          <>
                            <div className="spelmodus-card leermodus">
                              <h4>📚 Leer Modus</h4>
                              <div className="modus-statistieken">
                                <p><strong>Sessies:</strong> {modusStats.normaal.sessies}</p>
                                <p><strong>Gemiddelde score:</strong> {modusStats.normaal.gemiddeldeScore.toFixed(1)}/5</p>
                                <p><strong>Speeltijd:</strong> {formatTijd(modusStats.normaal.speeltijd)}</p>
                                <p><strong>Categorieën:</strong> {modusStats.normaal.categorieen.length}</p>
                              </div>
                            </div>
                            <div className="spelmodus-card leitner">
                              <h4>🔄 Leitner Leer Modus</h4>
                              <div className="modus-statistieken">
                                <p><strong>Sessies:</strong> {modusStats.leitner.sessies}</p>
                                <p><strong>Gemiddelde score:</strong> {modusStats.leitner.gemiddeldeScore.toFixed(1)}/5</p>
                                <p><strong>Speeltijd:</strong> {formatTijd(modusStats.leitner.speeltijd)}</p>
                                <p><strong>Categorieën:</strong> {modusStats.leitner.categorieen.length}</p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Verbeterde Statistiek Cards */}
                  <div className="statistieken-grid">
                    {(() => {
                      const leerDataManager = getLeerDataManager();
                      const modusStats = leerDataManager.getStatistiekenPerModus();
                      const totaalNormaal = modusStats.normaal.sessies;
                      const totaalLeitner = modusStats.leitner.sessies;
                      const totaalSessies = totaalNormaal + totaalLeitner;
                      
                      // Bereken opdrachten per modus
                      const normaalOpdrachten = leerDataManager.getOpdrachtenPerModus('normaal');
                      const leitnerOpdrachten = leerDataManager.getOpdrachtenPerModus('leitner');
                      
                      return (
                        <>
                          <div className="statistiek-card">
                            <div className="statistiek-card-header">
                              <h3>📚 Totaal Opdrachten</h3>
                              <button 
                                className="info-knop" 
                                title="Totaal aantal voltooide opdrachten"
                                onClick={() => showInfoModal(
                                  '📚 Totaal Opdrachten',
                                  'Het totale aantal opdrachten dat je hebt voltooid. Dit getal is gebaseerd op alle opdrachten die je hebt afgerond, ongeacht in welke modus.'
                                )}
                              >
                                ℹ️
                              </button>
                            </div>
                            <p className="statistiek-waarde">{leerData.statistieken.totaalOpdrachten}</p>
                            <p className="statistiek-context">
                              Leer: {normaalOpdrachten} opdrachten, Leitner: {leitnerOpdrachten} opdrachten
                            </p>
                          </div>
                          <div className="statistiek-card">
                            <div className="statistiek-card-header">
                              <h3>🎮 Totaal Sessies</h3>
                              <button 
                                className="info-knop" 
                                title="Totaal aantal voltooide sessies"
                                onClick={() => showInfoModal(
                                  '🎮 Totaal Sessies',
                                  'Het aantal keer dat je een leer-sessie hebt afgerond. Alleen sessies die volledig zijn voltooid worden geteld.'
                                )}
                              >
                                ℹ️
                              </button>
                            </div>
                            <p className="statistiek-waarde">{leerData.statistieken.totaalSessies}</p>
                            <p className="statistiek-context">
                              Leer: {modusStats.normaal.sessies} sessies, Leitner: {modusStats.leitner.sessies} sessies
                            </p>
                          </div>
                          <div className="statistiek-card">
                            <div className="statistiek-card-header">
                              <h3>⏱️ Totaal Speeltijd</h3>
                              <button 
                                className="info-knop" 
                                title="Totaal speeltijd in alle sessies"
                                onClick={() => showInfoModal(
                                  '⏱️ Totaal Speeltijd',
                                  'De totale tijd die je hebt besteed aan het leren in alle voltooide sessies.'
                                )}
                              >
                                ℹ️
                              </button>
                            </div>
                            <p className="statistiek-waarde">{formatTijd(leerData.statistieken.totaalSpeeltijd)}</p>
                            <p className="statistiek-context">
                              Normaal: {formatTijd(modusStats.normaal.speeltijd)}, Leitner: {formatTijd(modusStats.leitner.speeltijd)}
                            </p>
                          </div>
                          <div className="statistiek-card">
                            <div className="statistiek-card-header">
                              <h3>📊 Gemiddelde Score</h3>
                              <button 
                                className="info-knop" 
                                title="Gemiddelde score over alle opdrachten"
                                onClick={() => showInfoModal(
                                  '📊 Gemiddelde Score',
                                  'Je gemiddelde score over alle opdrachten die je hebt voltooid (schaal van 0-5).'
                                )}
                              >
                                ℹ️
                              </button>
                            </div>
                            <p className="statistiek-waarde">{leerData.statistieken.gemiddeldeScore.toFixed(1)}/5</p>
                            <p className="statistiek-context">
                              Normaal: {modusStats.normaal.gemiddeldeScore.toFixed(1)}, Leitner: {modusStats.leitner.gemiddeldeScore.toFixed(1)}
                            </p>
                          </div>
                          <div className="statistiek-card">
                            <div className="statistiek-card-header">
                              <h3>🎯 Consistentie</h3>
                              <button 
                                className="info-knop" 
                                title="Percentage sessies met score > 3"
                                onClick={() => showInfoModal(
                                  '🎯 Consistentie',
                                  'Het percentage van je sessies waarin je een gemiddelde score van 3 of hoger hebt behaald. Dit laat zien hoe consistent je presteert.'
                                )}
                              >
                                ℹ️
                              </button>
                            </div>
                            <p className="statistiek-waarde">{leerData.statistieken.consistentieScore}%</p>
                            <p className="statistiek-context">
                              {totaalSessies > 0 ? `${Math.round((totaalNormaal / totaalSessies) * 100)}% normale sessies` : 'Geen sessies'}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Prestatie Highlights */}
                  <div className="prestatie-highlights">
                    <h3>🏆 Prestatie Highlights</h3>
                    <div className="highlights-grid">
                      {(() => {
                        const leerDataManager = getLeerDataManager();
                        const highlights = leerDataManager.getPrestatieHighlights();
                        
                        return (
                          <>
                            <div className="highlight-card">
                              <h4>🎯 Beste Sessie</h4>
                              <p className="highlight-waarde">{highlights.besteSessie.score.toFixed(1)}/5</p>
                              <p className="highlight-context">
                                {highlights.besteSessie.modus} • {formatDatum(highlights.besteSessie.datum)}
                              </p>
                            </div>
                            <div className="highlight-card">
                              <h4>📈 Vooruitgang</h4>
                              <p className="highlight-waarde">
                                {highlights.vooruitgang.verbetering > 0 ? '+' : ''}{highlights.vooruitgang.verbetering.toFixed(1)} punt
                              </p>
                              <p className="highlight-context">{highlights.vooruitgang.periode}</p>
                            </div>
                            <div className="highlight-card">
                              <h4>🔥 Streak</h4>
                              <p className="highlight-waarde">{highlights.streak.dagen} dag{highlights.streak.dagen !== 1 ? 'en' : ''}</p>
                              <p className="highlight-context">
                                {highlights.streak.dagen > 0 ? 'Actief' : 'Niet actief'}
                              </p>
                            </div>
                            <div className="highlight-card">
                              <h4>⏱️ Snelste Sessie</h4>
                              <p className="highlight-waarde">{formatTijd(highlights.snelsteSessie.tijd)}</p>
                              <p className="highlight-context">
                                {formatDatum(highlights.snelsteSessie.datum)}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Voortgang Sectie */}
                  <div className="voortgang-sectie">
                    <h3>🎯 Voortgang</h3>
                    <div className="voortgang-info">
                      <p><strong>Favoriete categorie:</strong> {leerData.statistieken.favorieteCategorie || 'N/A'}</p>
                      <p><strong>Verbeterpunt:</strong> {leerData.statistieken.zwaksteCategorie || 'N/A'}</p>
                      <p><strong>Laatste activiteit:</strong> {leerData.statistieken.laatsteActiviteit ? formatDatum(leerData.statistieken.laatsteActiviteit) : 'N/A'}</p>
                    </div>
                  </div>

                  {/* Verbeterde Score Trend */}
                  {scoreTrendData && (
                    <div className="chart-sectie">
                      <h3>📈 Score Trend (Laatste 10 Opdrachten)</h3>
                      <div className="chart-container">
                        <Line data={scoreTrendData} options={lineChartConfig} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'categorieen' && (() => {
                const leerDataManager = getLeerDataManager();
                const hoofdcategorieData = Object.values(leerDataManager.getHoofdcategorieStatistieken());
                const vergelijking = leerDataManager.getCategorieVergelijking();
                
                const toggleHoofdCategorie = (categorie: string) => {
                  setOpenAnalyseCategorieen(prev => ({ ...prev, [categorie]: !prev[categorie] }));
                };

                const renderCardContent = (categorie: any) => {
                  const beheersing = leerDataManager.getCategorieBeheersing(categorie.categorie);
                  const verdeling = leerDataManager.getLeitnerBoxVerdelingVoorCategorie(categorie.categorie);
                  const scoreGeschiedenis = leerDataManager.getScoreGeschiedenisVoorCategorie(categorie.categorie);

                  return (
                    <>
                      <div className="beheersing-statistieken">
                        <div className="beheersing-row">
                          <div className="beheersing-item">
                            <span className="beheersing-label">🎯 Beheersing:</span>
                            <span className="beheersing-waarde">{beheersing.beheersingPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="beheersing-item">
                            <span className="beheersing-label">📦 Gem. box:</span>
                            <span className="beheersing-waarde">{beheersing.gemiddeldeBox.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="beheersing-row">
                          <div className="beheersing-item">
                            <span className="beheersing-label">✅ Beheerst:</span>
                            <span className="beheersing-waarde">{beheersing.beheerstOpdrachten}/{beheersing.totaalOpdrachten}</span>
                          </div>
                          <div className="beheersing-item">
                            <span className="beheersing-label">⚡ Vandaag:</span>
                            <span className="beheersing-waarde">{beheersing.vandaagBeschikbaar} beschikbaar</span>
                          </div>
                        </div>
                      </div>
                      <div className="score-trend-info">
                        <div className="trend-item">
                          <span className="trend-label">📈 Score trend:</span>
                          <span className={`trend-waarde ${beheersing.scoreTrend}`}>
                            {beheersing.scoreTrend === 'stijgend' ? '↗️ Stijgend' : 
                             beheersing.scoreTrend === 'dalend' ? '↘️ Dalend' : '➡️ Stabiel'}
                          </span>
                        </div>
                        <div className="trend-item">
                          <span className="trend-label">🎯 Consistentie:</span>
                          <span className="trend-waarde">{beheersing.consistentieScore.toFixed(0)}%</span>
                        </div>
                      </div>
                      <LeitnerVerdelingBar verdeling={verdeling} />
                      <ScoreTrendSparkline data={scoreGeschiedenis} />
                      <div className="categorie-acties">
                        <button
                          className="focus-knop"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onStartFocusSessie) onStartFocusSessie(categorie.categorie);
                          }}
                        >
                          🎯 Focus Oefening
                        </button>
                      </div>
                    </>
                  );
                };

                return (
                  <div className="categorieen-tab">
                    {hoofdcategorieData.length === 0 ? (
                      <p>Nog geen categorieën geprobeerd.</p>
                    ) : (
                      <>
                        <div className="categorie-vergelijking">
                          <h4>🏆 Categorie Ranking</h4>
                          <div className="vergelijking-cards">
                            <div className="vergelijking-card beste">
                              <h5>🥇 Beste Categorie</h5>
                              <p className="categorie-naam">{vergelijking.besteCategorie}</p>
                              <p className="categorie-score">
                                {vergelijking.categorieRanking.length > 0
                                  ? `${vergelijking.categorieRanking[0].beheersingPercentage.toFixed(1)}% beheersing`
                                  : 'Geen data'
                                }
                              </p>
                            </div>
                            <div className="vergelijking-card zwakste">
                              <h5>🎯 Verbeterpunt</h5>
                              <p className="categorie-naam">{vergelijking.zwaksteCategorie}</p>
                              <p className="categorie-score">
                                {vergelijking.categorieRanking.length > 0
                                  ? `${vergelijking.categorieRanking[vergelijking.categorieRanking.length - 1].beheersingPercentage.toFixed(1)}% beheersing`
                                  : 'Geen data'
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="categorieen-lijst">
                          {hoofdcategorieData.map((hoofdCat: any) => {
                            const mastery = leerDataManager.getCategorieMastery(hoofdCat.categorie);
                            const isOpen = openAnalyseCategorieen[hoofdCat.categorie];

                            return (
                              <React.Fragment key={hoofdCat.categorie}>
                                <div className="categorie-card hoofd-categorie" onClick={() => toggleHoofdCategorie(hoofdCat.categorie)}>
                                  <div className="categorie-card-header">
                                    <h4>
                                      <span className={`pijl ${isOpen ? 'open' : ''}`}>▶</span>
                                      {hoofdCat.categorie}
                                    </h4>
                                    <MasteryIndicator level={mastery.level} percentage={mastery.percentage} />
                                  </div>
                                  {renderCardContent(hoofdCat)}
                                </div>
                                
                                {isOpen && hoofdCat.subCategorieen.map((subCat: any) => {
                                  const subMastery = leerDataManager.getCategorieMastery(subCat.categorie);
                                  return (
                                    <div key={subCat.categorie} className="categorie-card sub-categorie">
                                      <div className="categorie-card-header">
                                        <h4>{subCat.categorie}</h4>
                                        <MasteryIndicator level={subMastery.level} percentage={subMastery.percentage} />
                                      </div>
                                      {renderCardContent(subCat)}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}



              {activeTab === 'achievements' && (
                <div className="achievements-tab">
                  <div className="achievement-charts-container">
                    {algemeneAchievementData && (
                      <div className="chart-sectie">
                        <h3>🏆 Algemene Achievements</h3>
                        <div className="chart-container achievement-chart">
                          <Doughnut data={algemeneAchievementData} options={aangepasteDoughnutConfig} />
                        </div>
                      </div>
                    )}
                    
                    {leitnerAchievementData && (
                      <div className="chart-sectie">
                        <h3>📚 Leitner Achievements</h3>
                        <div className="chart-container achievement-chart">
                          <Doughnut data={leitnerAchievementData} options={aangepasteDoughnutConfig} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="achievements-columns">
                    <div className="achievement-column">
                      <h3>🏆 Algemene Prestaties</h3>
                      <div className="achievements-lijst">
                        {/* Groepeer achievements per categorie */}
                        {['onboarding', 'progressie', 'kwaliteit', 'consistentie', 'exploratie', 'speciaal'].map(categorie => {
                          const categorieDefs = achievementDefs.algemeen.filter(def => def.categorie === categorie);
                          if (categorieDefs.length === 0) return null;
                          
                          const categorieTitels = {
                            onboarding: '🎉 Onboarding',
                            progressie: '📈 Voortgang', 
                            kwaliteit: '⭐ Kwaliteit',
                            consistentie: '📅 Consistentie',
                            exploratie: '🎨 Exploratie',
                            speciaal: '🌟 Speciale Prestaties'
                          };
                          
                          return (
                            <div key={categorie} className={`achievement-categorie-groep ${categorie}`}>
                              <div className={`achievement-categorie-header ${categorie}`}>
                                {categorieTitels[categorie as keyof typeof categorieTitels]}
                              </div>
                              {categorieDefs.map(def => {
                                const behaald = achievements.find(a => a.id === def.id);
                                return (
                                  <div key={def.id} className={`achievement-card categorie-${def.categorie} ${behaald ? 'behaald' : 'niet-behaald'}`}>
                                    <div className="achievement-icon">{behaald ? def.icon : '🔒'}</div>
                                    <div className="achievement-info">
                                      <h4>{def.naam}</h4>
                                      <p>{def.beschrijving}</p>
                                      {behaald && <small>Behaald op: {formatDatum(behaald.behaaldOp)}</small>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="achievement-column">
                      <h3>🗓️ Leitner-Mijlpalen</h3>
                      <div className="achievements-lijst">
                        {/* Groepeer Leitner achievements per categorie */}
                        {['herhaling', 'promotie', 'consistentie'].map(categorie => {
                          const categorieDefs = achievementDefs.leitner.filter(def => def.categorie === categorie);
                          if (categorieDefs.length === 0) return null;
                          
                          const categorieTitels = {
                            herhaling: '🔄 Dagelijkse Herhalingen',
                            promotie: '📈 Box Promoties',
                            consistentie: '🔥 Streaks'
                          };
                          
                          return (
                            <div key={categorie} className={`achievement-categorie-groep ${categorie === 'consistentie' ? 'consistentie-leitner' : categorie}`}>
                              <div className={`achievement-categorie-header ${categorie === 'consistentie' ? 'consistentie-leitner' : categorie}`}>
                                {categorieTitels[categorie as keyof typeof categorieTitels]}
                              </div>
                              {categorieDefs.map(def => {
                                const behaald = leitnerData?.achievements.find(a => a.id === def.id);
                                return (
                                  <div key={def.id} className={`achievement-card categorie-${def.categorie === 'consistentie' ? 'consistentie-leitner' : def.categorie} ${behaald ? 'behaald' : 'niet-behaald'}`}>
                                    <div className="achievement-icon">{behaald ? def.icon : '🔒'}</div>
                                    <div className="achievement-info">
                                      <h4>{def.naam} {def.level && `(${def.level})`}</h4>
                                      <p>{def.beschrijving}</p>
                                      {behaald && <small>Behaald op: {formatDatum(behaald.behaaldOp)}</small>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'leitner' && (
                <div className="leitner-tab">
                  <h3>🔄 Leitner Modus</h3>
                  {!leitnerStats ? (
                    <p>Leitner modus niet geactiveerd.</p>
                  ) : (
                    <>
                      <div className="leitner-overzicht">
                        <div className="leitner-statistiek-card">
                          <h4>📊 Systeem Overzicht</h4>
                          <p><strong>Totaal opdrachten:</strong> {leitnerStats.totaalOpdrachten}</p>
                          <p><strong>Vandaag beschikbaar:</strong> {leitnerStats.vandaagBeschikbaar}</p>
                        </div>
                        
                        <div className="leitner-box-overzicht">
                          <div className="leitner-box-header">
                            <h4>📦 Box Verdeling</h4>
                            <button className="info-knop" onClick={() => setShowLeitnerUitleg(!showLeitnerUitleg)}>
                              ℹ️ Hoe het werkt?
                            </button>
                          </div>
                          {showLeitnerUitleg && (
                            <div className="leitner-uitleg">
                              <h4>🧠 Hoe Werkt de Leitner Modus?</h4>
                              <p>
                                Dit systeem helpt je om kennis effectief in je <strong>lange-termijn geheugen</strong> op te slaan. Elke keer als je een opdracht goed hebt, schuift deze een box op en duurt het langer voordat je hem opnieuw moet herhalen. Maak je een foutje? Dan gaat de opdracht terug naar een eerdere box om extra te oefenen.
                              </p>
                              <p>
                                Het ultieme doel is om opdrachten naar de <strong>'Beheerst'</strong> box te krijgen. Dit betekent dat je de kennis solide hebt verankerd. Maar onthoud: zelfs beheerste kennis heeft af en toe een opfrisser nodig!
                              </p>
                            </div>
                          )}
                          <div className="box-grid">
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(boxId => (
                              <div key={boxId} className={`box-card box-${boxId}`}>
                                <h5>{boxId === 7 ? 'Beheerst' : `Box ${boxId}`}</h5>
                                <p className="box-interval">
                                  {boxId === 0 ? '10 minuten' : 
                                   boxId === 1 ? '1 dag' : 
                                   boxId === 2 ? '2 dagen' :
                                   boxId === 3 ? '4 dagen' :
                                   boxId === 4 ? '7 dagen' : 
                                   boxId === 5 ? '14 dagen' :
                                   boxId === 6 ? '1,5 maand' : 'Uitgespeeld'}
                                </p>
                                <p className="box-count">{leitnerStats.opdrachtenPerBox[boxId] || 0} opdrachten</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {leitnerBoxData && (
                          <div className="chart-sectie">
                            <h4>📊 Box Verdeling</h4>
                            <div className="chart-container">
                              <Bar data={leitnerBoxData} options={barChartConfig} />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
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
          <button 
            className="close-button" 
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
      </div>

      {/* Info Modal */}
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