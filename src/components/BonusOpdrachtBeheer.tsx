import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './BonusOpdrachtBeheer.css';

type BonusOpdracht = { opdracht: string; punten: number[] };

interface BonusOpdrachtBeheerProps {
  opdrachten: BonusOpdracht[];
  setOpdrachten: (opdrachten: BonusOpdracht[]) => void;
  isLokaleOpslagActief?: boolean;
  basisBonusOpdrachten: BonusOpdracht[];
  onLokaleOpslagChange?: (actief: boolean) => void;
}

export const BonusOpdrachtBeheer = ({ 
  opdrachten, 
  setOpdrachten, 
  isLokaleOpslagActief = false,
  basisBonusOpdrachten,
  onLokaleOpslagChange
}: BonusOpdrachtBeheerProps) => {
  const [nieuweOpdracht, setNieuweOpdracht] = useState('');
  const [nieuwePunten, setNieuwePunten] = useState('');
  const [toonBevestiging, setToonBevestiging] = useState(false);
  const [toonResetBevestiging, setToonResetBevestiging] = useState(false);
  const [toonLokaleOpslagDialog, setToonLokaleOpslagDialog] = useState(false);
  const [pendingOpdrachten, setPendingOpdrachten] = useState<BonusOpdracht[]>([]);
  const [dialogType, setDialogType] = useState<'import' | 'handmatig' | 'bulk'>('import');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Laad opgeslagen bonusopdrachten bij component mount
  useEffect(() => {
    if (isLokaleOpslagActief) {
      const opgeslagen = localStorage.getItem('bonusOpdrachten');
      if (opgeslagen) {
        try {
          const parsed = JSON.parse(opgeslagen);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOpdrachten(parsed);
          }
        } catch (error) {
          console.error('Fout bij het laden van opgeslagen bonusopdrachten:', error);
        }
      }
    }
  }, [isLokaleOpslagActief, setOpdrachten]);

  // Sla bonusopdrachten op in localStorage wanneer ze veranderen
  useEffect(() => {
    if (isLokaleOpslagActief && opdrachten.length > 0) {
      localStorage.setItem('bonusOpdrachten', JSON.stringify(opdrachten));
    } else if (!isLokaleOpslagActief) {
      localStorage.removeItem('bonusOpdrachten');
    }
  }, [opdrachten, isLokaleOpslagActief]);

  const handleToevoegen = (event: React.FormEvent) => {
    event.preventDefault();
    if (!nieuweOpdracht || !nieuwePunten) {
      alert('Vul zowel een opdracht als de punten in.');
      return;
    }
    const puntenArray = nieuwePunten.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    if (puntenArray.length === 0) {
      alert('Geef geldige, komma-gescheiden punten op (bijv. 1, 2, 3).');
      return;
    }
    
    const nieuweOpdrachtObj = { opdracht: nieuweOpdracht, punten: puntenArray };
    const nieuweLijst = [...opdrachten, nieuweOpdrachtObj];
    
    // Vraag om lokale opslag als dit de eerste handmatige toevoeging is
    if (!isLokaleOpslagActief) {
      setPendingOpdrachten(nieuweLijst);
      setDialogType('handmatig');
      setToonLokaleOpslagDialog(true);
    } else {
      setOpdrachten(nieuweLijst);
    }
    
    setNieuweOpdracht('');
    setNieuwePunten('');
  };

  // Functie voor het verwijderen van individuele opdrachten (niet meer gebruikt in deze component)
  // const handleVerwijderen = (index: number) => {
  //   setOpdrachten(opdrachten.filter((_, i) => i !== index));
  // };

  const handleBulkVerwijderen = () => {
    setOpdrachten([]);
    setToonBevestiging(false);
  };

  const handleResetNaarBasis = () => {
    setOpdrachten(basisBonusOpdrachten);
    setToonResetBevestiging(false);
  };

  const handleLokaleOpslagBevestiging = (actief: boolean) => {
    if (onLokaleOpslagChange) {
      onLokaleOpslagChange(actief);
    }
    
    if (actief && pendingOpdrachten.length > 0) {
      setOpdrachten(pendingOpdrachten);
    }
    
    setToonLokaleOpslagDialog(false);
    setPendingOpdrachten([]);
  };

  const downloadExcelSjabloon = () => {
    const data = [
      { 
        Bonusopdracht: 'Voorbeeld bonusopdracht', 
        Punten: '1, 2, 3'
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bonusopdrachten");
    XLSX.writeFile(workbook, "bonusopdrachten_sjabloon.xlsx");
  };

  const exportNaarExcel = () => {
    const data = opdrachten.map(opdracht => ({
      Bonusopdracht: opdracht.opdracht,
      Punten: opdracht.punten.join(', ')
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bonusopdrachten");
    XLSX.writeFile(workbook, "bonusopdrachten_export.xlsx");
  };

  const importVanExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const nieuweOpdrachten: BonusOpdracht[] = [];
        
        jsonData.forEach((row: any) => {
          const opdracht = row.Bonusopdracht || row.bonusopdracht;
          const puntenString = row.Punten || row.punten;
          
          if (opdracht && puntenString) {
            const puntenArray = puntenString.toString().split(',').map((p: string) => parseInt(p.trim())).filter((p: number) => !isNaN(p));
            if (puntenArray.length > 0) {
              nieuweOpdrachten.push({ opdracht, punten: puntenArray });
            }
          }
        });

        if (nieuweOpdrachten.length > 0) {
          // Vraag om lokale opslag bij import
          setPendingOpdrachten(nieuweOpdrachten);
          setDialogType('import');
          setToonLokaleOpslagDialog(true);
        } else {
          alert('Geen geldige bonusopdrachten gevonden in het bestand.');
        }
      } catch (error) {
        alert('Fout bij het lezen van het Excel bestand. Controleer of het juiste formaat heeft.');
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDialogContent = () => {
    switch (dialogType) {
      case 'import':
        return {
          title: 'Lokale Opslag voor Geïmporteerde Opdrachten',
          message: `Wil je de ${pendingOpdrachten.length} geïmporteerde bonusopdracht(en) lokaal opslaan zodat ze niet verloren gaan bij het verversen van de pagina?`,
          importCount: pendingOpdrachten.length
        };
      case 'handmatig':
        return {
          title: 'Lokale Opslag voor Bonusopdrachten',
          message: 'Wil je je bonusopdrachten lokaal opslaan zodat ze niet verloren gaan bij het verversen van de pagina?\n\nDeze vraag wordt alleen bij de eerste keer gesteld. Na een refresh wordt deze opnieuw gesteld als je nog niet voor lokale opslag hebt gekozen.',
          importCount: 1
        };
      default:
        return {
          title: 'Lokale Opslag',
          message: 'Wil je je bonusopdrachten lokaal opslaan?',
          importCount: 0
        };
    }
  };

  return (
    <div className="bonus-opdracht-beheer">
      <p className="uitleg-tekst">
        Voeg bonusopdrachten toe voor extra variatie in het spel. Je kunt ze handmatig toevoegen, via Excel importeren, of allemaal verwijderen. 
        <strong>Tip:</strong> Bewaar je Excel bestand of deel het online met medestudenten voor hergebruik!
        {isLokaleOpslagActief && (
          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}> ✓ Lokale opslag actief</span>
        )}
      </p>

      {/* Excel Import/Export Sectie */}
      <div className="excel-sectie">
        <h5>Excel Import/Export</h5>
        <div className="excel-knoppen">
          <button 
            onClick={downloadExcelSjabloon} 
            className="excel-knop sjabloon-knop"
            title="Download een Excel bestand met de juiste kolommen om bonusopdrachten in te vullen"
          >
            📥 Download Excel Sjabloon
          </button>
          <button 
            onClick={exportNaarExcel} 
            className="excel-knop export-knop" 
            disabled={opdrachten.length === 0}
            title="Exporteer alle huidige bonusopdrachten naar een Excel bestand"
          >
            📤 Export naar Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={importVanExcel}
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="excel-knop import-knop"
            title="Importeer bonusopdrachten uit een Excel bestand (voegt toe aan bestaande opdrachten)"
          >
            📁 Import van Excel
          </button>
        </div>
      </div>

      {/* Beheer Knoppen */}
      <div className="beheer-knoppen">
        {opdrachten.length > 0 && (
          <button 
            onClick={() => setToonBevestiging(true)} 
            className="bulk-verwijder-knop"
            title="Verwijder alle bonusopdrachten in één keer"
          >
            🗑️ Verwijder alle opdrachten
          </button>
        )}
        <button 
          onClick={() => setToonResetBevestiging(true)} 
          className="reset-basis-knop"
          title="Herstel de originele bonusopdrachten die standaard bij het spel horen"
        >
          🔄 Herstel basis bonusopdrachten
        </button>
      </div>

      {/* Handmatige Toevoeging */}
      <div className="handmatig-sectie">
        <h5>Handmatig Toevoegen</h5>
        <p className="setting-description" style={{ marginBottom: '10px', fontSize: '0.9em' }}>
          Voeg snel een nieuwe bonusopdracht toe met bijbehorende punten.
        </p>
        <form onSubmit={handleToevoegen} className="nieuwe-opdracht-formulier">
          <input
            type="text"
            className="tekst-input"
            value={nieuweOpdracht}
            onChange={(e) => setNieuweOpdracht(e.target.value)}
            placeholder="Nieuwe bonusopdracht"
            title="Voer hier je bonusopdracht in"
            required
          />
          <input
            type="text"
            className="punten-input"
            value={nieuwePunten}
            onChange={(e) => setNieuwePunten(e.target.value)}
            placeholder="Punten (bijv. 1,2,3)"
            title="Voer de punten in die je kunt verdienen, gescheiden door komma's"
            required
          />
          <button 
            type="submit" 
            className="toevoeg-knop"
            title="Voeg de nieuwe bonusopdracht toe"
          >
            +
          </button>
        </form>
      </div>

      {/* Bevestigingsdialoog voor verwijderen */}
      {toonBevestiging && (
        <div className="bevestigings-overlay">
          <div className="bevestigings-dialoog">
            <h4>Bevestig Verwijdering</h4>
            <p>Weet je zeker dat je alle {opdrachten.length} bonusopdracht(en) wilt verwijderen?</p>
            <div className="bevestigings-knoppen">
              <button onClick={() => setToonBevestiging(false)} className="annuleer-knop">
                Annuleren
              </button>
              <button onClick={handleBulkVerwijderen} className="bevestig-knop">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bevestigingsdialoog voor reset */}
      {toonResetBevestiging && (
        <div className="bevestigings-overlay">
          <div className="bevestigings-dialoog">
            <h4>Herstel Basis Bonusopdrachten</h4>
            <p>Weet je zeker dat je terug wilt naar de basis bonusopdrachten? Dit vervangt alle huidige opdrachten.</p>
            <div className="bevestigings-knoppen">
              <button onClick={() => setToonResetBevestiging(false)} className="annuleer-knop">
                Annuleren
              </button>
              <button onClick={handleResetNaarBasis} className="bevestig-knop">
                Herstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lokale opslag dialoog */}
      {toonLokaleOpslagDialog && (
        <div className="bevestigings-overlay">
          <div className="bevestigings-dialoog">
            <h4>{getDialogContent().title}</h4>
            <p>{getDialogContent().message}</p>
            {dialogType === 'import' && (
              <p style={{ fontSize: '0.9em', color: '#4CAF50', marginTop: '10px' }}>
                ✓ {getDialogContent().importCount} opdracht(en) klaar voor import
              </p>
            )}
            <div className="bevestigings-knoppen">
              <button onClick={() => handleLokaleOpslagBevestiging(false)} className="annuleer-knop">
                Nee, alleen tijdelijk opslaan
              </button>
              <button onClick={() => handleLokaleOpslagBevestiging(true)} className="bevestig-knop">
                Ja, lokaal opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 