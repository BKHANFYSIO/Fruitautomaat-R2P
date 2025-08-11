export const TIPS_CONFIG = {
  // Ritme en limieten
  tipInterval: 3, // 1 tip per 3 sterke winmomenten
  maxTipsPerSession: 6,
  cooldownDays: 7,
  sessionRecentCount: 3,

  // Gewichten voor hybride selectie
  weights: {
    modus: 0.5,
    combinatie: 0.3,
    analyse: 0.2,
    algemeen: 0.1,
  },

  // Drempels voor dynamische analyse-tips
  thresholds: {
    coveragePercents: [20, 40, 60, 80],
    masteryPercents: [0.1, 20, 50], // 0.1 ~ eerste keer >0%
    avgBoxValues: [2, 4, 6],
    timelineDays: {
      week: 7,
      month: 30,
      quarter: 90,
    },
  },
} as const;

export type TipsConfig = typeof TIPS_CONFIG;


