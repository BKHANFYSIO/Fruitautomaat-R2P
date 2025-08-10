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
  const [studentNiveau, setStudentNiveau] = useState<'1e jaar' | '2e jaar' | '3e jaar' | '4e jaar'>('2e jaar');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

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

    const fileContext = uploadedFiles.length > 0 
      ? `\n**BIJLAGEN:**\nGebruik de volgende bijlagen als bronmateriaal voor het maken van de opdrachten:\n${uploadedFiles.map(file => `- ${file.name}`).join('\n')}\n\nBaseer de opdrachten en antwoorden op de inhoud van deze documenten.`
      : '';

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
Categorie | Opdracht | Antwoordsleutel | Tijdslimiet | Extra_Punten (max 2)

**OPTIE 2: Excel-formaat**
Geef de data in een formaat dat direct in Excel kan worden geplakt, met de volgende kolomnamen:
Categorie, Opdracht, Antwoordsleutel, Tijdslimiet, Extra_Punten (max 2)

**KOLOMSPECIFICATIES:**
- "Categorie": Exact overeenkomen met het opgegeven specifieke onderwerp
- "Opdracht": De vraag of opdrachttekst
- "Antwoordsleutel": Het modelantwoord met bronvermelding
- "Tijdslimiet": Getal in seconden (bijv. 60 voor 1 minuut). Alleen toevoegen als de opdracht een tijdslimiet nodig heeft voor een goede uitvoering.
- "Extra_Punten (max 2)": Getal tussen 0 en 2. Alleen extra punten geven voor moeilijke of complexe opdrachten die meer inspanning vereisen.

**VOORBEELD TABEL FORMAAT:**

| Categorie | Opdracht | Antwoordsleutel | Tijdslimiet | Extra_Punten (max 2) |
|-----------|----------|-----------------|-------------|---------------------|
| ${onderwerp} | Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld. | Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017). | 120 | 1 |
| ${onderwerp} | Benoem de belangrijkste spieren van de rotator cuff. | De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren. Bron: Gray's Anatomy (2015). | 0 | 0 |

**VOORBEELD EXCEL FORMAAT:**
Categorie,Opdracht,Antwoordsleutel,Tijdslimiet,Extra_Punten (max 2)
${onderwerp},"Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld.","Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017).",120,1
${onderwerp},"Benoem de belangrijkste spieren van de rotator cuff.","De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren. Bron: Gray's Anatomy (2015).",0,0${fileContext}`;
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
    const template = `Categorie,Opdracht,Antwoordsleutel,Tijdslimiet,Extra_Punten (max 2)
Voorbeeld Onderwerp,Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld.,Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017).,120,1
Voorbeeld Onderwerp,Benoem de belangrijkste spieren van de rotator cuff en leg uit wat hun functie is bij schouderstabilisatie.,De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren en stabiliseren tijdens bewegingen. Bron: Gray's Anatomy (2015).,90,2`;
    
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
                    value="3e jaar"
                    checked={studentNiveau === '3e jaar'}
                    onChange={() => setStudentNiveau('3e jaar')}
                  />
                  3e jaar
                </label>
                <label>
                  <input
                    type="radio"
                    name="studentNiveau"
                    value="4e jaar"
                    checked={studentNiveau === '4e jaar'}
                    onChange={() => setStudentNiveau('4e jaar')}
                  />
                  4e jaar
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Vraag moeilijkheidsgraad:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="niveau"
                    value="makkelijk"
                    checked={niveau === 'makkelijk'}
                    onChange={() => setNiveau('makkelijk')}
                  />
                  Makkelijk
                </label>
                <label>
                  <input
                    type="radio"
                    name="niveau"
                    value="mix"
                    checked={niveau === 'mix'}
                    onChange={() => setNiveau('mix')}
                  />
                  Mix
                </label>
                <label>
                  <input
                    type="radio"
                    name="niveau"
                    value="moeilijk"
                    checked={niveau === 'moeilijk'}
                    onChange={() => setNiveau('moeilijk')}
                  />
                  Moeilijk
                </label>
              </div>
            </div>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 1.5: Voeg bronmateriaal toe (optioneel)</h4>
            <p className="instruction-text">
              Upload artikelen, transcripties of andere documenten waaruit de AI kan putten om de opdrachten te maken. 
              Dit zorgt voor meer specifieke en relevante opdrachten.
            </p>
            <div className="file-upload-section">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setUploadedFiles(prev => [...prev, ...files]);
                }}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-upload-label">
                📎 Voeg bestanden toe
              </label>
              
              {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                  <h5>Toegevoegde bestanden:</h5>
                  <ul>
                    {uploadedFiles.map((file, index) => (
                      <li key={index}>
                        {file.name}
                        <button 
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                          className="remove-file-btn"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 2: Kopieer de prompt</h4>
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
            <h4>Stap 3: Controleer en itereren</h4>
            <div className="instruction-steps">
              <div className="step">
                <strong>1. Controleer de output:</strong> AI-resultaten moeten altijd gecontroleerd worden op correctheid en relevantie.
              </div>
              <div className="step">
                <strong>2. Pas de prompt aan:</strong> Als de resultaten niet bevredigend zijn, pas dan de prompt aan:
                <ul>
                  <li>"Maak de vragen moeilijker"</li>
                  <li>"Geef meer praktische voorbeelden"</li>
                  <li>"Focus meer op code-voorbeelden"</li>
                  <li>"Maak de vragen korter"</li>
                </ul>
              </div>
              <div className="step">
                <strong>3. Herhaal indien nodig:</strong> Blijf de prompt aanpassen tot je tevreden bent met de resultaten.
              </div>
            </div>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 4: Voeg opdrachten toe</h4>
            <p className="instruction-text">
              Download het sjabloon en voeg je gegenereerde opdrachten toe in het juiste formaat. 
              Upload vervolgens het bestand via de instellingen.
            </p>
            <button className="download-knop" onClick={handleDownloadTemplate}>
              Download Sjabloon
            </button>
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