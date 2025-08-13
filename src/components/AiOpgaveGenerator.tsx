import { useState } from 'react';
import * as XLSX from 'xlsx';
import { CRITERIA } from '../data/criteria';
import { OPDRACHT_TYPE_ORDER, opdrachtTypeIconen } from '../data/constants';
import './AiOpgaveGenerator.css';

interface AiOpgaveGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiOpgaveGenerator = ({ isOpen, onClose }: AiOpgaveGeneratorProps) => {
  const [hoofdcategorie, setHoofdcategorie] = useState('');
  const [aantalOpdrachten, setAantalOpdrachten] = useState(5);
  const [niveau] = useState<'makkelijk' | 'moeilijk' | 'mix'>('mix');
  const [studentNiveau, setStudentNiveau] = useState<'1e jaar' | '2e jaar' | '3e/4e jaar'>('2e jaar');
  const [subcatMode, setSubcatMode] = useState<'ai' | 'handmatig'>('ai');
  // legacy input verwijderd; vervangen door handmatige lijst met aantallen
  const [onderwerpBeschrijving, setOnderwerpBeschrijving] = useState('');
  const [handmatigeSubcats, setHandmatigeSubcats] = useState<Array<{ naam: string; aantal: number }>>([{ naam: '', aantal: 1 }]);
  const TYPE_BESCHRIJVINGEN: Record<string, string> = {
    'Feitenkennis': 'Eén juist, kort feit/definitie zonder context.',
    'Begripsuitleg': 'Concept/proces helder uitleggen zonder casus of patiënt.',
    'Toepassing': 'Kennis toepassen op een korte praktijksituatie met keuze/onderbouwing. Casus kan in de opdrachttekst zitten; aparte "Casus" is optioneel.',
    'Vaardigheid – Onderzoek': 'Demonstreren/uitvoeren van lichamelijk onderzoek.',
    'Vaardigheid – Behandeling': 'Uitvoeren/demonstreren van interventie of oefenprogramma.',
    'Communicatie met patiënt': 'Patiëntgerichte uitleg/instructie/motiveren.',
    'Klinisch redeneren': 'Hypothesevorming/differentiaal/keuze op basis van argumentatie. Vereist casusbeschrijving.'
  };
  const BESCHIKBARE_TYPES = OPDRACHT_TYPE_ORDER.filter(t => TYPE_BESCHRIJVINGEN[t as keyof typeof TYPE_BESCHRIJVINGEN]);
  const TYPE_VOORBEELDEN: Record<string, string> = {
    'Feitenkennis': 'Noem 2 functies van de m. gluteus medius.',
    'Begripsuitleg': 'Leg uit wat mechanotransductie is bij peesweefsel.',
    'Toepassing': 'Kies de beste interventie bij beginnende achillespeesklachten en licht toe.',
    'Vaardigheid – Onderzoek': 'Toon hoe je de Lachman test uitvoert (stappen).',
    'Vaardigheid – Behandeling': 'Stel een 2‑weekse oefenprogressie op na enkelverstuiking.',
    'Communicatie met patiënt': 'Leg uit wat de oorzaak van aspecifieke lage rugpijn kan zijn in begrijpelijke taal.',
    'Klinisch redeneren': 'Welke hypothese past het best bij deze klachten en waarom?'
  };
  const [geselecteerdeTypes, setGeselecteerdeTypes] = useState<string[]>([]);
  // Tekenen tri-status filter voor generatie
  const [allowTekenenJa, setAllowTekenenJa] = useState<boolean>(true);
  const [allowTekenenMogelijk, setAllowTekenenMogelijk] = useState<boolean>(true);
  const [allowTekenenNee, setAllowTekenenNee] = useState<boolean>(true);

  const updateHandmatigeSubcat = (index: number, veld: 'naam' | 'aantal', waarde: string | number) => {
    setHandmatigeSubcats(prev => {
      const kopie = [...prev];
      const item = { ...kopie[index] };
      if (veld === 'naam') {
        item.naam = String(waarde);
      } else {
        const parsed = Number(waarde);
        item.aantal = Number.isFinite(parsed) && parsed > 0 ? Math.min(20, Math.max(1, parsed)) : 1;
      }
      kopie[index] = item;
      return kopie;
    });
  };

  const addSubcatRow = () => {
    setHandmatigeSubcats(prev => [...prev, { naam: '', aantal: 1 }]);
  };

  const removeSubcatRow = (index: number) => {
    setHandmatigeSubcats(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const toggleType = (type: string) => {
    setGeselecteerdeTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

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

    const subcategorieen = subcatMode === 'handmatig'
      ? handmatigeSubcats.map(s => s.naam).filter(Boolean)
      : [];

    const subcatInstructie = subcatMode === 'handmatig' && handmatigeSubcats.some(s => s.naam.trim())
      ? `Gebruik exact de volgende subcategorieën en aantallen en schrijf ze in kolom "Categorie". Respecteer de aantallen per subcategorie (maak niet meer en niet minder): ${handmatigeSubcats.filter(s => s.naam.trim()).map(s => `"${s.naam}" (${s.aantal} opdrachten)`).join(', ')}. Zet voor elke rij de kolom "Hoofdcategorie" op "${hoofdcategorie}".`
      : `Bepaal logische subcategorieën binnen "${hoofdcategorie}" en schrijf die in kolom "Categorie" (één per opdracht). Zet voor elke rij de kolom "Hoofdcategorie" op "${hoofdcategorie}".`;

    const typeLijst = BESCHIKBARE_TYPES.join(', ');
    const typeRestrictie = (geselecteerdeTypes && geselecteerdeTypes.length > 0)
      ? `Beperk je tot de volgende opdrachttypes: ${geselecteerdeTypes.join(', ')}.`
      : `Gebruik geschikte opdrachttypes uit de lijst: ${typeLijst}.`

    const totaalGevraagd = subcatMode === 'handmatig'
      ? handmatigeSubcats.filter(s => s.naam.trim()).reduce((sum, s) => sum + (Number.isFinite(s.aantal) ? s.aantal : 0), 0)
      : aantalOpdrachten;

    const voorbeeldOpdrachten = `**VOORBEELD OPDRACHTEN UIT DE APP:**

**KENNISVRAAG (Anatomie) - ZONDER TIJD EN EXTRA PUNTEN:**
{
  "Hoofdcategorie": "Anatomie",
  "Categorie": "Schouder",
  "Opdracht": "Benoem de botten in de onderarm",
  "Antwoordsleutel": "Radius (spaakbeen) en Ulna (ellepijp). De radius ligt aan de duimzijde en de ulna aan de pinkzijde. Bron: Gray's Anatomy (2015).",
  "Tijdslimiet": 0,
  "Extra_Punten": 0
}

**COMMUNICATIEVAARDIGHEDEN - MET TIJD:**
{
  "Hoofdcategorie": "Communicatie",
  "Categorie": "Patiënteducatie",
  "Opdracht": "Leg een patiënt met lage rugpijn uit wat de oorzaak kan zijn en geef advies over houding en beweging",
  "Antwoordsleutel": "1) Luister actief naar de klachten en stel open vragen. 2) Leg in begrijpelijke taal uit dat rugpijn vaak door houding, spanning of overbelasting komt. 3) Geef concrete adviezen: rechtop zitten, regelmatig bewegen, tillen met gebogen knieën. 4) Toon empathie en betrek de patiënt bij de oplossing. Bron: KNGF-richtlijn Communicatie (2019).",
  "Tijdslimiet": 90,
  "Extra_Punten": 0
}

**MOTORISCHE VAARDIGHEDEN - MET TIJD EN EXTRA PUNTEN:**
{
  "Hoofdcategorie": "Lichamelijk Onderzoek",
  "Categorie": "Schouderonderzoek",
  "Opdracht": "Voer een ROM-test uit van de schouder en leg uit wat je onderzoekt",
  "Antwoordsleutel": "1) Start met inspectie van beide schouders. 2) Test actieve ROM: flexie, extensie, abductie, adductie, endo- en exorotatie. 3) Test passieve ROM met correcte handvattingen. 4) Vergelijk met de gezonde zijde. 5) Noteer pijn, crepitaties en eindgevoel. 6) Leg uit dat je bewegingsbeperkingen, pijnpatronen en asymmetrieën onderzoekt. Bron: Maitland's Peripheral Manipulation (2014).",
  "Tijdslimiet": 120,
  "Extra_Punten": 2
}

**PRAKTISCHE CASUS - MET TIJD EN EXTRA PUNTEN:**
{
  "Hoofdcategorie": "Trainingsleer",
  "Categorie": "Hardlooprevalidatie",
  "Opdracht": "Een 45-jarige patiënt wil na een knieoperatie weer gaan hardlopen. Stel een trainingsschema op",
  "Antwoordsleutel": "1) Start met wandelen en geleidelijke opbouw. 2) Voeg intervaltraining toe: 1 min hardlopen, 2 min wandelen. 3) Verhoog geleidelijk de hardloopduur. 4) Let op pijnsignalen en pas schema aan. 5) Combineer met kracht- en stabiliteitsoefeningen. 6) Doel: binnen 12 weken 30 minuten aaneengesloten hardlopen. Bron: ACSM Guidelines for Exercise Testing and Prescription (2022).",
  "Tijdslimiet": 150,
  "Extra_Punten": 2
}`;

    // Tekenen-instructie voor de prompt op basis van de toggles
    // Tekenen tri-status instructies en filter
    const toegestaneTekenenStatuses = [
      allowTekenenJa ? 'Ja' : null,
      allowTekenenMogelijk ? 'Mogelijk' : null,
      allowTekenenNee ? 'Nee' : null,
    ].filter(Boolean) as string[];
    const effectieveTekenenStatuses = toegestaneTekenenStatuses.length > 0 ? toegestaneTekenenStatuses : ['Ja', 'Mogelijk', 'Nee'];

    const tekenenStatusDefinitie = 'Bepaal per opdracht de kolom "Tekenen" als: "Ja" (tekenen expliciet verplicht), "Mogelijk" (tekenen helpt, optioneel) of "Nee" (geen tekenen).';
    const tekenenFilterInstructie = `Neem alleen opdrachten op waarvan kolom "Tekenen" een van deze waarden heeft: ${effectieveTekenenStatuses.join(', ')}. Opdrachten met andere waarden niet teruggeven.`;

    return `**ROL:**
Je bent een expert-docent en curriculumontwikkelaar op het gebied van ${onderwerpBeschrijving}. Je bent gespecialiseerd in het creëren van heldere en effectieve leeropdrachten voor fysiotherapiestudenten.

**CONTEXT:**
Je ontwikkelt opdrachten voor een educatieve fruitautomaat-game. De opdrachten worden gebruikt om de kennis en vaardigheden van hbo-studenten fysiotherapie te toetsen. Ze moeten kort, eenduidig en uitdagend zijn.

**DOELGROEP:**
${studentNiveauInstructie}

  **INSTRUCTIE:**
 Genereer ${totaalGevraagd} nieuwe, unieke opdrachten binnen de hoofdcategorie: **${hoofdcategorie}**.
${subcatInstructie}
${typeRestrictie}
Als aantallen per subcategorie zijn opgegeven, gebruik precies de som daarvan (negeer dan het algemene aantal).

**STAPPENPLAN VOOR DE AI:**
1. Analyseer de kernconcepten van het opgegeven specifieke onderwerp.
2. Formuleer voor verschillende kernconcepten een heldere vraag, een kleine casus, of een praktische opdracht.
3. Zorg voor variatie in vraagstelling en moeilijkheidsgraad.
4. ${niveauInstructie}
5. Stel voor elke opdracht een moeilijkheidsniveau vast (1=basis, 2=gemiddeld, 3=gevorderd).
6. Formuleer voor elke opdracht een beknopt en correct modelantwoord met bronvermelding.

**BEOORDELINGSCRITERIA:**
${criteriaInstructie}

**OPDRACHTTYPES EN DEFINITIES:**
Kies per opdracht één type en vul dat in in kolom "Type". Toegestane waarden en betekenis:
 ${BESCHIKBARE_TYPES.map(t => `- ${t}: ${TYPE_BESCHRIJVINGEN[t]}`).join('\n')}
 - Als je geen passend type kunt bepalen, zet "Type" op "Onbekend".
\n${tekenenStatusDefinitie}
${tekenenFilterInstructie}

${voorbeeldOpdrachten}

**OUTPUT FORMAAT:**
Lever het resultaat in een van de volgende formaten:

**OPTIE 1: Kopieerbare tabel**
Geef een tabel met de volgende kolomnamen:
Hoofdcategorie | Categorie | Type | Tekenen | Opdracht | Antwoordsleutel | Tijdslimiet | Extra_Punten (max 2) | Niveau | Casus

**OPTIE 2: Excel-formaat**
Geef de data in een formaat dat direct in Excel kan worden geplakt, met de volgende kolomnamen:
Hoofdcategorie, Categorie, Type, Tekenen, Opdracht, Antwoordsleutel, Tijdslimiet, Extra_Punten (max 2), Niveau, Casus

      **KOLOMSPECIFICATIES:**
- "Categorie": Exact overeenkomen met het opgegeven specifieke onderwerp
- "Type": Eén waarde uit deze lijst: ${typeLijst}. Als onbekend, gebruik "Onbekend".
      - "Tekenen": "Ja" (verplicht tekenen), "Mogelijk" (helpend/optioneel) of "Nee" (geen tekenen). Oude waarden Ja/Nee blijven geldig.
- "Opdracht": De vraag of opdrachttekst
- "Antwoordsleutel": Het modelantwoord met bronvermelding
- "Tijdslimiet": Getal in seconden (bijv. 60 voor 1 minuut). Alleen toevoegen als de opdracht een tijdslimiet nodig heeft voor een goede uitvoering.
- "Extra_Punten (max 2)": Getal tussen 0 en 2. Alleen extra punten geven voor moeilijke of complexe opdrachten die meer inspanning vereisen.
- "Niveau": 1 (opwarmers/basis), 2 (basis/standaard), 3 (uitdagend). Leeg laten als je geen niveau wilt opgeven.

**VOORBEELD TABEL FORMAAT:**

| Hoofdcategorie | Categorie | Type | Tekenen | Opdracht | Antwoordsleutel | Tijdslimiet | Extra_Punten (max 2) | Niveau | Casus |
|----------------|-----------|------|---------|----------|-----------------|-------------|---------------------|--------|-------|
| ${hoofdcategorie} | ${subcategorieen[0] || 'Subcategorie 1'} | Begripsuitleg | Nee | Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld. | Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017). | 120 | 1 | 2 |  |
| ${hoofdcategorie} | ${subcategorieen[1] || 'Subcategorie 2'} | Feitenkennis | Ja | Benoem de belangrijkste spieren van de rotator cuff. | De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren. Bron: Gray's Anatomy (2015). | 0 | 0 | 1 |  |

**VOORBEELD EXCEL FORMAAT:**
Hoofdcategorie,Categorie,Type,Tekenen,Opdracht,Antwoordsleutel,Tijdslimiet,Extra_Punten (max 2),Niveau,Casus
${hoofdcategorie},${subcategorieen[0] || 'Subcategorie 1'},Begripsuitleg,Nee,"Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld.","Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017).",120,1,2,
${hoofdcategorie},${subcategorieen[1] || 'Subcategorie 2'},Feitenkennis,Ja,"Benoem de belangrijkste spieren van de rotator cuff.","De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren. Bron: Gray's Anatomy (2015).",0,0,1,${fileContext}`;
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
    const data = [
      {
        Hoofdcategorie: 'Anatomie',
        Categorie: 'Schouder',
        Type: 'Begripsuitleg',
        Tekenen: 'Nee',
        Opdracht: 'Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld.',
        Antwoordsleutel: 'Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden.',
        Tijdslimiet: 120,
        'Extra_Punten (max 2)': 1,
        Niveau: 2,
        Casus: ''
      },
      {
        Hoofdcategorie: 'Revalidatie',
        Categorie: 'Knie',
        Type: 'Toepassing',
        Tekenen: 'Nee',
        Opdracht: 'Stel een progressieplan op voor een patiënt die herstelt van een knieoperatie.',
        Antwoordsleutel: 'Criteria‑gebaseerde progressie; monitor pijn/zwelling; bron: richtlijn revalidatie.',
        Tijdslimiet: 90,
        'Extra_Punten (max 2)': 2,
        Niveau: 2,
        Casus: 'Patiënt 45 jaar, 6 weken post‑VKB; doel: traplopen zonder pijn.'
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Opdrachten');
    XLSX.writeFile(workbook, 'opdrachten_sjabloon.xlsx');
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
              De waarden hieronder (hoofdcategorie, onderwerp-beschrijving, aantal, studentniveau en eventuele subcategorieën) worden automatisch verwerkt in de prompt die je in stap 5 kunt kopiëren.
            </p>
            <div className="form-group">
              <label htmlFor="onderwerpBeschrijving">Beschrijving van het onderwerp (verplicht):</label>
              <input
                id="onderwerpBeschrijving"
                type="text"
                value={onderwerpBeschrijving}
                onChange={(e) => setOnderwerpBeschrijving(e.target.value)}
                placeholder="Bijv.: Revalidatie na voorste kruisband reconstructie binnen de sportfysiotherapie"
                required
              />
              {!onderwerpBeschrijving.trim() && (
                <div className="instruction-text" style={{ color: '#fca5a5', marginTop: 6 }}>Vul een korte beschrijving van het onderwerp in.</div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="hoofdcategorie">Hoofdcategorie:</label>
              <input
                id="hoofdcategorie"
                type="text"
                value={hoofdcategorie}
                onChange={(e) => setHoofdcategorie(e.target.value)}
                placeholder="bijv. Anatomie, Pathofysiologie, Vak Fysiotherapie, Gedrag & Communicatie"
              />
              <div className="instruction-text" style={{ marginTop: 6 }}>
                Dit is de hoofdcategorie waarin de opdrachten vallen. Je kunt kiezen uit bestaande categorieën in de app (Anatomie, Pathofysiologie, Vak Fysiotherapie, Gedrag & Communicatie) of zelf een nieuwe categorie opgeven. Nieuwe categorieën worden toegevoegd.
              </div>
            </div>
            <div className="form-group">
              <label>Subcategorieën:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="subcatMode"
                    value="ai"
                    checked={subcatMode === 'ai'}
                    onChange={() => setSubcatMode('ai')}
                  />
                  Laat de AI subcategorieën bepalen
                </label>
                <label>
                  <input
                    type="radio"
                    name="subcatMode"
                    value="handmatig"
                    checked={subcatMode === 'handmatig'}
                    onChange={() => setSubcatMode('handmatig')}
                  />
                  Ik geef zelf subcategorieën op
                </label>
              </div>
              {subcatMode === 'handmatig' && (
                <div style={{ marginTop: 8 }}>
                  {handmatigeSubcats.map((row, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <input
                        type="text"
                        value={row.naam}
                        onChange={(e) => updateHandmatigeSubcat(index, 'naam', e.target.value)}
                        placeholder="Bijv.: Schouder, Knie, Wervelkolom"
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 4, border: '1px solid #4a5568', background: '#2d3748', color: '#e2e8f0' }}
                      />
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={row.aantal}
                        onChange={(e) => updateHandmatigeSubcat(index, 'aantal', Number(e.target.value))}
                        style={{ width: 90, padding: '8px 12px', borderRadius: 4, border: '1px solid #4a5568', background: '#2d3748', color: '#e2e8f0' }}
                        aria-label="Aantal opdrachten"
                        title="Aantal opdrachten voor deze subcategorie"
                      />
                      <button className="download-knop" onClick={() => removeSubcatRow(index)} aria-label="Verwijder rij">−</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="download-knop" onClick={addSubcatRow}>+ Subcategorie</button>
                  </div>
                  <div className="instruction-text" style={{ marginTop: 6 }}>
                    Je kunt bestaande subcategorieën uit de app kiezen of zelf nieuwe bedenken. De opgegeven aantallen worden exact aangehouden.
                  </div>
                </div>
              )}
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
            
            <div className="form-group">
              <label>Opdracht types (meerdere mogelijk):</label>
              <div className="instruction-text" style={{ marginBottom: 6 }}>
                Vink de typen aan die je wilt laten genereren. Laat alles leeg om de keuze aan de AI over te laten.
              </div>
              <ul className="type-list">
                {BESCHIKBARE_TYPES.map((t) => (
                  <li key={t} className={`type-item ${geselecteerdeTypes.includes(t) ? 'selected' : ''}`} onClick={() => toggleType(t)}>
                    <label>
                      <input
                        type="checkbox"
                        checked={geselecteerdeTypes.includes(t)}
                        onChange={() => toggleType(t)}
                      />
                      <span className="type-title">
                        <span className="type-icon" aria-hidden>{opdrachtTypeIconen[t] || '❓'}</span>
                        {t}
                      </span>
                    </label>
                    <div className="type-desc">{TYPE_BESCHRIJVINGEN[t]}</div>
                    <div className="type-example">Voorbeeld: {TYPE_VOORBEELDEN[t]}</div>
                  </li>
                ))}
              </ul>
              <div className="instruction-text" style={{ marginTop: 8, marginBottom: 6 }}>
                <strong>Tekenen‑status (filter voor generatie)</strong><br />
                De AI labelt elke opdracht met Tekenen = Ja, Mogelijk of Nee. Selecteer hieronder welke je wilt laten genereren. Standaard: alle drie.
              </div>
              <div className="tekenen-toggle-row">
                <label>
                  <input type="checkbox" checked={allowTekenenJa} onChange={(e) => setAllowTekenenJa(e.target.checked)} />
                  Expliciet tekenen (Ja)
                </label>
                <label>
                  <input type="checkbox" checked={allowTekenenMogelijk} onChange={(e) => setAllowTekenenMogelijk(e.target.checked)} />
                  Tekenen helpt (Mogelijk)
                </label>
                <label>
                  <input type="checkbox" checked={allowTekenenNee} onChange={(e) => setAllowTekenenNee(e.target.checked)} />
                  Zonder tekenen (Nee)
                </label>
              </div>
            </div>
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
              onClick={() => {
                if (!onderwerpBeschrijving.trim()) {
                  window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Vul eerst de onderwerp-beschrijving in (Stap 1).', type: 'error', timeoutMs: 6000 } }));
                  return;
                }
                handleCopyPrompt();
              }}
              disabled={!onderwerpBeschrijving.trim()}
            >
              Kopieer Prompt
            </button>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 6: Stappen in de AI‑chatbot</h4>
            <ol className="steps-list">
              <li className="step-item">
                <span className="step-badge">1</span>
                <div className="step-content">
                  <strong>Bestanden toevoegen</strong>
                  <ul className="substeps-list">
                    <li className="substep-item"><span className="substep-badge">a</span><span>Sjabloon toevoegen (of het gewenste kolomformaat benoemen).</span></li>
                    <li className="substep-item"><span className="substep-badge">b</span><span>Br(on)nen toevoegen (indien van toepassing): links of korte samenvattingen per bron.</span></li>
                  </ul>
                </div>
              </li>
              <li className="step-item">
                <span className="step-badge">2</span>
                <div className="step-content">
                  <strong>Prompt gebruiken</strong>
                  <ul className="substeps-list">
                    <li className="substep-item"><span className="substep-badge">a</span><span>Plak de prompt.</span></li>
                    <li className="substep-item"><span className="substep-badge">b</span><span>Lees en pas naar wens aan (toon, niveau, vraagtypen, kolommen).</span></li>
                    <li className="substep-item"><span className="substep-badge">c</span><span>Stuur de prompt.</span></li>
                  </ul>
                </div>
              </li>
              <li className="step-item">
                <span className="step-badge">3</span>
                <div className="step-content">
                  <strong>Itereren</strong>
                  <ul className="substeps-list">
                    <li className="substep-item"><span className="substep-badge">a</span><span>Pas de prompt aan als het resultaat nog niet naar wens is.</span></li>
                    <li className="substep-item"><span className="substep-badge">b</span><span>Vraag extra opdrachten of bijsturing om de output te verbeteren.</span></li>
                  </ul>
                </div>
              </li>
              <li className="step-item">
                <span className="step-badge">4</span>
                <div className="step-content">
                  <strong>Output</strong>
                  <ul className="substeps-list">
                    <li className="substep-item"><span className="substep-badge">a</span><span>Vraag om een downloadbaar Excel/CSV met de juiste kolomnamen en download.</span></li>
                    <li className="substep-item"><span className="substep-badge">b</span><span>Lukt downloaden niet? Kopieer de tabel, plak in het gedownloade sjabloon en sla op.</span></li>
                  </ul>
                </div>
              </li>
            </ol>
            <p className="instruction-text" style={{ marginTop: 10 }}>
              Tip: valt het resultaat tegen? Probeer minder bronnen te gebruiken of maak het onderwerp concreter (subthema).
            </p>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 7: Voeg opdrachten toe</h4>
            <p className="instruction-text">Upload het bestand in de app via Instellingen → Opdrachtenbeheer.</p>
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