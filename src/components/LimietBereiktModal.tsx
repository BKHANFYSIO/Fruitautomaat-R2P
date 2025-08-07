import React from 'react';
import './LimietBereiktModal.css';

interface LimietBereiktModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  maxVragen: number;
  onOpenInstellingen?: () => void;
}

export const LimietBereiktModal: React.FC<LimietBereiktModalProps> = ({ isOpen, onClose, onConfirm, maxVragen, onOpenInstellingen }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="limiet-bereikt-modal-overlay" onClick={onClose}>
      <div className="limiet-bereikt-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="limiet-bereikt-modal-header">
          <h3>⚠️ Limiet voor nieuwe vragen bereikt</h3>
          <button onClick={onClose} className="limiet-bereikt-modal-close">&times;</button>
        </div>
        <div className="limiet-bereikt-modal-body">
          <p>
            Je hebt de dagelijkse limiet van <strong>{maxVragen}</strong> nieuwe vragen voor het Leitner-systeem bereikt.
          </p>
          <p className="uitleg-tekst">
            Het wordt aangeraden om niet te veel nieuwe onderwerpen op één dag te introduceren. Dit helpt om de hoeveelheid herhalingen beheersbaar te houden en bevordert een beter leereffect op de lange termijn.
          </p>
          {onOpenInstellingen && (
            <div className="instellingen-verwijzing">
              <p>
                <strong>Tip:</strong> Je kunt deze limiet aanpassen in de instellingen onder het "Leitner Leermodus" tabblad.
              </p>
              <button 
                onClick={onOpenInstellingen} 
                className="instellingen-knop-limiet"
                type="button"
              >
                ⚙️ Instellingen openen
              </button>
            </div>
          )}
          <p>
            Wil je de limiet voor vandaag negeren en toch doorgaan met nieuwe vragen?
          </p>
        </div>
        <div className="limiet-bereikt-modal-footer">
          <button onClick={onClose} className="limiet-bereikt-modal-button secondary">
            Stop voor vandaag
          </button>
          <button onClick={onConfirm} className="limiet-bereikt-modal-button primary">
            Ja, ga door met nieuwe vragen
          </button>
        </div>
      </div>
    </div>
  );
};
