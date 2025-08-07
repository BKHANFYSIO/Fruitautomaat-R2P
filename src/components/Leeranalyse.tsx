import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { LeerData, Achievement, LeitnerData, LeitnerAchievement } from '../data/types';
import { getLeerDataManager } from '../data/leerDataManager';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import StatBar from './StatBar';
import { 
  lineChartConfig, 
  barChartConfig, 
  doughnutChartConfig,
  chartColors
} from '../utils/chartConfigs';
import OverzichtTab from './leeranalyse/OverzichtTab';
import CategorieenTab from './leeranalyse/CategorieenTab';
import TijdlijnTab from './leeranalyse/TijdlijnTab';
import AchievementsTab from './leeranalyse/AchievementsTab';
import LeitnerTab from './leeranalyse/LeitnerTab';
import { 
  ScoreTrendSparkline, 
  LeitnerVerdelingBar, 
  MasteryIndicator, 
  RankingCard 
} from './leeranalyse/LeeranalyseComponents';
import { getWeekNumber } from './leeranalyse/LeeranalyseUtils';
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
  

  const [topCategorieTijdsRange, setTopCategorieTijdsRange] = useState<'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar'>('maand');
  const [topCategorieGrafiekType, setTopCategorieGrafiekType] = useState<'lijn' | 'staaf'>('lijn');
  
  // Leitner Box Herhalingen states
  const [leitnerBoxHerhalingenTijdsRange, setLeitnerBoxHerhalingenTijdsRange] = useState<'week' | 'maand' | 'drieMaanden' | 'halfJaar' | 'jaar'>('maand');
  const [leitnerBoxHerhalingenGrafiekType, setLeitnerBoxHerhalingenGrafiekType] = useState<'lijn' | 'staaf'>('lijn');

  const leerDataManager = useMemo(() => getLeerDataManager(), [isOpen]);

  const { hoofdcategorieRanking, subcategorieRanking } = useMemo(() => {
    if (!isOpen) return { hoofdcategorieRanking: null, subcategorieRanking: null };
    return {
      hoofdcategorieRanking: leerDataManager.getCategorieRanking('hoofd'),
      subcategorieRanking: leerDataManager.getCategorieRanking('sub')
    };
  }, [isOpen, leerDataManager]);




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

  // Leitner Box Herhalingen data
  const leitnerBoxHerhalingenData = useMemo(() => {
    if (!leerData) return null;
    const leerDataManager = getLeerDataManager();
    
    // Bepaal data type en periode op basis van geselecteerde tijdsrange
    switch (leitnerBoxHerhalingenTijdsRange) {
      case 'week':
        return leerDataManager.getLeitnerBoxHerhalingenTijdlijnData(7);
      case 'maand':
        return leerDataManager.getLeitnerBoxHerhalingenTijdlijnData(30);
      case 'drieMaanden':
        return leerDataManager.getLeitnerBoxHerhalingenWeekelijkseData(13); // ~3 maanden in weken
      case 'halfJaar':
        return leerDataManager.getLeitnerBoxHerhalingenWeekelijkseData(26); // ~6 maanden in weken
      case 'jaar':
        return leerDataManager.getLeitnerBoxHerhalingenMaandelijkseData(12); // 12 maanden
      default:
        return leerDataManager.getLeitnerBoxHerhalingenTijdlijnData(30);
    }
  }, [leerData, leitnerBoxHerhalingenTijdsRange]);





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

      // 5. Leitner sheet (indien beschikbaar)
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

      // Download het bestand
      XLSX.writeFile(workbook, `leeranalyse_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }, [leerData, leitnerData, formatDatum]);

  if (!isOpen) return null;

  // Toon melding als er geen data is
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
                  achievements={achievements}
                  leitnerData={leitnerData}
                  achievementDefs={achievementDefs}
                  onStartFocusSessie={onStartFocusSessie}
                  activiteitData={activiteitData}
                  prestatieData={prestatieData}
                  focusData={focusData}
                  sessieKwaliteitData={sessieKwaliteitData}
                  topCategorieData={topCategorieData}
                  leerpatronenData={leerpatronenData}
                  sessiePatronenData={sessiePatronenData}
                  leitnerBoxHerhalingenData={leitnerBoxHerhalingenData}
                  streakData={streakData}
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