import React from 'react';
import { Modal } from './Modal';
import './OpdrachtenVoltooidModal.css';

interface OpdrachtenVoltooidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCategorieSelectie?: (tab?: 'leitner' | 'highscore' | 'multiplayer' | 'normaal') => void;
}

export const OpdrachtenVoltooidModal: React.FC<OpdrachtenVoltooidModalProps> = ({ 
  isOpen, 
  onClose, 
  onOpenCategorieSelectie 
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<span>🎯 Alle opdrachten voltooid</span>} size="sm" variant="success">
      <div className="opdrachten-voltooid-modal-body">
        <div className="success-icon">🎉</div>
        <p className="main-message">
          Gefeliciteerd! Je hebt alle opdrachten (zowel nieuw als te herhalen) in de geselecteerde categorieën voltooid.
        </p>
        <div className="info-section">
          <p><strong>Wat nu?</strong> Je kunt:</p>
          <ul>
            <li>Andere categorieën selecteren om verder te oefenen</li>
            <li>Je leeranalyse bekijken om je voortgang te zien</li>
            <li>Een (tussentijds) certificaat genereren voor je portfolio</li>
            <li>Vrije leermodus of andere modus kiezen</li>
          </ul>
        </div>
      </div>
      <div className="opdrachten-voltooid-modal-footer">
        <button onClick={onClose} className="opdrachten-voltooid-modal-button secondary">Sluiten</button>
        {onOpenCategorieSelectie && (
          <button onClick={() => onOpenCategorieSelectie('leitner')} className="opdrachten-voltooid-modal-button primary">
            📚 Leitner Categorieën Beheren
          </button>
        )}
      </div>
    </Modal>
  );
};
