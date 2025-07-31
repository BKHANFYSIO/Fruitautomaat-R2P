import './Beoordeling.css';

interface BeoordelingProps {
  onBeoordeel: (prestatie: 'Heel Goed' | 'Redelijk' | 'Niet Goed') => void;
  isLeerModus?: boolean;
}

export const Beoordeling = ({ onBeoordeel, isLeerModus = false }: BeoordelingProps) => {
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
    </div>
  );
}; 