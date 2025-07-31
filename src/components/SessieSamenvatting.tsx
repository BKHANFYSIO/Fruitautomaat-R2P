
import type { SessieData } from '../data/types';
import './SessieSamenvatting.css';

interface SessieSamenvattingProps {
  isOpen: boolean;
  onClose: () => void;
  sessieData: SessieData | null;
  onOpenLeeranalyse: () => void;
}

export const SessieSamenvatting = ({ 
  isOpen, 
  onClose, 
  sessieData, 
  onOpenLeeranalyse 
}: SessieSamenvattingProps) => {
  if (!isOpen || !sessieData) return null;

  const formatTijd = (minuten: number): string => {
    const uren = Math.floor(minuten / 60);
    const restMinuten = minuten % 60;
    
    if (uren > 0) {
      return `${uren}u ${restMinuten}m`;
    }
    return `${restMinuten}m`;
  };

  const formatDatum = (datumString: string): string => {
    return new Date(datumString).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="sessie-samenvatting-overlay" onClick={onClose}>
      <div className="sessie-samenvatting-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sessie-samenvatting-header">
          <h3>🏁 Sessie Afgerond</h3>
          <button onClick={onClose} className="sessie-samenvatting-close">&times;</button>
        </div>
        
        <div className="sessie-samenvatting-body">
          <div className="sessie-statistieken">
            <div className="statistiek-item">
              <span className="statistiek-label">📅 Start:</span>
              <span className="statistiek-waarde">{formatDatum(sessieData.startTijd)}</span>
            </div>
            <div className="statistiek-item">
              <span className="statistiek-label">⏱️ Duur:</span>
              <span className="statistiek-waarde">{sessieData.duur ? formatTijd(sessieData.duur) : 'N/A'}</span>
            </div>
            <div className="statistiek-item">
              <span className="statistiek-label">📚 Opdrachten:</span>
              <span className="statistiek-waarde">{sessieData.opdrachtenGedaan}</span>
            </div>
            <div className="statistiek-item">
              <span className="statistiek-label">📊 Gemiddelde score:</span>
              <span className="statistiek-waarde">{sessieData.gemiddeldeScore.toFixed(1)}/5</span>
            </div>
            {sessieData.categorieen.length > 0 && (
              <div className="statistiek-item">
                <span className="statistiek-label">🎯 Categorieën:</span>
                <span className="statistiek-waarde">{sessieData.categorieen.join(', ')}</span>
              </div>
            )}
          </div>

          <div className="sessie-melding">
            <p>
              <strong>✅ Sessie succesvol opgeslagen!</strong>
            </p>
            <p>
              Je leerdata is opgeslagen en beschikbaar in de leeranalyse. 
              Bekijk je uitgebreide voortgang en statistieken.
            </p>
          </div>
        </div>
        
        <div className="sessie-samenvatting-footer">
          <button onClick={onClose} className="sessie-samenvatting-button secondary">
            Sluiten
          </button>
          <button 
            onClick={() => {
              onOpenLeeranalyse();
              onClose();
            }}
            className="sessie-samenvatting-button primary"
          >
            📊 Bekijk Leeranalyse
          </button>
        </div>
      </div>
    </div>
  );
}; 