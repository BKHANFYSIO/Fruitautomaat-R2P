import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { Opdracht } from './types';

const NOOD_OPDRACHTEN: Opdracht[] = [
  { Categorie: 'Algemeen', Opdracht: 'Leg het concept van deze app uit', Antwoordsleutel: 'Een fruitautomaat die willekeurig opdrachten en spelers kiest.', Tijdslimiet: 60, Extra_Punten: 1 },
  { Categorie: 'Anatomie (Voorbeeld)', Opdracht: 'Benoem de botten in de onderarm', Antwoordsleutel: 'Radius (spaakbeen) en Ulna (ellepijp)', Tijdslimiet: 30, Extra_Punten: 2 },
];


export const useOpdrachten = (defaultFilePath: string) => {
  const [opdrachten, setOpdrachten] = useState<Opdracht[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const parseExcelData = useCallback((data: ArrayBuffer): Opdracht[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false, defval: "" });

    return json.map(row => {
      // Probeer beide mogelijke kolomnamen voor Tijdslimiet
      const tijdslimiet = Number(row["Tijdslimiet (sec)"]) || Number(row.Tijdslimiet);
      const extraPunten = Number(row["Extra_Punten (max 2)"]) || Number(row.Extra_Punten);

      return {
        Categorie: row.Categorie || "Onbekend",
        Opdracht: row.Opdracht || "Geen opdrachttekst",
        Antwoordsleutel: row.Antwoordsleutel || "",
        // Als tijdslimiet geen geldig getal is of 0, gebruik 0 (geen timer)
        Tijdslimiet: !isNaN(tijdslimiet) && tijdslimiet > 0 ? tijdslimiet : 0,
        Extra_Punten: !isNaN(extraPunten) ? extraPunten : 0,
      };
    });
  }, []);

  useEffect(() => {
    const fetchInitialOpdrachten = async () => {
      try {
        setLoading(true);
        setError(null);
        setWarning(null);
        const response = await fetch(defaultFilePath);
        if (!response.ok) {
          throw new Error(`Standaard opdrachtenbestand (${defaultFilePath}) kon niet worden geladen.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const data = parseExcelData(arrayBuffer);
        // Voeg een extra check toe om te zien of er daadwerkelijk rijen zijn geparsed.
        if (data.length === 0) {
            throw new Error("Excel-bestand is leeg of heeft een onverwacht format.");
        }
        setOpdrachten(data);
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
    if (vervang) {
      setOpdrachten(nieuweOpdrachten);
    } else {
      setOpdrachten(huidigeOpdrachten => {
        const bestaandeOpdrachtKeys = new Set(huidigeOpdrachten.map(o => o.Opdracht));
        const uniekeNieuweOpdrachten = nieuweOpdrachten.filter(o => !bestaandeOpdrachtKeys.has(o.Opdracht));
        return [...huidigeOpdrachten, ...uniekeNieuweOpdrachten];
      });
    }
    setWarning(null); // Verwijder de waarschuwing na een succesvolle upload
  }, []);

  return { opdrachten, loading, error, warning, laadNieuweOpdrachten, parseExcelData };
}; 