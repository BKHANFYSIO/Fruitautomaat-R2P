import { 
  lineChartConfig, 
  barChartConfig 
} from '../../utils/chartConfigs';

// Helper functie voor correcte weeknummer berekening (ISO week)
export const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Helper functie voor het formatteren van datums
export const formatDate = (date: Date, format: 'short' | 'long' = 'short') => {
  if (format === 'short') {
    return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Helper functie voor het formatteren van percentages
export const formatPercentage = (value: number, decimals: number = 1) => {
  return `${value.toFixed(decimals)}%`;
};

// Helper functie voor het formatteren van getallen
export const formatNumber = (value: number, decimals: number = 1) => {
  return value.toFixed(decimals);
};

// Helper functie voor het formatteren van tijd
export const formatTijd = (seconds: number) => {
  const uren = Math.floor(seconds / 3600);
  const minuten = Math.floor((seconds % 3600) / 60);
  const seconden = seconds % 60;

  if (uren > 0) {
    return `${uren}u ${minuten}m ${seconden}s`;
  } else if (minuten > 0) {
    return `${minuten}m ${seconden}s`;
  } else {
    return `${seconden}s`;
  }
};

// Helper functie voor het genereren van grafiek labels
export const generateChartLabels = (data: any[], tijdsRange: string) => {
  return data.map(d => {
    if ('datum' in d) {
      return new Date(d.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } else if ('week' in d) {
      const date = new Date(d.week);
      const weekNumber = getWeekNumber(date);
      return `Week ${weekNumber} (${date.getFullYear()})`;
    } else if ('maand' in d) {
      const [year, month] = d.maand.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
    }
    return '';
  });
};

// Helper functie voor het genereren van grafiek configuratie
export const generateChartConfig = (tijdsRange: string, grafiekType: string) => {
  const baseConfig = grafiekType === 'lijn' ? lineChartConfig : barChartConfig;
  
  return {
    ...baseConfig,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: tijdsRange === 'week' || tijdsRange === 'maand' ? 'Datum' :
                tijdsRange === 'drieMaanden' || tijdsRange === 'halfJaar' ? 'Week' : 'Maand'
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
        min: 0,
        grid: {
          color: '#4ade8020'
        },
        ticks: {
          color: '#4ade80'
        }
      }
    }
  };
};
