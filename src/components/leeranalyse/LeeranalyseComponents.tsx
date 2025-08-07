import React from 'react';
import { Line } from 'react-chartjs-2';
import { SparklineData, LeitnerVerdeling, MasteryData } from './LeeranalyseTypes';

export const ScoreTrendSparkline = ({ data }: { data: SparklineData[] }) => {
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

export const LeitnerVerdelingBar = ({ verdeling }: { verdeling: LeitnerVerdeling }) => {
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
      <div className="verdeling-bar-header">
        <h5>📦 Leitner Box Verdeling</h5>
        <small>Totaal: {totaal} opdrachten</small>
      </div>
      <div className="verdeling-bar">
        {Object.entries(verdeling).map(([boxId, count]) => {
          const percentage = (count / totaal) * 100;
          const boxNummer = parseInt(boxId);
          const boxLabel = boxNummer === 7 ? 'Beheerst' : `Box ${boxNummer}`;
          
          return (
            <div key={boxId} className="verdeling-segment" style={{ width: `${percentage}%` }}>
              <div 
                className="verdeling-segment-bar" 
                style={{ backgroundColor: boxKleuren[boxNummer] }}
                title={`${boxLabel}: ${count} opdrachten (${percentage.toFixed(1)}%)`}
              />
              <span className="verdeling-segment-label">{boxLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MasteryIndicator = ({ level, percentage }: MasteryData) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return '#ff6b6b';
      case 'Gevorderd': return '#feca57';
      case 'Expert': return '#48dbfb';
      case 'Master': return '#0abde3';
      case 'Grandmaster': return '#54a0ff';
      default: return '#888';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Beginner': return '🌱';
      case 'Gevorderd': return '🌿';
      case 'Expert': return '🌳';
      case 'Master': return '🏆';
      case 'Grandmaster': return '👑';
      default: return '📊';
    }
  };

  return (
    <div className="mastery-indicator" style={{ color: getLevelColor(level) }}>
      <span className="mastery-icon">{getLevelIcon(level)}</span>
      <span className="mastery-level">{level}</span>
      <span className="mastery-percentage">({percentage.toFixed(0)}%)</span>
    </div>
  );
};

export const RankingCard = ({ 
  rankingData, 
  type, 
  categoryType 
}: { 
  rankingData: any, 
  type: 'Beste' | 'Verbeterpunt', 
  categoryType: 'Hoofd' | 'Sub' 
}) => {
  if (!rankingData) return null;

  const getTypeIcon = (type: string) => {
    return type === 'Beste' ? '🥇' : '📈';
  };

  const getTypeColor = (type: string) => {
    return type === 'Beste' ? '#4ade80' : '#f59e0b';
  };

  return (
    <div className={`vergelijking-card ${type.toLowerCase()}`}>
      <h5>
        {getTypeIcon(type)} {type} {categoryType === 'Hoofd' ? 'Hoofdcategorie' : 'Subcategorie'}
      </h5>
      <div className="categorie-naam" style={{ color: getTypeColor(type) }}>
        {rankingData.categorie}
      </div>
      <div className="categorie-score">
        Score: {rankingData.score.toFixed(1)}
      </div>
      <div className="categorie-details">
        <small>
          Dekking: {rankingData.dekking.toFixed(0)}% | 
          Gem. Box: {rankingData.gemiddeldeBox.toFixed(1)} | 
          Beheersing: {rankingData.beheersing.toFixed(0)}%
        </small>
      </div>
    </div>
  );
};
