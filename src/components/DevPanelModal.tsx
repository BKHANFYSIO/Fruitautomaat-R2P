import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from './Modal';
import { DevCard } from './ui/DevCard';
import { CodeChip } from './ui/CodeChip';
import { InfoTooltip } from './ui/InfoTooltip';
import { LEER_FEEDBACK_DATABASE, MODE_TIPS, ANALYSE_TIPS, ALGEMENE_TIPS } from '../data/tipsEngine';
import { extractUrlsFromText, detectMediaKind, getYouTubeId } from '../utils/linkUtils';
import { SYMBOLEN } from '../data/constants';
import { SessieSamenvatting } from './SessieSamenvatting';
import { OpdrachtenVoltooidModal } from './OpdrachtenVoltooidModal';
import { LimietBereiktModal } from './LimietBereiktModal';
import { Eindscherm } from './Eindscherm';
import type { Speler } from '../data/types';
import type { HighScore } from '../data/highScoreManager';
import { getLeerDataManager } from '../data/leerDataManager';
import { useSettings } from '../context/SettingsContext';
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
  // Luister naar global toggle event (toets 'd' in App)
  useEffect(() => {
    const handler = () => {
      (isOpen ? onClose : () => {})();
    };
    window.addEventListener('toggleDevPanelModal', handler as EventListener);
    return () => window.removeEventListener('toggleDevPanelModal', handler as EventListener);
  }, [isOpen, onClose]);
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

  // Demo-modals (sneller testen)
  const [isTestSessieOpen, setIsTestSessieOpen] = useState(false);
  const [isTestVoltooidOpen, setIsTestVoltooidOpen] = useState(false);
  const [isTestLimietOpen, setIsTestLimietOpen] = useState(false);
  const [isTestEindschermSingleOpen, setIsTestEindschermSingleOpen] = useState(false);
  const [isTestEindschermMultiOpen, setIsTestEindschermMultiOpen] = useState(false);

  const demoSessie = {
    sessieId: 'demo',
    startTijd: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    eindTijd: new Date().toISOString(),
    duur: 7,
    opdrachtenGedaan: 5,
    gemiddeldeScore: 3.6,
    serieuzeModus: true,
    leermodusType: 'normaal' as const,
    categorieen: ['Video']
  };

  const demoSpelers: Speler[] = [
    { naam: 'Jij', score: 12.3, extraSpins: 0, beurten: 3 },
    { naam: 'Sam', score: 10.0, extraSpins: 0, beurten: 3 },
  ];

  const demoHighScore: HighScore = { score: 15.5, timestamp: Date.now(), spelerNaam: 'Alex' };

  // Generic synthetic data generator (progressieve categorie-opbouw en focusdagen)
  const [dailyNewMin, setDailyNewMin] = useState(8);
  const [dailyNewMax, setDailyNewMax] = useState(12);
  const [dailyRepMin, setDailyRepMin] = useState(15);
  const [dailyRepMax, setDailyRepMax] = useState(40);
  const [focusEveryNDays, setFocusEveryNDays] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [freeDayPercent, setFreeDayPercent] = useState(10); // % dagen zonder sessies
  // Scoreverdeling (nieuw/herhaling)
  const [newP1, setNewP1] = useState(25); // % score=1
  const [newP3, setNewP3] = useState(25); // % score=3
  const [newP5, setNewP5] = useState(50); // % score=5
  const [repP1, setRepP1] = useState(15);
  const [repP3, setRepP3] = useState(35);
  const [repP5, setRepP5] = useState(50);
  // Dev-only: Alleen nieuwe opdrachten
  const { devForceOnlyNew, setDevForceOnlyNew, devMaxOnlyNewPerDay, setDevMaxOnlyNewPerDay } = useSettings();

  const generateSynthetic = async (days: number) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenProgress(0);
    window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: `Start met genereren van ${days} dagen…`, type: 'succes', timeoutMs: 6000 } }));
    const mgr = getLeerDataManager();
    // Probeer opdrachten te laden (fallback no-op als al geladen via app)
    if ((mgr as any)._alleOpdrachten?.length === 0) {
      try {
        await fetch('/opdrachten.xlsx');
      } catch {}
    }
    // Reset leerdata (alleen data)
    try {
      localStorage.removeItem('fruitautomaat_user_leerdata');
      const empty = (mgr as any).createEmptyLeerData?.();
      if (empty) (mgr as any).saveLeerData?.(empty);
    } catch {}

    const today = new Date();
    const start = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    // Gebruik uitsluitend bestaande Excel-opdrachten
    const allOps = (mgr as any)._alleOpdrachten as Array<{ Hoofdcategorie?: string; Categorie: string; Opdracht: string; Antwoordsleutel: string; Tijdslimiet: number; Extra_Punten: number }> || [];
    const categoriePool = Array.from(new Set(allOps.map(o => o.Categorie)));

    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Loop elke dag
    const globalUsedIds = new Set<string>();
    // Pool van nog niet geïntroduceerde opdrachten (index-gebaseerd om id-collisies te vermijden)
    const getId = (op: any) => `${op.Hoofdcategorie || 'Overig'}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
    const remainingIdx = new Set<number>(allOps.map((_, idx) => idx));
    for (let d = 0; d < days; d++) {
      const day = new Date(start.getTime() + d * 24 * 60 * 60 * 1000);
      const dateAt = (h: number, m: number = 0) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).toISOString();

      // Progressieve categorie-opbouw: begin met 1-2; elke ~14 dagen groeit set met 1 categorie
      const weeksSinceStart = Math.floor(d / 7);
      const baseCount = Math.min(2 + Math.floor(weeksSinceStart / 2), categoriePool.length);
      const actieveSet = categoriePool.slice(0, baseCount);

      // Focusdag: eens per 5 dagen focus op 1-2 categorieën
      const isFocusDag = d % focusEveryNDays === 0 && d > 0;
      const focusCount = randInt(1, Math.min(2, actieveSet.length));
      const focusCats = [...actieveSet].sort(() => 0.5 - Math.random()).slice(0, focusCount);
      const catsVandaag = isFocusDag ? focusCats : [...actieveSet].sort(() => 0.5 - Math.random()).slice(0, randInt(1, Math.min(3, actieveSet.length)));

      // Willekeurige vrije dagen: sla dag over (geen sessies) op ~10% van de dagen
      const isFreeDay = Math.random() < (freeDayPercent / 100);
      if (!isFreeDay) {
      const runSession = async (serieuze: boolean, modus: 'normaal' | 'leitner', baseHour: number) => {
        const sessieId = mgr.startSessie(serieuze, modus);
        // Override startTijd naar deze dag (ochtend 09:00)
        const data = (mgr as any).loadLeerData?.();
        if (data) {
          data.sessies[sessieId].startTijd = dateAt(baseHour, 0);
          (mgr as any).saveLeerData?.(data);
        }

        // Nieuwe opdrachten (0–20), herhalingen 5–30; op focusdagen minder nieuw en meer herhaling
        // Bepaal categorie-focus voor deze sessie (opbouwend in de tijd)
        const catsPool = catsVandaag;
        const groeiMax = Math.min(2 + Math.floor(weeksSinceStart / 2), catsPool.length);
        const allesKans = weeksSinceStart >= 6 && Math.random() < 0.25;
        const focusSize = allesKans ? catsPool.length : randInt(1, Math.max(1, Math.min(3, groeiMax)));
        const cats = [...catsPool].sort(() => 0.5 - Math.random()).slice(0, focusSize);

        // Nieuwe opdrachten loggen: kies onafhankelijk van categorieën een vaste dagdoelstelling
        const dailyNewTarget = randInt(Math.min(dailyNewMin, dailyNewMax), Math.max(dailyNewMin, dailyNewMax));
        const newOpsForDay: any[] = [];
        const idsArray = Array.from(remainingIdx);
        // shuffle idsArray
        idsArray.sort(() => 0.5 - Math.random());
        const reviewUpdates: Array<{ id: string; minute: number }> = [];
        for (let n = 0; n < idsArray.length && newOpsForDay.length < dailyNewTarget; n++) {
          const idx = idsArray[n];
          const op = allOps[idx];
          if (op && (cats.length === 0 || cats.includes(op.Categorie))) {
            newOpsForDay.push({ ...op, Opdracht: `[${d+1}.${newOpsForDay.length+1}] ${op.Opdracht}` });
            remainingIdx.delete(idx);
          }
        }
        // fallback als te weinig binnen gekozen categorieën gevonden
        if (newOpsForDay.length < Math.min(dailyNewTarget, idsArray.length)) {
          for (let n = 0; n < idsArray.length && newOpsForDay.length < dailyNewTarget; n++) {
            const idx = idsArray[n];
            if (!remainingIdx.has(idx)) continue;
            const op = allOps[idx];
            if (op) {
              newOpsForDay.push({ ...op, Opdracht: `[${d+1}.${newOpsForDay.length+1}] ${op.Opdracht}` });
              remainingIdx.delete(idx);
            }
          }
        }
        for (let i = 0; i < newOpsForDay.length; i++) {
          const op = newOpsForDay[i];
          mgr.recordOpdrachtStart(op as any);
          const r = Math.random() * 100;
          const score = r < newP1 ? 1 : r < (newP1 + newP3) ? 3 : 5;
          (mgr as any).recordOpdrachtVoltooid(op as any, score, 'auto', sessieId, randInt(20, 90), modus);
          // Corrigeer datum/tijd van historie naar de synthetische dag
          try {
            const ld = (mgr as any).loadLeerData?.();
            if (ld) {
              const hoofdcategorie = op.Hoofdcategorie || 'Overig';
              const opdrachtId = `${hoofdcategorie}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
              const item = ld.opdrachten?.[opdrachtId];
              if (item) {
                const when = dateAt(baseHour, 10 + i);
                if (Array.isArray(item.scoreGeschiedenis) && item.scoreGeschiedenis.length > 0) {
                  item.scoreGeschiedenis[item.scoreGeschiedenis.length - 1].datum = when;
                }
                if (Array.isArray(item.modusGeschiedenis) && item.modusGeschiedenis.length > 0) {
                  item.modusGeschiedenis[item.modusGeschiedenis.length - 1].datum = when;
                }
                item.laatsteDatum = when.split('T')[0];
                (mgr as any).saveLeerData?.(ld);
              }
            }
          } catch {}
          const id = getId(op);
          reviewUpdates.push({ id, minute: 5 + i });
          globalUsedIds.add(id);
        }

        // Herhalingen simuleren door bestaande opdrachten te pakken uit leerdata (bestaande Excel-opdrachten)
        const data2 = (mgr as any).loadLeerData?.();
        let alleLrOps = Object.values(data2?.opdrachten || {});
        if (cats.length > 0) {
          alleLrOps = alleLrOps.filter((o: any) => cats.includes(o.categorie));
        }
        // Sample zonder vervanging om te voorkomen dat 1-2 opdrachten duizenden pogingen krijgen
        const repLow = Math.min(dailyRepMin, dailyRepMax);
        const repHigh = Math.max(dailyRepMin, dailyRepMax);
        const repCountTarget = randInt(repLow, repHigh);
        const sampleCount = Math.min(repCountTarget, Math.max(0, alleLrOps.length));
        const shuffledReps = [...alleLrOps].sort(() => 0.5 - Math.random()).slice(0, sampleCount);
        for (let j = 0; j < shuffledReps.length; j++) {
          const pickOp = shuffledReps[j] as any;
          // Bouw een Opdracht object dat overeenkomt met bestaand opdrachtId (zodat recordOpdrachtVoltooid het vindt)
          const hoofdcategorie = pickOp.hoofdcategorie || 'Overig';
          const opText = pickOp.opdrachtId?.includes('_') ? pickOp.opdrachtId.split('_')[2] : pickOp.categorie;
          const bestaandLike = {
            Hoofdcategorie: hoofdcategorie,
            Categorie: pickOp.categorie,
            Opdracht: opText,
            Antwoordsleutel: '—',
            Tijdslimiet: 45,
            Extra_Punten: 0,
          } as any;
          const r2 = Math.random() * 100;
          const scoreRep = r2 < repP1 ? 1 : r2 < (repP1 + repP3) ? 3 : 5; // trager stijgen
          (mgr as any).recordOpdrachtVoltooid(bestaandLike, scoreRep, 'auto', sessieId, randInt(15, 60), modus);
          // Corrigeer datum/tijd van historie naar de synthetische dag
          try {
            const ld2 = (mgr as any).loadLeerData?.();
            if (ld2) {
              const hoofdcategorie2 = bestaandLike.Hoofdcategorie || 'Overig';
              const opdrachtId2 = `${hoofdcategorie2}_${bestaandLike.Categorie}_${bestaandLike.Opdracht.substring(0, 20)}`;
              const item2 = ld2.opdrachten?.[opdrachtId2];
              if (item2) {
                const when2 = dateAt(baseHour, 30 + (j % 20));
                if (Array.isArray(item2.scoreGeschiedenis) && item2.scoreGeschiedenis.length > 0) {
                  item2.scoreGeschiedenis[item2.scoreGeschiedenis.length - 1].datum = when2;
                }
                if (Array.isArray(item2.modusGeschiedenis) && item2.modusGeschiedenis.length > 0) {
                  item2.modusGeschiedenis[item2.modusGeschiedenis.length - 1].datum = when2;
                }
                item2.laatsteDatum = when2.split('T')[0];
                (mgr as any).saveLeerData?.(ld2);
              }
            }
          } catch {}
          const id = pickOp.opdrachtId;
          if (id) reviewUpdates.push({ id, minute: 30 + (j % 20) });
        }

        // Sessie afronden en duur zetten 10–45m
        const achievements = mgr.endSessie(sessieId);
        const data3 = (mgr as any).loadLeerData?.();
        if (data3) {
          data3.sessies[sessieId].eindTijd = dateAt(baseHour, randInt(35, 55));
          data3.sessies[sessieId].duur = Math.round(((new Date(data3.sessies[sessieId].eindTijd).getTime() - new Date(data3.sessies[sessieId].startTijd).getTime()) / 60000));
          (mgr as any).saveLeerData?.(data3);
        }

        // Pas alle reviewUpdates in één keer toe (minder localStorage writes)
        const ldataFinal = (mgr as any).loadLeitnerData?.();
        if (ldataFinal) {
          if (!ldataFinal.opdrachtReviewTimes) ldataFinal.opdrachtReviewTimes = {};
          reviewUpdates.forEach(({ id, minute }) => {
            ldataFinal.opdrachtReviewTimes[id] = dateAt(9, minute);
          });
          (mgr as any).saveLeitnerData?.(ldataFinal);
        }
        return achievements;
      };

      // Maak 1-4 sessies per dag; mix van modes en categorie-focussen
      const sessiesVandaag = randInt(1, 4);
      const sessieHours = [9, 12, 15, 19];
      for (let s = 0; s < sessiesVandaag; s++) {
        const isLeitner = Math.random() < 0.55; // lichte voorkeur voor leitner in leeranalyse
        const mode: 'normaal' | 'leitner' = isLeitner ? 'leitner' : 'normaal';
        await runSession(isLeitner, mode, sessieHours[s] || 9);
      }
      }

      // Yield naar de event loop om "pagina reageert niet" te voorkomen bij lange generaties
      setGenProgress(Math.round(((d + 1) / days) * 100));
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    setIsGenerating(false);
    // Reset dagteller nieuwe vragen naar vandaag=0, zodat "Nieuwe opdrachten vandaag" klopt
    try {
      const ldataEnd = (mgr as any).loadLeitnerData?.();
      if (ldataEnd) {
        const todayStr = new Date().toISOString().split('T')[0];
        ldataEnd.newQuestionsToday = { date: todayStr, count: 0 };
        (mgr as any).saveLeitnerData?.(ldataEnd);
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: `Synthetic data (${days} dagen) gegenereerd.`, type: 'succes', timeoutMs: 6000 } }));
  };

  // Convenience wrappers verwijderd (werden niet gebruikt)

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

          <DevCard title="Tips-overzicht" subtitle="Snel inzicht in alle tips en drempels">
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  const w = window.open('', 'tips_overzicht_popup', 'width=700,height=800');
                  if (w) {
                    const style = '<style>body{font-family:system-ui,Segoe UI,Helvetica,Arial,sans-serif;background:#111;color:#ddd;padding:16px;} h3{margin-top:16px;} ul{max-height:240px;overflow:auto;} li{font-size:12px;margin:4px 0}</style>';
                    const renderList = (title: string, items: string[]) => `<h3>${title} (${items.length})</h3><ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
                    const combo = LEER_FEEDBACK_DATABASE.map(t=>`${t.combinatie}: ${t.bericht}`);
                    const modus = MODE_TIPS.map(t=>`[${t.modes.join('/')}] ${t.tekst}`);
                    const analyse = ANALYSE_TIPS.map(t=>`[${t.modes.join('/')}] ${t.tekst}`);
                    const algemeen = ALGEMENE_TIPS.map(t=>t.tekst);
                    w.document.write(`<!doctype html><html><head>${style}<title>Tips-overzicht</title></head><body>`+
                      `<h2>Tips-overzicht</h2>`+
                      renderList('Combinatie-tips', combo)+
                      renderList('Modus-tips', modus)+
                      renderList('Analyse-tips (vast)', analyse)+
                      renderList('Algemene tips', algemeen)+
                      `<p style="font-size:12px;opacity:.8">Dynamische analyse-tips (coverage/mastery/avgBox/tijdslijn) hangen af van data; drempels in src/data/tipsConfig.ts.</p>`+
                      `</body></html>`);
                    w.document.close();
                  }
                }}
              >Open in popup</button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
              Overzicht openen in popup toont volledige lijsten. Dynamische analyse-tips hangen af van data (drempels in <code>src/data/tipsConfig.ts</code>).
            </div>
          </DevCard>

          <DevCard title="Alleen nieuwe (test)" subtitle="Negeer herhalingen tot N nieuwe per dag">
            <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={devForceOnlyNew}
                  onChange={(e) => setDevForceOnlyNew(e.target.checked)}
                />
                Alleen nieuwe opdrachten forceren
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Max nieuwe per dag
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={devMaxOnlyNewPerDay}
                  onChange={(e) => setDevMaxOnlyNewPerDay(Number(e.target.value))}
                  style={{ width: 70 }}
                  disabled={!devForceOnlyNew}
                />
              </label>
              <InfoTooltip>
                Als dit aan staat, probeert de selectie eerst nieuwe opdrachten te kiezen tot het ingestelde maximum per dag. Daarna schakelt het terug naar herhalingen.
              </InfoTooltip>
            </div>
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

          <DevCard title="Modals testen" subtitle="Open popups zonder spel te doorlopen">
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setIsTestVoltooidOpen(true)}>🎯 Alle opdrachten voltooid</button>
              <button onClick={() => setIsTestSessieOpen(true)}>🏁 Sessie samenvatting</button>
              <button onClick={() => setIsTestLimietOpen(true)}>⚠️ Limiet bereikt</button>
              <button onClick={() => setIsTestEindschermSingleOpen(true)}>🏆 Eindscherm (Highscore)</button>
              <button onClick={() => setIsTestEindschermMultiOpen(true)}>🏆 Eindscherm (Multiplayer)</button>
            </div>
          </DevCard>

          <DevCard title="Synthetic data (config)" subtitle="Genereer realistische leerdata">
            <div className="col" style={{ gap: 8 }}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Nieuwe/dag min
                  <input type="number" min={1} max={50} value={dailyNewMin} onChange={(e) => setDailyNewMin(Number(e.target.value))} style={{ width: 70 }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  max
                  <input type="number" min={1} max={50} value={dailyNewMax} onChange={(e) => setDailyNewMax(Number(e.target.value))} style={{ width: 70 }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Herh./dag min
                  <input type="number" min={0} max={200} value={dailyRepMin} onChange={(e) => setDailyRepMin(Number(e.target.value))} style={{ width: 70 }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  max
                  <input type="number" min={0} max={200} value={dailyRepMax} onChange={(e) => setDailyRepMax(Number(e.target.value))} style={{ width: 70 }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Focusdag elke
                  <input type="number" min={2} max={14} value={focusEveryNDays} onChange={(e) => setFocusEveryNDays(Number(e.target.value))} style={{ width: 70 }} />
                  dagen
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Vrije dagen
                  <input type="number" min={0} max={50} value={freeDayPercent} onChange={(e) => setFreeDayPercent(Number(e.target.value))} style={{ width: 70 }} />%
                </label>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <span className="muted">Scoreverdeling nieuw (1/3/5)</span>
                <input type="number" min={0} max={100} value={newP1} onChange={(e) => setNewP1(Number(e.target.value))} style={{ width: 60 }} />
                <input type="number" min={0} max={100} value={newP3} onChange={(e) => setNewP3(Number(e.target.value))} style={{ width: 60 }} />
                <input type="number" min={0} max={100} value={newP5} onChange={(e) => setNewP5(Number(e.target.value))} style={{ width: 60 }} />
                <span className="muted">Herhaling (1/3/5)</span>
                <input type="number" min={0} max={100} value={repP1} onChange={(e) => setRepP1(Number(e.target.value))} style={{ width: 60 }} />
                <input type="number" min={0} max={100} value={repP3} onChange={(e) => setRepP3(Number(e.target.value))} style={{ width: 60 }} />
                <input type="number" min={0} max={100} value={repP5} onChange={(e) => setRepP5(Number(e.target.value))} style={{ width: 60 }} />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button onClick={() => generateSynthetic(21)} disabled={isGenerating}>Genereer 3 weken</button>
                <button onClick={() => generateSynthetic(120)} disabled={isGenerating}>Genereer 4 maanden</button>
                {isGenerating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 160, height: 8, background: '#333', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${genProgress}%`, height: '100%', background: '#48bb78' }} />
                    </div>
                    <span style={{ fontSize: '0.9rem' }}>{genProgress}%</span>
                  </div>
                )}
              </div>
            </div>
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
                      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Alle domeinen gekopieerd naar klembord.', type: 'succes', timeoutMs: 6000 } }));
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

      {/* Test-modals */}
      <SessieSamenvatting
        isOpen={isTestSessieOpen}
        onClose={() => setIsTestSessieOpen(false)}
        sessieData={demoSessie}
        onOpenLeeranalyse={() => setIsTestSessieOpen(false)}
      />
      <OpdrachtenVoltooidModal
        isOpen={isTestVoltooidOpen}
        onClose={() => setIsTestVoltooidOpen(false)}
        onOpenCategorieSelectie={() => setIsTestVoltooidOpen(false)}
      />
      <LimietBereiktModal
        isOpen={isTestLimietOpen}
        onClose={() => setIsTestLimietOpen(false)}
        onConfirm={() => setIsTestLimietOpen(false)}
        maxVragen={10}
        onOpenInstellingen={() => setIsTestLimietOpen(false)}
      />
      {isTestEindschermSingleOpen && (
        <Eindscherm
          spelers={[demoSpelers[0]]}
          onHerstart={() => setIsTestEindschermSingleOpen(false)}
          gameMode={'single'}
          isNieuwRecord={false}
          highScore={demoHighScore}
          personalBest={null}
          isNieuwPersoonlijkRecord={false}
        />
      )}
      {isTestEindschermMultiOpen && (
        <Eindscherm
          spelers={demoSpelers}
          onHerstart={() => setIsTestEindschermMultiOpen(false)}
          gameMode={'multi'}
          isNieuwRecord={false}
          highScore={null}
          personalBest={null}
          isNieuwPersoonlijkRecord={false}
        />
      )}
    </>
  );
};


