import { useState } from 'react';
import './BestandsUploader.css';

interface BestandsUploaderProps {
  onFileSelected: (file: File) => void;
  onAnnuleer: () => void;
  onVerwerk: (vervang: boolean) => void;
  geselecteerdBestand: File | null;
}

export const BestandsUploader = ({ 
  onFileSelected, 
  onAnnuleer, 
  onVerwerk, 
  geselecteerdBestand
}: BestandsUploaderProps) => {
  const [uploadMode, setUploadMode] = useState<'vervangen' | 'toevoegen'>('vervangen');
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
          <p style={{ color: '#333', marginBottom: '15px' }}>Geselecteerd: <strong>{geselecteerdBestand.name}</strong></p>
          
          <div className="upload-mode-selectie">
            <p style={{ fontSize: '0.9rem', color: '#333', marginBottom: '10px', fontWeight: '600' }}>
              Upload modus:
            </p>
            <div className="upload-mode-knoppen">
              <label className="upload-mode-optie">
                <input
                  type="radio"
                  name="uploadMode"
                  value="vervangen"
                  checked={uploadMode === 'vervangen'}
                  onChange={() => setUploadMode('vervangen')}
                />
                <span className="upload-mode-label">
                  <strong>Vervangen</strong> - Alle eigen opdrachten vervangen
                </span>
              </label>
              <label className="upload-mode-optie">
                <input
                  type="radio"
                  name="uploadMode"
                  value="toevoegen"
                  checked={uploadMode === 'toevoegen'}
                  onChange={() => setUploadMode('toevoegen')}
                />
                <span className="upload-mode-label">
                  <strong>Toevoegen</strong> - Nieuwe opdrachten toevoegen (dubbelingen worden overgeslagen)
                </span>
              </label>
            </div>
          </div>

          <div className="upload-info">
            {uploadMode === 'vervangen' ? (
              <p style={{ fontSize: '0.9rem', color: '#d32f2f', fontWeight: 'bold', marginBottom: '15px', backgroundColor: '#ffebee', padding: '8px', borderRadius: '4px', border: '1px solid #ffcdd2' }}>
                ⚠️ <strong>Let op:</strong> Alle huidige eigen opdrachten worden vervangen. Systeem opdrachten blijven behouden.
              </p>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#2e7d32', fontWeight: 'bold', marginBottom: '15px', backgroundColor: '#e8f5e8', padding: '8px', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                ✅ <strong>Veilig:</strong> Nieuwe opdrachten worden toegevoegd. Bestaande opdrachten blijven behouden.
              </p>
            )}
          </div>

          <div className="verwerk-knoppen">
            <button onClick={() => onVerwerk(uploadMode === 'vervangen')} className="bevestig-knop">
              {uploadMode === 'vervangen' ? 'Vervang & Verwerk' : 'Toevoegen & Verwerk'}
            </button>
            <button onClick={onAnnuleer} className="annuleer-knop">Annuleren</button>
          </div>
        </div>
      )}
      {error && <p style={{ color: '#f56565', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}; 