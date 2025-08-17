
import type { SessieData } from '../data/types';
import { Modal } from './Modal';
import { getLeerDataManager } from '../data/leerDataManager';
import { useSettings } from '../context/SettingsContext';
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

  const { negeerBox0Wachttijd } = useSettings();

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

  // Afgeleide statistieken voor deze sessie
  const mgr = getLeerDataManager();
  const sessieStart = new Date(sessieData.startTijd).getTime();
  const sessieEinde = new Date(sessieData.eindTijd || new Date().toISOString()).getTime();

  // Verzamel per-sessie scores via scoreGeschiedenis binnen tijdsvenster
  const leerData = (mgr as any).loadLeerData?.() || null;
  let countHeelGoed = 0, countRedelijk = 0, countNietGoed = 0;
  const categorieNaarScores: Record<string, { sum: number; count: number }> = {};
  let uniekeOpdrachtenInSessie = 0;

  if (leerData && leerData.opdrachten) {
    const uniekeOpdrachtIds = new Set<string>();
    
    for (const op of Object.values(leerData.opdrachten) as any[]) {
      const cat = op.categorie as string;
      const geschiedenis = Array.isArray(op.scoreGeschiedenis) ? op.scoreGeschiedenis : [];
      for (const entry of geschiedenis) {
        const t = new Date(entry.datum).getTime();
        if (t >= sessieStart && t <= sessieEinde) {
          const score = Number(entry.score) || 0;
          if (score >= 4.5) countHeelGoed++; else if (score >= 2) countRedelijk++; else countNietGoed++;
          if (!categorieNaarScores[cat]) categorieNaarScores[cat] = { sum: 0, count: 0 };
          categorieNaarScores[cat].sum += score;
          categorieNaarScores[cat].count += 1;
          
          // Tel unieke opdrachten in deze sessie
          uniekeOpdrachtIds.add(op.opdrachtId);
        }
      }
    }
    
    uniekeOpdrachtenInSessie = uniekeOpdrachtIds.size;
  }

  // Sterkste/zwakste categorie op basis van sessie-gemiddelde
  const categorieGemiddelden = Object.entries(categorieNaarScores)
    .map(([cat, { sum, count }]) => ({ cat, avg: Math.round((sum / count) * 10) / 10, count }))
    .sort((a, b) => b.avg - a.avg);
  const sterkste = categorieGemiddelden[0];
  const zwakste = categorieGemiddelden[categorieGemiddelden.length - 1];

  // Trend t.o.v. vorige sessie (zelfde modus)
  let deltaScore: number | null = null;
  let deltaDuur: number | null = null;
  if (leerData && leerData.sessies) {
    const sessies = Object.values(leerData.sessies) as any[];
    const zelfdeModus = sessies
      .filter(s => !!s.eindTijd && s.serieuzeModus === sessieData.serieuzeModus && s.leermodusType === sessieData.leermodusType)
      .sort((a, b) => new Date(a.startTijd).getTime() - new Date(b.startTijd).getTime());
    const index = zelfdeModus.findIndex(s => s.sessieId === sessieData.sessieId);
    const vorige = index > 0 ? zelfdeModus[index - 1] : null;
    if (vorige) {
      deltaScore = Math.round((sessieData.gemiddeldeScore - (vorige.gemiddeldeScore || 0)) * 10) / 10;
      const huidigeDuur = sessieData.duur || 0;
      const vorigeDuur = vorige.duur || 0;
      deltaDuur = Math.round((huidigeDuur - vorigeDuur) * 10) / 10;
    }
  }

  // Leitner: actuele beschikbaarheid voor (sub)categorieën in deze sessie
  let leitnerNuBeschikbaar: number | null = null;
  let leitnerRegulier: number | null = null;
  if (sessieData.serieuzeModus && sessieData.leermodusType === 'leitner') {
    try {
      const stats = mgr.getLeitnerStatistiekenVoorCategorieen?.(sessieData.categorieen || [], { negeerBox0WachttijdAlsLeeg: true });
      if (stats) {
        leitnerNuBeschikbaar = stats.vandaagBeschikbaar;
        leitnerRegulier = stats.reguliereHerhalingenBeschikbaar;
      }
    } catch {}
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <span>🏁 Sessie afgerond</span>
    } size="sm" variant="success">
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
            <span className="statistiek-label">📚 Opdrachten (uniek):</span>
            <span className="statistiek-waarde">{uniekeOpdrachtenInSessie}</span>
          </div>
          <div className="statistiek-item">
            <span className="statistiek-label">📚 Opdrachten (totaal):</span>
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

        {/* Extra inzichten */}
        <div className="sessie-extra-grid">
          <div className="mini-stat">
            <div className="mini-title">Trend t.o.v. vorige sessie</div>
            <div className="mini-row">
              <span>Score</span>
              <span className={`delta ${deltaScore === null ? 'muted' : deltaScore >= 0 ? 'up' : 'down'}`}>{deltaScore === null ? '—' : `${deltaScore > 0 ? '+' : ''}${deltaScore}`}</span>
            </div>
            <div className="mini-row">
              <span>Duur</span>
              <span className={`delta ${deltaDuur === null ? 'muted' : deltaDuur <= 0 ? 'up' : 'down'}`}>{deltaDuur === null ? '—' : `${deltaDuur > 0 ? '+' : ''}${deltaDuur}m`}</span>
            </div>
          </div>

          <div className="mini-stat">
            <div className="mini-title">Beoordelingen (deze sessie)</div>
            <div className="mini-row"><span>Heel Goed</span><span>{countHeelGoed}</span></div>
            <div className="mini-row"><span>Redelijk</span><span>{countRedelijk}</span></div>
            <div className="mini-row"><span>Niet Goed</span><span>{countNietGoed}</span></div>
          </div>

          <div className="mini-stat">
            <div className="mini-title">Categorie highlights</div>
            <div className="mini-row"><span>Sterkste</span><span>{sterkste ? `${sterkste.cat} (${sterkste.avg}/5)` : '—'}</span></div>
            <div className="mini-row"><span>Zwakste</span><span>{zwakste ? `${zwakste.cat} (${zwakste.avg}/5)` : '—'}</span></div>
          </div>

          {sessieData.serieuzeModus && sessieData.leermodusType === 'leitner' && (
            <div className="mini-stat">
              <div className="mini-title">Leitner</div>
              <div className="mini-row"><span>Box 0 wachttijd negeren</span><span>{negeerBox0Wachttijd ? 'Ja' : 'Nee'}</span></div>
              <div className="mini-row"><span>Nu beschikbaar</span><span>{leitnerNuBeschikbaar ?? '—'}</span></div>
              <div className="mini-row"><span>Reguliere herh.</span><span>{leitnerRegulier ?? '—'}</span></div>
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
    </Modal>
  );
}; 