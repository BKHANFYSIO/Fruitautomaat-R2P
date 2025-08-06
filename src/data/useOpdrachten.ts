import { useState, useEffect, useCallback } from 'react';
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


export const useOpdrachten = (defaultFilePath: string) => {
  const [opdrachten, setOpdrachten] = useState<Opdracht[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const parseExcelData = useCallback((data: ArrayBuffer, bron: 'systeem' | 'gebruiker'): Opdracht[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false, defval: "" });

    return json.map(row => {
      const tijdslimiet = Number(row["Tijdslimiet (sec)"]) || Number(row.Tijdslimiet);
      const extraPunten = Number(row["Extra_Punten (max 2)"]) || Number(row.Extra_Punten);
      const opdrachtType = row.OpdrachtType || row.opdrachtType || 'Onbekend';

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
        opdrachtType: opdrachtType ? capitalize(opdrachtType) : 'Onbekend',
      };
    });
  }, []);

  useEffect(() => {
    const fetchInitialOpdrachten = async () => {
      try {
        setLoading(true);
        setError(null);
        setWarning(null);

        // 1. Laad systeemopdrachten
        const response = await fetch(defaultFilePath);
        if (!response.ok) {
          throw new Error(`Standaard opdrachtenbestand (${defaultFilePath}) kon niet worden geladen.`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const systeemOpdrachten = parseExcelData(arrayBuffer, 'systeem');

        if (systeemOpdrachten.length === 0) {
            throw new Error("Excel-bestand is leeg of heeft een onverwacht format.");
        }

        // 2. Laad gebruiker opdrachten uit localStorage
        const opgeslagenGebruikerOpdrachten = localStorage.getItem(OPDRACHTEN_STORAGE_KEY);
        const gebruikerOpdrachten = opgeslagenGebruikerOpdrachten ? JSON.parse(opgeslagenGebruikerOpdrachten) : [];

        // 3. Combineer en set de opdrachten
        setOpdrachten([...systeemOpdrachten, ...gebruikerOpdrachten]);

      } catch (err) {
        setWarning('Standaard opdrachtenbestand niet gevonden of ongeldig. De app gebruikt nu voorbeeldopdrachten. Upload een correct bestand via Instellingen.');
        setOpdrachten(NOOD_OPDRACHTEN);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialOpdrachten();
  }, [defaultFilePath, parseExcelData]);

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
