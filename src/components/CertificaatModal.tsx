import React, { useState } from 'react';
import './CertificaatModal.css';

interface CertificaatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (studentName: string) => void;
}

export const CertificaatModal = ({ isOpen, onClose, onGenerate }: CertificaatModalProps) => {
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      setError('Voer een naam in');
      return;
    }

    if (studentName.trim().length < 2) {
      setError('Naam moet minimaal 2 karakters bevatten');
      return;
    }

    setError('');
    onGenerate(studentName.trim());
    setStudentName('');
  };

  const handleClose = () => {
    setStudentName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="certificaat-modal-overlay" onClick={handleClose}>
      <div className="certificaat-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="certificaat-modal-header">
          <h3>🏆 Certificaat Genereren</h3>
          <button onClick={handleClose} className="certificaat-modal-close">&times;</button>
        </div>
        
        <div className="certificaat-modal-body">
          <p>
            Voer je naam in om een certificaat te genereren met je leerprestaties uit de serieuze leer-modus.
          </p>
          
          <form onSubmit={handleSubmit} className="certificaat-form">
            <div className="form-group">
              <label htmlFor="studentName">Naam:</label>
              <input
                type="text"
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Voer je volledige naam in"
                className={error ? 'error' : ''}
                autoFocus
              />
              {error && <span className="error-message">{error}</span>}
            </div>
            
            <div className="certificaat-info">
              <h4>Certificaat bevat:</h4>
              <ul>
                <li>📊 Overzicht van je leerprestaties</li>
                <li>🎯 Analyse per categorie</li>
                <li>🏆 Behaalde achievements</li>
                <li>📈 Sessie statistieken</li>
              </ul>
            </div>
          </form>
        </div>
        
        <div className="certificaat-modal-footer">
          <button onClick={handleClose} className="certificaat-modal-button secondary">
            Annuleren
          </button>
          <button 
            onClick={handleSubmit}
            className="certificaat-modal-button primary"
            disabled={!studentName.trim()}
          >
            🏆 Certificaat Genereren
          </button>
        </div>
      </div>
    </div>
  );
}; 