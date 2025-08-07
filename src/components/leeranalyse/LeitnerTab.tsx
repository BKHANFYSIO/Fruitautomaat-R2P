import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { getLeerDataManager } from '../../data/leerDataManager';
import type { TabProps } from './LeeranalyseTypes';
import { barChartConfig } from '../../utils/chartConfigs';

interface LeitnerTabProps extends TabProps {
}

const LeitnerTab: React.FC<LeitnerTabProps> = ({
  leerData,
  leitnerData
}) => {
  const [showLeitnerUitleg, setShowLeitnerUitleg] = useState(false);

  // Data generatie
  const leerDataManager = React.useMemo(() => {
    if (!leerData) return null;
    return getLeerDataManager();
  }, [leerData]);

  const leitnerStats = React.useMemo(() => {
    if (!leerDataManager || !leitnerData) return null;
    return leerDataManager.getLeitnerStatistieken();
  }, [leerDataManager, leitnerData]);

  const leitnerBoxData = React.useMemo(() => {
    if (!leerDataManager || !leitnerStats) return null;
    
    const boxVerdeling = Object.values(leitnerStats.opdrachtenPerBox);
    const chartColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#48bb78', '#ed8936'];
    
    return {
      labels: ['Box 0', 'Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5', 'Box 6', 'Beheerst'],
      datasets: [{
        label: 'Aantal opdrachten',
        data: boxVerdeling,
        backgroundColor: chartColors,
        borderColor: chartColors,
        borderWidth: 1
      }]
    };
  }, [leerDataManager, leitnerStats]);

  if (!leitnerStats) {
    return (
      <div className="leitner-tab">
        <h3>🔄 Leitner Modus</h3>
        <p>Leitner modus niet geactiveerd.</p>
      </div>
    );
  }

  return (
    <div className="leitner-tab">
      <h3>🔄 Leitner Modus</h3>
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
    </div>
  );
};

export default LeitnerTab;
