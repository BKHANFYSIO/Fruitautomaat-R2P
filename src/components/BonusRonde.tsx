interface BonusRondeProps {
  bonusOpdracht: { opdracht: string; punten: number[] };
  onVoltooid: (geslaagd: boolean) => void;
}

export const BonusRonde = ({ bonusOpdracht, onVoltooid }: BonusRondeProps) => {
  const mogelijkePunten = bonusOpdracht.punten.join(' of ');
  
  return (
    <div className="bonus-ronde-container">
      <h3>Bonusronde!</h3>
      <p>{bonusOpdracht.opdracht}</p>
      <p>Te verdienen: {mogelijkePunten} extra {mogelijkePunten.length > 1 ? 'punten' : 'punt'}.</p>
      <p className="uitleg-bonus">Voer deze opdracht succesvol uit om de extra punten op te tellen bij je hoofdopdracht. Je medestudenten zijn de jury!</p>
      <div>
        <button onClick={() => onVoltooid(true)}>Geslaagd!</button>
        <button onClick={() => onVoltooid(false)}>Mislukt</button>
      </div>
    </div>
  );
}; 