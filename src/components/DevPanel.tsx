import { SYMBOLEN } from '../data/constants';
import { useEffect, useMemo, useState } from 'react';
import { extractUrlsFromText, detectMediaKind, getYouTubeId } from '../utils/linkUtils';
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
  opdrachtenVoorSelectie?: Array<{ Antwoordsleutel: string; Opdracht: string }>; // optioneel, voor linkcheck
}

export const DevPanel: React.FC<DevPanelProps> = ({ 
  forceResult, 
  setForceResult, 
  simuleerVoltooiing, 
  forcePromotie, 
  resetLeitner, 
  forceHerhalingen,
  toggleBox0Interval,
  isBox0IntervalVerkort,
  opdrachtenVoorSelectie
}) => {

  const handleChange = (index: number, value: string) => {
    const newResult = [...forceResult];
    newResult[index] = value === 'random' ? null : value;
    setForceResult(newResult);
  };

  // --- Linkchecker (client) ---
  type UrlStatus = 'onbekend' | 'ok' | 'kapot' | 'niet-verifieerbaar';
  const [linkCheckResult, setLinkCheckResult] = useState<Record<string, UrlStatus>>({});
  const [isChecking, setIsChecking] = useState(false);

  const alleUrls = useMemo(() => {
    if (!opdrachtenVoorSelectie) return [] as string[];
    const urls = new Set<string>();
    for (const op of opdrachtenVoorSelectie) {
      extractUrlsFromText(op.Antwoordsleutel || '').forEach((u) => urls.add(u));
    }
    return Array.from(urls);
  }, [opdrachtenVoorSelectie]);

  const handleCheckLinks = async () => {
    setIsChecking(true);
    const updates: Record<string, UrlStatus> = {};
    const checks = alleUrls.map(async (u) => {
      const kind = detectMediaKind(u);
      if (kind === 'image') {
        // Verifieer via Image() (geen CORS nodig)
        const res = await new Promise<UrlStatus>((resolve) => {
          const img = new Image();
          img.onload = () => resolve('ok');
          img.onerror = () => resolve('kapot');
          img.src = u;
        });
        updates[u] = res;
        return;
      }
      if (kind === 'youtube') {
        // Check via YouTube thumbnail
        const id = getYouTubeId(u);
        if (!id) { updates[u] = 'niet-verifieerbaar'; return; }
        const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        const res = await new Promise<UrlStatus>((resolve) => {
          const img = new Image();
          img.onload = () => resolve('ok');
          img.onerror = () => resolve('kapot');
          img.src = thumb;
        });
        updates[u] = res;
        return;
      }
      // Vimeo/overig: in browser onbetrouwbaar → markeer als niet-verifieerbaar
      updates[u] = 'niet-verifieerbaar';
    });
    await Promise.all(checks);
    setLinkCheckResult(updates);
    setIsChecking(false);
  };

  // Manifest overzicht (optioneel)
  type ManifestEntry = { originalUrl: string; localPath?: string; meta?: { kind?: string }; lastChecked?: string };
  const [manifestInfo, setManifestInfo] = useState<{ total: number; images: number; videos: number; lastUpdate?: string } | null>(null);

  useEffect(() => {
    fetch('/answer-media/manifest.json')
      .then(r => r.json())
      .then((data: Record<string, ManifestEntry>) => {
        const entries = Object.values(data || {});
        const total = entries.length;
        const images = entries.filter(e => e.meta?.kind === 'image').length;
        const videos = entries.filter(e => e.meta?.kind === 'youtube' || e.meta?.kind === 'vimeo').length;
        const lastUpdate = entries.map(e => e.lastChecked).filter(Boolean).sort().slice(-1)[0];
        setManifestInfo({ total, images, videos, lastUpdate });
      })
      .catch(() => setManifestInfo(null));
  }, []);

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

      {opdrachtenVoorSelectie && (
        <div className="dev-section">
          <h5>Links & Media – snelle check (client)</h5>
          <div className="dev-controls">
            <p style={{ margin: '6px 0 10px 0' }}>
              Controle in de browser: afbeeldingen (Image) en YouTube (thumbnail). Voor Vimeo en overige links: gebruik de CLI-check hieronder.
            </p>
            <button onClick={handleCheckLinks} disabled={isChecking}>
              {isChecking ? 'Bezig met controleren…' : 'Controleer links in antwoordsleutels'}
            </button>
            {alleUrls.length === 0 ? (
              <p style={{ marginTop: 8 }}>Geen links gevonden.</p>
            ) : (
              <>
                <p style={{ margin: '8px 0' }}>Gevonden: {alleUrls.length} links</p>
                <div style={{ margin: '6px 0', fontSize: '0.9em', color: '#bbb' }}>
                  Legenda: <strong>ok</strong> = bereikbaar, <strong>kapot</strong> = niet bereikbaar, <strong>niet-verifieerbaar</strong> = in browser niet zeker (gebruik CLI).
                </div>
                <div style={{ maxHeight: 200, overflow: 'auto', background: '#222', padding: 8, borderRadius: 6 }}>
                  <table style={{ width: '100%', fontSize: '0.9em' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>URL</th>
                        <th style={{ textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alleUrls.map((u) => (
                        <tr key={u}>
                          <td style={{ paddingRight: 8, wordBreak: 'break-all' }}>
                            <a href={u} target="_blank" rel="noopener noreferrer">{u}</a>
                          </td>
                          <td>{linkCheckResult[u] || 'onbekend'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ marginTop: 6, fontSize: '0.85em', color: '#bbb' }}>
                  Tip: gebruik de CLI-check voor echte statuscodes en volledige dekking (sectie hieronder).
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="dev-section">
        <h5>Links & Media – CLI (betrouwbare check en cache)</h5>
        <div className="dev-controls">
          <p style={{ margin: '6px 0' }}>Wat je kunt doen:</p>
          <ul style={{ marginTop: 0 }}>
            <li><strong>check:links</strong>: controleer links met echte HTTP-statuscodes (HEAD/GET).</li>
            <li><strong>media:cache</strong>: download afbeeldingen naar <code>public/answer-media/</code>, vul <code>manifest.json</code>, en haal video-metadata (YouTube/Vimeo) op voor APA.</li>
          </ul>
          <p style={{ margin: '6px 0' }}>Commands (voer uit in projectroot):</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#222', color: '#ddd', padding: '8px', borderRadius: '6px' }}>{`npm run check:links
npm run media:cache -- --allowlist=githubusercontent.com,unsplash.com,youtube.com,vimeo.com --revalidate --cleanup=30`}</pre>
          <p style={{ margin: '6px 0', fontSize: '0.95em' }}>Opties:</p>
          <ul style={{ marginTop: 0 }}>
            <li><strong>--allowlist</strong>: alleen downloaden van genoemde domeinen (aan te raden i.v.m. rechten).</li>
            <li><strong>--revalidate</strong>: hercontrole en her-download bij gewijzigde inhoud.</li>
            <li><strong>--cleanup=30</strong>: verwijder niet-meer-gebruikte cache-items ouder dan 30 dagen.</li>
          </ul>
          <p style={{ margin: '6px 0' }}>Weergave in de app:</p>
          <ul style={{ marginTop: 0 }}>
            <li>YouTube/Vimeo en afbeeldingen worden automatisch embedded in antwoordsleutels.</li>
            <li>Gecachte afbeeldingen worden lokaal geladen met APA-verwijzing; video’s krijgen APA op basis van metadata.</li>
          </ul>
          {manifestInfo && (
            <div style={{ marginTop: 8, background: '#232323', padding: 8, borderRadius: 6 }}>
              <strong>Manifest overzicht</strong>
              <div style={{ fontSize: '0.95em', marginTop: 4 }}>
                Totaal: {manifestInfo.total} · Afbeeldingen: {manifestInfo.images} · Video’s: {manifestInfo.videos}
                {manifestInfo.lastUpdate ? ` · Laatste update: ${manifestInfo.lastUpdate}` : ''}
              </div>
              <div style={{ fontSize: '0.85em', color: '#bbb', marginTop: 4 }}>
                Bestand: <code>public/answer-media/manifest.json</code>
              </div>
            </div>
          )}
          <p style={{ marginTop: 8, fontSize: '0.9em', color: '#bbb' }}>
            Tip voor docenten: plak gewoon je link in de antwoordsleutel (video/afbeelding/website). De app herkent en toont dit automatisch. Beheer kan desgewenst media cachen voor snelheid/stabiliteit.
          </p>
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