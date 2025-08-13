import React, { useEffect, useRef, useState } from 'react';
import { useSwipe } from '../../hooks/useSwipe';
import { Line, Bar } from 'react-chartjs-2';
import type { TabProps, TijdsRange, GrafiekType, FocusMetric, ActiviteitData, PrestatieData, FocusData, SessieKwaliteitData, TopCategorieData, LeerpatronenData, SessiePatronenData, LeitnerBoxHerhalingenData } from './LeeranalyseTypes';
import { generateChartLabels } from './LeeranalyseUtils';
import { lineChartConfig, barChartConfig } from '../../utils/chartConfigs';
import { getLeerDataManager } from '../../data/leerDataManager';


// Array van kleuren voor grafieken
const chartColorArray = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#48bb78', '#ed8936'];

interface TijdlijnTabProps extends TabProps {
  // Data props
  activiteitData: ActiviteitData[] | null;
  prestatieData: PrestatieData[] | null;
  focusData: FocusData[] | null;
  sessieKwaliteitData: SessieKwaliteitData[] | null;
  topCategorieData: TopCategorieData[] | null;
  leerpatronenData: LeerpatronenData[] | null;
  sessiePatronenData: SessiePatronenData[] | null;
  leitnerBoxHerhalingenData: LeitnerBoxHerhalingenData[] | null;
}

const TijdlijnTab: React.FC<TijdlijnTabProps> = ({
  leerData,
  activiteitData,
  prestatieData,
  focusData,
  sessieKwaliteitData,
  topCategorieData,
  leerpatronenData,
  sessiePatronenData,
  leitnerBoxHerhalingenData,
  
}) => {
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [toonSwipeHint, setToonSwipeHint] = useState<boolean>(false);
  // Sluit op Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreenChart(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Swipe tussen grafieken als fullscreen actief is
  const chartOrder = ['activiteit','prestatie','focus','sessie','topcat','leerpatronen','sessiepatronen','leitnerbox'] as const;
  const swipe = useSwipe({
    onSwipeLeft: () => {
      if (!fullscreenChart) return;
      const idx = chartOrder.indexOf(fullscreenChart as any);
      const next = chartOrder[(idx + 1) % chartOrder.length];
      setFullscreenChart(next);
    },
    onSwipeRight: () => {
      if (!fullscreenChart) return;
      const idx = chartOrder.indexOf(fullscreenChart as any);
      const prev = chartOrder[(idx - 1 + chartOrder.length) % chartOrder.length];
      setFullscreenChart(prev);
    }
  }, { minSwipeDistance: 40, maxSwipeTime: 600 });

  // Zorg dat swipes binnen fullscreen niet bubbelen naar de buitenste tab-swipe
  const swipeHandlersFullscreen = fullscreenChart ? {
    onTouchStart: (e: React.TouchEvent) => { e.stopPropagation(); (swipe as any).onTouchStart(e); },
    onTouchMove: (e: React.TouchEvent) => { e.stopPropagation(); (swipe as any).onTouchMove(e); },
    onTouchEnd: (e: React.TouchEvent) => { e.stopPropagation(); (swipe as any).onTouchEnd(e); }
  } : {} as any;

  // Toon eenmalig swipe-hint bij eerste fullscreen-ervaring
  useEffect(() => {
    if (fullscreenChart) {
      try {
        const key = 'tijdlijn_swipe_hint_shown';
        const wasShown = localStorage.getItem(key);
        if (!wasShown) {
          setToonSwipeHint(true);
          localStorage.setItem(key, '1');
          const t = setTimeout(() => setToonSwipeHint(false), 2500);
          return () => clearTimeout(t);
        }
      } catch {}
    } else {
      setToonSwipeHint(false);
    }
  }, [fullscreenChart]);
  // State voor tijdsranges
  const [activiteitTijdsRange, setActiviteitTijdsRange] = useState<TijdsRange>('week');
  const [prestatieTijdsRange, setPrestatieTijdsRange] = useState<TijdsRange>('week');
  const [focusTijdsRange, setFocusTijdsRange] = useState<TijdsRange>('week');
  const [sessieKwaliteitTijdsRange, setSessieKwaliteitTijdsRange] = useState<TijdsRange>('week');
  const [topCategorieTijdsRange, setTopCategorieTijdsRange] = useState<TijdsRange>('week');
  const [leerpatronenTijdsRange, setLeerpatronenTijdsRange] = useState<TijdsRange>('week');
  const [leitnerBoxHerhalingenTijdsRange, setLeitnerBoxHerhalingenTijdsRange] = useState<TijdsRange>('week');

  // Eenmalige initialisatie-flags om handmatige keuzes van de gebruiker niet te overschrijven
  const initDone = useRef({
    activiteit: false,
    prestatie: false,
    focus: false,
    sessieKwaliteit: false,
    topCategorie: false,
    leerpatronen: false,
    leitnerBox: false
  });

  // Bepaal automatische range op basis van span in dagen van de dataset
  const bepaalAutoRange = (dataArray: Array<{ datum?: string; week?: string; maand?: string; [k: string]: unknown }> | null | undefined): TijdsRange => {
    if (!dataArray || dataArray.length === 0) return 'week';

    const parseItemDate = (item: { datum?: string; week?: string; maand?: string }): Date | null => {
      if (item.datum) {
        return new Date(item.datum as string);
      }
      if (item.week) {
        return new Date(item.week as string);
      }
      if (item.maand) {
        const [y, m] = String(item.maand as string).split('-');
        const year = Number(y);
        const month = Number(m);
        if (!isNaN(year) && !isNaN(month)) {
          return new Date(year, month - 1, 1);
        }
      }
      return null;
    };

    let minTime = Number.POSITIVE_INFINITY;
    let maxTime = Number.NEGATIVE_INFINITY;
    for (const item of dataArray) {
      // Bepaal of dit item daadwerkelijke activiteit bevat (minstens één numerieke waarde > 0)
      const heeftWaarde = Object.entries(item).some(([key, value]) => {
        if (key === 'datum' || key === 'week' || key === 'maand') return false;
        return typeof value === 'number' && value > 0;
      });

      if (!heeftWaarde) continue;

      const d = parseItemDate(item);
      if (d && !isNaN(d.getTime())) {
        const t = d.getTime();
        if (t < minTime) minTime = t;
        if (t > maxTime) maxTime = t;
      }
    }

    if (!isFinite(minTime) || !isFinite(maxTime)) return 'week';

    const dagen = Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)) + 1;

    if (dagen <= 7) return 'week';
    if (dagen <= 31) return 'maand';
    if (dagen <= 92) return 'drieMaanden';
    if (dagen <= 183) return 'halfJaar';
    return 'jaar';
  };

  // Initialiseer per sectie automatisch de meest passende periode (eenmalig)
  useEffect(() => {
    if (!initDone.current.activiteit && activiteitData && activiteitData.length > 0) {
      setActiviteitTijdsRange(prev => (prev === 'week' ? bepaalAutoRange(activiteitData as any) : prev));
      initDone.current.activiteit = true;
    }
  }, [activiteitData]);

  useEffect(() => {
    if (!initDone.current.prestatie && prestatieData && prestatieData.length > 0) {
      setPrestatieTijdsRange(prev => (prev === 'week' ? bepaalAutoRange(prestatieData as any) : prev));
      initDone.current.prestatie = true;
    }
  }, [prestatieData]);

  useEffect(() => {
    if (!initDone.current.focus && focusData && focusData.length > 0) {
      setFocusTijdsRange(prev => (prev === 'week' ? bepaalAutoRange(focusData as any) : prev));
      initDone.current.focus = true;
    }
  }, [focusData]);

  useEffect(() => {
    if (!initDone.current.sessieKwaliteit && sessieKwaliteitData && sessieKwaliteitData.length > 0) {
      setSessieKwaliteitTijdsRange(prev => (prev === 'week' ? bepaalAutoRange(sessieKwaliteitData as any) : prev));
      initDone.current.sessieKwaliteit = true;
    }
  }, [sessieKwaliteitData]);

  useEffect(() => {
    if (!initDone.current.topCategorie && topCategorieData && topCategorieData.length > 0) {
      setTopCategorieTijdsRange(prev => (prev === 'week' ? bepaalAutoRange(topCategorieData as any) : prev));
      initDone.current.topCategorie = true;
    }
  }, [topCategorieData]);

  useEffect(() => {
    if (!initDone.current.leerpatronen && leerpatronenData && leerpatronenData.length > 0) {
      setLeerpatronenTijdsRange(prev => (prev === 'week' ? bepaalAutoRange(leerpatronenData as any) : prev));
      initDone.current.leerpatronen = true;
    }
  }, [leerpatronenData]);

  useEffect(() => {
    if (!initDone.current.leitnerBox && leitnerBoxHerhalingenData && leitnerBoxHerhalingenData.length > 0) {
      setLeitnerBoxHerhalingenTijdsRange(prev => (prev === 'week' ? bepaalAutoRange(leitnerBoxHerhalingenData as any) : prev));
      initDone.current.leitnerBox = true;
    }
  }, [leitnerBoxHerhalingenData]);

  // State voor grafiek types
  const [activiteitGrafiekType, setActiviteitGrafiekType] = useState<GrafiekType>('lijn');
  const [prestatieGrafiekType, setPrestatieGrafiekType] = useState<GrafiekType>('lijn');
  const [focusGrafiekType, setFocusGrafiekType] = useState<GrafiekType>('lijn');
  const [sessieKwaliteitGrafiekType, setSessieKwaliteitGrafiekType] = useState<GrafiekType>('lijn');
  const [topCategorieGrafiekType, setTopCategorieGrafiekType] = useState<GrafiekType>('lijn');
  const [leerpatronenGrafiekType, setLeerpatronenGrafiekType] = useState<GrafiekType>('lijn');
  const [leitnerBoxHerhalingenGrafiekType, setLeitnerBoxHerhalingenGrafiekType] = useState<GrafiekType>('lijn');

  // State voor focus metric
  const [focusMetric, setFocusMetric] = useState<FocusMetric>('tijd');

  // Data manager
  const leerDataManager = React.useMemo(() => getLeerDataManager(), []);

  // Sla/lees gebruikerskeuze per grafiek op uit localStorage
  const storageLoadedRef = useRef(false);
  useEffect(() => {
    if (storageLoadedRef.current) return;
    try {
      const readRange = (key: string): TijdsRange | null => {
        const v = localStorage.getItem(key);
        if (v === 'week' || v === 'maand' || v === 'drieMaanden' || v === 'halfJaar' || v === 'jaar') return v;
        return null;
      };
      const readType = (key: string): GrafiekType | null => {
        const v = localStorage.getItem(key);
        if (v === 'lijn' || v === 'staaf' || v === 'gestapeld') return v;
        return null;
      };
      const readMetric = (key: string): FocusMetric | null => {
        const v = localStorage.getItem(key);
        if (v === 'tijd' || v === 'aantal') return v;
        return null;
      };

      // Periode
      const r1 = readRange('tijdlijn_activiteit_range'); if (r1) setActiviteitTijdsRange(r1);
      const r2 = readRange('tijdlijn_prestatie_range'); if (r2) setPrestatieTijdsRange(r2);
      const r3 = readRange('tijdlijn_focus_range'); if (r3) setFocusTijdsRange(r3);
      const r4 = readRange('tijdlijn_sessie_range'); if (r4) setSessieKwaliteitTijdsRange(r4);
      const r5 = readRange('tijdlijn_topcat_range'); if (r5) setTopCategorieTijdsRange(r5);
      const r6 = readRange('tijdlijn_leerpatronen_range'); if (r6) setLeerpatronenTijdsRange(r6);
      const r7 = readRange('tijdlijn_leitnerbox_range'); if (r7) setLeitnerBoxHerhalingenTijdsRange(r7);

      // Types
      const t1 = readType('tijdlijn_activiteit_type'); if (t1) setActiviteitGrafiekType(t1);
      const t2 = readType('tijdlijn_prestatie_type'); if (t2) setPrestatieGrafiekType(t2);
      const t3 = readType('tijdlijn_focus_type'); if (t3) setFocusGrafiekType(t3);
      const t4 = readType('tijdlijn_sessie_type'); if (t4) setSessieKwaliteitGrafiekType(t4);
      const t5 = readType('tijdlijn_topcat_type'); if (t5) setTopCategorieGrafiekType(t5);
      const t6 = readType('tijdlijn_leerpatronen_type'); if (t6) setLeerpatronenGrafiekType(t6);
      const t7 = readType('tijdlijn_leitnerbox_type'); if (t7) setLeitnerBoxHerhalingenGrafiekType(t7);

      // Focus metric
      const fm = readMetric('tijdlijn_focus_metric'); if (fm) setFocusMetric(fm);
    } catch {}
    storageLoadedRef.current = true;
  }, []);

  useEffect(() => { try { localStorage.setItem('tijdlijn_activiteit_range', activiteitTijdsRange); } catch {} }, [activiteitTijdsRange]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_prestatie_range', prestatieTijdsRange); } catch {} }, [prestatieTijdsRange]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_focus_range', focusTijdsRange); } catch {} }, [focusTijdsRange]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_sessie_range', sessieKwaliteitTijdsRange); } catch {} }, [sessieKwaliteitTijdsRange]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_topcat_range', topCategorieTijdsRange); } catch {} }, [topCategorieTijdsRange]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_leerpatronen_range', leerpatronenTijdsRange); } catch {} }, [leerpatronenTijdsRange]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_leitnerbox_range', leitnerBoxHerhalingenTijdsRange); } catch {} }, [leitnerBoxHerhalingenTijdsRange]);

  useEffect(() => { try { localStorage.setItem('tijdlijn_activiteit_type', activiteitGrafiekType); } catch {} }, [activiteitGrafiekType]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_prestatie_type', prestatieGrafiekType); } catch {} }, [prestatieGrafiekType]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_focus_type', focusGrafiekType); } catch {} }, [focusGrafiekType]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_sessie_type', sessieKwaliteitGrafiekType); } catch {} }, [sessieKwaliteitGrafiekType]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_topcat_type', topCategorieGrafiekType); } catch {} }, [topCategorieGrafiekType]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_leerpatronen_type', leerpatronenGrafiekType); } catch {} }, [leerpatronenGrafiekType]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_leitnerbox_type', leitnerBoxHerhalingenGrafiekType); } catch {} }, [leitnerBoxHerhalingenGrafiekType]);
  useEffect(() => { try { localStorage.setItem('tijdlijn_focus_metric', focusMetric); } catch {} }, [focusMetric]);

  // Helper: mapping range -> granulariteit en venster
  const getGranulariteitEnVenster = (range: TijdsRange): { gran: 'dag' | 'week' | 'maand'; venster: number } => {
    switch (range) {
      case 'week':
        return { gran: 'dag', venster: 7 };
      case 'maand':
        return { gran: 'dag', venster: 31 };
      case 'drieMaanden':
        return { gran: 'week', venster: 12 };
      case 'halfJaar':
        return { gran: 'week', venster: 26 };
      case 'jaar':
        return { gran: 'maand', venster: 12 };
      default:
        return { gran: 'dag', venster: 7 };
    }
  };

  // Globale reset naar automatische periodes (niet per sectie)
  const resetNaarAutomatisch = () => {
    try {
      localStorage.removeItem('tijdlijn_activiteit_range');
      localStorage.removeItem('tijdlijn_prestatie_range');
      localStorage.removeItem('tijdlijn_focus_range');
      localStorage.removeItem('tijdlijn_sessie_range');
      localStorage.removeItem('tijdlijn_topcat_range');
      localStorage.removeItem('tijdlijn_leerpatronen_range');
      localStorage.removeItem('tijdlijn_leitnerbox_range');
    } catch {}

    // Bepaal opnieuw op basis van langere dagelijkse data (duurzaam voor half jaar+)
    const actDaily = leerDataManager.getDagelijkseActiviteitData(365) as Array<{ datum?: string; week?: string; maand?: string }>;
    setActiviteitTijdsRange(bepaalAutoRange(actDaily));

    const prestDaily = leerDataManager.getPrestatieDagelijkseData(365) as Array<{ datum?: string; week?: string; maand?: string }>;
    setPrestatieTijdsRange(bepaalAutoRange(prestDaily));

    const focusDaily = leerDataManager.getFocusDagelijkseData(365, focusMetric) as Array<{ datum?: string; week?: string; maand?: string }>;
    setFocusTijdsRange(bepaalAutoRange(focusDaily));

    const sessieDaily = leerDataManager.getSessieKwaliteitDagelijkseData(365) as Array<{ datum?: string; week?: string; maand?: string }>;
    setSessieKwaliteitTijdsRange(bepaalAutoRange(sessieDaily));

    const topDaily = leerDataManager.getTopCategorieDagelijkseData(365) as Array<{ datum?: string; week?: string; maand?: string }>;
    setTopCategorieTijdsRange(bepaalAutoRange(topDaily));

    const leitnerDaily = leerDataManager.getLeitnerTijdlijnData(365);
    setLeerpatronenTijdsRange(bepaalAutoRange(leitnerDaily));

    const leitnerBoxDaily = leerDataManager.getLeitnerBoxHerhalingenTijdlijnData(365);
    setLeitnerBoxHerhalingenTijdsRange(bepaalAutoRange(leitnerBoxDaily));
  };

  // Range-gebonden data ophalen per sectie
  const activiteitDataView = React.useMemo(() => {
    const { gran, venster } = getGranulariteitEnVenster(activiteitTijdsRange);
    if (!leerData) return [];
    if (gran === 'dag') return leerDataManager.getDagelijkseActiviteitData(venster);
    if (gran === 'week') return leerDataManager.getWeekelijkseData(venster);
    return leerDataManager.getMaandelijkseData(venster);
  }, [leerData, leerDataManager, activiteitTijdsRange]);

  const prestatieDataView = React.useMemo(() => {
    const { gran, venster } = getGranulariteitEnVenster(prestatieTijdsRange);
    if (!leerData) return [];
    if (gran === 'dag') return leerDataManager.getPrestatieDagelijkseData(venster);
    if (gran === 'week') return leerDataManager.getPrestatieWeekelijkseData(venster);
    return leerDataManager.getPrestatieMaandelijkseData(venster);
  }, [leerData, leerDataManager, prestatieTijdsRange]);

  const focusDataView = React.useMemo(() => {
    const { gran, venster } = getGranulariteitEnVenster(focusTijdsRange);
    if (!leerData) return [];
    if (gran === 'dag') return leerDataManager.getFocusDagelijkseData(venster, focusMetric);
    if (gran === 'week') return leerDataManager.getFocusWeekelijkseData(venster, focusMetric);
    return leerDataManager.getFocusMaandelijkseData(venster, focusMetric);
  }, [leerData, leerDataManager, focusTijdsRange, focusMetric]);

  const sessieKwaliteitDataView = React.useMemo(() => {
    const { gran, venster } = getGranulariteitEnVenster(sessieKwaliteitTijdsRange);
    if (!leerData) return [];
    if (gran === 'dag') return leerDataManager.getSessieKwaliteitDagelijkseData(venster);
    if (gran === 'week') return leerDataManager.getSessieKwaliteitWeekelijkseData(venster);
    return leerDataManager.getSessieKwaliteitMaandelijkseData(venster);
  }, [leerData, leerDataManager, sessieKwaliteitTijdsRange]);

  const topCategorieDataView = React.useMemo(() => {
    const { gran, venster } = getGranulariteitEnVenster(topCategorieTijdsRange);
    if (!leerData) return [];
    if (gran === 'dag') return leerDataManager.getTopCategorieDagelijkseData(venster);
    if (gran === 'week') return leerDataManager.getTopCategorieWeekelijkseData(venster);
    return leerDataManager.getTopCategorieMaandelijkseData(venster);
  }, [leerData, leerDataManager, topCategorieTijdsRange]);

  const leerpatronenDataView = React.useMemo(() => {
    const { gran, venster } = getGranulariteitEnVenster(leerpatronenTijdsRange);
    if (!leerData) return [];
    if (gran === 'dag') return leerDataManager.getLeitnerTijdlijnData(venster);
    if (gran === 'week') return leerDataManager.getLeitnerWeekelijkseData(venster);
    return leerDataManager.getLeitnerMaandelijkseData(venster);
  }, [leerData, leerDataManager, leerpatronenTijdsRange]);

  const leitnerBoxHerhalingenDataView = React.useMemo(() => {
    const { gran, venster } = getGranulariteitEnVenster(leitnerBoxHerhalingenTijdsRange);
    if (!leerData) return [];
    if (gran === 'dag') return leerDataManager.getLeitnerBoxHerhalingenTijdlijnData(venster);
    if (gran === 'week') return leerDataManager.getLeitnerBoxHerhalingenWeekelijkseData(venster);
    return leerDataManager.getLeitnerBoxHerhalingenMaandelijkseData(venster);
  }, [leerData, leerDataManager, leitnerBoxHerhalingenTijdsRange]);

  if (!leerData) {
    return (
      <div className="geen-data">
        <p>Geen leerdata beschikbaar.</p>
      </div>
    );
  }

  // Helper functie voor het renderen van tijdsrange selector
  const renderTijdsRangeSelector = (
    tijdsRange: TijdsRange,
    setTijdsRange: (range: TijdsRange) => void,
    label: string,
    autoBronData: any[]
  ) => (
    <div className="tijdsrange-selector">
      <label>{label}:</label>
      <div className="range-buttons">
        <button
          className={`range-btn ${tijdsRange === 'week' ? 'active' : ''}`}
          onClick={() => setTijdsRange('week')}
        >
          Laatste week
        </button>
        <button
          className={`range-btn ${tijdsRange === 'maand' ? 'active' : ''}`}
          onClick={() => setTijdsRange('maand')}
        >
          Laatste maand
        </button>
        <button
          className={`range-btn ${tijdsRange === 'drieMaanden' ? 'active' : ''}`}
          onClick={() => setTijdsRange('drieMaanden')}
        >
          Laatste 3 maanden
        </button>
        <button
          className={`range-btn ${tijdsRange === 'halfJaar' ? 'active' : ''}`}
          onClick={() => setTijdsRange('halfJaar')}
        >
          Laatste half jaar
        </button>
        <button
          className={`range-btn ${tijdsRange === 'jaar' ? 'active' : ''}`}
          onClick={() => setTijdsRange('jaar')}
        >
          Laatste jaar
        </button>
        {(() => {
          const getRangeLabel = (range: TijdsRange): string => {
            switch (range) {
              case 'week':
                return 'Laatste week';
              case 'maand':
                return 'Laatste maand';
              case 'drieMaanden':
                return 'Laatste 3 maanden';
              case 'halfJaar':
                return 'Laatste half jaar';
              case 'jaar':
                return 'Laatste jaar';
              default:
                return 'Laatste week';
            }
          };
          const autoRange = bepaalAutoRange(autoBronData);
          const isAutoActive = tijdsRange === autoRange;
          return (
            <button
              className={`range-btn ${isAutoActive ? 'active' : ''}`}
              onClick={() => setTijdsRange(autoRange)}
              title={isAutoActive
                ? `Automatisch bepaald: ${getRangeLabel(autoRange)}`
                : `Bepaal automatisch op basis van de beschikbare data (${getRangeLabel(autoRange)})`}
            >
              {isAutoActive ? `Automatisch bepaald (${getRangeLabel(autoRange)})` : 'Bepaal automatisch'}
            </button>
          );
        })()}
      </div>
    </div>
  );

  // Helper functie voor het renderen van grafiek type selector
  const renderGrafiekTypeSelector = (
    grafiekType: GrafiekType,
    setGrafiekType: (type: GrafiekType) => void,
    label: string
  ) => (
    <div className="grafiek-type-selector">
      <label>{label}:</label>
      <div className="type-buttons">
        <button
          className={`type-btn ${grafiekType === 'lijn' ? 'active' : ''}`}
          onClick={() => setGrafiekType('lijn')}
        >
          📈 Lijn
        </button>
        <button
          className={`type-btn ${grafiekType === 'staaf' ? 'active' : ''}`}
          onClick={() => setGrafiekType('staaf')}
        >
          📊 Staaf
        </button>
        {label === 'Grafiek type' && (
          <button
            className={`type-btn ${grafiekType === 'gestapeld' ? 'active' : ''}`}
            onClick={() => setGrafiekType('gestapeld')}
          >
            📦 Gestapeld
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="tijdlijn-tab">
      <h3>📅 Tijdlijn Analyse</h3>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          className="type-btn"
          onClick={(e) => {
            e.preventDefault();
            resetNaarAutomatisch();
          }}
          title="Reset alle grafieken naar automatische periode op basis van data"
        >
          🔄 Reset naar automatisch
        </button>
      </div>
      
      {/* Dagelijkse Activiteit */}
      <div className="tijdlijn-sectie">
        <div className="dagelijkse-activiteit-header">
          <h4>📊 Activiteit Overzicht</h4>
          {renderTijdsRangeSelector(activiteitTijdsRange, setActiviteitTijdsRange, 'Tijdsperiode', activiteitDataView)}
          {renderGrafiekTypeSelector(activiteitGrafiekType, setActiviteitGrafiekType, 'Grafiek type')}
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
          <div className={`chart-container ${fullscreenChart === 'activiteit' ? 'fullscreen' : ''}`} onClick={() => setFullscreenChart(fullscreenChart ? null : 'activiteit')} {...swipeHandlersFullscreen}>
            {fullscreenChart === 'activiteit' && (
              <button className="chart-close" onClick={(e) => { e.stopPropagation(); setFullscreenChart(null); }}>✕</button>
            )}
            {fullscreenChart === 'activiteit' && toonSwipeHint && (
              <div className="swipe-hint">⬅️ Swipe tussen grafieken ➡️</div>
            )}
            {activiteitGrafiekType === 'lijn' ? (
              <Line 
                data={{
                   labels: generateChartLabels(activiteitDataView),
                  datasets: [
                    {
                      label: 'Opdrachten',
                       data: activiteitDataView.map((d: any) => d.opdrachten),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Speeltijd (minuten)',
                       data: activiteitDataView.map((d: any) => d.speeltijd),
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
                   labels: generateChartLabels(activiteitDataView),
                  datasets: [
                    {
                      label: 'Opdrachten',
                       data: activiteitDataView.map((d: any) => d.opdrachten),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Speeltijd (minuten)',
                       data: activiteitDataView.map((d: any) => d.speeltijd),
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
          {renderTijdsRangeSelector(prestatieTijdsRange, setPrestatieTijdsRange, 'Tijdsperiode', prestatieDataView)}
          {renderGrafiekTypeSelector(prestatieGrafiekType, setPrestatieGrafiekType, 'Grafiek type')}
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
          <div className={`chart-container ${fullscreenChart === 'prestatie' ? 'fullscreen' : ''}`} onClick={() => setFullscreenChart(fullscreenChart ? null : 'prestatie')} {...swipeHandlersFullscreen}>
            {fullscreenChart === 'prestatie' && (
              <button className="chart-close" onClick={(e) => { e.stopPropagation(); setFullscreenChart(null); }}>✕</button>
            )}
            {fullscreenChart === 'prestatie' && toonSwipeHint && (
              <div className="swipe-hint">⬅️ Swipe tussen grafieken ➡️</div>
            )}
            {prestatieGrafiekType === 'lijn' ? (
              <Line 
                data={{
                   labels: generateChartLabels(prestatieDataView),
                  datasets: [
                    {
                      label: 'Gemiddelde Score',
                       data: prestatieDataView.map((d: any) => d.gemiddeldeScore),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Gemiddelde Tijd (minuten)',
                       data: prestatieDataView.map((d: any) => d.gemiddeldeTijd),
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
                   labels: generateChartLabels(prestatieDataView),
                  datasets: [
                    {
                      label: 'Gemiddelde Score',
                       data: prestatieDataView.map((d: any) => d.gemiddeldeScore),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Gemiddelde Tijd (minuten)',
                       data: prestatieDataView.map((d: any) => d.gemiddeldeTijd),
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
          {renderTijdsRangeSelector(focusTijdsRange, setFocusTijdsRange, 'Tijdsperiode', focusDataView)}
          {renderGrafiekTypeSelector(focusGrafiekType, setFocusGrafiekType, 'Grafiek type')}
          <div className="metric-selector">
            <label>Metric:</label>
            <div className="metric-buttons">
              <button
                className={`metric-btn ${focusMetric === 'tijd' ? 'active' : ''}`}
                onClick={() => setFocusMetric('tijd')}
              >
                ⏱️ Tijd
              </button>
              <button
                className={`metric-btn ${focusMetric === 'aantal' ? 'active' : ''}`}
                onClick={() => setFocusMetric('aantal')}
              >
                📊 Aantal
              </button>
            </div>
          </div>
        </div>
        <p className="grafiek-uitleg">
          Deze grafiek toont je focus patronen over tijd. 
          {focusGrafiekType === 'lijn' ? 
            'De groene lijn toont Leitner leermodus sessies, terwijl de oranje lijn Vrije leermodus sessies toont.' :
            'De groene staven tonen Leitner leermodus sessies, terwijl de oranje staven Vrije leermodus sessies tonen.'
          }
          Dit helpt je om je focus strategieën te optimaliseren.
        </p>
        {focusData && focusData.length > 0 ? (
          <div className={`chart-container ${fullscreenChart === 'focus' ? 'fullscreen' : ''}`} onClick={() => setFullscreenChart(fullscreenChart ? null : 'focus')} {...swipeHandlersFullscreen}>
            {fullscreenChart === 'focus' && (
              <button className="chart-close" onClick={(e) => { e.stopPropagation(); setFullscreenChart(null); }}>✕</button>
            )}
            {fullscreenChart === 'focus' && toonSwipeHint && (
              <div className="swipe-hint">⬅️ Swipe tussen grafieken ➡️</div>
            )}
            {focusGrafiekType === 'lijn' ? (
              <Line 
                data={{
                   labels: generateChartLabels(focusDataView),
                  datasets: [
                    {
                      label: 'Leitner Leermodus',
                       data: focusDataView.map((d: any) => focusMetric === 'tijd' ? d.serieuzeModus : d.serieuzeModus),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Vrije Leermodus',
                       data: focusDataView.map((d: any) => focusMetric === 'tijd' ? d.normaleModus : d.normaleModus),
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
                        text: focusMetric === 'tijd' ? 'Leitner Leermodus (minuten)' : 'Leitner Leermodus (aantal)',
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
                        text: focusMetric === 'tijd' ? 'Vrije Leermodus (minuten)' : 'Vrije Leermodus (aantal)',
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
                   labels: generateChartLabels(focusDataView),
                  datasets: [
                    {
                      label: 'Leitner Leermodus',
                       data: focusDataView.map((d: any) => focusMetric === 'tijd' ? d.serieuzeModus : d.serieuzeModus),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Vrije Leermodus',
                       data: focusDataView.map((d: any) => focusMetric === 'tijd' ? d.normaleModus : d.normaleModus),
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
                         text: focusMetric === 'tijd' ? 'Leitner Leermodus (minuten)' : 'Leitner Leermodus (aantal)',
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
                         text: focusMetric === 'tijd' ? 'Vrije Leermodus (minuten)' : 'Vrije Leermodus (aantal)',
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
            <p>Gebruik focus modus om je focus patronen te zien!</p>
          </div>
        )}
      </div>

      {/* Sessie Kwaliteit */}
      <div className="tijdlijn-sectie">
        <div className="dagelijkse-activiteit-header">
          <h4>⏱️ Sessie Kwaliteit</h4>
          {renderTijdsRangeSelector(sessieKwaliteitTijdsRange, setSessieKwaliteitTijdsRange, 'Tijdsperiode', sessieKwaliteitDataView)}
          {renderGrafiekTypeSelector(sessieKwaliteitGrafiekType, setSessieKwaliteitGrafiekType, 'Grafiek type')}
        </div>
        <p className="grafiek-uitleg">
          Deze grafiek toont de kwaliteit van je leer sessies over tijd. 
          {sessieKwaliteitGrafiekType === 'lijn' ? 
            'De groene lijn toont het aantal sessies, terwijl de oranje lijn de gemiddelde sessie duur toont.' :
            'De groene staven tonen het aantal sessies, terwijl de oranje staven de gemiddelde sessie duur tonen.'
          }
          Dit helpt je om je sessie strategieën te optimaliseren.
        </p>
        {sessieKwaliteitData && sessieKwaliteitData.length > 0 ? (
          <div className={`chart-container ${fullscreenChart === 'sessie' ? 'fullscreen' : ''}`} onClick={() => setFullscreenChart(fullscreenChart ? null : 'sessie')} {...swipeHandlersFullscreen}>
            {fullscreenChart === 'sessie' && (
              <button className="chart-close" onClick={(e) => { e.stopPropagation(); setFullscreenChart(null); }}>✕</button>
            )}
            {fullscreenChart === 'sessie' && toonSwipeHint && (
              <div className="swipe-hint">⬅️ Swipe tussen grafieken ➡️</div>
            )}
            {sessieKwaliteitGrafiekType === 'lijn' ? (
              <Line 
                data={{
                   labels: generateChartLabels(sessieKwaliteitDataView),
                  datasets: [
                    {
                      label: 'Aantal Sessies',
                       data: sessieKwaliteitDataView.map((d: any) => d.aantalSessies),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Gemiddelde Duur (minuten)',
                       data: sessieKwaliteitDataView.map((d: any) => d.gemiddeldeDuur),
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
                   labels: generateChartLabels(sessieKwaliteitDataView),
                  datasets: [
                    {
                      label: 'Aantal Sessies',
                       data: sessieKwaliteitDataView.map((d: any) => d.aantalSessies),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Gemiddelde Duur (minuten)',
                       data: sessieKwaliteitDataView.map((d: any) => d.gemiddeldeDuur),
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

      {/* Top 5 Categorieën */}
      <div className="tijdlijn-sectie">
        <div className="dagelijkse-activiteit-header">
          <h4>🏆 Top 5 Categorieën</h4>
          {renderTijdsRangeSelector(topCategorieTijdsRange, setTopCategorieTijdsRange, 'Tijdsperiode', topCategorieDataView)}
          {renderGrafiekTypeSelector(topCategorieGrafiekType, setTopCategorieGrafiekType, 'Grafiek type')}
        </div>
        <p className="grafiek-uitleg">
          Deze grafiek toont je top 5 categorieën over tijd. 
          {topCategorieGrafiekType === 'lijn' ? 
            'De lijnen tonen de prestaties van je top 5 categorieën over de geselecteerde periode.' :
            'De staven tonen de prestaties van je top 5 categorieën over de geselecteerde periode.'
          }
          Dit helpt je om je focus te optimaliseren.
        </p>
        {topCategorieData && topCategorieData.length > 0 ? (
          <div className={`chart-container ${fullscreenChart === 'topcat' ? 'fullscreen' : ''}`} onClick={() => setFullscreenChart(fullscreenChart ? null : 'topcat')} {...swipeHandlersFullscreen}>
            {fullscreenChart === 'topcat' && (
              <button className="chart-close" onClick={(e) => { e.stopPropagation(); setFullscreenChart(null); }}>✕</button>
            )}
            {fullscreenChart === 'topcat' && toonSwipeHint && (
              <div className="swipe-hint">⬅️ Swipe tussen grafieken ➡️</div>
            )}
            {topCategorieGrafiekType === 'lijn' ? (
              <Line 
                data={{
                   labels: generateChartLabels(topCategorieDataView),
                  datasets: Object.keys(topCategorieData[0] || {})
                    .filter(key => !['datum', 'week', 'maand'].includes(key))
                    .slice(0, 5)
                    .map((categorie, index) => ({
                      label: categorie,
                       data: topCategorieDataView.map((d: any) => d[categorie] || 0),
                      borderColor: chartColorArray[index % chartColorArray.length],
                      backgroundColor: `${chartColorArray[index % chartColorArray.length]}20`,
                      yAxisID: 'y'
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
                        text: 'Score',
                        color: '#4ade80'
                      },
                      min: 0,
                      grid: {
                        color: '#4ade8020'
                      },
                      ticks: {
                        color: '#4ade80'
                      }
                    }
                  }
                }}
              />
            ) : (
              <Bar 
                data={{
                   labels: generateChartLabels(topCategorieDataView),
                  datasets: Object.keys(topCategorieData[0] || {})
                    .filter(key => !['datum', 'week', 'maand'].includes(key))
                    .slice(0, 5)
                    .map((categorie, index) => ({
                      label: categorie,
                       data: topCategorieDataView.map((d: any) => d[categorie] || 0),
                      backgroundColor: chartColorArray[index % chartColorArray.length],
                      borderColor: chartColorArray[index % chartColorArray.length],
                      yAxisID: 'y'
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
                        text: 'Score',
                        color: '#4ade80'
                      },
                      min: 0,
                      grid: {
                        color: '#4ade8020'
                      },
                      ticks: {
                        color: '#4ade80'
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
            <p>Speel verschillende categorieën om je top categorieën te zien!</p>
          </div>
        )}
      </div>

      {/* Leerpatronen */}
      <div className="tijdlijn-sectie">
        <div className="dagelijkse-activiteit-header">
          <h4>🔄 Leerpatronen</h4>
          {renderTijdsRangeSelector(leerpatronenTijdsRange, setLeerpatronenTijdsRange, 'Tijdsperiode', leerpatronenDataView)}
          {renderGrafiekTypeSelector(leerpatronenGrafiekType, setLeerpatronenGrafiekType, 'Grafiek type')}
        </div>
        <p className="grafiek-uitleg">
          Deze grafiek toont je leerpatronen over tijd. 
          {leerpatronenGrafiekType === 'lijn' ? 
            'De groene lijn toont nieuwe opdrachten, terwijl de oranje lijn herhalingen toont.' :
            leerpatronenGrafiekType === 'gestapeld' ?
            'De gestapelde staven tonen nieuwe opdrachten en herhalingen gecombineerd.' :
            'De groene staven tonen nieuwe opdrachten, terwijl de oranje staven herhalingen tonen.'
          }
          Dit helpt je om je leerstrategieën te optimaliseren.
        </p>
        {leerpatronenData && leerpatronenData.length > 0 ? (
          <div className={`chart-container ${fullscreenChart === 'leerpatronen' ? 'fullscreen' : ''}`} onClick={() => setFullscreenChart(fullscreenChart ? null : 'leerpatronen')} {...swipeHandlersFullscreen}>
            {fullscreenChart === 'leerpatronen' && (
              <button className="chart-close" onClick={(e) => { e.stopPropagation(); setFullscreenChart(null); }}>✕</button>
            )}
            {fullscreenChart === 'leerpatronen' && toonSwipeHint && (
              <div className="swipe-hint">⬅️ Swipe tussen grafieken ➡️</div>
            )}
            {leerpatronenGrafiekType === 'lijn' ? (
              <Line 
                data={{
                   labels: generateChartLabels(leerpatronenDataView),
                  datasets: [
                    {
                      label: 'Nieuwe Opdrachten',
                       data: leerpatronenDataView.map((d: any) => d.nieuweOpdrachten),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Herhalingen',
                       data: leerpatronenDataView.map((d: any) => d.herhalingen),
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
                        text: 'Nieuwe Opdrachten',
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
                        text: 'Herhalingen',
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
            ) : leerpatronenGrafiekType === 'gestapeld' ? (
              <Bar 
                data={{
                   labels: generateChartLabels(leerpatronenDataView),
                  datasets: [
                    {
                      label: 'Nieuwe Opdrachten',
                       data: leerpatronenDataView.map((d: any) => d.nieuweOpdrachten),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      stack: 'stack1'
                    },
                    {
                      label: 'Herhalingen',
                       data: leerpatronenDataView.map((d: any) => d.herhalingen),
                      backgroundColor: '#f59e0b',
                      borderColor: '#f59e0b',
                      stack: 'stack1'
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
                    }
                  }
                }}
              />
            ) : (
              <Bar 
                data={{
                   labels: generateChartLabels(leerpatronenDataView),
                  datasets: [
                    {
                      label: 'Nieuwe Opdrachten',
                       data: leerpatronenDataView.map((d: any) => d.nieuweOpdrachten),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Herhalingen',
                       data: leerpatronenDataView.map((d: any) => d.herhalingen),
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
                        text: 'Nieuwe Opdrachten',
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
                        text: 'Herhalingen',
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
            <p>🔄 Nog geen leerpatronen data beschikbaar.</p>
            <p>Speel opdrachten om je leerpatronen te zien!</p>
          </div>
        )}
      </div>

      {/* Sessie Patronen */}
      <div className="tijdlijn-sectie">
        <h4>⏰ Sessie Patronen</h4>
        <p className="grafiek-uitleg">
          Deze grafiek toont je sessie patronen per uur van de dag. 
          Dit helpt je om je optimale leertijden te identificeren.
        </p>
        {sessiePatronenData && sessiePatronenData.length > 0 ? (
          <div className={`chart-container ${fullscreenChart === 'sessiepatronen' ? 'fullscreen' : ''}`} onClick={() => setFullscreenChart(fullscreenChart ? null : 'sessiepatronen')} {...swipeHandlersFullscreen}>
            {fullscreenChart === 'sessiepatronen' && (
              <button className="chart-close" onClick={(e) => { e.stopPropagation(); setFullscreenChart(null); }}>✕</button>
            )}
            {fullscreenChart === 'sessiepatronen' && toonSwipeHint && (
              <div className="swipe-hint">⬅️ Swipe tussen grafieken ➡️</div>
            )}
            <Bar 
              data={{
                labels: sessiePatronenData.map((d: any) => `${d.uur}:00`),
                datasets: [
                  {
                    label: 'Aantal Sessies',
                    data: sessiePatronenData.map((d: any) => d.sessies),
                    backgroundColor: '#4ade80',
                    borderColor: '#4ade80',
                    yAxisID: 'y'
                  },
                  {
                    label: 'Totale Tijd (minuten)',
                    data: sessiePatronenData.map((d: any) => d.totaleTijd),
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
                      text: 'Uur van de dag'
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
                      text: 'Totale Tijd (minuten)',
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
          </div>
        ) : (
          <div className="geen-data-melding">
            <p>⏰ Nog geen sessie patronen data beschikbaar.</p>
            <p>Start sessies op verschillende tijden om je patronen te zien!</p>
          </div>
        )}
      </div>

      {/* Leitner Box Herhalingen */}
      <div className="tijdlijn-sectie sectie-leitner-box">
        <div className="dagelijkse-activiteit-header">
          <h4>📚 Leitner Box Herhalingen</h4>
          {renderTijdsRangeSelector(leitnerBoxHerhalingenTijdsRange, setLeitnerBoxHerhalingenTijdsRange, 'Tijdsperiode', leitnerBoxHerhalingenDataView)}
          {renderGrafiekTypeSelector(leitnerBoxHerhalingenGrafiekType, setLeitnerBoxHerhalingenGrafiekType, 'Grafiek type')}
        </div>
        <p className="grafiek-uitleg">
          Deze grafiek toont je Leitner box herhalingen over tijd. 
          {leitnerBoxHerhalingenGrafiekType === 'lijn' ? 
            'De lijnen tonen de herhalingen per box over de geselecteerde periode.' :
            'De staven tonen de herhalingen per box over de geselecteerde periode.'
          }
          Dit helpt je om je Leitner strategie te optimaliseren.
        </p>
        {leitnerBoxHerhalingenData && leitnerBoxHerhalingenData.length > 0 ? (
          <div className={`chart-container ${fullscreenChart === 'leitnerbox' ? 'fullscreen' : ''}`} onClick={() => setFullscreenChart(fullscreenChart ? null : 'leitnerbox')} {...swipeHandlersFullscreen}>
            {fullscreenChart === 'leitnerbox' && (
              <button className="chart-close" onClick={(e) => { e.stopPropagation(); setFullscreenChart(null); }}>✕</button>
            )}
            {fullscreenChart === 'leitnerbox' && toonSwipeHint && (
              <div className="swipe-hint">⬅️ Swipe tussen grafieken ➡️</div>
            )}
            {leitnerBoxHerhalingenGrafiekType === 'lijn' ? (
              <Line 
                data={{
                   labels: generateChartLabels(leitnerBoxHerhalingenDataView),
                  datasets: [
                    {
                      label: 'Box 0',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box0),
                      borderColor: '#ef4444',
                      backgroundColor: '#ef444420',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 1',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box1),
                      borderColor: '#f97316',
                      backgroundColor: '#f9731620',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 2',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box2),
                      borderColor: '#eab308',
                      backgroundColor: '#eab30820',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 3',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box3),
                      borderColor: '#22c55e',
                      backgroundColor: '#22c5520',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 4',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box4),
                      borderColor: '#06b6d4',
                      backgroundColor: '#06b6d420',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 5',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box5),
                      borderColor: '#8b5cf6',
                      backgroundColor: '#8b5cf620',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 6',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box6),
                      borderColor: '#ec4899',
                      backgroundColor: '#ec489920',
                      yAxisID: 'y'
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
                        text: leitnerBoxHerhalingenTijdsRange === 'week' || leitnerBoxHerhalingenTijdsRange === 'maand' ? 'Datum' :
                              leitnerBoxHerhalingenTijdsRange === 'drieMaanden' || leitnerBoxHerhalingenTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
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
                        text: 'Aantal Herhalingen',
                        color: '#4ade80'
                      },
                      min: 0,
                      grid: {
                        color: '#4ade8020'
                      },
                      ticks: {
                        color: '#4ade80'
                      }
                    }
                  }
                }}
              />
            ) : (
              <Bar 
                data={{
                   labels: generateChartLabels(leitnerBoxHerhalingenDataView),
                  datasets: [
                    {
                      label: 'Box 0',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box0),
                      backgroundColor: '#ef4444',
                      borderColor: '#ef4444',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 1',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box1),
                      backgroundColor: '#f97316',
                      borderColor: '#f97316',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 2',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box2),
                      backgroundColor: '#eab308',
                      borderColor: '#eab308',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 3',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box3),
                      backgroundColor: '#22c55e',
                      borderColor: '#22c55e',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 4',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box4),
                      backgroundColor: '#06b6d4',
                      borderColor: '#06b6d4',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 5',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box5),
                      backgroundColor: '#8b5cf6',
                      borderColor: '#8b5cf6',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 6',
                       data: leitnerBoxHerhalingenDataView.map((d: any) => d.box6),
                      backgroundColor: '#ec4899',
                      borderColor: '#ec4899',
                      yAxisID: 'y'
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
                        text: leitnerBoxHerhalingenTijdsRange === 'week' || leitnerBoxHerhalingenTijdsRange === 'maand' ? 'Datum' :
                              leitnerBoxHerhalingenTijdsRange === 'drieMaanden' || leitnerBoxHerhalingenTijdsRange === 'halfJaar' ? 'Week' : 'Maand'
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
                        text: 'Aantal Herhalingen',
                        color: '#4ade80'
                      },
                      min: 0,
                      grid: {
                        color: '#4ade8020'
                      },
                      ticks: {
                        color: '#4ade80'
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        ) : (
          <div className="geen-data-melding">
            <p>📚 Nog geen Leitner box herhalingen data beschikbaar.</p>
            <p>Gebruik de Leitner modus om je box herhalingen te zien!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TijdlijnTab;
