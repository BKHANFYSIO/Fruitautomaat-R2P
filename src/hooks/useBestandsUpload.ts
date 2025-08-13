import { useCallback, useState } from 'react';
import type { Opdracht } from '../data/types';

type ParseExcelData = (arrayBuffer: ArrayBuffer, bron: 'gebruiker' | 'systeem') => Opdracht[];
type LaadNieuweOpdrachten = (nieuwe: Opdracht[], vervang: boolean) => void;

export function useBestandsUpload(
  parseExcelData: ParseExcelData,
  laadNieuweOpdrachten: LaadNieuweOpdrachten,
  showNotificatie: (msg: string, type?: 'succes' | 'fout', timeoutMs?: number) => void,
) {
  const [geselecteerdBestand, setGeselecteerdBestand] = useState<File | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleFileSelected = useCallback((file: File) => {
    setGeselecteerdBestand(file);
  }, []);

  const handleAnnuleerUpload = useCallback(() => {
    setGeselecteerdBestand(null);
  }, []);

  const handleVerwerkBestand = useCallback((vervang: boolean) => {
    if (!geselecteerdBestand) return;
    setIsBusy(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const nieuweOpdrachten = parseExcelData(arrayBuffer, 'gebruiker');
        // Zachte validatie: Klinisch redeneren zonder Casus
        const zonderCasus = nieuweOpdrachten.filter(o => o.opdrachtType === 'Klinisch redeneren' && (!o.casus || o.casus.trim() === ''));
        if (zonderCasus.length > 0) {
          showNotificatie(`Waarschuwing: ${zonderCasus.length} opdracht(en) met type "Klinisch redeneren" missen een Casus. Ze zijn wel ingeladen.`, 'fout', 6000);
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[Upload] Ontbrekende Casus in gebruikersbestand:', { aantal: zonderCasus.length, voorbeelden: zonderCasus.slice(0,3).map(o => o.Opdracht?.slice(0,80)) });
          }
        }
        // NB: deduplicatie is elders afgevangen
        laadNieuweOpdrachten(nieuweOpdrachten, vervang);
        if (vervang) {
          showNotificatie(`${nieuweOpdrachten.length} opdrachten succesvol vervangen!`, 'succes', 4000);
        } else {
          showNotificatie(`${nieuweOpdrachten.length} opdrachten succesvol toegevoegd!`, 'succes', 4000);
        }
        setGeselecteerdBestand(null);
      } catch (err) {
        showNotificatie('Fout bij het verwerken van het Excel-bestand. Controleer het formaat.', 'fout', 5000);
        setGeselecteerdBestand(null);
      } finally {
        setIsBusy(false);
      }
    };
    reader.onerror = () => {
      showNotificatie('Fout bij het lezen van het bestand.', 'fout', 4000);
      setGeselecteerdBestand(null);
      setIsBusy(false);
    };
    reader.readAsArrayBuffer(geselecteerdBestand);
  }, [geselecteerdBestand, parseExcelData, laadNieuweOpdrachten, showNotificatie]);

  return { geselecteerdBestand, isBusy, handleFileSelected, handleAnnuleerUpload, handleVerwerkBestand };
}


