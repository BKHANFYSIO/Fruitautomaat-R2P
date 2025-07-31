import { useState } from 'react';

interface BestandsUploaderProps {
  onFileSelected: (file: File) => void;
  onAnnuleer: () => void;
  onVerwerk: () => void;
  geselecteerdBestand: File | null;
  isVervangenActief: boolean;
  setIsVervangenActief: (isActief: boolean) => void;
}

export const BestandsUploader = ({ 
  onFileSelected, 
  onAnnuleer, 
  onVerwerk, 
  geselecteerdBestand, 
  isVervangenActief,
  setIsVervangenActief
}: BestandsUploaderProps) => {
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type)) {
      setError('Selecteer een geldig .xlsx bestand.');
      // Reset input value to allow re-selection of the same file if needed after error
      e.target.value = '';
      return;
    }

    onFileSelected(file);
    // Reset input value so the same file can be selected again after cancelling
    e.target.value = '';
  };

  return (
    <div className="bestands-uploader-container">
      {!geselecteerdBestand ? (
        <>
          <label htmlFor="file-upload" className="file-upload-label instellingen-knop">
            📁 Kies een bestand...
          </label>
          <input
            type="file"
            id="file-upload"
            accept=".xlsx"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </>
      ) : (
        <div className="verwerk-sectie">
          <p>Geselecteerd: <strong>{geselecteerdBestand.name}</strong></p>
          <label>
            <input
              type="checkbox"
              checked={isVervangenActief}
              onChange={() => setIsVervangenActief(!isVervangenActief)}
            />
            Vervang huidige opdrachten (i.p.v. toevoegen)
          </label>
          <div className="verwerk-knoppen">
            <button onClick={onVerwerk} className="bevestig-knop">Verwerk Bestand</button>
            <button onClick={onAnnuleer} className="annuleer-knop">Annuleren</button>
          </div>
        </div>
      )}
      {error && <p style={{ color: '#f56565', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}; 