import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  Filler, 
} from 'chart.js';

// Registreer alle benodigde Chart.js componenten
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  Filler
);

// Basis configuratie voor alle grafieken
export const baseChartConfig = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: {
          size: 12,
          family: 'Inter, sans-serif'
        },
        color: '#333'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#667eea',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      titleFont: {
        size: 14,
        weight: 'bold' as const
      },
      bodyFont: {
        size: 12
      }
    }
  }
};

// Kleuren palet voor grafieken
export const chartColors = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#48bb78',
  warning: '#ed8936',
  danger: '#f56565',
  info: '#4299e1',
  light: '#e2e8f0',
  dark: '#2d3748',
  gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
};

// Configuratie voor lijn grafiek (score trends)
export const lineChartConfig = {
  ...baseChartConfig,
  scales: {
    x: {
      grid: {
        color: '#e2e8f0',
        drawBorder: false
      },
      ticks: {
        color: '#666',
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      max: 5,
      grid: {
        color: '#e2e8f0',
        drawBorder: false
      },
      ticks: {
        color: '#666',
        font: {
          size: 11
        },
        callback: function(value: any) {
          return value + '/5';
        }
      }
    }
  }
};

// Configuratie voor staafdiagram (categorieën)
export const barChartConfig = {
  ...baseChartConfig,
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#666',
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#e2e8f0',
        drawBorder: false
      },
      ticks: {
        color: '#666',
        font: {
          size: 11
        }
      }
    }
  }
};

// Configuratie voor radar chart (categorie vergelijking)
export const radarChartConfig = {
  ...baseChartConfig,
  scales: {
    r: {
      beginAtZero: true,
      max: 5,
      ticks: {
        color: '#666',
        font: {
          size: 11
        },
        callback: function(value: any) {
          return value + '/5';
        }
      },
      grid: {
        color: '#e2e8f0'
      }
    }
  }
};

// Configuratie voor doughnut chart (achievements)
export const doughnutChartConfig = {
  ...baseChartConfig,
  cutout: '60%',
  plugins: {
    ...baseChartConfig.plugins,
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 11
        }
      }
    }
  }
};

// Helper functie voor het genereren van gradient kleuren
export const createGradient = (ctx: CanvasRenderingContext2D, colors: string[]) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  return gradient;
};

// Helper functie voor het formatteren van datums
export const formatChartDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit'
  });
};

// Helper functie voor het formatteren van tijd
export const formatChartTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}u ${remainingMinutes}m`;
}; 