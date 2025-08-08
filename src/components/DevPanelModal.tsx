import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from './Modal';
import { DevCard } from './ui/DevCard';
import { CodeChip } from './ui/CodeChip';
import { InfoTooltip } from './ui/InfoTooltip';
import { extractUrlsFromText, detectMediaKind, getYouTubeId } from '../utils/linkUtils';
import { SYMBOLEN } from '../data/constants';
import './DevPanel.css';

interface DevPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  opdrachtenVoorSelectie?: Array<{ Antwoordsleutel: string; Opdracht: string }>; // optioneel
  // bestaande props uit DevPanel
  forceResult: (string | null)[];
  setForceResult: (result: (string | null)[]) => void;
  simuleerVoltooiing: () => void;
  forcePromotie: (boxNummer: number) => void;
  resetLeitner: () => void;
  forceHerhalingen: (boxId: number, aantal: number) => void;
  toggleBox0Interval: () => void;
  isBox0IntervalVerkort: boolean;
}

type UrlStatus = 'onbekend' | 'ok' | 'kapot' | 'niet-verifieerbaar';

export const DevPanelModal: React.FC<DevPanelModalProps> = ({
  isOpen,
  onClose,
  opdrachtenVoorSelectie,
  forceResult,
  setForceResult,
  simuleerVoltooiing,
  forcePromotie,
  resetLeitner,
  forceHerhalingen,
  toggleBox0Interval,
  isBox0IntervalVerkort,
}) => {
  const alleUrls = useMemo(() => {
    if (!opdrachtenVoorSelectie) return [] as string[];
    const urls = new Set<string>();
    for (const op of opdrachtenVoorSelectie) {
      extractUrlsFromText(op.Antwoordsleutel || '').forEach((u) => urls.add(u));
    }
    return Array.from(urls);
  }, [opdrachtenVoorSelectie]);

  const [scanResult, setScanResult] = useState<Record<string, UrlStatus>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Allowlist bewerken voor media:cache
  const [allowlist, setAllowlist] = useState<string[]>([]);

  useEffect(() => {
    // Lees altijd uit het repo-bestand; geen lokale opslag meer
    fetch('/answer-media/allowlist.json')
      .then(r => r.json())
      .then((defaults: string[]) => {
        if (Array.isArray(defaults)) setAllowlist(defaults);
      })
      .catch(() => setAllowlist([]));
  }, [isOpen]);

  const toDomainUrl = (dom: string) => `https://${dom}`;

  const handleScanLinks = async () => {
    setIsScanning(true);
    const updates: Record<string, UrlStatus> = {};
    const checks = alleUrls.map(async (u) => {
      const kind = detectMediaKind(u);
      if (kind === 'image') {
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
      updates[u] = 'niet-verifieerbaar';
    });
    await Promise.all(checks);
    setScanResult(updates);
    setIsScanning(false);
    setIsResultModalOpen(true);
  };

  const cmdCheck = 'npm run check:links';
  const cacheFlags: string[] = [];
  if (allowlist.length > 0) cacheFlags.push(`--allowlist=${allowlist.join(',')}`);
  cacheFlags.push('--revalidate', '--cleanup=30');
  const cmdCache = `npm run media:cache -- ${cacheFlags.join(' ')}`;

  const [manifestInfo, setManifestInfo] = useState<{ total: number; images: number; videos: number; lastUpdate?: string } | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  useEffect(() => {
    fetch('/answer-media/manifest.json')
      .then(r => r.json())
      .then((data: Record<string, any>) => {
        const entries = Object.values(data || {});
        const total = entries.length;
        const images = entries.filter((e: any) => e.meta?.kind === 'image').length;
        const videos = entries.filter((e: any) => e.meta?.kind === 'youtube' || e.meta?.kind === 'vimeo').length;
        const lastUpdate = entries.map((e: any) => e.lastChecked).filter(Boolean).sort().slice(-1)[0];
        setManifestInfo({ total, images, videos, lastUpdate });
      })
      .catch(() => setManifestInfo(null));
  }, [isOpen]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Developer Panel">
        <div className="devmodal-grid">
          <DevCard title="Spin forceren" subtitle="Kies zelf de uitkomst van de rollen">
            <div className="row" style={{ gap: 12 }}>
              {[0,1,2].map((index) => (
                <select
                  key={index}
                  aria-label={`Rol ${index+1}`}
                  value={forceResult[index] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const next = [...forceResult];
                    next[index] = val === '' ? null : val;
                    setForceResult(next);
                  }}
                >
                  <option value="">Willekeurig</option>
                  {SYMBOLEN.map((s: any) => (
                    <option key={s.id} value={s.symbool}>{s.symbool} {s.naam}</option>
                  ))}
                </select>
              ))}
              <InfoTooltip>
                Kies per rol een symbool om de volgende spin te sturen. Laat het leeg voor een normale (willekeurige) spin.
              </InfoTooltip>
            </div>
            <details style={{ marginTop: 8 }}>
              <summary>Details</summary>
              <ul>
                <li>Werkt voor de volgende spin(s) totdat je het terugzet naar “Willekeurig”.</li>
                <li>Handig om snel bonus-situaties te testen (bijv. 3 vraagtekens = bonusopdracht).</li>
              </ul>
            </details>
          </DevCard>

          <DevCard title="Leitner hulpmiddelen" subtitle="Snel testen en beheren">
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button onClick={simuleerVoltooiing}>Markeer dag als voltooid</button>
              <button onClick={() => forcePromotie(2)}>Promotie B2</button>
              <button onClick={() => forcePromotie(3)}>Promotie B3</button>
              <button onClick={() => forcePromotie(4)}>Promotie B4</button>
              <button onClick={() => forcePromotie(5)}>Promotie B5</button>
              <button onClick={() => forcePromotie(6)}>Promotie B6</button>
              <button onClick={resetLeitner} className="danger-button">Reset Leitner</button>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="muted">Herhalingen toevoegen:</span>
              <button onClick={() => forceHerhalingen(0, 5)}>5 → Box 0</button>
              <button onClick={() => forceHerhalingen(1, 3)}>3 → Box 1</button>
              <button onClick={() => forceHerhalingen(2, 3)}>3 → Box 2</button>
              <span className="spacer" />
              <button onClick={toggleBox0Interval}>
                {isBox0IntervalVerkort ? 'Herstel Box 0 wachttijd (10 min)' : 'Versnel Box 0 (15 sec)'}
              </button>
            </div>
            <details style={{ marginTop: 8 }}>
              <summary>Details</summary>
              <ul>
                <li>“Dag als voltooid”: doet alsof je herhaalronde klaar is (handig voor testen).</li>
                <li>“Promotie Bx”: controleert/forceert de badge voor die box.</li>
                <li>“Herhalingen toevoegen”: zet snel extra kaarten in een box om de flow te kunnen zien.</li>
                <li>“Versnel Box 0”: maak wachten kort (15 sec) om sneller te kunnen oefenen. Met de andere knop zet je dit terug.</li>
              </ul>
            </details>
          </DevCard>

          <DevCard title="Links & Media (snel)" subtitle="Snelle controle in je browser">
            <div className="row">
              <button onClick={handleScanLinks} disabled={isScanning}>{isScanning ? 'Bezig…' : 'Scan links'}</button>
              <InfoTooltip>Controleert afbeeldingen en YouTube grofweg. Voor een volledige en betrouwbare controle gebruik je de CLI hieronder.</InfoTooltip>
              <div className="spacer" />
              <div className="muted">Gevonden: {alleUrls.length}</div>
              <button onClick={() => setIsResultModalOpen(true)} disabled={Object.keys(scanResult).length === 0}>Open resultaten</button>
            </div>
            <details style={{ marginTop: 8 }}>
              <summary>Details</summary>
              <ul>
                <li>Dit is een snelle indicatie. Door browserbeperkingen kan het niet alles zien.</li>
                <li>Wil je zeker weten of links werken? Gebruik de CLI-check hieronder.</li>
              </ul>
            </details>
          </DevCard>

          <DevCard title="Links & Media (CLI & cache)" subtitle="Betrouwbare controle en lokaal opslaan">
            <div className="col">
              <CodeChip command={cmdCheck} label="check:links" />
              <CodeChip command={cmdCache} label="media:cache" />
              <div className="row" style={{ gap: 8 }}>
                <button onClick={() => setIsHelpOpen(true)}>Uitleg</button>
              </div>
              <details className="allowlist-editor">
                <summary>Allowlist (uit bestand allowlist.json)</summary>
                {allowlist.length > 0 ? (
                  <div className="tags" style={{ marginTop: 6 }}>
                    {allowlist.map((dom) => (
                      <span key={dom} className="tag">
                        <a href={toDomainUrl(dom)} target="_blank" rel="noopener noreferrer">{dom}</a>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="muted" style={{ marginTop: 6 }}>Geen domeinen gevonden. Voeg domeinen toe in <code>public/answer-media/allowlist.json</code> en herlaad de pagina.</div>
                )}
                {allowlist.length > 0 && (
                  <div className="row" style={{ gap: 8, marginTop: 8 }}>
                    <button onClick={() => {
                      const text = allowlist.join(',');
                      navigator.clipboard?.writeText(text);
                      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Alle domeinen gekopieerd naar klembord.', type: 'succes', timeoutMs: 2500 } }));
                    }}>Kopieer alle domeinen</button>
                  </div>
                )}
              </details>
              <details>
                <summary>Details</summary>
                <ul>
                  <li>--allowlist: alleen downloaden van veilige/toegestane websites.</li>
                  <li>--revalidate: check opnieuw en ververs als de inhoud is veranderd.</li>
                  <li>--cleanup=30: verwijder oude, niet meer gebruikte downloads (ouder dan 30 dagen).</li>
                </ul>
                <ul>
                  <li>Video’s en afbeeldingen worden automatisch getoond in de antwoordsleutel.</li>
                  <li>Afbeeldingen die je downloadt worden lokaal getoond, met een bronvermelding (APA).</li>
                </ul>
              </details>
            </div>
          </DevCard>

          <DevCard title="Media-cache status" subtitle="Overzicht van gedownloade media">
            <div className="tiles">
              <div className="tile"><div className="tile-kpi">{manifestInfo?.total ?? '-'}</div><div className="tile-label">Totaal</div></div>
              <div className="tile"><div className="tile-kpi">{manifestInfo?.images ?? '-'}</div><div className="tile-label">Afbeeldingen</div></div>
              <div className="tile"><div className="tile-kpi">{manifestInfo?.videos ?? '-'}</div><div className="tile-label">Video’s</div></div>
            </div>
            <div className="muted">Laatste update: {manifestInfo?.lastUpdate || '-'}</div>
            <details style={{ marginTop: 8 }}>
              <summary>Details</summary>
              <ul>
                <li>Bestand: public/answer-media/manifest.json</li>
                <li>Hierin staat welke online link bij welk lokaal bestand hoort, plus brongegevens voor de vermelding.</li>
              </ul>
            </details>
          </DevCard>

          <DevCard title="Tests" subtitle="Handige opdrachten voor controle">
            <div className="col">
              <CodeChip command="npm run test" />
              <CodeChip command="npm run test:watch" />
              <CodeChip command="npm run test:ui" />
            </div>
            <details style={{ marginTop: 8 }}>
              <summary>Wat wordt getest</summary>
              <ul>
                <li>analyseerSpin: werkt de logica voor combinaties/bonussen goed?</li>
                <li>selectLeitnerOpdracht: kiest het systeem de juiste kaart in leermodus?</li>
                <li>recordOpdrachtVoltooid: wordt de voltooiing goed opgeslagen met het juiste type?</li>
              </ul>
            </details>
          </DevCard>
        </div>
      </Modal>

      <Modal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} title="Linkscan-resultaten">
        <div className="linkscan-controls">
          <span className="muted">Totaal: {alleUrls.length}</span>
        </div>
        <div className="linkscan-table">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>URL</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {alleUrls.map((u) => {
                const kind = detectMediaKind(u);
                const status = scanResult[u] || 'onbekend';
                return (
                  <tr key={u}>
                    <td>{kind}</td>
                    <td className="wrap"><a href={u} target="_blank" rel="noopener noreferrer">{u}</a></td>
                    <td>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Uitleg – Links & Media (CLI & cache)">
        <div className="col" style={{ gap: 10 }}>
          <p><strong>Kort:</strong> hiermee download je afbeeldingen naar jouw project onder <code>public/answer-media/</code>. We slaan ook een overzicht op in <code>public/answer-media/manifest.json</code>. De app gebruikt daarna automatisch de lokale kopie met een nette bronvermelding (APA).</p>
          <p><strong>Zo gebruik je het:</strong> klik op <em>Kopieer</em> bij het gewenste commando, open je terminal in de projectmap en plak het commando daar. Druk op Enter om het uit te voeren.</p>
          <h4>Wat gebeurt er precies?</h4>
          <ul>
            <li>We zoeken alle afbeeldingslinks in antwoordsleutels.</li>
            <li>We downloaden de bestanden naar <code>public/answer-media/&lt;hash&gt;.&lt;ext&gt;</code>.</li>
            <li>We vullen <code>manifest.json</code> met: originele link → lokaal pad + broninfo.</li>
            <li>In de app kijkt de antwoordsleutel eerst in dit manifest. Is er een lokale versie? Dan tonen we die (snel, stabiel) en zetten er een bronvermelding onder.</li>
            <li>Video’s (YouTube/Vimeo) downloaden we niet. We halen alleen titel/auteur op voor de bronvermelding.</li>
          </ul>
          <h4>Waar komen de bestanden terecht?</h4>
          <p>Alles staat in jouw projectmap <code>public/answer-media/</code>. Je kunt die map en het manifest gewoon committen en naar GitHub pushen. Bij deploy (bijv. Vercel) worden ze automatisch meegeleverd.</p>
          <h4>Aanbevolen stappen</h4>
          <ol>
            <li>Links snel checken (optioneel): <code>npm run check:links</code> (kopieer en plak in je terminal)</li>
            <li>Afbeeldingen lokaal zetten: <code>npm run media:cache -- --allowlist=githubusercontent.com,unsplash.com,youtube.com,vimeo.com --revalidate --cleanup=30</code> (kopieer en plak in je terminal)</li>
            <li>Open het DevPanel (toets 'd') en bekijk "Media-cache status" om te zien wat is gedownload.</li>
            <li>Tevreden? Commit en push: <code>git add public/answer-media</code> → <code>git commit</code> → <code>git push</code>.</li>
          </ol>
          <h4>Over de opties</h4>
          <ul>
            <li><code>--allowlist</code>: alleen van veilige domeinen downloaden (aanrader i.v.m. rechten/kwaliteit).</li>
            <li><code>--revalidate</code>: vernieuw lokale kopieën als de online afbeelding is gewijzigd.</li>
            <li><code>--cleanup=30</code>: verwijder downloads die 30+ dagen niet meer gebruikt zijn.</li>
          </ul>
        </div>
      </Modal>
    </>
  );
};


