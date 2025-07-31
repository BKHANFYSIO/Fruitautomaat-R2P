export interface AppConfig {
  title: string;
  subtitle?: string;
  institution: string;
  department: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Standaard configuratie voor Return2Performance
export const defaultAppConfig: AppConfig = {
  title: "Return2Performance",
  subtitle: "Leeranalyse Certificaat",
  institution: "Hogeschool van Arnhem en Nijmegen",
  department: "Opleiding Fysiotherapie",
  colors: {
    primary: "#667eea", // HAN blauw
    secondary: "#764ba2", // HAN paars
    accent: "#48bb78" // HAN groen
  }
};

// Functie om configuratie te laden (kan later uitgebreid worden)
export const getAppConfig = (): AppConfig => {
  // Hier kan later configuratie uit localStorage of API worden geladen
  // Voor nu gebruiken we de standaard configuratie
  return defaultAppConfig;
};

// Functie om configuratie bij te werken
export const updateAppConfig = (_newConfig: Partial<AppConfig>): void => {
  // Hier kan later configuratie worden opgeslagen
}; 