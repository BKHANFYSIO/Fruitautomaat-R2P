import { SYMBOLEN } from '../data/constants';
import './DevPanel.css';

interface DevPanelProps {
  forceResult: (string | null)[];
  setForceResult: (result: (string | null)[]) => void;
  simuleerVoltooiing: () => void;
  forcePromotie: (boxNummer: number) => void;
  resetLeitner: () => void;
  forceHerhalingen: (boxId: number, aantal: number) => void;
  toggleBox0Interval: () => void;
  isBox0IntervalVerkort: boolean;
}

export const DevPanel: React.FC<DevPanelProps> = ({ 
  forceResult, 
  setForceResult, 
  simuleerVoltooiing, 
  forcePromotie, 
  resetLeitner, 
  forceHerhalingen,
  toggleBox0Interval,
  isBox0IntervalVerkort
}) => {

  const handleChange = (index: number, value: string) => {
    const newResult = [...forceResult];
    newResult[index] = value === 'random' ? null : value;
    setForceResult(newResult);
  };

  return (
    <div className="dev-panel">
      <h4>🛠️ Developer Panel (Druk 'd' om te sluiten)</h4>
      
      <div className="dev-section">
        <h5>Spin Resultaat Forceren</h5>
        <div className="dev-controls">
          {[0, 1, 2].map(index => (
            <select 
              key={index}
              onChange={(e) => handleChange(index, e.target.value)}
              value={forceResult[index] || 'random'}
            >
              <option value="random">Willekeurig</option>
              {SYMBOLEN.map((s: {id: string, symbool: string, naam: string}) => <option key={s.id} value={s.symbool}>{s.symbool} {s.naam}</option>)}
            </select>
          ))}
        </div>
      </div>

      <div className="dev-section">
        <h5>Leitner Achievements Testen</h5>
        <div className="dev-controls">
          <button onClick={simuleerVoltooiing}>Simuleer Dag Voltooid</button>
          <button onClick={() => forcePromotie(2)}>Forceer Promotie B2</button>
          <button onClick={() => forcePromotie(3)}>Forceer Promotie B3</button>
          <button onClick={() => forcePromotie(4)}>Forceer Promotie B4</button>
          <button onClick={() => forcePromotie(5)}>Forceer Promotie B5</button>
          <button onClick={() => forcePromotie(6)}>Forceer Promotie B6</button>
        </div>
      </div>

      <div className="dev-section">
        <h5>Data Beheer</h5>
        <div className="dev-controls">
          <button onClick={resetLeitner} className="danger-button">Reset Leitner Data</button>

          <h4>Herhalingen Test</h4>
          <button onClick={() => forceHerhalingen(0, 5)}>Forceer 5 naar Box 0</button>
          <button onClick={() => forceHerhalingen(1, 3)}>Forceer 3 naar Box 1</button>
          <button onClick={() => forceHerhalingen(2, 3)}>Forceer 3 naar Box 2</button>
          
          <h4>Interval Test</h4>
          <button onClick={toggleBox0Interval}>
            {isBox0IntervalVerkort ? 'Reset Box 0 Interval (15sec → 10min)' : 'Toggle Box 0 Interval (10min → 15sec)'}
          </button>
        </div>
      </div>

      <div className="dev-section">
        <h5>Testen</h5>
        <div className="dev-controls">
          <p style={{ margin: '6px 0' }}>
            Voer tests uit in de terminal (projectroot):
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#222', color: '#ddd', padding: '8px', borderRadius: '6px' }}>
npm run test
          </pre>
          <p style={{ margin: '6px 0' }}>
            Watch-modus (handig tijdens ontwikkelen):
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#222', color: '#ddd', padding: '8px', borderRadius: '6px' }}>
npm run test:watch
          </pre>
          <p style={{ margin: '6px 0' }}>
            UI modus (optioneel, interactieve test-UI):
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#222', color: '#ddd', padding: '8px', borderRadius: '6px' }}>
npm run test:ui
          </pre>
          <p style={{ marginTop: '8px', fontSize: '0.95em' }}>
            Wat testen we nu:
          </p>
          <ul style={{ marginTop: 0 }}>
            <li><strong>analyseerSpin</strong>: controleert acties/bonus bij combinaties (bijv. 3 vraagtekens → bonusopdracht; 3 bellen → kop-of-munt).</li>
            <li><strong>selectLeitnerOpdracht</strong>: geeft een geldige opdracht terug in niet-serieuze modus.</li>
            <li><strong>recordOpdrachtVoltooid</strong>: logt het leermodus-type (normaal/leitner) in de historie.</li>
          </ul>
          <p style={{ fontSize: '0.95em' }}>
            Waarom nuttig: deze tests geven snel zekerheid bij refactors, vooral rond spinlogica en leerdata. Bij falen weet je precies waar de breuk zit.
          </p>
        </div>
      </div>
    </div>
  );
}; 