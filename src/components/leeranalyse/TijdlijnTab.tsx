import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { getLeerDataManager } from '../../data/leerDataManager';
import { 
  lineChartConfig, 
  barChartConfig
} from '../../utils/chartConfigs';
import type { TabProps, TijdsRange, GrafiekType, FocusMetric } from './LeeranalyseTypes';
import { getWeekNumber, generateChartLabels, generateChartConfig } from './LeeranalyseUtils';

// Array van kleuren voor grafieken
const chartColorArray = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#48bb78', '#ed8936'];

interface TijdlijnTabProps extends TabProps {
  // Data props
  activiteitData: any;
  prestatieData: any;
  focusData: any;
  sessieKwaliteitData: any;
  topCategorieData: any;
  leerpatronenData: any;
  sessiePatronenData: any;
  leitnerBoxHerhalingenData: any;
  streakData: any;
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
  streakData
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
      
      {/* Dagelijkse Activiteit */}
      <div className="tijdlijn-sectie">
        <div className="dagelijkse-activiteit-header">
          <h4>📊 Activiteit Overzicht</h4>
          {renderTijdsRangeSelector(activiteitTijdsRange, setActiviteitTijdsRange, 'Tijdsperiode')}
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
          <div className="chart-container">
            {activiteitGrafiekType === 'lijn' ? (
              <Line 
                data={{
                  labels: generateChartLabels(activiteitData, activiteitTijdsRange),
                  datasets: [
                    {
                      label: 'Opdrachten',
                      data: activiteitData.map((d: any) => d.opdrachten),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Speeltijd (minuten)',
                      data: activiteitData.map((d: any) => d.speeltijd),
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
                  labels: generateChartLabels(activiteitData, activiteitTijdsRange),
                  datasets: [
                    {
                      label: 'Opdrachten',
                      data: activiteitData.map((d: any) => d.opdrachten),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Speeltijd (minuten)',
                      data: activiteitData.map((d: any) => d.speeltijd),
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
          {renderTijdsRangeSelector(prestatieTijdsRange, setPrestatieTijdsRange, 'Tijdsperiode')}
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
          <div className="chart-container">
            {prestatieGrafiekType === 'lijn' ? (
              <Line 
                data={{
                  labels: generateChartLabels(prestatieData, prestatieTijdsRange),
                  datasets: [
                    {
                      label: 'Gemiddelde Score',
                      data: prestatieData.map((d: any) => d.gemiddeldeScore),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Gemiddelde Tijd (minuten)',
                      data: prestatieData.map((d: any) => d.gemiddeldeTijd),
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
                  labels: generateChartLabels(prestatieData, prestatieTijdsRange),
                  datasets: [
                    {
                      label: 'Gemiddelde Score',
                      data: prestatieData.map((d: any) => d.gemiddeldeScore),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Gemiddelde Tijd (minuten)',
                      data: prestatieData.map((d: any) => d.gemiddeldeTijd),
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

      {/* Focus Analyse */}
      <div className="tijdlijn-sectie">
        <div className="dagelijkse-activiteit-header">
          <h4>🎯 Focus Analyse</h4>
          {renderTijdsRangeSelector(focusTijdsRange, setFocusTijdsRange, 'Tijdsperiode')}
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
            'De groene lijn toont serieuze modus sessies, terwijl de oranje lijn normale modus sessies toont.' :
            'De groene staven tonen serieuze modus sessies, terwijl de oranje staven normale modus sessies tonen.'
          }
          Dit helpt je om je focus strategieën te optimaliseren.
        </p>
        {focusData && focusData.length > 0 ? (
          <div className="chart-container">
            {focusGrafiekType === 'lijn' ? (
              <Line 
                data={{
                  labels: generateChartLabels(focusData, focusTijdsRange),
                  datasets: [
                    {
                      label: 'Serieuze Modus',
                      data: focusData.map((d: any) => focusMetric === 'tijd' ? d.serieuzeModus : d.serieuzeModus),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Normale Modus',
                      data: focusData.map((d: any) => focusMetric === 'tijd' ? d.normaleModus : d.normaleModus),
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
                        text: focusMetric === 'tijd' ? 'Serieuze Modus (minuten)' : 'Serieuze Modus (aantal)',
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
                        text: focusMetric === 'tijd' ? 'Normale Modus (minuten)' : 'Normale Modus (aantal)',
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
                  labels: generateChartLabels(focusData, focusTijdsRange),
                  datasets: [
                    {
                      label: 'Serieuze Modus',
                      data: focusData.map((d: any) => focusMetric === 'tijd' ? d.serieuzeModus : d.serieuzeModus),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Normale Modus',
                      data: focusData.map((d: any) => focusMetric === 'tijd' ? d.normaleModus : d.normaleModus),
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
                        text: focusMetric === 'tijd' ? 'Serieuze Modus (minuten)' : 'Serieuze Modus (aantal)',
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
                        text: focusMetric === 'tijd' ? 'Normale Modus (minuten)' : 'Normale Modus (aantal)',
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
          {renderTijdsRangeSelector(sessieKwaliteitTijdsRange, setSessieKwaliteitTijdsRange, 'Tijdsperiode')}
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
          <div className="chart-container">
            {sessieKwaliteitGrafiekType === 'lijn' ? (
              <Line 
                data={{
                  labels: generateChartLabels(sessieKwaliteitData, sessieKwaliteitTijdsRange),
                  datasets: [
                    {
                      label: 'Aantal Sessies',
                      data: sessieKwaliteitData.map((d: any) => d.aantalSessies),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Gemiddelde Duur (minuten)',
                      data: sessieKwaliteitData.map((d: any) => d.gemiddeldeDuur),
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
                  labels: generateChartLabels(sessieKwaliteitData, sessieKwaliteitTijdsRange),
                  datasets: [
                    {
                      label: 'Aantal Sessies',
                      data: sessieKwaliteitData.map((d: any) => d.aantalSessies),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Gemiddelde Duur (minuten)',
                      data: sessieKwaliteitData.map((d: any) => d.gemiddeldeDuur),
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
          {renderTijdsRangeSelector(topCategorieTijdsRange, setTopCategorieTijdsRange, 'Tijdsperiode')}
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
          <div className="chart-container">
            {topCategorieGrafiekType === 'lijn' ? (
              <Line 
                data={{
                  labels: generateChartLabels(topCategorieData, topCategorieTijdsRange),
                  datasets: Object.keys(topCategorieData[0] || {})
                    .filter(key => !['datum', 'week', 'maand'].includes(key))
                    .slice(0, 5)
                    .map((categorie, index) => ({
                      label: categorie,
                      data: topCategorieData.map((d: any) => d[categorie] || 0),
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
                  labels: generateChartLabels(topCategorieData, topCategorieTijdsRange),
                  datasets: Object.keys(topCategorieData[0] || {})
                    .filter(key => !['datum', 'week', 'maand'].includes(key))
                    .slice(0, 5)
                    .map((categorie, index) => ({
                      label: categorie,
                      data: topCategorieData.map((d: any) => d[categorie] || 0),
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
          {renderTijdsRangeSelector(leerpatronenTijdsRange, setLeerpatronenTijdsRange, 'Tijdsperiode')}
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
          <div className="chart-container">
            {leerpatronenGrafiekType === 'lijn' ? (
              <Line 
                data={{
                  labels: generateChartLabels(leerpatronenData, leerpatronenTijdsRange),
                  datasets: [
                    {
                      label: 'Nieuwe Opdrachten',
                      data: leerpatronenData.map((d: any) => d.nieuweOpdrachten),
                      borderColor: '#4ade80',
                      backgroundColor: '#4ade8020',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Herhalingen',
                      data: leerpatronenData.map((d: any) => d.herhalingen),
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
                  labels: generateChartLabels(leerpatronenData, leerpatronenTijdsRange),
                  datasets: [
                    {
                      label: 'Nieuwe Opdrachten',
                      data: leerpatronenData.map((d: any) => d.nieuweOpdrachten),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      stack: 'stack1'
                    },
                    {
                      label: 'Herhalingen',
                      data: leerpatronenData.map((d: any) => d.herhalingen),
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
                  labels: generateChartLabels(leerpatronenData, leerpatronenTijdsRange),
                  datasets: [
                    {
                      label: 'Nieuwe Opdrachten',
                      data: leerpatronenData.map((d: any) => d.nieuweOpdrachten),
                      backgroundColor: '#4ade80',
                      borderColor: '#4ade80',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Herhalingen',
                      data: leerpatronenData.map((d: any) => d.herhalingen),
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
          <div className="chart-container">
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
      <div className="tijdlijn-sectie">
        <div className="dagelijkse-activiteit-header">
          <h4>📚 Leitner Box Herhalingen</h4>
          {renderTijdsRangeSelector(leitnerBoxHerhalingenTijdsRange, setLeitnerBoxHerhalingenTijdsRange, 'Tijdsperiode')}
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
          <div className="chart-container">
            {leitnerBoxHerhalingenGrafiekType === 'lijn' ? (
              <Line 
                data={{
                  labels: generateChartLabels(leitnerBoxHerhalingenData, leitnerBoxHerhalingenTijdsRange),
                  datasets: [
                    {
                      label: 'Box 0',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box0),
                      borderColor: '#ef4444',
                      backgroundColor: '#ef444420',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 1',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box1),
                      borderColor: '#f97316',
                      backgroundColor: '#f9731620',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 2',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box2),
                      borderColor: '#eab308',
                      backgroundColor: '#eab30820',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 3',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box3),
                      borderColor: '#22c55e',
                      backgroundColor: '#22c5520',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 4',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box4),
                      borderColor: '#06b6d4',
                      backgroundColor: '#06b6d420',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 5',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box5),
                      borderColor: '#8b5cf6',
                      backgroundColor: '#8b5cf620',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 6',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box6),
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
                  labels: generateChartLabels(leitnerBoxHerhalingenData, leitnerBoxHerhalingenTijdsRange),
                  datasets: [
                    {
                      label: 'Box 0',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box0),
                      backgroundColor: '#ef4444',
                      borderColor: '#ef4444',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 1',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box1),
                      backgroundColor: '#f97316',
                      borderColor: '#f97316',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 2',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box2),
                      backgroundColor: '#eab308',
                      borderColor: '#eab308',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 3',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box3),
                      backgroundColor: '#22c55e',
                      borderColor: '#22c55e',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 4',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box4),
                      backgroundColor: '#06b6d4',
                      borderColor: '#06b6d4',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 5',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box5),
                      backgroundColor: '#8b5cf6',
                      borderColor: '#8b5cf6',
                      yAxisID: 'y'
                    },
                    {
                      label: 'Box 6',
                      data: leitnerBoxHerhalingenData.map((d: any) => d.box6),
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
