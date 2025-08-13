import { useState } from 'react';
import './Hendel.css';

interface HendelProps {
  onSpin: () => void;
  disabled: boolean;
  attract?: boolean;
}

export const Hendel = ({ onSpin, disabled, attract = false }: HendelProps) => {
  const [isPulled, setIsPulled] = useState(false);

  const handlePull = () => {
    if (disabled) return;

    setIsPulled(true);
    onSpin();

    // Reset de animatie na een korte vertraging
    setTimeout(() => {
      setIsPulled(false);
    }, 500); // Duur van de animatie
  };

  return (
    <div 
      className="hendel-container"
      title={disabled ? "Beoordeel eerst de prestatie voordat je opnieuw kunt draaien." : "Trek aan de hendel om te spinnen!"}
    >
      <div 
        className={`hendel-grip ${isPulled ? 'pulled' : ''} ${disabled ? 'disabled' : ''} ${attract && !disabled ? 'attract' : ''}`}
        onClick={handlePull}
      >
        <div className="hendel-knop"></div>
        <div className="hendel-stick"></div>
      </div>
    </div>
  );
}; 