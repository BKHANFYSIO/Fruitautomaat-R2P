import './Beoordeling.css';
import { getLeerDataManager } from '../data/leerDataManager';

interface BeoordelingProps {
  onBeoordeel: (prestatie: 'Heel Goed' | 'Redelijk' | 'Niet Goed') => void;
  isLeerModus?: boolean;
  currentOpdracht?: { Hoofdcategorie?: string; Categorie: string; Opdracht: string };
  isLeitnerMode?: boolean;
}

export const Beoordeling = ({ onBeoordeel, isLeerModus = false, currentOpdracht, isLeitnerMode = false }: BeoordelingProps) => {
  const handlePauseOpdracht = () => {
    if (currentOpdracht && isLeitnerMode) {
      const leerDataManager = getLeerDataManager();
      const opdrachtId = `${currentOpdracht.Hoofdcategorie || 'Overig'}_${currentOpdracht.Categorie}_${currentOpdracht.Opdracht.substring(0, 20)}`;
      leerDataManager.pauseOpdracht(opdrachtId);
    }
  };

  const canPauseOpdracht = currentOpdracht && isLeitnerMode && isLeerModus;

  // Debug informatie
  console.log('Beoordeling Debug:', {
    currentOpdracht: !!currentOpdracht,
    isLeitnerMode,
    isLeerModus,
    canPauseOpdracht
  });

  return (
    <div className="beoordeling-container">
      <div className="beoordeling-knoppen">
        <button className="beoordeling-knop niet-goed" onClick={() => onBeoordeel('Niet Goed')}>
          Niet Goed <span className="percentage">{isLeerModus ? '(1/5)' : '(0%)'}</span>
        </button>
        <button className="beoordeling-knop redelijk" onClick={() => onBeoordeel('Redelijk')}>
          Redelijk <span className="percentage">{isLeerModus ? '(3/5)' : '(50%)'}</span>
        </button>
        <button className="beoordeling-knop heel-goed" onClick={() => onBeoordeel('Heel Goed')}>
          Heel Goed <span className="percentage">{isLeerModus ? '(5/5)' : '(100%)'}</span>
        </button>
      </div>
      
      {canPauseOpdracht && (
        <div className="pause-opdracht-sectie">
          <button 
            className="pause-opdracht-knop" 
            onClick={handlePauseOpdracht}
            title="Pauzeer deze opdracht - deze komt niet terug tot de pauze wordt gestopt"
          >
            ⏸️ Pauzeer deze opdracht
          </button>
          <p className="pause-uitleg">
            Deze opdracht komt niet terug tot de pauze wordt gestopt
          </p>
        </div>
      )}
    </div>
  );
}; 