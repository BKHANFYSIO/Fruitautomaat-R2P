import React from 'react';
import './Uitleg.css';

type Props = { isOpen: boolean; onClose: () => void };

export const LeerstrategienModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="uitleg-overlay" onClick={onClose}>
      <div className="uitleg-content" onClick={(e) => e.stopPropagation()}>
        <div className="uitleg-header">
          <h2>Leerstrategieën in deze app</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="uitleg-body">
          <p>Een aantal bewezen effectieve strategieën die je in deze app terugziet:</p>
          <ul>
            <li><strong>Retrieval Practice</strong>: actief ophalen van kennis in plaats van herlezen.</li>
            <li><strong>Elaboration</strong>: uitleggen/onderbouwen om begrip te verdiepen.</li>
            <li><strong>Spaced Repetition</strong>: herhalen met tussenpozen (Leitner; vergeetcurve).</li>
            <li><strong>Gamification</strong>: motivatie via spelmechanieken.</li>
            <li><strong>Zelfsturend leren</strong>: inzicht via leeranalyse en eigen keuzes.</li>
            <li><strong>Leren door uitleggen</strong>: verwoord je antwoord en geef voorbeelden.</li>
            <li><strong>Feedback</strong>: via antwoordsleutels, AI of peers.</li>
            <li><strong>Toetsing</strong>: formatief oefenen en beoordelen.</li>
            <li><strong>Interleaving</strong>: gerelateerde categorieën door elkaar oefenen.</li>
          </ul>
          <p style={{ marginTop: 8 }}>In volgende iteraties linken we relevante tips/context in de leermodus direct naar deze uitleg.</p>
        </div>
      </div>
    </div>
  );
};


