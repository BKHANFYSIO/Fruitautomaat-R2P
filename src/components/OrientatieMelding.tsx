import { useState } from 'react';
import './OrientatieMelding.css';

interface OrientatieMeldingProps {
  isMobiel: boolean;
}

export const OrientatieMelding = ({ isMobiel }: OrientatieMeldingProps) => {
  const [genegeerd, setGenegeerd] = useState(false);

  // Toon alleen op mobiele apparaten in portrait modus (via CSS)
  if (!isMobiel || genegeerd) {
    return null;
  }

  const handleNegeer = () => {
    setGenegeerd(true);
  };

  return (
    <div className="orientatie-melding-overlay">
      <div className="orientatie-melding-content">
        <svg 
          className="orientatie-icoon"
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M16 6.2c2.5 0 4.8 1 6.5 2.5l-2.2 2.2c-1.2-1-2.8-1.7-4.3-1.7-3.3 0-6 2.7-6 6s2.7 6 6 6c1.5 0 3-.7 4.3-1.7l2.2 2.2c-1.7 1.5-4 2.5-6.5 2.5-5 0-9-4-9-9s4-9 9-9z"/>
          <path d="M18 10l4 4-4 4"/>
        </svg>
        <p>Voor de beste ervaring, draai je scherm naar de horizontale modus.</p>
        <div className="fullscreen-tip">
          <p>Tip: gebruik de 'volledig scherm' modus voor een nog betere ervaring.</p>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fullscreen-icoon"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        </div>
        <button onClick={handleNegeer} className="negeer-knop">Negeren</button>
      </div>
    </div>
  );
}; 