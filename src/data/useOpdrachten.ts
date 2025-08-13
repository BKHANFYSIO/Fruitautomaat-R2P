import { useState, useEffect, useCallback } from 'react';
import { OPDRACHT_TYPE_ORDER } from './constants';
import * as XLSX from 'xlsx';
import type { Opdracht } from './types';

const NOOD_OPDRACHTEN: Opdracht[] = [
  { Hoofdcategorie: 'Algemeen', Categorie: 'Algemeen', Opdracht: 'Leg het concept van deze app uit', Antwoordsleutel: 'Een fruitautomaat die willekeurig opdrachten en spelers kiest.', Tijdslimiet: 60, Extra_Punten: 1, bron: 'systeem' },
  { Hoofdcategorie: 'Voorbeeld', Categorie: 'Anatomie', Opdracht: 'Benoem de botten in de onderarm', Antwoordsleutel: 'Radius (spaakbeen) en Ulna (ellepijp)', Tijdslimiet: 30, Extra_Punten: 2, bron: 'systeem' },
];

const OPDRACHTEN_STORAGE_KEY = 'fruitautomaat_user_opdrachten';

// Helper om een string te capitaliseren
const capitalize = (s: string) => {
  if (typeof s !== 'string' || !s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export const getDisplayCategorie = (opdracht: Opdracht, alleOpdrachten: Opdracht[]): string => {
  if (!opdracht.Hoofdcategorie || opdracht.Hoofdcategorie === 'Ongecategoriseerd') {
    return opdracht.Categorie;
  }
  
  const conflicterendeOpdrachten = alleOpdrachten.filter(
    o => o.Categorie === opdracht.Categorie && 
         o.Hoofdcategorie !== opdracht.Hoofdcategorie &&
         o.Hoofdcategorie !== undefined
  );
  
  if (conflicterendeOpdrachten.length > 0) {
    return `${opdracht.Categorie} (${opdracht.Hoofdcategorie})`;
  }
  
  return opdracht.Categorie;
};


export const useOpdrachten = (defaultFilePaths: string | string[]) => {
  const [opdrachten, setOpdrachten] = useState<Opdracht[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const parseExcelData = useCallback((data: ArrayBuffer, bron: 'systeem' | 'gebruiker'): Opdracht[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false, defval: "" });

    const toAscii = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
    const levenshtein = (a: string, b: string) => {
      const m = a.length, n = b.length;
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost
          );
        }
      }
      return dp[m][n];
    };
    const ALIASES: Record<string, string> = {};
    const aliasTuples: Array<[string, string]> = [
      ['feitenkennis', 'feiten'],
      ['begripsuitleg', 'begrip'],
      ['toepassing in casus', 'toepassing'],
      ['vaardigheid – onderzoek', 'onderzoek'],
      ['vaardigheid – behandeling', 'behandeling'],
      ['communicatie met patiënt', 'communicatie'],
      ['klinisch redeneren', 'redeneren']
    ];
    aliasTuples.forEach(([canon, alias]) => { ALIASES[alias] = canon; });

    const canonicalSet = new Set(OPDRACHT_TYPE_ORDER.map(t => t.toLowerCase()));
    const normalizeType = (raw: any): string => {
      if (!raw || String(raw).trim() === '') return 'Onbekend';
      const base = toAscii(String(raw).trim().toLowerCase());
      // Exact canonical
      if (canonicalSet.has(base)) return capitalize(base);
      // Alias
      if (ALIASES[base]) return capitalize(ALIASES[base]);
      // Fuzzy: pak d<=2 naar dichtstbijzijnde canonical
      let best: { t: string; d: number } | null = null;
      for (const t of canonicalSet) {
        const d = levenshtein(base, t);
        if (best === null || d < best.d) best = { t, d };
      }
      if (best && best.d <= 2) return capitalize(best.t);
      return 'Onbekend';
    };

    return json.map(row => {
      const tijdslimiet = Number(row["Tijdslimiet (sec)"]) || Number(row.Tijdslimiet);
      const extraPunten = Number(row["Extra_Punten (max 2)"]) || Number(row.Extra_Punten);
      const opdrachtType = normalizeType(row.Type || row.OpdrachtType || row.opdrachtType || '');
      const tekenenRaw = row.Tekenen ?? row.tekenen ?? '';
      const isTekenen = typeof tekenenRaw === 'string'
        ? /^(ja|yes|true|1)$/i.test(tekenenRaw.trim())
        : Boolean(tekenenRaw);
      const casus = (row.Casus ?? row.casus ?? '').toString().trim();
      // Niveau kolom (1-3), tolerant voor strings
      let niveau: 1 | 2 | 3 | undefined;
      const rawNiveau = row.Niveau ?? row.niveau ?? '';
      const nivNum = Number(String(rawNiveau).trim());
      if (!isNaN(nivNum) && [1,2,3].includes(nivNum)) {
        niveau = nivNum as 1|2|3;
      }

      const hoofdcategorie = row.Hoofdcategorie?.trim();
      const categorie = row.Categorie?.trim();

      return {
        Hoofdcategorie: hoofdcategorie ? capitalize(hoofdcategorie) : 'Ongecategoriseerd',
        Categorie: categorie ? capitalize(categorie) : "Onbekend",
        Opdracht: row.Opdracht || "Geen opdrachttekst",
        Antwoordsleutel: row.Antwoordsleutel || "",
        Tijdslimiet: !isNaN(tijdslimiet) && tijdslimiet > 0 ? tijdslimiet : 0,
        Extra_Punten: !isNaN(extraPunten) ? extraPunten : 0,
        bron,
        opdrachtType,
        isTekenen,
        casus: casus || undefined,
        niveau,
      };
    });
  }, []);

  useEffect(() => {
    const fetchInitialOpdrachten = async () => {
      try {
        setLoading(true);
        setError(null);
        setWarning(null);

        // 1. Laad systeemopdrachten (één of meerdere paden)
        let paths = Array.isArray(defaultFilePaths) ? defaultFilePaths : [defaultFilePaths];
        // Ondersteun een eenvoudige 'glob' syntax zoals '/opdrachten*.xlsx'
        if (paths.length === 1 && typeof paths[0] === 'string' && /\*\.xlsx$/.test(paths[0])) {
          const base = String(paths[0]).replace(/\*\.xlsx$/, ''); // '/opdrachten'
          const kandidaten = new Set<string>();
          // Basenaam
          kandidaten.add(`${base}.xlsx`);
          // Cijfer-varianten: zonder en met koppelteken, index 1..30
          for (let i = 1; i <= 30; i++) {
            kandidaten.add(`${base}${i}.xlsx`);
            kandidaten.add(`${base}-${i}.xlsx`);
          }
          // Veelvoorkomende suffixen met koppelteken
          ['oud', 'extra', 'anatomie', 'fysio', 'pathofysiologie', 'gedrag', 'communicatie', 'revalidatie']
            .forEach(s => kandidaten.add(`${base}-${s}.xlsx`));
          paths = Array.from(kandidaten);
        }
        const resultaten = await Promise.all(
          paths.map(async (path) => {
            try {
              const resp = await fetch(path);
              if (!resp.ok) throw new Error(`Kon ${path} niet laden`);
              const ab = await resp.arrayBuffer();
              const parsed = parseExcelData(ab, 'systeem');
              return { path, opdrachten: parsed, ok: true as const };
            } catch (e) {
              return { path, opdrachten: [] as Opdracht[], ok: false as const };
            }
          })
        );
        const systeemOpdrachten = resultaten.flatMap(r => r.opdrachten);
        const mislukte = resultaten.filter(r => !r.ok).map(r => r.path);

        if (systeemOpdrachten.length === 0) {
          // Geen enkel standaardbestand geladen → toon waarschuwing en val terug op noodopdrachten
          setWarning(`Standaard opdrachtenbestand(en) konden niet worden geladen (${mislukte.join(', ') || 'onbekend'}). De app gebruikt nu voorbeeldopdrachten. Upload een correct bestand via Instellingen.`);
          setOpdrachten(NOOD_OPDRACHTEN);
          setLoading(false);
          return;
        }

        // Extra zachte validatie: systeembestanden met ontbrekende casus bij casus-typen
        const systeemZonderCasus = systeemOpdrachten.filter(o =>
          (o.opdrachtType === 'Toepassing in casus' || o.opdrachtType === 'Klinisch redeneren') && (!o.casus || o.casus.trim() === '')
        );
        if (systeemZonderCasus.length > 0) {
          const voorbeelden = systeemZonderCasus.slice(0, 3).map(o => `${o.Hoofdcategorie || ''} > ${o.Categorie} — ${o.opdrachtType}: ${o.Opdracht.substring(0, 80)}${o.Opdracht.length > 80 ? '…' : ''}`);
          const msg = `Waarschuwing: ${systeemZonderCasus.length} systeemopdracht(en) missen "Casus" terwijl het type "Toepassing in casus" of "Klinisch redeneren" is. Voorbeelden:\n- ${voorbeelden.join('\n- ')}\n(De rijen zijn wel ingeladen. Tip: vul de kolom Casus aan.)`;
          setWarning(msg);
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            // Extra melding voor lokale ontwikkeling
            console.warn('[Opdrachten] Ontbrekende Casus in systeembestanden:', { aantal: systeemZonderCasus.length, voorbeelden });
          }
        }

        // 2. Laad gebruiker opdrachten uit localStorage
        const opgeslagenGebruikerOpdrachten = localStorage.getItem(OPDRACHTEN_STORAGE_KEY);
        const gebruikerOpdrachten = opgeslagenGebruikerOpdrachten ? JSON.parse(opgeslagenGebruikerOpdrachten) : [];

        // 3. Combineer en set de opdrachten
        setOpdrachten([...systeemOpdrachten, ...gebruikerOpdrachten]);

      } catch (err) {
        setWarning('Standaard opdrachtenbestand(en) niet gevonden of ongeldig. De app gebruikt nu voorbeeldopdrachten. Upload een correct bestand via Instellingen.');
        setOpdrachten(NOOD_OPDRACHTEN);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialOpdrachten();
  }, [defaultFilePaths, parseExcelData]);

  const laadNieuweOpdrachten = useCallback((nieuweOpdrachten: Opdracht[], vervang: boolean) => {
    // We slaan alleen 'gebruiker' opdrachten op in localStorage
    const gebruikerOpdrachten = nieuweOpdrachten.filter(o => o.bron === 'gebruiker');

    setOpdrachten(huidigeOpdrachten => {
      const systeemOpdrachten = huidigeOpdrachten.filter(o => o.bron === 'systeem');
      const huidigeGebruikerOpdrachten = vervang ? [] : huidigeOpdrachten.filter(o => o.bron === 'gebruiker');
      
      // Verbeterde duplicaat detectie: check op combinatie van opdrachttekst, categorie en hoofdcategorie
      const bestaandeOpdrachtKeys = new Set(
        huidigeGebruikerOpdrachten.map(o => 
          `${o.Opdracht}|${o.Categorie}|${o.Hoofdcategorie}`
        )
      );
      
      const uniekeNieuweOpdrachten = gebruikerOpdrachten.filter(o => {
        const key = `${o.Opdracht}|${o.Categorie}|${o.Hoofdcategorie}`;
        return !bestaandeOpdrachtKeys.has(key);
      });

      const gecombineerdeGebruikerOpdrachten = [...huidigeGebruikerOpdrachten, ...uniekeNieuweOpdrachten];
      
      localStorage.setItem(OPDRACHTEN_STORAGE_KEY, JSON.stringify(gecombineerdeGebruikerOpdrachten));
      
      return [...systeemOpdrachten, ...gecombineerdeGebruikerOpdrachten];
    });

    setWarning(null);
  }, []);
  
  const verwijderGebruikerOpdrachten = useCallback(() => {
    localStorage.removeItem(OPDRACHTEN_STORAGE_KEY);
    setOpdrachten(huidigeOpdrachten => huidigeOpdrachten.filter(o => o.bron === 'systeem'));
  }, []);

  return { opdrachten, loading, error, warning, laadNieuweOpdrachten, parseExcelData, verwijderGebruikerOpdrachten };
};
