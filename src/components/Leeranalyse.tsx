import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { LeerData, Achievement, LeitnerData, LeitnerAchievement } from '../data/types';
import { getLeerDataManager } from '../data/leerDataManager';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  lineChartConfig, 
  barChartConfig, 
  doughnutChartConfig,
  chartColors
} from '../utils/chartConfigs';
import './Leeranalyse.css';

// Helper functie voor correcte weeknummer berekening (ISO week)
const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

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
  const [activeTab, setActiveTab] = useState<'overzicht' | 'categorieen' | 'achievements' | 'leitner' | 'tijdlijn'>(openToAchievements ? 'achievements' : 'overzicht');
  const [openAnalyseCategorieen, setOpenAnalyseCategorieen] = useState<Record<string, boolean>>({});
  const [showLeitnerUitleg, setShowLeitnerUitleg] = useState(false);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });
  // Grafiek states voor verschillende analyses
  const [activiteitTijdsRange, setActiviteitTijdsRange] = useState<'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar'>('maand');
  const [activiteitGrafiekType, setActiviteitGrafiekType] = useState<'lijn' | 'staaf'>('lijn');
  const [leerpatronenTijdsRange, setLeerpatronenTijdsRange] = useState<'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar'>('maand');
  const [leerpatronenGrafiekType, setLeerpatronenGrafiekType] = useState<'lijn' | 'staaf' | 'gestapeld'>('lijn');
  const [prestatieTijdsRange, setPrestatieTijdsRange] = useState<'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar'>('maand');
  const [prestatieGrafiekType, setPrestatieGrafiekType] = useState<'lijn' | 'staaf'>('lijn');
  const [sessieKwaliteitTijdsRange, setSessieKwaliteitTijdsRange] = useState<'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar'>('maand');
  const [sessieKwaliteitGrafiekType, setSessieKwaliteitGrafiekType] = useState<'lijn' | 'staaf'>('lijn');
  
  // Focus Analyse states
  const [focusTijdsRange, setFocusTijdsRange] = useState<'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar'>('maand');
  const [focusGrafiekType, setFocusGrafiekType] = useState<'lijn' | 'staaf'>('lijn');
  const [focusMetric, setFocusMetric] = useState<'tijd' | 'aantal'>('tijd');
  
  // Categorie Verdeling states
  const [categorieTijdsRange, setCategorieTijdsRange] = useState<'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar'>('maand');
  const [categorieGrafiekType, setCategorieGrafiekType] = useState<'lijn' | 'staaf'>('lijn');
  const [topCategorieTijdsRange, setTopCategorieTijdsRange] = useState<'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar'>('maand');
  const [topCategorieGrafiekType, setTopCategorieGrafiekType] = useState<'lijn' | 'staaf'>('lijn');

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




  // Activiteit data (opdrachten vs speeltijd)
  const activiteitData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    
    // Bepaal data type en periode op basis van geselecteerde tijdsrange
    switch (activiteitTijdsRange) {
      case 'week':
        return leerDataManager.getDagelijkseActiviteitData(7);
      case 'maand':
        return leerDataManager.getDagelijkseActiviteitData(30);
      case 'drieMaanden':
        return leerDataManager.getWeekelijkseData(13); // ~3 maanden in weken
      case 'halfJaar':
        return leerDataManager.getWeekelijkseData(26); // ~6 maanden in weken
      case 'jaar':
        return leerDataManager.getMaandelijkseData(12); // 12 maanden
      default:
        return leerDataManager.getDagelijkseActiviteitData(30);
    }
  }, [leerData, activiteitTijdsRange]);



  // Leerpatronen data (nieuwe opdrachten vs herhalingen)
  const leerpatronenData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    
    // Bepaal data type en periode op basis van geselecteerde tijdsrange
    switch (leerpatronenTijdsRange) {
      case 'week':
        return leerDataManager.getLeitnerTijdlijnData(7);
      case 'maand':
        return leerDataManager.getLeitnerTijdlijnData(30);
      case 'drieMaanden':
        return leerDataManager.getLeitnerWeekelijkseData(13); // ~3 maanden in weken
      case 'halfJaar':
        return leerDataManager.getLeitnerWeekelijkseData(26); // ~6 maanden in weken
      case 'jaar':
        return leerDataManager.getLeitnerMaandelijkseData(12); // 12 maanden
      default:
        return leerDataManager.getLeitnerTijdlijnData(30);
    }
  }, [leerData, leerpatronenTijdsRange]);

  // Focus Analyse data (serieuze vs normale modus)
  const focusData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    
    // Bepaal data type en periode op basis van geselecteerde tijdsrange
    switch (focusTijdsRange) {
      case 'week':
        return leerDataManager.getFocusDagelijkseData(7, focusMetric);
      case 'maand':
        return leerDataManager.getFocusDagelijkseData(30, focusMetric);
      case 'drieMaanden':
        return leerDataManager.getFocusWeekelijkseData(13, focusMetric); // ~3 maanden in weken
      case 'halfJaar':
        return leerDataManager.getFocusWeekelijkseData(26, focusMetric); // ~6 maanden in weken
      case 'jaar':
        return leerDataManager.getFocusMaandelijkseData(12, focusMetric); // 12 maanden
      default:
        return leerDataManager.getFocusDagelijkseData(30, focusMetric);
    }
  }, [leerData, focusTijdsRange, focusMetric]);

  // Categorie Verdeling data (hoofdcategorieën)
  const categorieData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    
    // Bepaal data type en periode op basis van geselecteerde tijdsrange
    switch (categorieTijdsRange) {
      case 'week':
        return leerDataManager.getCategorieDagelijkseData(7);
      case 'maand':
        return leerDataManager.getCategorieDagelijkseData(30);
      case 'drieMaanden':
        return leerDataManager.getCategorieWeekelijkseData(13); // ~3 maanden in weken
      case 'halfJaar':
        return leerDataManager.getCategorieWeekelijkseData(26); // ~6 maanden in weken
      case 'jaar':
        return leerDataManager.getCategorieMaandelijkseData(12); // 12 maanden
      default:
        return leerDataManager.getCategorieDagelijkseData(30);
    }
  }, [leerData, categorieTijdsRange]);

  // Top Categorieën data
  const topCategorieData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    
    // Bepaal data type en periode op basis van geselecteerde tijdsrange
    switch (topCategorieTijdsRange) {
      case 'week':
        return leerDataManager.getTopCategorieDagelijkseData(7);
      case 'maand':
        return leerDataManager.getTopCategorieDagelijkseData(30);
      case 'drieMaanden':
        return leerDataManager.getTopCategorieWeekelijkseData(13); // ~3 maanden in weken
      case 'halfJaar':
        return leerDataManager.getTopCategorieWeekelijkseData(26); // ~6 maanden in weken
      case 'jaar':
        return leerDataManager.getTopCategorieMaandelijkseData(12); // 12 maanden
      default:
        return leerDataManager.getTopCategorieDagelijkseData(30);
    }
  }, [leerData, topCategorieTijdsRange]);

  // Prestatie Analyse data
  const prestatieData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    
    // Bepaal data type en periode op basis van geselecteerde tijdsrange
    switch (prestatieTijdsRange) {
      case 'week':
        return leerDataManager.getPrestatieDagelijkseData(7);
      case 'maand':
        return leerDataManager.getPrestatieDagelijkseData(30);
      case 'drieMaanden':
        return leerDataManager.getPrestatieWeekelijkseData(13); // ~3 maanden in weken
      case 'halfJaar':
        return leerDataManager.getPrestatieWeekelijkseData(26); // ~6 maanden in weken
      case 'jaar':
        return leerDataManager.getPrestatieMaandelijkseData(12); // 12 maanden
      default:
        return leerDataManager.getPrestatieDagelijkseData(30);
    }
  }, [leerData, prestatieTijdsRange]);

  // Sessie Kwaliteit data
  const sessieKwaliteitData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    
    // Bepaal data type en periode op basis van geselecteerde tijdsrange
    switch (sessieKwaliteitTijdsRange) {
      case 'week':
        return leerDataManager.getSessieKwaliteitDagelijkseData(7);
      case 'maand':
        return leerDataManager.getSessieKwaliteitDagelijkseData(30);
      case 'drieMaanden':
        return leerDataManager.getSessieKwaliteitWeekelijkseData(13); // ~3 maanden in weken
      case 'halfJaar':
        return leerDataManager.getSessieKwaliteitWeekelijkseData(26); // ~6 maanden in weken
      case 'jaar':
        return leerDataManager.getSessieKwaliteitMaandelijkseData(12); // 12 maanden
      default:
        return leerDataManager.getSessieKwaliteitDagelijkseData(30);
    }
  }, [leerData, sessieKwaliteitTijdsRange]);

  const sessiePatronenData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    return leerDataManager.getSessiePatronenData();
  }, [leerData]);

  const streakData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    return leerDataManager.getStreakData();
  }, [leerData]);





  // Leitner statistieken
  const leitnerStats = useMemo(() => {
    if (!isOpen) return null;
    
    const leerDataManager = getLeerDataManager();
    return leerDataManager.getLeitnerStatistieken();
  }, [isOpen]);

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
      '#805ad5', // Paars voor box 0
      '#ff6b6b', // Rood voor box 1
      '#feca57', // Oranje voor box 2
      '#48dbfb', // Blauw voor box 3
      '#0abde3', // Donkerblauw voor box 4
      '#54a0ff', // Lichtblauw voor box 5
      '#2c3e50', // Grijs voor box 6
      '#ffd700'  // Goud voor beheerst
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
                              <h4>📚 Vrije Leermodus</h4>
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
                              Vrije Leermodus: {normaalOpdrachten} opdrachten, Leitner: {leitnerOpdrachten} opdrachten
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
                              Vrije Leermodus: {modusStats.normaal.sessies} sessies, Leitner: {modusStats.leitner.sessies} sessies
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
                              Vrije Leermodus: {formatTijd(modusStats.normaal.speeltijd)}, Leitner: {formatTijd(modusStats.leitner.speeltijd)}
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
                                  'Je gemiddelde score over alle opdrachten die je hebt voltooid (schaal van 0-5). Dit is een zelfscore en moet in context geplaatst worden. Het gaat om leren en herhalen. Bij veel nieuwe opdrachten over een onderwerp waar je nog weinig van weet zal de score laag zijn. Maar na een aantal herhalingen in leitner boxen wordt de score steeds hoger.'
                                )}
                              >
                                ℹ️
                              </button>
                            </div>
                            <p className="statistiek-waarde">{leerData.statistieken.gemiddeldeScore.toFixed(1)}/5</p>
                            <p className="statistiek-context">
                              Vrije Leermodus: {modusStats.normaal.gemiddeldeScore.toFixed(1)}, Leitner: {modusStats.leitner.gemiddeldeScore.toFixed(1)}
                            </p>
                          </div>
                          <div className="statistiek-card">
                            <div className="statistiek-card-header">
                              <h3>🆕 Nieuwe Opdrachten Vandaag</h3>
                              <button 
                                className="info-knop" 
                                title="Aantal nieuwe opdrachten vandaag gestart"
                                onClick={() => showInfoModal(
                                  '🆕 Nieuwe Opdrachten Vandaag',
                                  'Het aantal nieuwe opdrachten dat je vandaag hebt gestart in het Leitner-systeem. Dit helpt je om je dagelijkse leerdoelen bij te houden.'
                                )}
                              >
                                ℹ️
                              </button>
                            </div>
                            <p className="statistiek-waarde">{leerDataManager.getNewQuestionsTodayCount()}</p>
                            <p className="statistiek-context">
                              Nieuwe opdrachten toegevoegd aan Box 0 vandaag
                            </p>
                          </div>
                          <div className="statistiek-card">
                            <div className="statistiek-card-header">
                              <h3>📈 Vooruitgang</h3>
                              <button 
                                className="info-knop" 
                                title="Verbetering in score over tijd"
                                onClick={() => showInfoModal(
                                  '📈 Vooruitgang',
                                  'Je verbetering in score over de afgelopen periode. Dit laat zien hoe je prestaties zich ontwikkelen door oefening en herhaling.'
                                )}
                              >
                                ℹ️
                              </button>
                            </div>
                            <p className="statistiek-waarde">
                              {(() => {
                                const highlights = leerDataManager.getPrestatieHighlights();
                                return highlights.vooruitgang.verbetering > 0 ? '+' : '';
                              })()}{(() => {
                                const highlights = leerDataManager.getPrestatieHighlights();
                                return highlights.vooruitgang.verbetering.toFixed(1);
                              })()} punt
                            </p>
                            <p className="statistiek-context">
                              {(() => {
                                const highlights = leerDataManager.getPrestatieHighlights();
                                return highlights.vooruitgang.periode;
                              })()}
                            </p>
                          </div>
                          <div className="statistiek-card">
                            <div className="statistiek-card-header">
                              <h3>🔥 Streak</h3>
                              <button 
                                className="info-knop" 
                                title="Aantal opeenvolgende dagen actief"
                                onClick={() => showInfoModal(
                                  '🔥 Streak',
                                  'Het aantal opeenvolgende dagen dat je actief bent geweest. Streaks motiveren om dagelijks te oefenen en consistent te blijven.'
                                )}
                              >
                                ℹ️
                              </button>
                            </div>
                            <p className="statistiek-waarde">
                              {(() => {
                                const highlights = leerDataManager.getPrestatieHighlights();
                                return highlights.streak.dagen;
                              })()} dag{(() => {
                                const highlights = leerDataManager.getPrestatieHighlights();
                                return highlights.streak.dagen !== 1 ? 'en' : '';
                              })()}
                            </p>
                            <p className="statistiek-context">
                              {(() => {
                                const highlights = leerDataManager.getPrestatieHighlights();
                                return highlights.streak.dagen > 0 ? 'Actief' : 'Niet actief';
                              })()}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>






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

              {activeTab === 'tijdlijn' && (
                <div className="tijdlijn-tab">
                  <h3>📅 Tijdlijn Analyse</h3>
                  
                  {/* Dagelijkse Activiteit */}
                  <div className="tijdlijn-sectie">
                    <div className="dagelijkse-activiteit-header">
                      <h4>📊 Activiteit Overzicht</h4>
                      <div className="tijdsrange-selector">
                        <label>Tijdsperiode:</label>
                        <div className="range-buttons">
                          <button
                            className={`range-btn ${activiteitTijdsRange === 'week' ? 'active' : ''}`}
                            onClick={() => setActiviteitTijdsRange('week')}
                          >
                            Laatste week
                          </button>
                          <button
                            className={`range-btn ${activiteitTijdsRange === 'maand' ? 'active' : ''}`}
                            onClick={() => setActiviteitTijdsRange('maand')}
                          >
                            Laatste maand
                          </button>
                          <button
                            className={`range-btn ${activiteitTijdsRange === 'drieMaanden' ? 'active' : ''}`}
                            onClick={() => setActiviteitTijdsRange('drieMaanden')}
                          >
                            Laatste 3 maanden
                          </button>
                          <button
                            className={`range-btn ${activiteitTijdsRange === 'halfJaar' ? 'active' : ''}`}
                            onClick={() => setActiviteitTijdsRange('halfJaar')}
                          >
                            Laatste half jaar
                          </button>
                          <button
                            className={`range-btn ${activiteitTijdsRange === 'jaar' ? 'active' : ''}`}
                            onClick={() => setActiviteitTijdsRange('jaar')}
                          >
                            Laatste jaar
                          </button>
                        </div>
                      </div>
                      <div className="grafiek-type-selector">
                        <label>Grafiek type:</label>
                        <div className="type-buttons">
                          <button
                            className={`type-btn ${activiteitGrafiekType === 'lijn' ? 'active' : ''}`}
                            onClick={() => setActiviteitGrafiekType('lijn')}
                          >
                            📈 Lijn
                          </button>
                          <button
                            className={`type-btn ${activiteitGrafiekType === 'staaf' ? 'active' : ''}`}
                            onClick={() => setActiviteitGrafiekType('staaf')}
                          >
                            📊 Staaf
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="grafiek-uitleg">
                      Deze grafiek toont je activiteit over de geselecteerde periode. 
                      {activiteitGrafiekType === 'lijn' ? 
                        (activiteitTijdsRange === 'week' || activiteitTijdsRange === 'maand' ? 
                          'De groene lijn geeft het aantal voltooide opdrachten weer, terwijl de oranje lijn je speeltijd in minuten toont.' :
                          activiteitTijdsRange === 'drieMaanden' || activiteitTijdsRange === 'halfJaar' ?
                          'De groene lijn toont wekelijkse opdrachten, terwijl de oranje lijn je wekelijkse speeltijd in minuten toont.' :
                          'De groene lijn toont maandelijkse opdrachten, terwijl de oranje lijn je maandelijkse speeltijd in minuten toont.'
                        ) :
                        (activiteitTijdsRange === 'week' || activiteitTijdsRange === 'maand' ? 
                          'De groene staven geven het aantal voltooide opdrachten weer, terwijl de oranje staven je speeltijd in minuten tonen.' :
                          activiteitTijdsRange === 'drieMaanden' || activiteitTijdsRange === 'halfJaar' ?
                          'De groene staven tonen wekelijkse opdrachten, terwijl de oranje staven je wekelijkse speeltijd in minuten tonen.' :
                          'De groene staven tonen maandelijkse opdrachten, terwijl de oranje staven je maandelijkse speeltijd in minuten tonen.'
                        )
                      }
                    </p>
                                        {activiteitData && activiteitData.length > 0 ? (
                      <div className="chart-container">
                        {activiteitGrafiekType === 'lijn' ? (
                          <Line 
                            data={{
                              labels: activiteitData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Opdrachten',
                                  data: activiteitData.map(d => d.opdrachten),
                                  borderColor: '#4ade80',
                                  backgroundColor: '#4ade8020',
                                  yAxisID: 'y'
                                },
                                {
                                  label: 'Speeltijd (minuten)',
                                  data: activiteitData.map(d => d.speeltijd),
                                  borderColor: '#f59e0b',
                                  backgroundColor: '#f59e0b20',
                                  yAxisID: 'y1'
                                }
                              ]
                            }}
                            options={{
                              ...lineChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: activiteitTijdsRange === 'week' || activiteitTijdsRange === 'maand' ? 'Datum' :
                                          activiteitTijdsRange === 'drieMaanden' || activiteitTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  },
                                  ticks: {
                                    color: '#e0e0e0',
                                    font: {
                                      size: 11
                                    }
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Opdrachten',
                                    color: '#4ade80'
                                  },
                                  min: 0,
                                  grid: {
                                    color: '#4ade8020'
                                  },
                                  ticks: {
                                    color: '#4ade80'
                                  }
                                },
                                y1: {
                                  type: 'linear',
                                  display: true,
                                  position: 'right',
                                  title: {
                                    display: true,
                                    text: 'Speeltijd (minuten)',
                                    color: '#f59e0b'
                                  },
                                  min: 0,
                                  grid: {
                                    drawOnChartArea: false,
                                    color: '#f59e0b20'
                                  },
                                  ticks: {
                                    color: '#f59e0b'
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <Bar 
                            data={{
                              labels: activiteitData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Opdrachten',
                                  data: activiteitData.map(d => d.opdrachten),
                                  backgroundColor: '#4ade80',
                                  borderColor: '#4ade80',
                                  yAxisID: 'y'
                                },
                                {
                                  label: 'Speeltijd (minuten)',
                                  data: activiteitData.map(d => d.speeltijd),
                                  backgroundColor: '#f59e0b',
                                  borderColor: '#f59e0b',
                                  yAxisID: 'y1'
                                }
                              ]
                            }}
                                                          options={{
                                ...barChartConfig,
                                scales: {
                                  x: {
                                    display: true,
                                    title: {
                                      display: true,
                                      text: activiteitTijdsRange === 'week' || activiteitTijdsRange === 'maand' ? 'Datum' :
                                            activiteitTijdsRange === 'drieMaanden' || activiteitTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                    },
                                    ticks: {
                                      color: '#e0e0e0',
                                      font: {
                                        size: 11
                                      }
                                    }
                                  },
                                  y: {
                                    type: 'linear',
                                    display: true,
                                    position: 'left',
                                    title: {
                                      display: true,
                                      text: 'Aantal Opdrachten',
                                      color: '#4ade80'
                                    },
                                    min: 0,
                                    grid: {
                                      color: '#4ade8020'
                                    },
                                    ticks: {
                                      color: '#4ade80'
                                    }
                                  },
                                  y1: {
                                    type: 'linear',
                                    display: true,
                                    position: 'right',
                                    title: {
                                      display: true,
                                      text: 'Speeltijd (minuten)',
                                      color: '#f59e0b'
                                    },
                                    min: 0,
                                    grid: {
                                      drawOnChartArea: false,
                                      color: '#f59e0b20'
                                    },
                                    ticks: {
                                      color: '#f59e0b'
                                    }
                                  }
                                }
                              }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="geen-data-melding">
                        <p>📊 Nog geen dagelijkse activiteitsdata beschikbaar.</p>
                        <p>Start met het spelen van opdrachten om je dagelijkse activiteit te zien!</p>
                      </div>
                    )}
                  </div>

                  {/* Prestatie Analyse */}
                  <div className="tijdlijn-sectie">
                    <div className="dagelijkse-activiteit-header">
                      <h4>🎯 Prestatie Analyse</h4>
                      <div className="tijdsrange-selector">
                        <label>Tijdsperiode:</label>
                        <div className="range-buttons">
                          <button
                            className={`range-btn ${prestatieTijdsRange === 'week' ? 'active' : ''}`}
                            onClick={() => setPrestatieTijdsRange('week')}
                          >
                            Laatste week
                          </button>
                          <button
                            className={`range-btn ${prestatieTijdsRange === 'maand' ? 'active' : ''}`}
                            onClick={() => setPrestatieTijdsRange('maand')}
                          >
                            Laatste maand
                          </button>
                          <button
                            className={`range-btn ${prestatieTijdsRange === 'drieMaanden' ? 'active' : ''}`}
                            onClick={() => setPrestatieTijdsRange('drieMaanden')}
                          >
                            Laatste 3 maanden
                          </button>
                          <button
                            className={`range-btn ${prestatieTijdsRange === 'halfJaar' ? 'active' : ''}`}
                            onClick={() => setPrestatieTijdsRange('halfJaar')}
                          >
                            Laatste half jaar
                          </button>
                          <button
                            className={`range-btn ${prestatieTijdsRange === 'jaar' ? 'active' : ''}`}
                            onClick={() => setPrestatieTijdsRange('jaar')}
                          >
                            Laatste jaar
                          </button>
                        </div>
                      </div>
                      <div className="grafiek-type-selector">
                        <label>Grafiek type:</label>
                        <div className="type-buttons">
                          <button
                            className={`type-btn ${prestatieGrafiekType === 'lijn' ? 'active' : ''}`}
                            onClick={() => setPrestatieGrafiekType('lijn')}
                          >
                            📈 Lijn
                          </button>
                          <button
                            className={`type-btn ${prestatieGrafiekType === 'staaf' ? 'active' : ''}`}
                            onClick={() => setPrestatieGrafiekType('staaf')}
                          >
                            📊 Staaf
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="grafiek-uitleg">
                      Deze grafiek toont je prestatie over tijd. 
                      {prestatieGrafiekType === 'lijn' ? 
                        (prestatieTijdsRange === 'week' || prestatieTijdsRange === 'maand' ? 
                          'De groene lijn geeft je gemiddelde score weer, terwijl de oranje lijn je gemiddelde tijd per opdracht toont.' :
                          prestatieTijdsRange === 'drieMaanden' || prestatieTijdsRange === 'halfJaar' ?
                          'De groene lijn toont wekelijkse gemiddelde scores, terwijl de oranje lijn je wekelijkse gemiddelde tijd per opdracht toont.' :
                          'De groene lijn toont maandelijkse gemiddelde scores, terwijl de oranje lijn je maandelijkse gemiddelde tijd per opdracht toont.'
                        ) :
                        (prestatieTijdsRange === 'week' || prestatieTijdsRange === 'maand' ? 
                          'De groene staven geven je gemiddelde score weer, terwijl de oranje staven je gemiddelde tijd per opdracht tonen.' :
                          prestatieTijdsRange === 'drieMaanden' || prestatieTijdsRange === 'halfJaar' ?
                          'De groene staven tonen wekelijkse gemiddelde scores, terwijl de oranje staven je wekelijkse gemiddelde tijd per opdracht tonen.' :
                          'De groene staven tonen maandelijkse gemiddelde scores, terwijl de oranje staven je maandelijkse gemiddelde tijd per opdracht tonen.'
                        )
                      }
                      Dit helpt je om je leerprestaties te optimaliseren.
                    </p>
                    {prestatieData && prestatieData.length > 0 ? (
                      <div className="chart-container">
                        {prestatieGrafiekType === 'lijn' ? (
                          <Line 
                            data={{
                              labels: prestatieData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Gemiddelde Score',
                                  data: prestatieData.map(d => d.gemiddeldeScore),
                                  borderColor: '#4ade80',
                                  backgroundColor: '#4ade8020',
                                  yAxisID: 'y'
                                },
                                {
                                  label: 'Gemiddelde Tijd (minuten)',
                                  data: prestatieData.map(d => d.gemiddeldeTijd),
                                  borderColor: '#f59e0b',
                                  backgroundColor: '#f59e0b20',
                                  yAxisID: 'y1'
                                }
                              ]
                            }}
                            options={{
                              ...lineChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: prestatieTijdsRange === 'week' || prestatieTijdsRange === 'maand' ? 'Datum' :
                                          prestatieTijdsRange === 'drieMaanden' || prestatieTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  },
                                  ticks: {
                                    color: '#e0e0e0',
                                    font: {
                                      size: 11
                                    }
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Gemiddelde Score',
                                    color: '#4ade80'
                                  },
                                  min: 0,
                                  max: 5,
                                  grid: {
                                    color: '#4ade8020'
                                  },
                                  ticks: {
                                    color: '#4ade80'
                                  }
                                },
                                y1: {
                                  type: 'linear',
                                  display: true,
                                  position: 'right',
                                  title: {
                                    display: true,
                                    text: 'Gemiddelde Tijd (minuten)',
                                    color: '#f59e0b'
                                  },
                                  min: 0,
                                  grid: {
                                    drawOnChartArea: false,
                                    color: '#f59e0b20'
                                  },
                                  ticks: {
                                    color: '#f59e0b'
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <Bar 
                            data={{
                              labels: prestatieData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Gemiddelde Score',
                                  data: prestatieData.map(d => d.gemiddeldeScore),
                                  backgroundColor: '#4ade80',
                                  borderColor: '#4ade80',
                                  yAxisID: 'y'
                                },
                                {
                                  label: 'Gemiddelde Tijd (minuten)',
                                  data: prestatieData.map(d => d.gemiddeldeTijd),
                                  backgroundColor: '#f59e0b',
                                  borderColor: '#f59e0b',
                                  yAxisID: 'y1'
                                }
                              ]
                            }}
                                                          options={{
                                ...barChartConfig,
                                scales: {
                                  x: {
                                    display: true,
                                    title: {
                                      display: true,
                                      text: prestatieTijdsRange === 'week' || prestatieTijdsRange === 'maand' ? 'Datum' :
                                            prestatieTijdsRange === 'drieMaanden' || prestatieTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                    },
                                    ticks: {
                                      color: '#e0e0e0',
                                      font: {
                                        size: 11
                                      }
                                    }
                                  },
                                  y: {
                                    type: 'linear',
                                    display: true,
                                    position: 'left',
                                    title: {
                                      display: true,
                                      text: 'Gemiddelde Score',
                                      color: '#4ade80'
                                    },
                                    min: 0,
                                    max: 5,
                                    grid: {
                                      color: '#4ade8020'
                                    },
                                    ticks: {
                                      color: '#4ade80'
                                    }
                                  },
                                  y1: {
                                    type: 'linear',
                                    display: true,
                                    position: 'right',
                                    title: {
                                      display: true,
                                      text: 'Gemiddelde Tijd (minuten)',
                                      color: '#f59e0b'
                                    },
                                    min: 0,
                                    grid: {
                                      drawOnChartArea: false,
                                      color: '#f59e0b20'
                                    },
                                    ticks: {
                                      color: '#f59e0b'
                                    }
                                  }
                                }
                              }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="geen-data-melding">
                        <p>🎯 Nog geen prestatie data beschikbaar.</p>
                        <p>Voltooi opdrachten om je prestatie te zien!</p>
                      </div>
                    )}
                  </div>

                  {/* Focus Analyse */}
                  <div className="tijdlijn-sectie">
                    <div className="dagelijkse-activiteit-header">
                      <h4>🎯 Focus Analyse</h4>
                      <div className="tijdsrange-selector">
                        <label>Tijdsperiode:</label>
                        <div className="range-buttons">
                          <button
                            className={`range-btn ${focusTijdsRange === 'week' ? 'active' : ''}`}
                            onClick={() => setFocusTijdsRange('week')}
                          >
                            Laatste week
                          </button>
                          <button
                            className={`range-btn ${focusTijdsRange === 'maand' ? 'active' : ''}`}
                            onClick={() => setFocusTijdsRange('maand')}
                          >
                            Laatste maand
                          </button>
                          <button
                            className={`range-btn ${focusTijdsRange === 'drieMaanden' ? 'active' : ''}`}
                            onClick={() => setFocusTijdsRange('drieMaanden')}
                          >
                            Laatste 3 maanden
                          </button>
                          <button
                            className={`range-btn ${focusTijdsRange === 'halfJaar' ? 'active' : ''}`}
                            onClick={() => setFocusTijdsRange('halfJaar')}
                          >
                            Laatste half jaar
                          </button>
                          <button
                            className={`range-btn ${focusTijdsRange === 'jaar' ? 'active' : ''}`}
                            onClick={() => setFocusTijdsRange('jaar')}
                          >
                            Laatste jaar
                          </button>
                        </div>
                      </div>
                      <div className="grafiek-type-selector">
                        <label>Grafiek type:</label>
                        <div className="type-buttons">
                          <button
                            className={`type-btn ${focusGrafiekType === 'lijn' ? 'active' : ''}`}
                            onClick={() => setFocusGrafiekType('lijn')}
                          >
                            📈 Lijn
                          </button>
                          <button
                            className={`type-btn ${focusGrafiekType === 'staaf' ? 'active' : ''}`}
                            onClick={() => setFocusGrafiekType('staaf')}
                          >
                            📊 Staaf
                          </button>
                        </div>
                      </div>
                      <div className="grafiek-type-selector">
                        <label>Metric:</label>
                        <div className="type-buttons">
                          <button
                            className={`type-btn ${focusMetric === 'tijd' ? 'active' : ''}`}
                            onClick={() => setFocusMetric('tijd')}
                          >
                            ⏱️ Tijd
                          </button>
                          <button
                            className={`type-btn ${focusMetric === 'aantal' ? 'active' : ''}`}
                            onClick={() => setFocusMetric('aantal')}
                          >
                            📊 Aantal
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="grafiek-uitleg">
                      Deze grafiek toont je focus over tijd. 
                      {focusMetric === 'tijd' ? 
                        (focusTijdsRange === 'week' || focusTijdsRange === 'maand' ? 
                          'De groene lijn geeft Leitner leermodus tijd weer, terwijl de oranje lijn vrije leermodus tijd toont.' :
                          focusTijdsRange === 'drieMaanden' || focusTijdsRange === 'halfJaar' ?
                          'De groene lijn toont wekelijkse Leitner leermodus tijd, terwijl de oranje lijn wekelijkse vrije leermodus tijd toont.' :
                          'De groene lijn toont maandelijkse Leitner leermodus tijd, terwijl de oranje lijn maandelijkse vrije leermodus tijd toont.'
                        ) :
                        (focusTijdsRange === 'week' || focusTijdsRange === 'maand' ? 
                          'De groene lijn geeft Leitner leermodus opdrachten weer, terwijl de oranje lijn vrije leermodus opdrachten toont.' :
                          focusTijdsRange === 'drieMaanden' || focusTijdsRange === 'halfJaar' ?
                          'De groene lijn toont wekelijkse Leitner leermodus opdrachten, terwijl de oranje lijn wekelijkse vrije leermodus opdrachten toont.' :
                          'De groene lijn toont maandelijkse Leitner leermodus opdrachten, terwijl de oranje lijn maandelijkse vrije leermodus opdrachten toont.'
                        )
                      }
                      Dit helpt je om je studiepatronen te optimaliseren.
                    </p>
                    {focusData && focusData.length > 0 ? (
                      <div className="chart-container">
                        {focusGrafiekType === 'lijn' ? (
                          <Line 
                            data={{
                              labels: focusData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Leitner Leermodus',
                                  data: focusData.map(d => d.serieuzeModus),
                                  borderColor: '#4ade80',
                                  backgroundColor: '#4ade8020',
                                  yAxisID: 'y'
                                },
                                {
                                  label: 'Vrije Leermodus',
                                  data: focusData.map(d => d.normaleModus),
                                  borderColor: '#f59e0b',
                                  backgroundColor: '#f59e0b20',
                                  yAxisID: 'y1'
                                }
                              ]
                            }}
                            options={{
                              ...lineChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: focusTijdsRange === 'week' || focusTijdsRange === 'maand' ? 'Datum' :
                                          focusTijdsRange === 'drieMaanden' || focusTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  },
                                  ticks: {
                                    color: '#e0e0e0',
                                    font: {
                                      size: 11
                                    }
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: focusMetric === 'tijd' ? 'Tijd (minuten)' : 'Aantal Opdrachten',
                                    color: '#4ade80'
                                  },
                                  min: 0,
                                  grid: {
                                    color: '#4ade8020'
                                  },
                                  ticks: {
                                    color: '#4ade80'
                                  }
                                },
                                y1: {
                                  type: 'linear',
                                  display: true,
                                  position: 'right',
                                  title: {
                                    display: true,
                                    text: focusMetric === 'tijd' ? 'Tijd (minuten)' : 'Aantal Opdrachten',
                                    color: '#f59e0b'
                                  },
                                  min: 0,
                                  grid: {
                                    drawOnChartArea: false,
                                    color: '#f59e0b20'
                                  },
                                  ticks: {
                                    color: '#f59e0b'
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <Bar 
                            data={{
                              labels: focusData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Leitner Leermodus',
                                  data: focusData.map(d => d.serieuzeModus),
                                  backgroundColor: '#4ade80',
                                  borderColor: '#4ade80',
                                  yAxisID: 'y'
                                },
                                {
                                  label: 'Vrije Leermodus',
                                  data: focusData.map(d => d.normaleModus),
                                  backgroundColor: '#f59e0b',
                                  borderColor: '#f59e0b',
                                  yAxisID: 'y1'
                                }
                              ]
                            }}
                                                          options={{
                                ...barChartConfig,
                                scales: {
                                  x: {
                                    display: true,
                                    title: {
                                      display: true,
                                      text: focusTijdsRange === 'week' || focusTijdsRange === 'maand' ? 'Datum' :
                                            focusTijdsRange === 'drieMaanden' || focusTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                    },
                                    ticks: {
                                      color: '#e0e0e0',
                                      font: {
                                        size: 11
                                      }
                                    }
                                  },
                                  y: {
                                    type: 'linear',
                                    display: true,
                                    position: 'left',
                                    title: {
                                      display: true,
                                      text: focusMetric === 'tijd' ? 'Tijd (minuten)' : 'Aantal Opdrachten',
                                      color: '#4ade80'
                                    },
                                    min: 0,
                                    grid: {
                                      color: '#4ade8020'
                                    },
                                    ticks: {
                                      color: '#4ade80'
                                    }
                                  },
                                  y1: {
                                    type: 'linear',
                                    display: true,
                                    position: 'right',
                                    title: {
                                      display: true,
                                      text: focusMetric === 'tijd' ? 'Tijd (minuten)' : 'Aantal Opdrachten',
                                      color: '#f59e0b'
                                    },
                                    min: 0,
                                    grid: {
                                      drawOnChartArea: false,
                                      color: '#f59e0b20'
                                    },
                                    ticks: {
                                      color: '#f59e0b'
                                    }
                                  }
                                }
                              }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="geen-data-melding">
                        <p>🎯 Nog geen focus data beschikbaar.</p>
                        <p>Gebruik verschillende modi om je focus patronen te zien!</p>
                      </div>
                    )}
                  </div>

                  {/* Sessie Kwaliteit */}
                  <div className="tijdlijn-sectie">
                    <div className="dagelijkse-activiteit-header">
                      <h4>⏱️ Sessie Kwaliteit</h4>
                      <div className="tijdsrange-selector">
                        <label>Tijdsperiode:</label>
                        <div className="range-buttons">
                          <button
                            className={`range-btn ${sessieKwaliteitTijdsRange === 'week' ? 'active' : ''}`}
                            onClick={() => setSessieKwaliteitTijdsRange('week')}
                          >
                            Laatste week
                          </button>
                          <button
                            className={`range-btn ${sessieKwaliteitTijdsRange === 'maand' ? 'active' : ''}`}
                            onClick={() => setSessieKwaliteitTijdsRange('maand')}
                          >
                            Laatste maand
                          </button>
                          <button
                            className={`range-btn ${sessieKwaliteitTijdsRange === 'drieMaanden' ? 'active' : ''}`}
                            onClick={() => setSessieKwaliteitTijdsRange('drieMaanden')}
                          >
                            Laatste 3 maanden
                          </button>
                          <button
                            className={`range-btn ${sessieKwaliteitTijdsRange === 'halfJaar' ? 'active' : ''}`}
                            onClick={() => setSessieKwaliteitTijdsRange('halfJaar')}
                          >
                            Laatste half jaar
                          </button>
                          <button
                            className={`range-btn ${sessieKwaliteitTijdsRange === 'jaar' ? 'active' : ''}`}
                            onClick={() => setSessieKwaliteitTijdsRange('jaar')}
                          >
                            Laatste jaar
                          </button>
                        </div>
                      </div>
                      <div className="grafiek-type-selector">
                        <label>Grafiek type:</label>
                        <div className="type-buttons">
                          <button
                            className={`type-btn ${sessieKwaliteitGrafiekType === 'lijn' ? 'active' : ''}`}
                            onClick={() => setSessieKwaliteitGrafiekType('lijn')}
                          >
                            📈 Lijn
                          </button>
                          <button
                            className={`type-btn ${sessieKwaliteitGrafiekType === 'staaf' ? 'active' : ''}`}
                            onClick={() => setSessieKwaliteitGrafiekType('staaf')}
                          >
                            📊 Staaf
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="grafiek-uitleg">
                      Deze grafiek toont je sessie kwaliteit over tijd. 
                      {sessieKwaliteitGrafiekType === 'lijn' ? 
                        (sessieKwaliteitTijdsRange === 'week' || sessieKwaliteitTijdsRange === 'maand' ? 
                          'De groene lijn geeft het aantal sessies weer, terwijl de oranje lijn je gemiddelde sessie duur toont.' :
                          sessieKwaliteitTijdsRange === 'drieMaanden' || sessieKwaliteitTijdsRange === 'halfJaar' ?
                          'De groene lijn toont wekelijkse sessies, terwijl de oranje lijn je wekelijkse gemiddelde sessie duur toont.' :
                          'De groene lijn toont maandelijkse sessies, terwijl de oranje lijn je maandelijkse gemiddelde sessie duur toont.'
                        ) :
                        (sessieKwaliteitTijdsRange === 'week' || sessieKwaliteitTijdsRange === 'maand' ? 
                          'De groene staven geven het aantal sessies weer, terwijl de oranje staven je gemiddelde sessie duur tonen.' :
                          sessieKwaliteitTijdsRange === 'drieMaanden' || sessieKwaliteitTijdsRange === 'halfJaar' ?
                          'De groene staven tonen wekelijkse sessies, terwijl de oranje staven je wekelijkse gemiddelde sessie duur tonen.' :
                          'De groene staven tonen maandelijkse sessies, terwijl de oranje staven je maandelijkse gemiddelde sessie duur tonen.'
                        )
                      }
                      Dit helpt je om je studiepatronen te optimaliseren.
                    </p>
                    {sessieKwaliteitData && sessieKwaliteitData.length > 0 ? (
                      <div className="chart-container">
                        {sessieKwaliteitGrafiekType === 'lijn' ? (
                          <Line 
                            data={{
                              labels: sessieKwaliteitData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Aantal Sessies',
                                  data: sessieKwaliteitData.map(d => d.aantalSessies),
                                  borderColor: '#4ade80',
                                  backgroundColor: '#4ade8020',
                                  yAxisID: 'y'
                                },
                                {
                                  label: 'Gemiddelde Duur (minuten)',
                                  data: sessieKwaliteitData.map(d => d.gemiddeldeDuur),
                                  borderColor: '#f59e0b',
                                  backgroundColor: '#f59e0b20',
                                  yAxisID: 'y1'
                                }
                              ]
                            }}
                            options={{
                              ...lineChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: sessieKwaliteitTijdsRange === 'week' || sessieKwaliteitTijdsRange === 'maand' ? 'Datum' :
                                          sessieKwaliteitTijdsRange === 'drieMaanden' || sessieKwaliteitTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  },
                                  ticks: {
                                    color: '#e0e0e0',
                                    font: {
                                      size: 11
                                    }
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Sessies',
                                    color: '#4ade80'
                                  },
                                  min: 0,
                                  grid: {
                                    color: '#4ade8020'
                                  },
                                  ticks: {
                                    color: '#4ade80'
                                  }
                                },
                                y1: {
                                  type: 'linear',
                                  display: true,
                                  position: 'right',
                                  title: {
                                    display: true,
                                    text: 'Gemiddelde Duur (minuten)',
                                    color: '#f59e0b'
                                  },
                                  min: 0,
                                  grid: {
                                    drawOnChartArea: false,
                                    color: '#f59e0b20'
                                  },
                                  ticks: {
                                    color: '#f59e0b'
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <Bar 
                            data={{
                              labels: sessieKwaliteitData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Aantal Sessies',
                                  data: sessieKwaliteitData.map(d => d.aantalSessies),
                                  backgroundColor: '#4ade80',
                                  borderColor: '#4ade80',
                                  yAxisID: 'y'
                                },
                                {
                                  label: 'Gemiddelde Duur (minuten)',
                                  data: sessieKwaliteitData.map(d => d.gemiddeldeDuur),
                                  backgroundColor: '#f59e0b',
                                  borderColor: '#f59e0b',
                                  yAxisID: 'y1'
                                }
                              ]
                            }}
                                                          options={{
                                ...barChartConfig,
                                scales: {
                                  x: {
                                    display: true,
                                    title: {
                                      display: true,
                                      text: sessieKwaliteitTijdsRange === 'week' || sessieKwaliteitTijdsRange === 'maand' ? 'Datum' :
                                            sessieKwaliteitTijdsRange === 'drieMaanden' || sessieKwaliteitTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                    },
                                    ticks: {
                                      color: '#e0e0e0',
                                      font: {
                                        size: 11
                                      }
                                    }
                                  },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Sessies',
                                    color: '#4ade80'
                                  },
                                  min: 0,
                                  grid: {
                                    color: '#4ade8020'
                                  },
                                  ticks: {
                                    color: '#4ade80'
                                  }
                                },
                                y1: {
                                  type: 'linear',
                                  display: true,
                                  position: 'right',
                                  title: {
                                    display: true,
                                    text: 'Gemiddelde Duur (minuten)',
                                    color: '#f59e0b'
                                  },
                                  min: 0,
                                  grid: {
                                    drawOnChartArea: false,
                                    color: '#f59e0b20'
                                  },
                                  ticks: {
                                    color: '#f59e0b'
                                  }
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="geen-data-melding">
                        <p>⏱️ Nog geen sessie kwaliteit data beschikbaar.</p>
                        <p>Start sessies om je sessie kwaliteit te zien!</p>
                      </div>
                    )}
                  </div>

                  {/* Categorie Verdeling - Hoofdcategorieën */}
                  <div className="tijdlijn-sectie">
                    <div className="dagelijkse-activiteit-header">
                      <h4>📚 Categorie Verdeling</h4>
                      <div className="tijdsrange-selector">
                        <label>Tijdsperiode:</label>
                        <div className="range-buttons">
                          <button
                            className={`range-btn ${categorieTijdsRange === 'week' ? 'active' : ''}`}
                            onClick={() => setCategorieTijdsRange('week')}
                          >
                            Laatste week
                          </button>
                          <button
                            className={`range-btn ${categorieTijdsRange === 'maand' ? 'active' : ''}`}
                            onClick={() => setCategorieTijdsRange('maand')}
                          >
                            Laatste maand
                          </button>
                          <button
                            className={`range-btn ${categorieTijdsRange === 'drieMaanden' ? 'active' : ''}`}
                            onClick={() => setCategorieTijdsRange('drieMaanden')}
                          >
                            Laatste 3 maanden
                          </button>
                          <button
                            className={`range-btn ${categorieTijdsRange === 'halfJaar' ? 'active' : ''}`}
                            onClick={() => setCategorieTijdsRange('halfJaar')}
                          >
                            Laatste half jaar
                          </button>
                          <button
                            className={`range-btn ${categorieTijdsRange === 'jaar' ? 'active' : ''}`}
                            onClick={() => setCategorieTijdsRange('jaar')}
                          >
                            Laatste jaar
                          </button>
                        </div>
                      </div>
                      <div className="grafiek-type-selector">
                        <label>Grafiek type:</label>
                        <div className="type-buttons">
                          <button
                            className={`type-btn ${categorieGrafiekType === 'lijn' ? 'active' : ''}`}
                            onClick={() => setCategorieGrafiekType('lijn')}
                          >
                            📈 Lijn
                          </button>
                          <button
                            className={`type-btn ${categorieGrafiekType === 'staaf' ? 'active' : ''}`}
                            onClick={() => setCategorieGrafiekType('staaf')}
                          >
                            📊 Staaf
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="grafiek-uitleg">
                      Deze grafiek toont de verdeling van opdrachten over hoofdcategorieën. 
                      {categorieGrafiekType === 'lijn' ? 
                        (categorieTijdsRange === 'week' || categorieTijdsRange === 'maand' ? 
                          'Elke lijn toont een hoofdcategorie met het aantal opdrachten over tijd.' :
                          categorieTijdsRange === 'drieMaanden' || categorieTijdsRange === 'halfJaar' ?
                          'Elke lijn toont een hoofdcategorie met wekelijkse opdrachten.' :
                          'Elke lijn toont een hoofdcategorie met maandelijkse opdrachten.'
                        ) :
                        (categorieTijdsRange === 'week' || categorieTijdsRange === 'maand' ? 
                          'Elke staaf toont een hoofdcategorie met het aantal opdrachten.' :
                          categorieTijdsRange === 'drieMaanden' || categorieTijdsRange === 'halfJaar' ?
                          'Elke staaf toont een hoofdcategorie met wekelijkse opdrachten.' :
                          'Elke staaf toont een hoofdcategorie met maandelijkse opdrachten.'
                        )
                      }
                      Dit helpt je om je studiebalans te optimaliseren.
                    </p>
                    {categorieData && categorieData.length > 0 && Object.keys(categorieData[0]).filter(key => key !== 'datum' && key !== 'week' && key !== 'maand').length > 0 ? (
                      <div className="chart-container">
                        {categorieGrafiekType === 'lijn' ? (
                          <Line 
                            data={{
                              labels: categorieData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: Object.keys(categorieData[0] || {}).filter(key => key !== 'datum' && key !== 'week' && key !== 'maand').map((categorie, index) => ({
                                label: categorie,
                                data: categorieData.map(d => d[categorie] as number || 0),
                                borderColor: `hsl(${index * 60}, 70%, 50%)`,
                                backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.2)`,
                                tension: 0.4
                              }))
                            }}
                            options={{
                              ...lineChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: categorieTijdsRange === 'week' || categorieTijdsRange === 'maand' ? 'Datum' :
                                          categorieTijdsRange === 'drieMaanden' || categorieTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Opdrachten'
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <Bar 
                            data={{
                              labels: categorieData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: Object.keys(categorieData[0] || {}).filter(key => key !== 'datum' && key !== 'week' && key !== 'maand').map((categorie, index) => ({
                                label: categorie,
                                data: categorieData.map(d => d[categorie] as number || 0),
                                backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                                borderColor: `hsl(${index * 60}, 70%, 50%)`
                              }))
                            }}
                            options={{
                              ...barChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: categorieTijdsRange === 'week' || categorieTijdsRange === 'maand' ? 'Datum' :
                                          categorieTijdsRange === 'drieMaanden' || categorieTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Opdrachten'
                                  }
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="geen-data-melding">
                        <p>📚 Nog geen categorie data beschikbaar.</p>
                        <p>Voltooi opdrachten in verschillende categorieën om de verdeling te zien!</p>
                        <p><small>Debug: {categorieData ? `${categorieData.length} datapunten, categorieën: ${Object.keys(categorieData[0] || {}).filter(key => key !== 'datum' && key !== 'week' && key !== 'maand').join(', ')}` : 'Geen data'}</small></p>
                      </div>
                    )}
                  </div>

                  {/* Top 5 Categorieën */}
                  <div className="tijdlijn-sectie">
                    <div className="dagelijkse-activiteit-header">
                      <h4>🏆 Top 5 Categorieën</h4>
                      <div className="tijdsrange-selector">
                        <label>Tijdsperiode:</label>
                        <div className="range-buttons">
                          <button
                            className={`range-btn ${topCategorieTijdsRange === 'week' ? 'active' : ''}`}
                            onClick={() => setTopCategorieTijdsRange('week')}
                          >
                            Laatste week
                          </button>
                          <button
                            className={`range-btn ${topCategorieTijdsRange === 'maand' ? 'active' : ''}`}
                            onClick={() => setTopCategorieTijdsRange('maand')}
                          >
                            Laatste maand
                          </button>
                          <button
                            className={`range-btn ${topCategorieTijdsRange === 'drieMaanden' ? 'active' : ''}`}
                            onClick={() => setTopCategorieTijdsRange('drieMaanden')}
                          >
                            Laatste 3 maanden
                          </button>
                          <button
                            className={`range-btn ${topCategorieTijdsRange === 'halfJaar' ? 'active' : ''}`}
                            onClick={() => setTopCategorieTijdsRange('halfJaar')}
                          >
                            Laatste half jaar
                          </button>
                          <button
                            className={`range-btn ${topCategorieTijdsRange === 'jaar' ? 'active' : ''}`}
                            onClick={() => setTopCategorieTijdsRange('jaar')}
                          >
                            Laatste jaar
                          </button>
                        </div>
                      </div>
                      <div className="grafiek-type-selector">
                        <label>Grafiek type:</label>
                        <div className="type-buttons">
                          <button
                            className={`type-btn ${topCategorieGrafiekType === 'lijn' ? 'active' : ''}`}
                            onClick={() => setTopCategorieGrafiekType('lijn')}
                          >
                            📈 Lijn
                          </button>
                          <button
                            className={`type-btn ${topCategorieGrafiekType === 'staaf' ? 'active' : ''}`}
                            onClick={() => setTopCategorieGrafiekType('staaf')}
                          >
                            📊 Staaf
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="grafiek-uitleg">
                      Deze grafiek toont je top 5 meest actieve categorieën. 
                      {topCategorieGrafiekType === 'lijn' ? 
                        (topCategorieTijdsRange === 'week' || topCategorieTijdsRange === 'maand' ? 
                          'Elke lijn toont een top categorie met het aantal opdrachten over tijd.' :
                          topCategorieTijdsRange === 'drieMaanden' || topCategorieTijdsRange === 'halfJaar' ?
                          'Elke lijn toont een top categorie met wekelijkse opdrachten.' :
                          'Elke lijn toont een top categorie met maandelijkse opdrachten.'
                        ) :
                        (topCategorieTijdsRange === 'week' || topCategorieTijdsRange === 'maand' ? 
                          'Elke staaf toont een top categorie met het aantal opdrachten.' :
                          topCategorieTijdsRange === 'drieMaanden' || topCategorieTijdsRange === 'halfJaar' ?
                          'Elke staaf toont een top categorie met wekelijkse opdrachten.' :
                          'Elke staaf toont een top categorie met maandelijkse opdrachten.'
                        )
                      }
                      Dit helpt je om je focusgebieden te identificeren.
                    </p>
                    {topCategorieData && topCategorieData.length > 0 ? (
                      <div className="chart-container">
                        {topCategorieGrafiekType === 'lijn' ? (
                          <Line 
                            data={{
                              labels: topCategorieData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: Object.keys(topCategorieData[0] || {}).filter(key => key !== 'datum' && key !== 'week' && key !== 'maand').map((categorie, index) => ({
                                label: categorie,
                                data: topCategorieData.map(d => d[categorie] as number || 0),
                                borderColor: `hsl(${index * 60}, 70%, 50%)`,
                                backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.2)`,
                                tension: 0.4
                              }))
                            }}
                            options={{
                              ...lineChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: topCategorieTijdsRange === 'week' || topCategorieTijdsRange === 'maand' ? 'Datum' :
                                          topCategorieTijdsRange === 'drieMaanden' || topCategorieTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Opdrachten'
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <Bar 
                            data={{
                              labels: topCategorieData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: Object.keys(topCategorieData[0] || {}).filter(key => key !== 'datum' && key !== 'week' && key !== 'maand').map((categorie, index) => ({
                                label: categorie,
                                data: topCategorieData.map(d => d[categorie] as number || 0),
                                backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                                borderColor: `hsl(${index * 60}, 70%, 50%)`
                              }))
                            }}
                            options={{
                              ...barChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: topCategorieTijdsRange === 'week' || topCategorieTijdsRange === 'maand' ? 'Datum' :
                                          topCategorieTijdsRange === 'drieMaanden' || topCategorieTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Opdrachten'
                                  }
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="geen-data-melding">
                        <p>🏆 Nog geen top categorie data beschikbaar.</p>
                        <p>Voltooi opdrachten om je top categorieën te zien!</p>
                      </div>
                    )}
                  </div>

                  {/* Leerpatronen */}
                  <div className="tijdlijn-sectie">
                    <div className="dagelijkse-activiteit-header">
                      <h4>🔄 Leerpatronen</h4>
                      <div className="tijdsrange-selector">
                        <label>Tijdsperiode:</label>
                        <div className="range-buttons">
                          <button
                            className={`range-btn ${leerpatronenTijdsRange === 'week' ? 'active' : ''}`}
                            onClick={() => setLeerpatronenTijdsRange('week')}
                          >
                            Laatste week
                          </button>
                          <button
                            className={`range-btn ${leerpatronenTijdsRange === 'maand' ? 'active' : ''}`}
                            onClick={() => setLeerpatronenTijdsRange('maand')}
                          >
                            Laatste maand
                          </button>
                          <button
                            className={`range-btn ${leerpatronenTijdsRange === 'drieMaanden' ? 'active' : ''}`}
                            onClick={() => setLeerpatronenTijdsRange('drieMaanden')}
                          >
                            Laatste 3 maanden
                          </button>
                          <button
                            className={`range-btn ${leerpatronenTijdsRange === 'halfJaar' ? 'active' : ''}`}
                            onClick={() => setLeerpatronenTijdsRange('halfJaar')}
                          >
                            Laatste half jaar
                          </button>
                          <button
                            className={`range-btn ${leerpatronenTijdsRange === 'jaar' ? 'active' : ''}`}
                            onClick={() => setLeerpatronenTijdsRange('jaar')}
                          >
                            Laatste jaar
                          </button>
                        </div>
                      </div>
                      <div className="grafiek-type-selector">
                        <label>Grafiek type:</label>
                        <div className="type-buttons">
                          <button
                            className={`type-btn ${leerpatronenGrafiekType === 'lijn' ? 'active' : ''}`}
                            onClick={() => setLeerpatronenGrafiekType('lijn')}
                          >
                            📈 Lijn
                          </button>
                          <button
                            className={`type-btn ${leerpatronenGrafiekType === 'staaf' ? 'active' : ''}`}
                            onClick={() => setLeerpatronenGrafiekType('staaf')}
                          >
                            📊 Staaf
                          </button>
                          <button
                            className={`type-btn ${leerpatronenGrafiekType === 'gestapeld' ? 'active' : ''}`}
                            onClick={() => setLeerpatronenGrafiekType('gestapeld')}
                          >
                            📦 Gestapeld
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="grafiek-uitleg">
                      Deze grafiek toont je leerpatronen over tijd. 
                      {leerpatronenGrafiekType === 'lijn' ? 
                        (leerpatronenTijdsRange === 'week' || leerpatronenTijdsRange === 'maand' ? 
                          'De groene lijn geeft nieuwe opdrachten weer, terwijl de oranje lijn herhalingen toont.' :
                          leerpatronenTijdsRange === 'drieMaanden' || leerpatronenTijdsRange === 'halfJaar' ?
                          'De groene lijn toont wekelijkse nieuwe opdrachten, terwijl de oranje lijn wekelijkse herhalingen toont.' :
                          'De groene lijn toont maandelijkse nieuwe opdrachten, terwijl de oranje lijn maandelijkse herhalingen toont.'
                        ) :
                        leerpatronenGrafiekType === 'staaf' ?
                        (leerpatronenTijdsRange === 'week' || leerpatronenTijdsRange === 'maand' ? 
                          'De groene staven geven nieuwe opdrachten weer, terwijl de oranje staven herhalingen tonen.' :
                          leerpatronenTijdsRange === 'drieMaanden' || leerpatronenTijdsRange === 'halfJaar' ?
                          'De groene staven tonen wekelijkse nieuwe opdrachten, terwijl de oranje staven wekelijkse herhalingen tonen.' :
                          'De groene staven tonen maandelijkse nieuwe opdrachten, terwijl de oranje staven maandelijkse herhalingen tonen.'
                        ) :
                        (leerpatronenTijdsRange === 'week' || leerpatronenTijdsRange === 'maand' ? 
                          'De gestapelde staven tonen nieuwe opdrachten (groen) en herhalingen (oranje) gecombineerd.' :
                          leerpatronenTijdsRange === 'drieMaanden' || leerpatronenTijdsRange === 'halfJaar' ?
                          'De gestapelde staven tonen wekelijkse nieuwe opdrachten (groen) en herhalingen (oranje) gecombineerd.' :
                          'De gestapelde staven tonen maandelijkse nieuwe opdrachten (groen) en herhalingen (oranje) gecombineerd.'
                        )
                      }
                      Dit helpt je om je herhalingspatronen te optimaliseren.
                    </p>
                    {leerpatronenData && leerpatronenData.length > 0 ? (
                      <div className="chart-container">
                        {leerpatronenGrafiekType === 'lijn' ? (
                          <Line 
                            data={{
                              labels: leerpatronenData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Nieuwe Opdrachten',
                                  data: leerpatronenData.map(d => d.nieuweOpdrachten),
                                  borderColor: '#4ade80',
                                  backgroundColor: '#4ade8020',
                                  tension: 0.4
                                },
                                {
                                  label: 'Herhalingen',
                                  data: leerpatronenData.map(d => d.herhalingen),
                                  borderColor: '#f59e0b',
                                  backgroundColor: '#f59e0b20',
                                  tension: 0.4
                                }
                              ]
                            }}
                            options={{
                              ...lineChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: leerpatronenTijdsRange === 'week' || leerpatronenTijdsRange === 'maand' ? 'Datum' :
                                          leerpatronenTijdsRange === 'drieMaanden' || leerpatronenTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  },
                                  ticks: {
                                    color: '#e0e0e0',
                                    font: {
                                      size: 11
                                    }
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Opdrachten'
                                  },
                                  min: 0
                                }
                              }
                            }}
                          />
                        ) : leerpatronenGrafiekType === 'staaf' ? (
                          <Bar 
                            data={{
                              labels: leerpatronenData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Nieuwe Opdrachten',
                                  data: leerpatronenData.map(d => d.nieuweOpdrachten),
                                  backgroundColor: '#4ade80',
                                  borderColor: '#4ade80'
                                },
                                {
                                  label: 'Herhalingen',
                                  data: leerpatronenData.map(d => d.herhalingen),
                                  backgroundColor: '#f59e0b',
                                  borderColor: '#f59e0b'
                                }
                              ]
                            }}
                            options={{
                              ...barChartConfig,
                              scales: {
                                x: {
                                  display: true,
                                  title: {
                                    display: true,
                                    text: leerpatronenTijdsRange === 'week' || leerpatronenTijdsRange === 'maand' ? 'Datum' :
                                          leerpatronenTijdsRange === 'drieMaanden' || leerpatronenTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                  },
                                  ticks: {
                                    color: '#e0e0e0',
                                    font: {
                                      size: 11
                                    }
                                  }
                                },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Opdrachten'
                                  },
                                  min: 0
                                }
                              }
                            }}
                          />
                        ) : (
                          <Bar 
                            data={{
                              labels: leerpatronenData.map(d => {
                                // Bepaal label op basis van data type
                                if ('datum' in d) {
                                  // Dagelijkse data
                                  return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                } else if ('week' in d) {
                                  // Weekelijkse data
                                  const date = new Date(d.week);
                                  const weekNumber = getWeekNumber(date);
                                  return `Week ${weekNumber} (${date.getFullYear()})`;
                                } else if ('maand' in d) {
                                  // Maandelijkse data
                                  const [year, month] = d.maand.split('-');
                                  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
                                }
                                return '';
                              }),
                              datasets: [
                                {
                                  label: 'Nieuwe Opdrachten',
                                  data: leerpatronenData.map(d => d.nieuweOpdrachten),
                                  backgroundColor: '#4ade80',
                                  borderColor: '#4ade80',
                                  stack: 'stack0'
                                },
                                {
                                  label: 'Herhalingen',
                                  data: leerpatronenData.map(d => d.herhalingen),
                                  backgroundColor: '#f59e0b',
                                  borderColor: '#f59e0b',
                                  stack: 'stack0'
                                }
                              ]
                            }}
                                                          options={{
                                ...barChartConfig,
                                scales: {
                                  x: {
                                    display: true,
                                    title: {
                                      display: true,
                                      text: leerpatronenTijdsRange === 'week' || leerpatronenTijdsRange === 'maand' ? 'Datum' :
                                            leerpatronenTijdsRange === 'drieMaanden' || leerpatronenTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
                                    },
                                    stacked: true,
                                    ticks: {
                                      color: '#e0e0e0',
                                      font: {
                                        size: 11
                                      }
                                    }
                                  },
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: {
                                    display: true,
                                    text: 'Aantal Opdrachten'
                                  },
                                  min: 0,
                                  stacked: true
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="geen-data-melding">
                        <p>🔄 Nog geen leerpatronen data beschikbaar.</p>
                        <p>Gebruik het Leitner systeem om je herhalingspatronen te zien!</p>
                      </div>
                    )}
                  </div>

                  {/* Sessie Patronen */}
                  <div className="tijdlijn-sectie">
                    <h4>⏰ Sessie Patronen</h4>
                    <p className="grafiek-uitleg">
                      Deze grafiek toont op welke tijdstippen je het meest actief bent. 
                      De paarse staven geven het aantal sessies weer, terwijl de oranje staven 
                      de totale tijd besteed aan opdrachten in minuten tonen. 
                      Dit helpt je om je optimale leertijden te identificeren en je planning te optimaliseren.
                    </p>
                    {sessiePatronenData && sessiePatronenData.length > 0 ? (
                      <div className="chart-container">
                        <Bar 
                          data={{
                            labels: sessiePatronenData.map(p => `${p.uur}:00`),
                            datasets: [
                              {
                                label: 'Aantal Sessies',
                                data: sessiePatronenData.map(p => p.sessies),
                                backgroundColor: '#8b5cf6',
                                borderColor: '#8b5cf6',
                                yAxisID: 'y'
                              },
                              {
                                label: 'Totale Tijd (minuten)',
                                data: sessiePatronenData.map(p => p.totaleTijd),
                                backgroundColor: '#f59e0b',
                                borderColor: '#f59e0b',
                                yAxisID: 'y1'
                              }
                            ]
                          }}
                          options={{
                            ...barChartConfig,
                            scales: {
                              x: {
                                display: true,
                                title: {
                                  display: true,
                                  text: 'Tijdstip'
                                },
                                ticks: {
                                  display: true,
                                  color: '#e0e0e0',
                                  font: {
                                    size: 10
                                  },
                                  maxRotation: 45,
                                  minRotation: 0
                                }
                              },
                              y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                  display: true,
                                  text: 'Aantal Sessies'
                                },
                                grid: {
                                  color: 'rgba(255, 255, 255, 0.1)'
                                }
                              },
                              y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                  display: true,
                                  text: 'Totale Tijd (minuten)'
                                },
                                grid: {
                                  drawOnChartArea: false,
                                },
                              }
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="geen-data-melding">
                        <p>⏰ Nog geen sessie patronen beschikbaar.</p>
                        <p>Speel op verschillende tijdstippen om je leertijden te zien!</p>
                      </div>
                    )}
                  </div>

                  {/* Streak en Consistentie */}
                  <div className="tijdlijn-sectie">
                    <h4>🔥 Streak & Consistentie</h4>
                    <p className="grafiek-uitleg">
                      Hier zie je je leerconsistentie. Streaks motiveren om dagelijks te oefenen 
                      en helpen bij het opbouwen van duurzame leergewoontes.
                    </p>
                    {streakData ? (
                      <div className="streak-info">
                        <div className="streak-card">
                          <h5>Huidige Streak</h5>
                          <p className="streak-waarde">{streakData.huidigeStreak} dagen</p>
                        </div>
                        <div className="streak-card">
                          <h5>Langste Streak</h5>
                          <p className="streak-waarde">{streakData.langsteStreak} dagen</p>
                        </div>
                        <div className="streak-card">
                          <h5>Actieve Dagen</h5>
                          <p className="streak-waarde">{streakData.actieveDagen.length} totaal</p>
                        </div>
                      </div>
                    ) : (
                      <div className="geen-data-melding">
                        <p>🔥 Nog geen streak data beschikbaar.</p>
                        <p>Speel dagelijks om je consistentie te tracken!</p>
                      </div>
                    )}
                  </div>
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