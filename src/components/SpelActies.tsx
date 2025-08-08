import { useState } from 'react';
import type { Opdracht } from '../data/types';
import './SpelActies.css';
import { AiPromptModal } from './AiPromptModal';
import { CRITERIA } from '../data/criteria';
import { Modal } from './Modal';
import { AntwoordContent } from './AntwoordContent';
import './Modal.css'; // Nodig voor antwoord-content styling

interface SpelActiesProps {
  opdracht: Opdracht;
}

// Mapping van opdrachtcategorieën naar criteria-sleutels
// Deze wordt niet meer gebruikt, we geven nu alle criteria mee.
/* const categorieNaarCriteria: { [key: string]: keyof typeof CRITERIA } = {
  'Anatomie': 'kennis',
  'Fysiologie': 'kennis',
  'Pathologie': 'kennis',
  'Communicatie': 'communicatie',
  'Lichamelijk onderzoek': 'motoriek',
  // Voeg hier meer mappings toe indien nodig
}; */

export const SpelActies = ({ opdracht }: SpelActiesProps) => {
  const [isAiPromptZichtbaar, setIsAiPromptZichtbaar] = useState(false);
  const [isAntwoordModalOpen, setIsAntwoordModalOpen] = useState(false);


  const antwoordSleutelText = opdracht.Antwoordsleutel;
  const heeftAntwoordsleutel = antwoordSleutelText && antwoordSleutelText.trim() !== '';

  const genereerAiPrompt = () => {
    const rol = "ROL:\nJe bent een expert in het ontwikkelen van beoordelingsmateriaal voor fysiotherapiestudenten. Jouw taak is om algemene beoordelingsrichtlijnen om te zetten in concrete, opdracht-specifieke criteria en om een passende antwoordsleutel te formuleren.";

    const opdrachtTekst = `OPDRACHT:\nStel specifieke, meetbare en observeerbare beoordelingscriteria op voor de volgende klinische opdracht:\n"${opdracht.Opdracht}"`;

    const alleCriteria = Object.values(CRITERIA).map(cat =>
      `**${cat.titel}**\n- ${cat.items.join('\n- ')}`
    ).join('\n\n');

    const criteriaInstructie = `ALGEMENE CRITERIA (Kies en maak specifiek):\nHieronder staan de algemene categorieën met criteria. Analyseer de opdracht, bepaal welke categorie(ën) het meest relevant zijn en maak de criteria binnen die geselecteerde categorie(ën) specifiek voor de bovenstaande opdracht.\n\n${alleCriteria}`;
    
    let antwoordSleutelInstructie: string;
    let outputInstructieAntwoordsleutel: string;

    if (heeftAntwoordsleutel) {
      antwoordSleutelInstructie = `BASIS ANTWOORDSLEUTEL (Verbeter en verfijn):\nNeem de volgende antwoordsleutel als uitgangspunt. Verbeter deze op basis van de specifieke criteria die je hebt opgesteld en de opdracht. Zorg dat de kerninformatie behouden blijft, maar maak de sleutel vollediger, nauwkeuriger en beter gestructureerd.\n"${antwoordSleutelText}"`;
      outputInstructieAntwoordsleutel = "- Geef daarna een 'Verbeterde Antwoordsleutel' die de originele sleutel verfijnt op basis van de opgestelde criteria.";
    } else {
      antwoordSleutelInstructie = `ANTWOORDSLEUTEL (Genereer):\nEr is geen basis antwoordsleutel beschikbaar. Genereer een beknopte, maar volledige antwoordsleutel die past bij de opdracht en de door jou opgestelde criteria.`;
      outputInstructieAntwoordsleutel = "- Geef daarna een 'Gegenereerde Antwoordsleutel' die een correct antwoord geeft op de opdracht.";
    }

    const outputFormat = `UITVOER INSTRUCTIES:\n- Geef als eerste de geselecteerde en specifiek gemaakte criteria in een beknopte lijst.\n${outputInstructieAntwoordsleutel}\n- Gebruik duidelijke en begrijpelijke taal, geschikt voor een student.\n- Voeg geen extra uitleg of inleiding toe.`;

    return [rol, opdrachtTekst, criteriaInstructie, antwoordSleutelInstructie, outputFormat]
      .join('\n\n');
  };

  const aiPrompt = genereerAiPrompt();

  return (
    <div className="spel-acties">
      <AiPromptModal isOpen={isAiPromptZichtbaar} onClose={() => setIsAiPromptZichtbaar(false)} prompt={aiPrompt} />

      <div className="actie-knoppen">
        {heeftAntwoordsleutel && (
          <button onClick={() => setIsAntwoordModalOpen(true)}>Antwoordsleutel</button>
        )}
        <button onClick={() => setIsAiPromptZichtbaar(true)}>AI-Prompt criteria</button>
      </div>
       {heeftAntwoordsleutel && (
        <Modal 
          isOpen={isAntwoordModalOpen} 
          onClose={() => setIsAntwoordModalOpen(false)}
          title="Antwoordsleutel"
        >
          <div className="antwoord-content">
            <div className="antwoord-sectie">
              <h4>Opdracht</h4>
              <p>{opdracht.Opdracht}</p>
            </div>
            <div className="antwoord-sectie">
              <h4>Antwoordsleutel</h4>
              <AntwoordContent text={antwoordSleutelText} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}; 