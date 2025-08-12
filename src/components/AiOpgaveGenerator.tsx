import { useState } from 'react';
import { CRITERIA } from '../data/criteria';
import './AiOpgaveGenerator.css';

interface AiOpgaveGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiOpgaveGenerator = ({ isOpen, onClose }: AiOpgaveGeneratorProps) => {
  const [onderwerp, setOnderwerp] = useState('');
  const [aantalOpdrachten, setAantalOpdrachten] = useState(5);
  const [niveau, setNiveau] = useState<'makkelijk' | 'moeilijk' | 'mix'>('mix');
  const [studentNiveau, setStudentNiveau] = useState<'1e jaar' | '2e jaar' | '3e/4e jaar'>('2e jaar');

  const generatePrompt = () => {
    const niveauInstructie = niveau === 'makkelijk' 
      ? 'Focus op basisconcepten en eenvoudige toepassingen.'
      : niveau === 'moeilijk' 
      ? 'Focus op gevorderde concepten, complexe scenario\'s en diepgaande toepassingen.'
      : 'Zorg voor een mix van basis, gemiddelde en gevorderde vragen.';

    const studentNiveauInstructie = `De doelgroep zijn fysiotherapiestudenten ${studentNiveau}. Pas de complexiteit en diepgang van de vragen aan aan het kennisniveau van ${studentNiveau} studenten.`;

    const criteriaInstructie = `Gebruik de volgende beoordelingscriteria voor het maken van de antwoordsleutels:
${Object.entries(CRITERIA).map(([, category]) => 
  `**${category.titel}:**\n${category.items.map(item => `- ${item}`).join('\n')}`
).join('\n\n')}

Analyseer elke opdracht en bepaal welke criteria het meest relevant zijn. Maak de antwoordsleutel specifiek voor de opdracht en gebruik de relevante criteria als richtlijn.`;

    const fileContext = '';

    const voorbeeldOpdrachten = `**VOORBEELD OPDRACHTEN UIT DE APP:**

**KENNISVRAAG (Anatomie) - ZONDER TIJD EN EXTRA PUNTEN:**
{
  "Categorie": "Anatomie",
  "Opdracht": "Benoem de botten in de onderarm",
  "Antwoordsleutel": "Radius (spaakbeen) en Ulna (ellepijp). De radius ligt aan de duimzijde en de ulna aan de pinkzijde. Bron: Gray's Anatomy (2015).",
  "Tijdslimiet": 0,
  "Extra_Punten": 0
}

**COMMUNICATIEVAARDIGHEDEN - MET TIJD:**
{
  "Categorie": "Communicatie",
  "Opdracht": "Leg een patiënt met lage rugpijn uit wat de oorzaak kan zijn en geef advies over houding en beweging",
  "Antwoordsleutel": "1) Luister actief naar de klachten en stel open vragen. 2) Leg in begrijpelijke taal uit dat rugpijn vaak door houding, spanning of overbelasting komt. 3) Geef concrete adviezen: rechtop zitten, regelmatig bewegen, tillen met gebogen knieën. 4) Toon empathie en betrek de patiënt bij de oplossing. Bron: KNGF-richtlijn Communicatie (2019).",
  "Tijdslimiet": 90,
  "Extra_Punten": 0
}

**MOTORISCHE VAARDIGHEDEN - MET TIJD EN EXTRA PUNTEN:**
{
  "Categorie": "Lichamelijk Onderzoek",
  "Opdracht": "Voer een ROM-test uit van de schouder en leg uit wat je onderzoekt",
  "Antwoordsleutel": "1) Start met inspectie van beide schouders. 2) Test actieve ROM: flexie, extensie, abductie, adductie, endo- en exorotatie. 3) Test passieve ROM met correcte handvattingen. 4) Vergelijk met de gezonde zijde. 5) Noteer pijn, crepitaties en eindgevoel. 6) Leg uit dat je bewegingsbeperkingen, pijnpatronen en asymmetrieën onderzoekt. Bron: Maitland's Peripheral Manipulation (2014).",
  "Tijdslimiet": 120,
  "Extra_Punten": 2
}

**PRAKTISCHE CASUS - MET TIJD EN EXTRA PUNTEN:**
{
  "Categorie": "Trainingsleer",
  "Opdracht": "Een 45-jarige patiënt wil na een knieoperatie weer gaan hardlopen. Stel een trainingsschema op",
  "Antwoordsleutel": "1) Start met wandelen en geleidelijke opbouw. 2) Voeg intervaltraining toe: 1 min hardlopen, 2 min wandelen. 3) Verhoog geleidelijk de hardloopduur. 4) Let op pijnsignalen en pas schema aan. 5) Combineer met kracht- en stabiliteitsoefeningen. 6) Doel: binnen 12 weken 30 minuten aaneengesloten hardlopen. Bron: ACSM Guidelines for Exercise Testing and Prescription (2022).",
  "Tijdslimiet": 150,
  "Extra_Punten": 2
}`;

    return `**ROL:**
Je bent een expert-docent en curriculumontwikkelaar op het gebied van ${onderwerp}. Je bent gespecialiseerd in het creëren van heldere en effectieve leeropdrachten voor fysiotherapiestudenten.

**CONTEXT:**
Je ontwikkelt opdrachten voor een educatieve fruitautomaat-game. De opdrachten worden gebruikt om de kennis van hbo-studenten fysiotherapie te toetsen. Ze moeten kort, eenduidig en uitdagend zijn.

**DOELGROEP:**
${studentNiveauInstructie}

**INSTRUCTIE:**
Genereer ${aantalOpdrachten} nieuwe, unieke opdrachten over het specifieke onderwerp: **${onderwerp}**.

**STAPPENPLAN VOOR DE AI:**
1. Analyseer de kernconcepten van het opgegeven specifieke onderwerp.
2. Formuleer voor verschillende kernconcepten een heldere vraag, een kleine casus, of een praktische opdracht.
3. Zorg voor variatie in vraagstelling en moeilijkheidsgraad.
4. ${niveauInstructie}
5. Stel voor elke opdracht een moeilijkheidsniveau vast (1=basis, 2=gemiddeld, 3=gevorderd).
6. Formuleer voor elke opdracht een beknopt en correct modelantwoord met bronvermelding.

**BEOORDELINGSCRITERIA:**
${criteriaInstructie}

${voorbeeldOpdrachten}

**OUTPUT FORMAAT:**
Lever het resultaat in een van de volgende formaten:

**OPTIE 1: Kopieerbare tabel**
Geef een tabel met de volgende kolomnamen:
Categorie | Opdracht | Antwoordsleutel | Tijdslimiet | Extra_Punten (max 2) | Niveau

**OPTIE 2: Excel-formaat**
Geef de data in een formaat dat direct in Excel kan worden geplakt, met de volgende kolomnamen:
Categorie, Opdracht, Antwoordsleutel, Tijdslimiet, Extra_Punten (max 2), Niveau

**KOLOMSPECIFICATIES:**
- "Categorie": Exact overeenkomen met het opgegeven specifieke onderwerp
- "Opdracht": De vraag of opdrachttekst
- "Antwoordsleutel": Het modelantwoord met bronvermelding
- "Tijdslimiet": Getal in seconden (bijv. 60 voor 1 minuut). Alleen toevoegen als de opdracht een tijdslimiet nodig heeft voor een goede uitvoering.
- "Extra_Punten (max 2)": Getal tussen 0 en 2. Alleen extra punten geven voor moeilijke of complexe opdrachten die meer inspanning vereisen.
 - "Niveau": 1 (opwarmers/basis), 2 (basis/standaard), 3 (uitdagend). Leeg laten als je geen niveau wilt opgeven.

**VOORBEELD TABEL FORMAAT:**

| Categorie | Opdracht | Antwoordsleutel | Tijdslimiet | Extra_Punten (max 2) | Niveau |
|-----------|----------|-----------------|-------------|---------------------|--------|
| ${onderwerp} | Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld. | Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017). | 120 | 1 | 2 |
| ${onderwerp} | Benoem de belangrijkste spieren van de rotator cuff. | De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren. Bron: Gray's Anatomy (2015). | 0 | 0 | 1 |

**VOORBEELD EXCEL FORMAAT:**
Categorie,Opdracht,Antwoordsleutel,Tijdslimiet,Extra_Punten (max 2),Niveau
${onderwerp},"Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld.","Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017).",120,1,2
${onderwerp},"Benoem de belangrijkste spieren van de rotator cuff.","De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren. Bron: Gray's Anatomy (2015).",0,0,1${fileContext}`;
  };

  const handleCopyPrompt = async () => {
    const prompt = generatePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Prompt gekopieerd naar klembord!', type: 'succes', timeoutMs: 6000 } }));
    } catch (err) {
      // Fallback voor oudere browsers
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Prompt gekopieerd naar klembord!', type: 'succes', timeoutMs: 6000 } }));
    }
  };

  const handleDownloadTemplate = () => {
    const template = `Categorie,Opdracht,Antwoordsleutel,Tijdslimiet,Extra_Punten (max 2),Niveau
Voorbeeld Onderwerp,Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld.,Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017).,120,1,2
Voorbeeld Onderwerp,Benoem de belangrijkste spieren van de rotator cuff en leg uit wat hun functie is bij schouderstabilisatie.,De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren en stabiliseren tijdens bewegingen. Bron: Gray's Anatomy (2015).,90,2,1`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opdrachten_sjabloon.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="ai-generator-overlay" onClick={onClose}>
      <div className="ai-generator-content" onClick={(e) => e.stopPropagation()}>
        <div className="ai-generator-header">
          <h2>Genereer Nieuwe Opdrachten met AI</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        
        <div className="ai-generator-body">
          <div className="ai-generator-section">
            <h4>Stap 1: Vul de parameters in</h4>
            <p className="instruction-text">
              De waarden hieronder (onderwerp, aantal en studentniveau) worden automatisch verwerkt in de prompt die je in stap 5 kunt kopiëren.
            </p>
            <div className="form-group">
              <label htmlFor="onderwerp">Onderwerp:</label>
              <input
                id="onderwerp"
                type="text"
                value={onderwerp}
                onChange={(e) => setOnderwerp(e.target.value)}
                placeholder="bijv. Trainingsleer, Anatomie, etc."
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="aantal">Aantal opdrachten:</label>
              <input
                id="aantal"
                type="number"
                value={aantalOpdrachten}
                onChange={(e) => setAantalOpdrachten(Number(e.target.value))}
                min="1"
                max="20"
              />
            </div>
            
            <div className="form-group">
              <label>Student niveau:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="studentNiveau"
                    value="1e jaar"
                    checked={studentNiveau === '1e jaar'}
                    onChange={() => setStudentNiveau('1e jaar')}
                  />
                  1e jaar
                </label>
                <label>
                  <input
                    type="radio"
                    name="studentNiveau"
                    value="2e jaar"
                    checked={studentNiveau === '2e jaar'}
                    onChange={() => setStudentNiveau('2e jaar')}
                  />
                  2e jaar
                </label>
                <label>
                  <input
                    type="radio"
                    name="studentNiveau"
                    value="3e/4e jaar"
                    checked={studentNiveau === '3e/4e jaar'}
                    onChange={() => setStudentNiveau('3e/4e jaar')}
                  />
                  3e/4e jaar
                </label>
              </div>
            </div>
            
            {/* Vraag moeilijkheidsgraad verwijderd op verzoek */}
          </div>

          <div className="ai-generator-section">
            <h4>Stap 2: Bepaal en verzamel bronmateriaal (optioneel)</h4>
            <p className="instruction-text">
              Zoek en verzamel zelf bronmateriaal waarop je de opdrachten wilt baseren. Denk aan:
            </p>
            <ul className="instruction-steps">
              <li>YouTube/kennisclips (tip: met tijdstempel – de app ondersteunt <code>?t=…</code> of <code>?start=…</code>)</li>
              <li>Artikelen en (kursus)boeken</li>
              <li>Transcripties, hoorcolleges, slides</li>
              <li>Websites en richtlijnen</li>
            </ul>
            <p className="instruction-text">
              Dit is optioneel. Zonder bronnen zal het taalmodel zijn eigen kennis gebruiken.
              Dat werkt vaak prima, maar verhoogt de kans op bias en hallucinaties. Controleer
              de inhoud dan extra kritisch en voeg bij voorkeur toch concrete bronnen toe.
            </p>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 3: Download sjabloon</h4>
            <p className="instruction-text">Download het Excel/CSV‑sjabloon waarin je de AI‑output kunt plakken.</p>
            <button className="download-knop" onClick={handleDownloadTemplate}>
              Download Sjabloon
            </button>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 4: Kies je AI‑chatbot</h4>
            <p className="instruction-text">
              Chatbots en onderliggende modellen veranderen snel; kies wat voor jou werkt. Wil je meer garantie dat opdrachten echt op je eigen
              bronnen zijn gebaseerd, overweeg dan een chatbot die sterk op geüploade of gelinkte bronnen leunt (bijv. NotebookLM). Binnen een
              AI‑chatbot kun je vaak ook nog tussen verschillende modellen kiezen; een redeneer/think‑model geeft bij dit soort taken meestal
              betere resultaten.
            </p>
            <div className="chatbot-button-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button className="download-knop" onClick={() => window.open('https://chat.openai.com/', '_blank', 'noopener,noreferrer')}>ChatGPT</button>
              <button className="download-knop" onClick={() => window.open('https://notebooklm.google.com/', '_blank', 'noopener,noreferrer')}>NotebookLM</button>
              <button className="download-knop" onClick={() => window.open('https://claude.ai/', '_blank', 'noopener,noreferrer')}>Claude</button>
              <button className="download-knop" onClick={() => window.open('https://chat.mistral.ai/', '_blank', 'noopener,noreferrer')}>Mistral</button>
            </div>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 5: Kopieer de prompt</h4>
            <p className="instruction-text">
              Klik op "Kopieer Prompt" om de gegenereerde prompt naar je klembord te kopiëren. 
              Plak deze vervolgens in je favoriete AI-tool (zoals ChatGPT, Claude, NotebookLM, etc.).
            </p>
            <button 
              className="kopieer-knop"
              onClick={handleCopyPrompt}
              disabled={!onderwerp.trim()}
            >
              Kopieer Prompt
            </button>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 6: Stappen in de AI‑chatbot</h4>
            <ol className="steps-list">
              <li className="step-item"><span className="step-badge">1</span><span className="step-content">Voeg het sjabloon toe (of geef het gewenste kolomformaat).</span></li>
              <li className="step-item"><span className="step-badge">2</span><span className="step-content">Voeg (een deel van) je bronnen toe (indien van toepassing): links of korte samenvattingen per bron.</span></li>
              <li className="step-item"><span className="step-badge">3</span><span className="step-content">Plak de prompt.</span></li>
              <li className="step-item"><span className="step-badge">4</span><span className="step-content">Lees de prompt en pas naar wens aan (toon, niveau, vraagtypen, kolommen).</span></li>
              <li className="step-item"><span className="step-badge">5</span><span className="step-content">Itereer tot het resultaat goed is (vraag om bijsturen waar nodig).</span></li>
              <li className="step-item"><span className="step-badge">6</span><span className="step-content">Laat opdrachten, antwoordsleutels en velden (tijdslimiet, extra punten, niveau) bijschaven waar nodig.</span></li>
              <li className="step-item"><span className="step-badge">7</span><span className="step-content">Vraag om alle opdrachten te leveren in een downloadbaar Excel/CSV met de juiste kolomnamen.</span></li>
              <li className="step-item"><span className="step-badge">8</span><span className="step-content">Download het bestand.</span></li>
            </ol>
            <p className="instruction-text" style={{ marginTop: 10 }}>
              Tip: valt het resultaat tegen? Probeer minder bronnen te gebruiken of maak het onderwerp concreter (subthema).
            </p>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 7: Voeg opdrachten toe</h4>
            <p className="instruction-text">
              Plak de AI‑output in het sjabloon (of zet om naar de juiste kolommen) en upload het bestand daarna in de app via Instellingen → Opdrachtenbeheer.
            </p>
          </div>

          <div className="ai-generator-section">
            <h4>Meer leren over AI en prompts</h4>
            <p className="instruction-text">
              Wil je meer leren over hoe je effectief prompts schrijft en met AI samenwerkt? 
              Volg de HAN e-learning 'AI Basiskennis en Vaardigheden' voor praktische tips en achtergrondinformatie.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 