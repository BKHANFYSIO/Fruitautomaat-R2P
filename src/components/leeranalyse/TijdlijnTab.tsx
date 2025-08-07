import React, { useState, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { getLeerDataManager } from '../../data/leerDataManager';
import type { LeerData } from '../../data/types';
import { 
  lineChartConfig, 
  barChartConfig
} from '../../utils/chartConfigs';
import type { TijdsRange, GrafiekType, FocusMetric } from './LeeranalyseTypes';
import { generateChartLabels } from './LeeranalyseUtils';

// Array van kleuren voor grafieken
const chartColorArray = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#48bb78', '#ed8936'];

interface TijdlijnTabProps {
  leerData: LeerData | null;
}

const TijdlijnTab: React.FC<TijdlijnTabProps> = ({
  leerData
}) => {
  // State voor tijdsranges
  const [activiteitTijdsRange, setActiviteitTijdsRange] = useState<TijdsRange>('week');
  const [prestatieTijdsRange, setPrestatieTijdsRange] = useState<TijdsRange>('week');
  const [focusTijdsRange, setFocusTijdsRange] = useState<TijdsRange>('week');
  const [sessieKwaliteitTijdsRange, setSessieKwaliteitTijdsRange] = useState<TijdsRange>('week');
  const [topCategorieTijdsRange, setTopCategorieTijdsRange] = useState<TijdsRange>('week');
  const [leerpatronenTijdsRange, setLeerpatronenTijdsRange] = useState<TijdsRange>('week');
  const [leitnerBoxHerhalingenTijdsRange, setLeitnerBoxHerhalingenTijdsRange] = useState<TijdsRange>('week');

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

  // Data generatie
  const leerDataManager = useMemo(() => getLeerDataManager(), []);

  const activiteitData = useMemo(() => {
    if (!leerData) return null;
    
    switch (activiteitTijdsRange) {
      case 'week':
        return leerDataManager.getDagelijkseActiviteitData(7);
      case 'maand':
        return leerDataManager.getDagelijkseActiviteitData(30);
      case 'drieMaanden':
        return leerDataManager.getWeekelijkseData(13);
      case 'halfJaar':
        return leerDataManager.getWeekelijkseData(26);
      case 'jaar':
        return leerDataManager.getMaandelijkseData(12);
      default:
        return leerDataManager.getDagelijkseActiviteitData(30);
    }
  }, [leerData, activiteitTijdsRange, leerDataManager]);

  const prestatieData = useMemo(() => {
    if (!leerData) return null;
    
    switch (prestatieTijdsRange) {
      case 'week':
        return leerDataManager.getPrestatieDagelijkseData(7);
      case 'maand':
        return leerDataManager.getPrestatieDagelijkseData(30);
      case 'drieMaanden':
        return leerDataManager.getPrestatieWeekelijkseData(13);
      case 'halfJaar':
        return leerDataManager.getPrestatieWeekelijkseData(26);
      case 'jaar':
        return leerDataManager.getPrestatieMaandelijkseData(12);
      default:
        return leerDataManager.getPrestatieDagelijkseData(30);
    }
  }, [leerData, prestatieTijdsRange, leerDataManager]);

  const focusData = useMemo(() => {
    if (!leerData) return null;
    
    switch (focusTijdsRange) {
      case 'week':
        return leerDataManager.getFocusDagelijkseData(7, focusMetric);
      case 'maand':
        return leerDataManager.getFocusDagelijkseData(30, focusMetric);
      case 'drieMaanden':
        return leerDataManager.getFocusWeekelijkseData(13, focusMetric);
      case 'halfJaar':
        return leerDataManager.getFocusWeekelijkseData(26, focusMetric);
      case 'jaar':
        return leerDataManager.getFocusMaandelijkseData(12, focusMetric);
      default:
        return leerDataManager.getFocusDagelijkseData(30, focusMetric);
    }
  }, [leerData, focusTijdsRange, focusMetric, leerDataManager]);

  const sessieKwaliteitData = useMemo(() => {
    if (!leerData) return null;
    
    switch (sessieKwaliteitTijdsRange) {
      case 'week':
        return leerDataManager.getSessieKwaliteitDagelijkseData(7);
      case 'maand':
        return leerDataManager.getSessieKwaliteitDagelijkseData(30);
      case 'drieMaanden':
        return leerDataManager.getSessieKwaliteitWeekelijkseData(13);
      case 'halfJaar':
        return leerDataManager.getSessieKwaliteitWeekelijkseData(26);
      case 'jaar':
        return leerDataManager.getSessieKwaliteitMaandelijkseData(12);
      default:
        return leerDataManager.getSessieKwaliteitDagelijkseData(30);
    }
  }, [leerData, sessieKwaliteitTijdsRange, leerDataManager]);

  const topCategorieData = useMemo(() => {
    if (!leerData) return null;
    
    switch (topCategorieTijdsRange) {
      case 'week':
        return leerDataManager.getTopCategorieDagelijkseData(7);
      case 'maand':
        return leerDataManager.getTopCategorieDagelijkseData(30);
      case 'drieMaanden':
        return leerDataManager.getTopCategorieWeekelijkseData(13);
      case 'halfJaar':
        return leerDataManager.getTopCategorieWeekelijkseData(26);
      case 'jaar':
        return leerDataManager.getTopCategorieMaandelijkseData(12);
      default:
        return leerDataManager.getTopCategorieDagelijkseData(30);
    }
  }, [leerData, topCategorieTijdsRange, leerDataManager]);

  const leerpatronenData = useMemo(() => {
    if (!leerData) return null;
    
    switch (leerpatronenTijdsRange) {
      case 'week':
        return leerDataManager.getLeitnerTijdlijnData(7);
      case 'maand':
        return leerDataManager.getLeitnerTijdlijnData(30);
      case 'drieMaanden':
        return leerDataManager.getLeitnerWeekelijkseData(13);
      case 'halfJaar':
        return leerDataManager.getLeitnerWeekelijkseData(26);
      case 'jaar':
        return leerDataManager.getLeitnerMaandelijkseData(12);
      default:
        return leerDataManager.getLeitnerTijdlijnData(30);
    }
  }, [leerData, leerpatronenTijdsRange, leerDataManager]);

  const sessiePatronenData = useMemo(() => {
    if (!leerData) return null;
    return leerDataManager.getSessiePatronenData();
  }, [leerData, leerDataManager]);

  const leitnerBoxHerhalingenData = useMemo(() => {
    if (!leerData) return null;
    
    switch (leitnerBoxHerhalingenTijdsRange) {
      case 'week':
        return leerDataManager.getLeitnerBoxHerhalingenTijdlijnData(7);
      case 'maand':
        return leerDataManager.getLeitnerBoxHerhalingenTijdlijnData(30);
      case 'drieMaanden':
        return leerDataManager.getLeitnerBoxHerhalingenWeekelijkseData(13);
      case 'halfJaar':
        return leerDataManager.getLeitnerBoxHerhalingenWeekelijkseData(26);
      case 'jaar':
        return leerDataManager.getLeitnerBoxHerhalingenMaandelijkseData(12);
      default:
        return leerDataManager.getLeitnerBoxHerhalingenTijdlijnData(30);
    }
  }, [leerData, leitnerBoxHerhalingenTijdsRange, leerDataManager]);



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
    label: string
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
      </div>
    </div>
  );

  // Helper functie voor het renderen van grafiek type selector
  const renderGrafiekTypeSelector = (
    grafiekType: GrafiekType,
    setGrafiekType: (type: GrafiekType) => void,
    label: string
  ) => (
    <div className="grafiektype-selector">
      <label>{label}:</label>
      <div className="type-buttons">
        <button
          className={`type-btn ${grafiekType === 'lijn' ? 'active' : ''}`}
          onClick={() => setGrafiekType('lijn')}
        >
          Lijn
        </button>
        <button
          className={`type-btn ${grafiekType === 'staaf' ? 'active' : ''}`}
          onClick={() => setGrafiekType('staaf')}
        >
          Staaf
        </button>
        {label.includes('Leerpatronen') && (
          <button
            className={`type-btn ${grafiekType === 'gestapeld' ? 'active' : ''}`}
            onClick={() => setGrafiekType('gestapeld')}
          >
            Gestapeld
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="tijdlijn-tab">
      {/* Activiteit Overzicht */}
      <div className="grafiek-sectie">
        <div className="sectie-header">
          <h3>Activiteit Overzicht</h3>
          {renderTijdsRangeSelector(activiteitTijdsRange, setActiviteitTijdsRange, 'Periode')}
          {renderGrafiekTypeSelector(activiteitGrafiekType, setActiviteitGrafiekType, 'Grafiek Type')}
        </div>
        {activiteitData && (
          <div className="grafiek-container">
            {activiteitGrafiekType === 'lijn' ? (
              <Line
                data={{
                  labels: generateChartLabels(activiteitData, activiteitTijdsRange),
                  datasets: [
                    {
                      label: 'Opdrachten',
                      data: activiteitData.map((d: any) => d.opdrachten),
                      borderColor: chartColorArray[0],
                      backgroundColor: chartColorArray[0] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Speeltijd (min)',
                      data: activiteitData.map((d: any) => d.speeltijd),
                      borderColor: chartColorArray[1],
                      backgroundColor: chartColorArray[1] + '20',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  ...lineChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal/Tijd' }
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={{
                  labels: generateChartLabels(activiteitData, activiteitTijdsRange),
                  datasets: [
                    {
                      label: 'Opdrachten',
                      data: activiteitData.map((d: any) => d.opdrachten),
                      backgroundColor: chartColorArray[0] + '80',
                      borderColor: chartColorArray[0],
                      borderWidth: 1
                    },
                    {
                      label: 'Speeltijd (min)',
                      data: activiteitData.map((d: any) => d.speeltijd),
                      backgroundColor: chartColorArray[1] + '80',
                      borderColor: chartColorArray[1],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  ...barChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal/Tijd' }
                    }
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Prestatie Analyse */}
      <div className="grafiek-sectie">
        <div className="sectie-header">
          <h3>Prestatie Analyse</h3>
          {renderTijdsRangeSelector(prestatieTijdsRange, setPrestatieTijdsRange, 'Periode')}
          {renderGrafiekTypeSelector(prestatieGrafiekType, setPrestatieGrafiekType, 'Grafiek Type')}
        </div>
        {prestatieData && (
          <div className="grafiek-container">
            {prestatieGrafiekType === 'lijn' ? (
              <Line
                data={{
                  labels: generateChartLabels(prestatieData, prestatieTijdsRange),
                  datasets: [
                    {
                      label: 'Gemiddelde Score',
                      data: prestatieData.map((d: any) => d.gemiddeldeScore),
                      borderColor: chartColorArray[2],
                      backgroundColor: chartColorArray[2] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Gemiddelde Tijd (min)',
                      data: prestatieData.map((d: any) => d.gemiddeldeTijd),
                      borderColor: chartColorArray[3],
                      backgroundColor: chartColorArray[3] + '20',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  ...lineChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Score/Tijd' }
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={{
                  labels: generateChartLabels(prestatieData, prestatieTijdsRange),
                  datasets: [
                    {
                      label: 'Gemiddelde Score',
                      data: prestatieData.map((d: any) => d.gemiddeldeScore),
                      backgroundColor: chartColorArray[2] + '80',
                      borderColor: chartColorArray[2],
                      borderWidth: 1
                    },
                    {
                      label: 'Gemiddelde Tijd (min)',
                      data: prestatieData.map((d: any) => d.gemiddeldeTijd),
                      backgroundColor: chartColorArray[3] + '80',
                      borderColor: chartColorArray[3],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  ...barChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Score/Tijd' }
                    }
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Focus Analyse */}
      <div className="grafiek-sectie">
        <div className="sectie-header">
          <h3>Focus Analyse</h3>
          {renderTijdsRangeSelector(focusTijdsRange, setFocusTijdsRange, 'Periode')}
          {renderGrafiekTypeSelector(focusGrafiekType, setFocusGrafiekType, 'Grafiek Type')}
          <div className="metric-selector">
            <label>Metric:</label>
            <div className="metric-buttons">
              <button
                className={`metric-btn ${focusMetric === 'tijd' ? 'active' : ''}`}
                onClick={() => setFocusMetric('tijd')}
              >
                Tijd
              </button>
              <button
                className={`metric-btn ${focusMetric === 'aantal' ? 'active' : ''}`}
                onClick={() => setFocusMetric('aantal')}
              >
                Aantal
              </button>
            </div>
          </div>
        </div>
        {focusData && (
          <div className="grafiek-container">
            {focusGrafiekType === 'lijn' ? (
              <Line
                data={{
                  labels: generateChartLabels(focusData, focusTijdsRange),
                  datasets: [
                    {
                      label: 'Serieuze Modus',
                      data: focusData.map((d: any) => d.serieuzeModus),
                      borderColor: chartColorArray[4],
                      backgroundColor: chartColorArray[4] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Normale Modus',
                      data: focusData.map((d: any) => d.normaleModus),
                      borderColor: chartColorArray[5],
                      backgroundColor: chartColorArray[5] + '20',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  ...lineChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: focusMetric === 'tijd' ? 'Tijd (min)' : 'Aantal' }
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={{
                  labels: generateChartLabels(focusData, focusTijdsRange),
                  datasets: [
                    {
                      label: 'Serieuze Modus',
                      data: focusData.map((d: any) => d.serieuzeModus),
                      backgroundColor: chartColorArray[4] + '80',
                      borderColor: chartColorArray[4],
                      borderWidth: 1
                    },
                    {
                      label: 'Normale Modus',
                      data: focusData.map((d: any) => d.normaleModus),
                      backgroundColor: chartColorArray[5] + '80',
                      borderColor: chartColorArray[5],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  ...barChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: focusMetric === 'tijd' ? 'Tijd (min)' : 'Aantal' }
                    }
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Sessie Kwaliteit */}
      <div className="grafiek-sectie">
        <div className="sectie-header">
          <h3>Sessie Kwaliteit</h3>
          {renderTijdsRangeSelector(sessieKwaliteitTijdsRange, setSessieKwaliteitTijdsRange, 'Periode')}
          {renderGrafiekTypeSelector(sessieKwaliteitGrafiekType, setSessieKwaliteitGrafiekType, 'Grafiek Type')}
        </div>
        {sessieKwaliteitData && (
          <div className="grafiek-container">
            {sessieKwaliteitGrafiekType === 'lijn' ? (
              <Line
                data={{
                  labels: generateChartLabels(sessieKwaliteitData, sessieKwaliteitTijdsRange),
                  datasets: [
                    {
                      label: 'Aantal Sessies',
                      data: sessieKwaliteitData.map((d: any) => d.aantalSessies),
                      borderColor: chartColorArray[6],
                      backgroundColor: chartColorArray[6] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Gemiddelde Duur (min)',
                      data: sessieKwaliteitData.map((d: any) => d.gemiddeldeDuur),
                      borderColor: chartColorArray[7],
                      backgroundColor: chartColorArray[7] + '20',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  ...lineChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal/Duur' }
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={{
                  labels: generateChartLabels(sessieKwaliteitData, sessieKwaliteitTijdsRange),
                  datasets: [
                    {
                      label: 'Aantal Sessies',
                      data: sessieKwaliteitData.map((d: any) => d.aantalSessies),
                      backgroundColor: chartColorArray[6] + '80',
                      borderColor: chartColorArray[6],
                      borderWidth: 1
                    },
                    {
                      label: 'Gemiddelde Duur (min)',
                      data: sessieKwaliteitData.map((d: any) => d.gemiddeldeDuur),
                      backgroundColor: chartColorArray[7] + '80',
                      borderColor: chartColorArray[7],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  ...barChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal/Duur' }
                    }
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Top 5 Categorieën */}
      <div className="grafiek-sectie">
        <div className="sectie-header">
          <h3>Top 5 Categorieën</h3>
          {renderTijdsRangeSelector(topCategorieTijdsRange, setTopCategorieTijdsRange, 'Periode')}
          {renderGrafiekTypeSelector(topCategorieGrafiekType, setTopCategorieGrafiekType, 'Grafiek Type')}
        </div>
        {topCategorieData && (
          <div className="grafiek-container">
            {topCategorieGrafiekType === 'lijn' ? (
              <Line
                data={{
                  labels: generateChartLabels(topCategorieData, topCategorieTijdsRange),
                  datasets: Object.keys(topCategorieData[0] || {}).filter(key => 
                    key !== 'datum' && key !== 'week' && key !== 'maand'
                  ).slice(0, 5).map((categorie, index) => ({
                    label: categorie,
                    data: topCategorieData.map((d: any) => d[categorie] || 0),
                    borderColor: chartColorArray[index % chartColorArray.length],
                    backgroundColor: chartColorArray[index % chartColorArray.length] + '20',
                    tension: 0.4
                  }))
                }}
                options={{
                  ...lineChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal Opdrachten' }
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={{
                  labels: generateChartLabels(topCategorieData, topCategorieTijdsRange),
                  datasets: Object.keys(topCategorieData[0] || {}).filter(key => 
                    key !== 'datum' && key !== 'week' && key !== 'maand'
                  ).slice(0, 5).map((categorie, index) => ({
                    label: categorie,
                    data: topCategorieData.map((d: any) => d[categorie] || 0),
                    backgroundColor: chartColorArray[index % chartColorArray.length] + '80',
                    borderColor: chartColorArray[index % chartColorArray.length],
                    borderWidth: 1
                  }))
                }}
                options={{
                  ...barChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal Opdrachten' }
                    }
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Leerpatronen */}
      <div className="grafiek-sectie">
        <div className="sectie-header">
          <h3>Leerpatronen</h3>
          {renderTijdsRangeSelector(leerpatronenTijdsRange, setLeerpatronenTijdsRange, 'Periode')}
          {renderGrafiekTypeSelector(leerpatronenGrafiekType, setLeerpatronenGrafiekType, 'Grafiek Type')}
        </div>
        {leerpatronenData && (
          <div className="grafiek-container">
            {leerpatronenGrafiekType === 'lijn' ? (
              <Line
                data={{
                  labels: generateChartLabels(leerpatronenData, leerpatronenTijdsRange),
                  datasets: [
                    {
                      label: 'Nieuwe Opdrachten',
                      data: leerpatronenData.map((d: any) => d.nieuweOpdrachten),
                      borderColor: chartColorArray[0],
                      backgroundColor: chartColorArray[0] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Herhalingen',
                      data: leerpatronenData.map((d: any) => d.herhalingen),
                      borderColor: chartColorArray[1],
                      backgroundColor: chartColorArray[1] + '20',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  ...lineChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal Opdrachten' }
                    }
                  }
                }}
              />
            ) : leerpatronenGrafiekType === 'staaf' ? (
              <Bar
                data={{
                  labels: generateChartLabels(leerpatronenData, leerpatronenTijdsRange),
                  datasets: [
                    {
                      label: 'Nieuwe Opdrachten',
                      data: leerpatronenData.map((d: any) => d.nieuweOpdrachten),
                      backgroundColor: chartColorArray[0] + '80',
                      borderColor: chartColorArray[0],
                      borderWidth: 1
                    },
                    {
                      label: 'Herhalingen',
                      data: leerpatronenData.map((d: any) => d.herhalingen),
                      backgroundColor: chartColorArray[1] + '80',
                      borderColor: chartColorArray[1],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  ...barChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal Opdrachten' }
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={{
                  labels: generateChartLabels(leerpatronenData, leerpatronenTijdsRange),
                  datasets: [
                    {
                      label: 'Nieuwe Opdrachten',
                      data: leerpatronenData.map((d: any) => d.nieuweOpdrachten),
                      backgroundColor: chartColorArray[0] + '80',
                      borderColor: chartColorArray[0],
                      borderWidth: 1,
                      stack: 'stack0'
                    },
                    {
                      label: 'Herhalingen',
                      data: leerpatronenData.map((d: any) => d.herhalingen),
                      backgroundColor: chartColorArray[1] + '80',
                      borderColor: chartColorArray[1],
                      borderWidth: 1,
                      stack: 'stack0'
                    }
                  ]
                }}
                options={{
                  ...barChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' },
                      stacked: true
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal Opdrachten' },
                      stacked: true
                    }
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Sessie Patronen */}
      <div className="grafiek-sectie">
        <div className="sectie-header">
          <h3>Sessie Patronen</h3>
        </div>
        {sessiePatronenData && (
          <div className="grafiek-container">
            <Bar
              data={{
                labels: sessiePatronenData.map((d: any) => `${d.uur}:00`),
                datasets: [
                  {
                    label: 'Aantal Sessies',
                    data: sessiePatronenData.map((d: any) => d.sessies),
                    backgroundColor: chartColorArray[2] + '80',
                    borderColor: chartColorArray[2],
                    borderWidth: 1
                  },
                  {
                    label: 'Totale Tijd (min)',
                    data: sessiePatronenData.map((d: any) => d.totaleTijd),
                    backgroundColor: chartColorArray[3] + '80',
                    borderColor: chartColorArray[3],
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                ...barChartConfig,
                scales: {
                  x: {
                    display: true,
                    title: { display: true, text: 'Uur van de dag' }
                  },
                  y: {
                    display: true,
                    title: { display: true, text: 'Aantal/Tijd' }
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Leitner Box Herhalingen */}
      <div className="grafiek-sectie">
        <div className="sectie-header">
          <h3>Leitner Box Herhalingen</h3>
          {renderTijdsRangeSelector(leitnerBoxHerhalingenTijdsRange, setLeitnerBoxHerhalingenTijdsRange, 'Periode')}
          {renderGrafiekTypeSelector(leitnerBoxHerhalingenGrafiekType, setLeitnerBoxHerhalingenGrafiekType, 'Grafiek Type')}
        </div>
        {leitnerBoxHerhalingenData && (
          <div className="grafiek-container">
            {leitnerBoxHerhalingenGrafiekType === 'lijn' ? (
              <Line
                data={{
                  labels: generateChartLabels(leitnerBoxHerhalingenData, leitnerBoxHerhalingenTijdsRange),
                  datasets: [
                    {
                      label: 'Box 0',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box0),
                      borderColor: chartColorArray[0],
                      backgroundColor: chartColorArray[0] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Box 1',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box1),
                      borderColor: chartColorArray[1],
                      backgroundColor: chartColorArray[1] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Box 2',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box2),
                      borderColor: chartColorArray[2],
                      backgroundColor: chartColorArray[2] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Box 3',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box3),
                      borderColor: chartColorArray[3],
                      backgroundColor: chartColorArray[3] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Box 4',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box4),
                      borderColor: chartColorArray[4],
                      backgroundColor: chartColorArray[4] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Box 5',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box5),
                      borderColor: chartColorArray[5],
                      backgroundColor: chartColorArray[5] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Box 6',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box6),
                      borderColor: chartColorArray[6],
                      backgroundColor: chartColorArray[6] + '20',
                      tension: 0.4
                    },
                    {
                      label: 'Box 7',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box7),
                      borderColor: chartColorArray[7],
                      backgroundColor: chartColorArray[7] + '20',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  ...lineChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal Herhalingen' }
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={{
                  labels: generateChartLabels(leitnerBoxHerhalingenData, leitnerBoxHerhalingenTijdsRange),
                  datasets: [
                    {
                      label: 'Box 0',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box0),
                      backgroundColor: chartColorArray[0] + '80',
                      borderColor: chartColorArray[0],
                      borderWidth: 1
                    },
                    {
                      label: 'Box 1',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box1),
                      backgroundColor: chartColorArray[1] + '80',
                      borderColor: chartColorArray[1],
                      borderWidth: 1
                    },
                    {
                      label: 'Box 2',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box2),
                      backgroundColor: chartColorArray[2] + '80',
                      borderColor: chartColorArray[2],
                      borderWidth: 1
                    },
                    {
                      label: 'Box 3',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box3),
                      backgroundColor: chartColorArray[3] + '80',
                      borderColor: chartColorArray[3],
                      borderWidth: 1
                    },
                    {
                      label: 'Box 4',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box4),
                      backgroundColor: chartColorArray[4] + '80',
                      borderColor: chartColorArray[4],
                      borderWidth: 1
                    },
                    {
                      label: 'Box 5',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box5),
                      backgroundColor: chartColorArray[5] + '80',
                      borderColor: chartColorArray[5],
                      borderWidth: 1
                    },
                    {
                      label: 'Box 6',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box6),
                      backgroundColor: chartColorArray[6] + '80',
                      borderColor: chartColorArray[6],
                      borderWidth: 1
                    },
                    {
                      label: 'Box 7',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box7),
                      backgroundColor: chartColorArray[7] + '80',
                      borderColor: chartColorArray[7],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  ...barChartConfig,
                  scales: {
                    x: {
                      display: true,
                      title: { display: true, text: 'Datum' }
                    },
                    y: {
                      display: true,
                      title: { display: true, text: 'Aantal Herhalingen' }
                    }
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TijdlijnTab;
