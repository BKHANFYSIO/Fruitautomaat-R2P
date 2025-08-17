import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { CRITERIA } from '../data/criteria';
import { OPDRACHT_TYPE_ORDER, opdrachtTypeIconen } from '../data/constants';
import './AiOpgaveGenerator.css';

interface AiOpgaveGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  hoofdcategorieen?: string[];
  subcategorieenPerHoofdcategorie?: Record<string, string[]>;
}

export const AiOpgaveGenerator = ({ isOpen, onClose, hoofdcategorieen = [], subcategorieenPerHoofdcategorie = {} }: AiOpgaveGeneratorProps) => {
  const [hoofdcategorie, setHoofdcategorie] = useState('');
  const [gekozenBestaandeHoofdcategorie, setGekozenBestaandeHoofdcategorie] = useState('');
  const [aantalOpdrachten, setAantalOpdrachten] = useState(30);
  const [niveau] = useState<'makkelijk' | 'moeilijk' | 'mix'>('mix');
  const [studentNiveau, setStudentNiveau] = useState<'1e jaar' | '2e jaar' | '3e/4e jaar'>('2e jaar');
  const [subcatMode, setSubcatMode] = useState<'ai' | 'handmatig'>('ai');
  // legacy input verwijderd; vervangen door handmatige lijst met aantallen
  const [onderwerpBeschrijving, setOnderwerpBeschrijving] = useState('');
  const [handmatigeSubcats, setHandmatigeSubcats] = useState<Array<{ naam: string; aantal: number }>>([{ naam: '', aantal: 15 }]);
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
    'Feitenkennis': 'Benoem de drie belangrijkste ligamenten die passieve stabiliteit geven aan het kniegewricht.',
    'Begripsuitleg': 'Leg uit hoe de menisci bijdragen aan schokabsorptie en stabiliteit in de knie.',
    'Toepassing': '**Casus:** Een 20-jarige voetballer heeft een mediaal collateraal bandletsel. **Opdracht:** Geef twee oefeningen die passen bij de subacute fase en onderbouw kort.',
    'Vaardigheid – Onderzoek': 'Demonstreer de Lachman-test en benoem de structuren die getest worden.',
    'Vaardigheid – Behandeling': 'Demonstreer een mobilisatietechniek voor het kniekapsel met als doel extensieverbetering.',
    'Communicatie met patiënt': 'Leg aan een patiënt uit waarom de voorste kruisband belangrijk is voor voorwaartse stabiliteit.',
    'Klinisch redeneren': '**Casus:** 30-jarige loper met pijn aan de mediale knie, slotklachten, positief McMurray. **Opdracht:** Bepaal twee mogelijke diagnoses en geef aan welk aanvullend onderzoek je kiest.'
  };
  const [geselecteerdeTypes, setGeselecteerdeTypes] = useState<string[]>([]);
  // Tekenen tri-status filter voor generatie
  const [allowTekenenJa, setAllowTekenenJa] = useState<boolean>(true);
  const [allowTekenenMogelijk, setAllowTekenenMogelijk] = useState<boolean>(true);
  const [allowTekenenNee, setAllowTekenenNee] = useState<boolean>(true);
  const [isTekenenUitlegOpen, setIsTekenenUitlegOpen] = useState(false);
  const [openTypeUitleg, setOpenTypeUitleg] = useState<string | null>(null);

  const updateHandmatigeSubcat = (index: number, veld: 'naam' | 'aantal', waarde: string | number) => {
    setHandmatigeSubcats(prev => {
      const kopie = [...prev];
      const item = { ...kopie[index] };
      if (veld === 'naam') {
        item.naam = String(waarde);
      } else {
        const parsed = Number(waarde);
        item.aantal = Number.isFinite(parsed) && parsed > 0 ? Math.min(99, Math.max(1, parsed)) : 1;
      }
      kopie[index] = item;
      return kopie;
    });
  };

  const addSubcatRow = () => {
    setHandmatigeSubcats(prev => [...prev, { naam: '', aantal: 15 }]);
  };

  const removeSubcatRow = (index: number) => {
    setHandmatigeSubcats(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const totaalHandmatig = handmatigeSubcats
    .filter(s => s.naam.trim())
    .reduce((sum, s) => sum + (Number.isFinite(s.aantal) ? s.aantal : 0), 0);

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

**BELANGRIJK: Download de bijlagen uit stap 3 van de AI Generator om de juiste structuur en niveau-indeling te begrijpen:**
- **Excel Sjabloon**: Voor de juiste kolomstructuur
- **Niveau Bepaling Instructies**: Voor gedetailleerde richtlijnen per opdrachttype

**DOELGROEP:**
${studentNiveauInstructie}

  **INSTRUCTIE:**
 Genereer ${totaalGevraagd} nieuwe, unieke opdrachten binnen de hoofdcategorie: **${hoofdcategorie}**.
${subcatInstructie}
${typeRestrictie}
Als aantallen per subcategorie zijn opgegeven, gebruik precies de som daarvan (negeer dan het algemene aantal).

**STAPPENPLAN VOOR DE AI:**
1. Analyseer de kernconcepten van het opgegeven specifieke onderwerp. Neem mee dat eventuele bronnen die als bijlage zijn toegevoegd de basis voor de te maken opdrachten vormen.
2. Formuleer voor verschillende kernconcepten een heldere vraag, een kleine casus, of een praktische opdracht.
3. Zorg voor variatie in vraagstelling en maak een mix van vraagtypes volgens de opgegeven vraagtypes. Het aantal van elk type moet passend zijn bij het onderwerp. Bijvoorbeeld: als het onderwerp weinig te maken heeft met communicatie met patiënten, maak dan ook geen of weinig opdrachten van dat type. Of als er geen vaardigheden aan te koppelen zijn, maak dan ook geen vaardigheidsopdrachten.
4. ${niveauInstructie}
5. Stel voor elke opdracht een moeilijkheidsniveau vast: 1 (opwarmers/basis), 2 (standaard), 3 (uitdagend).
6. Bepaal per opdracht of tekenen nodig is: "Ja" (verplicht), "Mogelijk" (helpend/optioneel) of "Nee" (geen tekenen).
7. Bepaal per opdracht of een tijdslimiet nodig is (alleen als de opdracht een tijdslimiet nodig heeft voor een goede uitvoering).
8. Bepaal per opdracht of extra punten gerechtvaardigd zijn (0-2, alleen voor moeilijke of complexe opdrachten die meer inspanning vereisen).
9. Formuleer voor elke opdracht een passend modelantwoord met bronvermelding. Het antwoord moet passend zijn bij het type vraag: een feit kan kort zijn, maar bij begrip en toepassing mag een uitgebreider antwoord gegeven worden.

**LINKS EN MEDIA IN ANTWOORDSLEUTELS:**
Je kunt links naar websites, afbeeldingen en video's toevoegen in de antwoordsleutel. De app herkent deze automatisch en toont ze op de juiste manier:

- **🔗 Websites**: Normale klikbare links (bijv. "Meer info: https://example.com")
- **🖼️ Afbeeldingen**: Automatisch ingebed voor bestanden met extensies .png, .jpg, .jpeg, .gif, .webp, .svg
  - **🎬 YouTube**: Automatisch ingebed met ondersteuning voor starttijden:
    - ?t=363 (363 seconden)
    - ?t=6m3s (6 minuten 3 seconden) 
    - ?start=363 (363 seconden)
- **🎬 Vimeo**: Automatisch ingebed
- **📄 Overige media**: Normale klikbare links

**Voorbeelden:**
- "Zie de anatomie: https://example.com/anatomy.jpg"
- "Bekijk de techniek: https://youtube.com/watch?v=abc123?t=2m30s"
- "Lees meer: https://richtlijn.nl/fysiotherapie"

**BEOORDELINGSCRITERIA:**
${criteriaInstructie}

**NIVEAU BEPALING:**
BELANGRIJK!! Gebruik onderstaande regels en beschrijvingen om elk type opdracht/vraagstuk in te delen op niveau 1, 2 of 3. De niveaus zijn type-overstijgend en worden bepaald door de complexiteit van kennis, uitvoering, redenering of communicatie. Lees per opdrachttype hoe de niveaus zijn gedefinieerd en bepaal vervolgens het juiste niveau.

**Algemeen:**
- **Niveau 1 – Opwarmers / Startniveau**: Basiskennis of eenvoudige uitvoering.
- **Niveau 2 – Standaardniveau**: Toepassing in herkenbare context, met keuze en onderbouwing.
- **Niveau 3 – Uitdagend niveau**: Integratie, analyse en meerdere stappen in complexe context.

**Niveau bepaling per opdrachttype:**

**Feitenkennis:**
- **Niveau 1**: Eenvoudige reproductie van direct aangeleerde, oppervlakkige basiskennis (enkelvoudige feitjes zoals fasen of hoofdstructuren). Gericht op het onthouden en benoemen van losse feiten, zonder interpretatie, verklaring of toepassing.
- **Niveau 2**: Verdere detaillering of ordening van meerdere feiten. Hierbij is aanwezige basiskennis een voorwaarde. Het gaat om vragen die verdieping vragen door feiten in samenhang te plaatsen of onderscheid te maken tussen meerdere nauw verwante feiten. Geen verklaringen of toepassingen, enkel ordening en precisering.
- **Typisch gebruik**: Meestal niveau 1 of 2; niveau 3 komt vrijwel niet voor.

**Begripsuitleg:**
- **Niveau 1**: Uitleg van één eenvoudig basisconcept of -proces. Maximaal 1 causale link. Weinig diepgang, vooral gericht op herkenning en het verwoorden van oppervlakkige kennis.
- **Niveau 2**: Uitleg van een proces met 2–3 causale links of één duidelijke toepassing. Vereist aanwezige basiskennis en inzicht in relaties tussen onderdelen. Middelmatige complexiteit, vraagt om koppeling van meerdere losse elementen.
- **Niveau 3**: Uitleg van een complex concept of proces met meerdere factoren, interacties en minimaal één uitzondering of beperking. Vereist diepgaande kennis, meerdere lagen van begrip en vermogen om relaties én implicaties te verwoorden. Hoge complexiteit en veel diepgang.
- **Typisch gebruik**: Vooral niveau 2; soms 1 of 3 afhankelijk van complexiteit.

**Toepassing:**
- **Niveau 1**: Eenvoudige toepassing van kennis in een korte casus of voorbeeld. Maximaal 1 variabele en 1 stap in de redenering of handeling. Weinig diepgang; het gaat om het direct omzetten van basiskennis naar een herkenbare, simpele situatie.
- **Niveau 2**: Toepassing met keuze en korte onderbouwing in een context met 2–3 variabelen. Vereist koppeling van kennis en eenvoudige redenering (2–3 stappen). Middelmatige complexiteit; vraagt onderbouwing met één criterium of rationale.
- **Niveau 3**: Toepassing in een complexere casus met meerdere variabelen of conflicterende factoren. Vereist uitgebreide onderbouwing, meerdere stappen en vaak een progressieplan of meerdere criteria. Hoge complexiteit en integratie van verschillende kennisdomeinen.
- **Typisch gebruik**: Vooral niveau 2; soms 1 bij eenvoudige toepassingen en 3 bij complexere casus.

**Klinisch redeneren:**
- **Niveau 2**: Redeneren met meerdere gegevens uit een korte casus. Formuleer 1–2 plausibele hypotheses, kies min. 1 gericht vervolgonderzoek (test/meetmoment) én een eerste interventierichting, met korte rationale. Context met 2–3 relevante variabelen, 2–3 redeneringsstappen, beperkte ambiguïteit. Geen volledige differentiaal; focus op meest waarschijnlijke optie met beknopte onderbouwing.
- **Niveau 3**: Volledig redeneerproces met differentiaaldiagnose (≥2 alternatieven) en expliciete argumentatie. Integreert ≥3 domeinen (bijv. anamnese, LO/metingen, richtlijn/ICF, trainingsleer/gedrag) en onzekerheid (conflicterende gegevens). Bevat meetplan (≥2 metingen of tijdspunten), beslis-/progressiecriteria (inclusief stop-/red flags waar passend) en een gefundeerde keuze met 4+ redeneringsstappen.
- **Typisch gebruik**: Vooral niveau 3; soms niveau 2; niveau 1 wordt in dit type niet gebruikt.

**Vaardigheid – Onderzoek:**
- **Niveau 1**: Uitvoeren van een eenvoudige vaardigheid of test. Focus op correcte techniek. Kan gecombineerd zijn met een eenvoudige, niet-complexe beredenering, maar geen diepgaande analyse vereist.
- **Niveau 2**: Uitvoeren van een vaardigheid van gemiddelde complexiteit én kort beredeneren waarom/hoe deze uitgevoerd wordt. Inclusief basisinterpretatie van de uitkomst. 2–3 stappen, 2–3 variabelen.
- **Niveau 3**: Uitvoeren van een complexe vaardigheid of cluster, gecombineerd met uitgebreid beredeneren vanuit meerdere perspectieven. Inclusief mogelijke uitkomsten en alternatieven. Analyse van resultaten en vertaling naar vervolgstappen. ≥4 stappen, ≥3 variabelen.
- **Typisch gebruik**: Alle niveaus mogelijk; verschil zit in de complexiteit van de uitvoering en de mate van beredeneren.

**Vaardigheid – Behandeling:**
- **Niveau 1**: Uitvoeren van een eenvoudige behandeling of oefening. Correcte uitvoering staat centraal. Kan gecombineerd zijn met een eenvoudige, niet-complexe beredenering (bijv. benoemen doelspier), maar geen dosering of uitgebreide rationale vereist.
- **Niveau 2**: Uitvoeren van een behandeling of oefening van gemiddelde complexiteit met korte beredenering (doel, dosering). Inclusief basisuitleg van het waarom. 2–3 stappen, 2–3 variabelen.
- **Niveau 3**: Uitvoeren van een complexe behandeling of cluster met uitgebreid beredeneren vanuit meerdere perspectieven. Inclusief progressieplan, criteria voor opbouw/afbouw, alternatieven en onderbouwing vanuit richtlijnen of klinisch redeneren. ≥4 stappen, ≥3 variabelen.
- **Typisch gebruik**: Alle niveaus mogelijk; verschil zit in de complexiteit van de uitvoering en de mate van beredeneren.

**Communicatie met patiënt:**
- **Niveau 1**: Basiscommunicatie zoals open vragen stellen, actief luisteren en eenvoudige uitleg in begrijpelijke taal. 1 stap, 1 variabele (één onderwerp), zonder noodzaak tot overtuigen of aanpassen.
- **Niveau 2**: Communicatie mét motiveren of instrueren, afgestemd op de situatie van de patiënt. 2–3 variabelen; 2–3 stappen (uitleg + instructie + motivatie). Vereist afstemming en kort onderbouwen waarom de boodschap relevant is.
- **Niveau 3**: Complexe communicatie met gedragsverandering of weerstand. Vereist gedeelde besluitvorming, motiverende gespreksvoering en integratie van meerdere factoren. ≥3 variabelen; ≥4 stappen inclusief uitleg, motivatie, omgaan met tegenargumenten en het gezamenlijk formuleren van een plan.
- **Typisch gebruik**: Vooral niveau 1 of 2; niveau 3 bij complexe gedragsverandering of weerstand.

**TIJDSLIMIET BEPALING:**
Bepaal realistische tijdslimieten op basis van het opdrachttype en complexiteit:

- **Feitenkennis**: 30-60 seconden (korte, directe antwoorden)
- **Begripsuitleg**: 60-120 seconden (uitleg vereist)
- **Toepassing**: 90-180 seconden (toepassing van kennis)
- **Vaardigheid – Onderzoek**: 120-240 seconden (demonstratie + uitleg)
- **Vaardigheid – Behandeling**: 120-300 seconden (techniek + uitleg)
- **Communicatie met patiënt**: 90-180 seconden (patiëntgerichte uitleg)
- **Klinisch redeneren**: 180-360 seconden (analyse + onderbouwing)

**EXTRA PUNTEN BEPALING:**
Bepaal extra punten op basis van de complexiteit en inspanning:

- **0 punten**: Standaard opdracht, eenvoudige vraag, direct antwoord
- **1 punt**: Complexe opdracht, meerdere stappen, uitgebreide uitleg vereist
- **2 punten**: Zeer complexe opdracht, meerdere vaardigheden combineren, hoge cognitieve belasting, of creatieve oplossing vereist

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
- "Antwoordsleutel": Het modelantwoord met bronvermelding. Je kunt links toevoegen naar websites, afbeeldingen (.png, .jpg, .gif, .webp, .svg) en video's (YouTube, Vimeo). YouTube ondersteunt starttijden: ?t=2m30s of ?start=150. De app herkent en toont media automatisch.
- "Tijdslimiet": Getal in seconden (bijv. 60 voor 1 minuut). Alleen toevoegen als de opdracht een tijdslimiet nodig heeft voor een goede uitvoering.
- "Extra_Punten (max 2)": Getal tussen 0 en 2. Alleen extra punten geven voor moeilijke of complexe opdrachten die meer inspanning vereisen.
- "Niveau": 1 (opwarmers/basis), 2 (standaard), 3 (uitdagend). Leeg laten als je geen niveau wilt opgeven.

**VOORBEELD TABEL FORMAAT:**

| Hoofdcategorie | Categorie | Type | Tekenen | Opdracht | Antwoordsleutel | Tijdslimiet | Extra_Punten (max 2) | Niveau | Casus |
|----------------|-----------|------|---------|----------|-----------------|-------------|---------------------|--------|-------|
| ${hoofdcategorie} | ${subcategorieen[0] || 'Subcategorie 1'} | Begripsuitleg | Nee | Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld. | Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017). Meer info: https://www.kngf.nl/richtlijnen | 120 | 1 | 2 |  |
| ${hoofdcategorie} | ${subcategorieen[1] || 'Subcategorie 2'} | Feitenkennis | Ja | Benoem de belangrijkste spieren van de rotator cuff. | De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren. Zie anatomie: https://example.com/rotator-cuff.jpg Bron: Gray's Anatomy (2015). | 45 | 0 | 1 |  |

**VOORBEELD EXCEL FORMAAT:**
Hoofdcategorie,Categorie,Type,Tekenen,Opdracht,Antwoordsleutel,Tijdslimiet,Extra_Punten (max 2),Niveau,Casus
${hoofdcategorie},${subcategorieen[0] || 'Subcategorie 1'},Begripsuitleg,Nee,"Leg uit wat de belangrijkste principes zijn van evidence-based practice in de fysiotherapie en geef een praktisch voorbeeld.","Evidence-based practice combineert: 1) Beste beschikbare wetenschappelijke bewijzen, 2) Klinische expertise van de therapeut, 3) Patiëntvoorkeuren en waarden. Praktisch voorbeeld: Bij een patiënt met lage rugpijn baseer je de behandeling op recente richtlijnen, je eigen ervaring met vergelijkbare casussen, en de wensen van de patiënt. Bron: KNGF-richtlijn Lage rugpijn (2017). Meer info: https://www.kngf.nl/richtlijnen",120,1,2,
${hoofdcategorie},${subcategorieen[1] || 'Subcategorie 2'},Feitenkennis,Ja,"Benoem de belangrijkste spieren van de rotator cuff.","De rotator cuff bestaat uit: 1) Supraspinatus (abductie), 2) Infraspinatus (exorotatie), 3) Teres minor (exorotatie), 4) Subscapularis (endorotatie). Deze spieren werken samen om de humeruskop in de glenoïdholte te centreren. Zie anatomie: https://example.com/rotator-cuff.jpg Bron: Gray's Anatomy (2015).",45,0,1,${fileContext}`;
  };

  const handleCopyPrompt = async () => {
    const prompt = generatePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Prompt gekopieerd naar klembord!', type: 'succes', timeoutMs: 6000 } }));
    } catch {
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

  const generateNiveauBepalingPDF = () => {
    // Download de bestaande PDF uit de public/Downloads map
    const link = document.createElement('a');
    link.href = '/Downloads/Instructie voor AI bepaling niveau van opdrachten.pdf';
    link.download = 'instructie_niveau_bepaling_AI.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateOpdrachtTypeInstructiesPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4', true);
    
    // Titel
    pdf.setFontSize(20);
    pdf.setTextColor(102, 126, 234);
    pdf.text('Instructies per Opdrachttype', 105, 25, { align: 'center' });
    
    // Subtitel
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Overzicht van alle opdrachttypes met beschrijvingen en werkwoorden', 105, 35, { align: 'center' });
    
    let yPos = 50;
    const lineHeight = 6;
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (2 * margin);
    
    // Functie om tekst te wrappen
    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = pdf.getTextWidth(testLine);
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    };
    
    // Functie om opdrachttype sectie toe te voegen
    const addOpdrachtTypeSection = (type: string, beschrijving: string, werkwoorden: string, voorbeeld: string) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      
      // Type titel
      pdf.setFontSize(16);
      pdf.setTextColor(102, 126, 234);
      pdf.text(type, margin, yPos);
      yPos += lineHeight + 2;
      
      // Beschrijving
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Beschrijving:', margin, yPos);
      yPos += lineHeight;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      const wrappedBeschrijving = wrapText(beschrijving, contentWidth);
      for (const line of wrappedBeschrijving) {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, margin, yPos);
        yPos += lineHeight;
      }
      yPos += 2;
      
      // Werkwoorden
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Werkwoorden:', margin, yPos);
      yPos += lineHeight;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 80);
      const wrappedWerkwoorden = wrapText(werkwoorden, contentWidth);
      for (const line of wrappedWerkwoorden) {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, margin, yPos);
        yPos += lineHeight;
      }
      yPos += 2;
      
      // Voorbeeld
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Voorbeeld:', margin, yPos);
      yPos += lineHeight;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      const wrappedVoorbeeld = wrapText(voorbeeld, contentWidth);
      for (const line of wrappedVoorbeeld) {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, margin, yPos);
        yPos += lineHeight;
      }
      
      yPos += lineHeight * 2;
    };
    
    // Voeg alle opdrachttypes toe
    BESCHIKBARE_TYPES.forEach((type) => {
      const beschrijving = TYPE_BESCHRIJVINGEN[type] || 'Geen beschrijving beschikbaar';
      const werkwoorden = getWerkwoordenVoorType(type);
      const voorbeeld = TYPE_VOORBEELDEN[type] || 'Geen voorbeeld beschikbaar';
      
      addOpdrachtTypeSection(type, beschrijving, werkwoorden, voorbeeld);
    });
    
    // Download het PDF bestand
    const filename = 'instructies_opdrachttypes_AI.pdf';
    pdf.save(filename);
  };

  const getWerkwoordenVoorType = (type: string): string => {
    const werkwoordenPerType: Record<string, string> = {
      'Feitenkennis': 'Benoem, noem, geef, wat, welke, waar, wanneer, wie',
      'Begripsuitleg': 'Leg uit, beschrijf, verklaar, definieer, wat betekent, hoe werkt',
      'Toepassing': 'Pas toe, kies, beslis, onderbouw, motiveer, stel voor, maak een plan',
      'Vaardigheid – Onderzoek': 'Demonstreer, voer uit, test, onderzoek, meet, observeer, analyseer',
      'Vaardigheid – Behandeling': 'Demonstreer, voer uit, behandel, oefen, pas toe, stel samen, maak',
      'Communicatie met patiënt': 'Leg uit, instrueer, motiveer, adviseer, begeleid, luister, stel vragen',
      'Klinisch redeneren': 'Analyseer, redeneer, stel hypothese, differentieer, beslis, onderbouw, evalueer'
    };
    
    return werkwoordenPerType[type] || 'Geen specifieke werkwoorden gedefinieerd';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="ai-generator-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="ai-generator-content"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
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
              <div style={{ 
                marginTop: 12, 
                padding: '16px', 
                backgroundColor: '#2d3748', 
                borderRadius: '8px', 
                border: '1px solid #4a5568' 
              }}>
                <div style={{ marginBottom: 12 }}>
                  <label htmlFor="onderwerpBeschrijving" style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
                    Beschrijving van het onderwerp (verplicht):
                  </label>
                </div>
                
                <div className="instruction-text" style={{ marginBottom: 12 }}>
                  <strong>Uitleg:</strong> Geef een korte maar duidelijke beschrijving van het onderwerp waar je opdrachten over wilt genereren. Dit helpt de AI om relevante en passende opdrachten te maken.
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <input
                    id="onderwerpBeschrijving"
                    type="text"
                    value={onderwerpBeschrijving}
                    onChange={(e) => setOnderwerpBeschrijving(e.target.value)}
                    placeholder="Bijv.: Revalidatie na voorste kruisband reconstructie binnen de sportfysiotherapie"
                    required
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      borderRadius: 4, 
                      border: '1px solid #4a5568', 
                      background: '#1a202c', 
                      color: '#e2e8f0' 
                    }}
                  />
                  {!onderwerpBeschrijving.trim() && (
                    <div className="instruction-text" style={{ color: '#fca5a5', marginTop: 6 }}>Vul een korte beschrijving van het onderwerp in.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="form-group">
              <div style={{ 
                marginTop: 12, 
                padding: '16px', 
                backgroundColor: '#2d3748', 
                borderRadius: '8px', 
                border: '1px solid #4a5568' 
              }}>
                <div style={{ marginBottom: 12 }}>
                  <label htmlFor="hoofdcategorie-select" style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
                    Hoofdcategorie:
                  </label>
                </div>
                
                <div className="instruction-text" style={{ marginBottom: 12 }}>
                  <strong>Uitleg:</strong> Kies een bestaande hoofdcategorie uit de app of laat de selectie leeg en vul je eigen hoofdcategorie in. Nieuwe categorieën worden toegevoegd.
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <select
                    id="hoofdcategorie-select"
                    value={gekozenBestaandeHoofdcategorie}
                    onChange={(e) => {
                      const value = e.target.value;
                      setGekozenBestaandeHoofdcategorie(value);
                      if (value) {
                        setHoofdcategorie(value);
                      } else {
                        // Laat vrije invoer veld actief wanneer leeg
                        setHoofdcategorie(prev => prev);
                      }
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #4a5568', background: '#1a202c', color: '#e2e8f0', marginBottom: '8px' }}
                  >
                    <option value="">Kies bestaande hoofdcategorie (optioneel)</option>
                    {hoofdcategorieen.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  
                  {/* Vrije invoer blijft beschikbaar zolang niets uit de lijst gekozen is */}
                  {gekozenBestaandeHoofdcategorie === '' && (
                    <input
                      id="hoofdcategorie"
                      type="text"
                      value={hoofdcategorie}
                      onChange={(e) => setHoofdcategorie(e.target.value)}
                      placeholder="of typ een nieuwe hoofdcategorie (bijv. Anatomie, Pathofysiologie)"
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        borderRadius: 4, 
                        border: '1px solid #4a5568', 
                        background: '#1a202c', 
                        color: '#e2e8f0' 
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="form-group">
              <div style={{ 
                marginTop: 12, 
                padding: '16px', 
                backgroundColor: '#2d3748', 
                borderRadius: '8px', 
                border: '1px solid #4a5568' 
              }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>Subcategorieën:</label>
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
                </div>

                {subcatMode === 'ai' ? (
                  <div className="instruction-text" style={{ marginBottom: 12 }}>
                    <strong>Uitleg:</strong> De AI bepaalt zelf welke subcategorieën het beste passen bij je onderwerp. Je geeft alleen het totale aantal opdrachten op.
                  </div>
                ) : (
                  <>
                    <div className="instruction-text" style={{ marginBottom: 12 }}>
                      <strong>Uitleg:</strong> Je kunt bestaande subcategorieën uit de app kiezen (indien beschikbaar voor "{hoofdcategorie || gekozenBestaandeHoofdcategorie}") of zelf nieuwe bedenken. De opgegeven aantallen worden exact aangehouden.
                    </div>
                    
                    {(() => {
                      const key = gekozenBestaandeHoofdcategorie || hoofdcategorie;
                      const suggesties = Array.from(new Set((subcategorieenPerHoofdcategorie[key] || []).filter(Boolean))).sort((a,b) => a.localeCompare(b));
                      return suggesties.length > 0 ? (
                        <div className="instruction-text" style={{ marginBottom: 12, padding: '8px 12px', backgroundColor: '#1a202c', borderRadius: '4px', border: '1px solid #2d3748' }}>
                          <strong>💡 Suggesties:</strong> Bestaande subcategorieën voor {key ? <strong>{key}</strong> : '—'} (klik op dropdown om te selecteren)
                        </div>
                      ) : null;
                    })()}
                    
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#a0aec0', fontWeight: 'bold' }}>Subcategorieën:</span>
                      </div>
                      {handmatigeSubcats.map((row, index) => (
                        <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                          <input
                            type="text"
                            value={row.naam}
                            onChange={(e) => updateHandmatigeSubcat(index, 'naam', e.target.value)}
                            placeholder="Bijv.: Schouder, Knie, Wervelkolom"
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 4, border: '1px solid #4a5568', background: '#1a202c', color: '#e2e8f0' }}
                          />
                          {(() => {
                            const key = gekozenBestaandeHoofdcategorie || hoofdcategorie;
                            const suggesties = Array.from(new Set((subcategorieenPerHoofdcategorie[key] || []).filter(Boolean))).sort((a,b) => a.localeCompare(b));
                            return suggesties.length > 0 ? (
                              <select
                                value={''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v) updateHandmatigeSubcat(index, 'naam', v);
                                }}
                                style={{ minWidth: 180, padding: '8px 12px', borderRadius: 4, border: '1px solid #4a5568', background: '#1a202c', color: '#e2e8f0' }}
                                aria-label="Kies bestaande subcategorie"
                              >
                                <option value="">Kies bestaande…</option>
                                {suggesties.map((s) => (
                                  <option key={`${key}-${s}`} value={s}>{s}</option>
                                ))}
                              </select>
                            ) : null;
                          })()}
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={row.aantal}
                            onChange={(e) => updateHandmatigeSubcat(index, 'aantal', Number(e.target.value))}
                            style={{ width: 90, padding: '8px 12px', borderRadius: 4, border: '1px solid #4a5568', background: '#1a202c', color: '#e2e8f0' }}
                            aria-label="Aantal opdrachten"
                            title="Aantal opdrachten voor deze subcategorie"
                          />
                          <button
                            className="download-knop"
                            onClick={() => removeSubcatRow(index)}
                            aria-label="Verwijder rij"
                            disabled={handmatigeSubcats.length <= 1}
                            title={handmatigeSubcats.length <= 1 ? 'Minimaal één rij vereist' : 'Verwijder rij'}
                            style={{ padding: '8px 12px', minWidth: '40px' }}
                          >
                            −
                          </button>
                        </div>
                      ))}
                      <button
                        className="download-knop"
                        onClick={addSubcatRow}
                        disabled={!hoofdcategorie && !gekozenBestaandeHoofdcategorie}
                        title={!hoofdcategorie && !gekozenBestaandeHoofdcategorie ? 'Kies eerst een hoofdcategorie' : 'Voeg subcategorie toe'}
                        style={{ marginTop: '4px' }}
                      >
                        + Subcategorie
                      </button>
                    </div>
                  </>
                )}

                <div style={{ borderTop: '1px solid #4a5568', paddingTop: '16px' }}>
                  <div className="instruction-text" style={{ marginBottom: 12 }}>
                    <strong>Uitleg:</strong> {subcatMode === 'ai' 
                      ? 'De AI bepaalt zelf welke subcategorieën het beste passen bij je onderwerp. Je geeft alleen het totale aantal opdrachten op.'
                      : 'Het totaal aantal opdrachten wordt automatisch berekend op basis van de aantallen die je per subcategorie hebt opgegeven.'
                    }
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label htmlFor="aantal" style={{ fontWeight: 'bold', color: '#e2e8f0' }}>
                      {subcatMode === 'ai' ? 'Aantal opdrachten:' : 'Totaal aantal:'}
                    </label>
                    <input
                      id="aantal"
                      type="number"
                      value={subcatMode === 'ai' ? aantalOpdrachten : totaalHandmatig}
                      onChange={subcatMode === 'ai' ? (e) => setAantalOpdrachten(Number(e.target.value)) : undefined}
                      readOnly={subcatMode !== 'ai'}
                      min="1"
                      max="100"
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: 4, 
                        border: '1px solid #4a5568', 
                        background: '#1a202c', 
                        color: '#e2e8f0', 
                        width: '100px',
                        opacity: subcatMode === 'ai' ? 1 : 0.8
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <div style={{ 
                marginTop: 12, 
                padding: '16px', 
                backgroundColor: '#2d3748', 
                borderRadius: '8px', 
                border: '1px solid #4a5568' 
              }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
                    Student niveau:
                  </label>
                </div>
                
                <div className="instruction-text" style={{ marginBottom: 12 }}>
                  <strong>Uitleg:</strong> Kies het studiejaar van de studenten waarvoor je opdrachten wilt genereren. Dit helpt de AI om de complexiteit en diepgang van de opdrachten aan te passen aan het kennisniveau.
                </div>
                
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
            </div>
            
            <div className="form-group">
              <div style={{ 
                marginTop: 12, 
                padding: '16px', 
                backgroundColor: '#2d3748', 
                borderRadius: '8px', 
                border: '1px solid #4a5568' 
              }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
                    Opdracht types (meerdere mogelijk):
                  </label>
                </div>
                
                <div className="instruction-text" style={{ marginBottom: 12 }}>
                  <strong>Uitleg:</strong> Vink de typen aan die je wilt laten genereren. Laat alles leeg om de keuze aan de AI over te laten.
                </div>
                
                <ul className="type-list">
                  {BESCHIKBARE_TYPES.map((t) => (
                    <li key={t} className={`type-item ${geselecteerdeTypes.includes(t) ? 'selected' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <label style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={geselecteerdeTypes.includes(t)}
                            onChange={() => toggleType(t)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span className="type-title" style={{ cursor: 'pointer' }} onClick={() => toggleType(t)}>
                            <span className="type-icon" aria-hidden>{opdrachtTypeIconen[t] || '❓'}</span>
                            {t}
                          </span>
                        </label>
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: openTypeUitleg === t ? '#4a5568' : 'transparent',
                            transition: 'background-color 0.2s'
                          }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTypeUitleg(openTypeUitleg === t ? null : t);
                          }}
                          title="Klik voor uitleg en voorbeelden"
                        >
                          <span style={{ 
                            fontSize: '12px', 
                            transition: 'transform 0.2s', 
                            transform: openTypeUitleg === t ? 'rotate(90deg)' : 'rotate(0deg)',
                            color: '#a0aec0'
                          }}>
                            ▶
                          </span>
                        </div>
                      </div>
                      {openTypeUitleg === t && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '12px', 
                          backgroundColor: '#1a202c', 
                          borderRadius: '6px', 
                          border: '1px solid #2d3748',
                          marginLeft: '24px'
                        }}>
                          <div style={{ color: '#cbd5e0', fontSize: '13px', marginBottom: '12px', lineHeight: '1.4' }}>
                            {TYPE_BESCHRIJVINGEN[t]}
                          </div>
                          <div style={{ color: '#a0aec0', fontSize: '12px', lineHeight: '1.4' }}>
                            <strong style={{ color: '#e2e8f0' }}>Voorbeelden:</strong>
                            <div style={{ marginTop: '8px' }}>
                              {(() => {
                                const voorbeelden = {
                                  'Feitenkennis': [
                                    'Benoem de drie belangrijkste ligamenten die passieve stabiliteit geven aan het kniegewricht.',
                                    'Noem de vier hoofdfasen van supercompensatie.',
                                    'Noem twee klinische tekenen die passen bij een inversietrauma van de enkel in de acute fase.'
                                  ],
                                  'Begripsuitleg': [
                                    'Leg uit hoe de menisci bijdragen aan schokabsorptie en stabiliteit in de knie.',
                                    'Beschrijf hoe het overload-principe invloed heeft op bindweefseladaptatie.',
                                    'Leg uit waarom vroege mobilisatie na een lateraal enkelbandletsel het herstel kan bevorderen.'
                                  ],
                                  'Toepassing': [
                                    '**Casus:** Een 20-jarige voetballer heeft een mediaal collateraal bandletsel. **Opdracht:** Geef twee oefeningen die passen bij de subacute fase en onderbouw kort.',
                                    '**Opdracht:** Pas het principe van specificiteit toe bij het opstellen van een oefenprogramma voor herstel van een verzwikte pols.',
                                    '**Casus:** Patiënt, 25 jaar, lateraal enkelbandletsel 4 dagen geleden, wil lopen zonder krukken. **Opdracht:** Stel een oefenadvies op volgens de KNGF-richtlijn.'
                                  ],
                                  'Vaardigheid – Onderzoek': [
                                    'Demonstreer de Lachman-test en benoem de structuren die getest worden.',
                                    'Voer een hand-held dynamometertest uit voor de quadriceps en noteer de meetwaarden. Indien geen dynamometer beschikbaar: leg uit hoe je de test zou uitvoeren.',
                                    'Meet de dorsaalflexie van de enkel met een goniometer en noteer het eindgevoel. Indien geen goniometer beschikbaar: leg uit hoe je de meting zou uitvoeren.'
                                  ],
                                  'Vaardigheid – Behandeling': [
                                    'Demonstreer een mobilisatietechniek voor het kniekapsel met als doel extensieverbetering.',
                                    'Voer een excentrische oefening uit voor de hamstrings en benoem de dosering.',
                                    'Laat een enkelbalansoefening zien op een instabiele ondergrond voor een patiënt in de herstelfase.'
                                  ],
                                  'Communicatie met patiënt': [
                                    'Leg aan een patiënt uit waarom de voorste kruisband belangrijk is voor voorwaartse stabiliteit.',
                                    'Motiveer een patiënt om een progressief krachttrainingsprogramma vol te houden door het herstelproces van bindweefsel uit te leggen.',
                                    'Leg in begrijpelijke taal uit waarom het belangrijk is om de enkel te blijven bewegen ondanks lichte pijn.'
                                  ],
                                  'Klinisch redeneren': [
                                    '**Casus:** 30-jarige loper met pijn aan de mediale knie, slotklachten, positief McMurray. **Opdracht:** Bepaal twee mogelijke diagnoses en geef aan welk aanvullend onderzoek je kiest.',
                                    '**Casus:** 22-jarige sporter met recidiverende kuitblessures, klachten na intensieve intervaltraining, onregelmatig herstelschema. **Opdracht:** Leg uit hoe je trainingsbelasting zou aanpassen om herhaling te voorkomen.',
                                    '**Casus:** 19-jarige met inversietrauma 1 week geleden. Lichte zwelling rond de laterale malleolus, kan steunen maar niet rennen, pijnscore 4/10 bij dorsaalflexie, figure-of-eight omtrek +1,2 cm t.o.v. andere enkel. **Opdracht:** Beschrijf je behandelplan volgens de KNGF-richtlijn, inclusief criteria voor opbouw.'
                                  ]
                                };
                                
                                return voorbeelden[t as keyof typeof voorbeelden]?.map((voorbeeld, index) => (
                                  <div key={index} style={{ 
                                    marginBottom: '8px', 
                                    padding: '8px', 
                                    backgroundColor: '#2d3748', 
                                    borderRadius: '4px',
                                    borderLeft: '3px solid #4a5568'
                                  }}>
                                    <span style={{ 
                                      color: '#a0aec0', 
                                      fontSize: '11px', 
                                      fontWeight: 'bold',
                                      marginRight: '6px'
                                    }}>
                                      {index + 1}.
                                    </span>
                                    <span style={{ color: '#cbd5e0' }}>
                                      {voorbeeld}
                                    </span>
                                  </div>
                                )) || [TYPE_VOORBEELDEN[t]];
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="form-group">
              <div style={{ 
                marginTop: 12, 
                padding: '16px', 
                backgroundColor: '#2d3748', 
                borderRadius: '8px', 
                border: '1px solid #4a5568' 
              }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
                    Tekenen‑status (filter voor generatie):
                  </label>
                </div>
                
                <div className="instruction-text" style={{ marginBottom: 12 }}>
                  <strong>Uitleg:</strong> De AI labelt elke opdracht met Tekenen = Ja, Mogelijk of Nee. Selecteer hieronder welke categorieën je wilt laten genereren.
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setIsTekenenUitlegOpen(!isTekenenUitlegOpen)}>
                    <strong>📝 Uitgebreide uitleg en voorbeelden</strong>
                    <span style={{ fontSize: '12px', transition: 'transform 0.2s', transform: isTekenenUitlegOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                  </div>
                  {isTekenenUitlegOpen && (
                    <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#1a202c', borderRadius: '6px', border: '1px solid #2d3748' }}>
                      <p style={{ margin: '0 0 8px 0', color: '#e2e8f0' }}>
                        <strong>Standaardinstelling:</strong> alle drie categorieën.
                      </p>
                      <p style={{ margin: '8px 0', color: '#cbd5e0' }}>
                        <strong>Als alle drie zijn geselecteerd:</strong> genereert de AI opdrachten uit alle categorieën.
                      </p>
                      <p style={{ margin: '8px 0', color: '#cbd5e0' }}>
                        <strong>Als alleen Ja is geselecteerd:</strong> genereert de AI uitsluitend opdrachten waarbij tekenen verplicht is.<br />
                        <em>Voorbeeld:</em> "Teken een grafiek van de fasen van bindweefselherstel en leg deze uit aan de hand van je tekening."
                      </p>
                      <p style={{ margin: '8px 0', color: '#cbd5e0' }}>
                        <strong>Als alleen Mogelijk is geselecteerd:</strong> genereert de AI opdrachten waar tekenen optioneel is.<br />
                        <em>Voorbeeld:</em> "Leg uit hoe een gewricht werkt (tekenen mag, maar is niet verplicht)."
                      </p>
                      <p style={{ margin: '8px 0', color: '#cbd5e0' }}>
                        <strong>Als alleen Nee is geselecteerd:</strong> genereert de AI opdrachten zonder tekenen.<br />
                        <em>Voorbeeld:</em> "Noem 3 spieren die betrokken zijn bij schouderabductie."
                      </p>
                      <p style={{ margin: '8px 0', color: '#cbd5e0' }}>
                        <strong>De AI houdt bij het genereren rekening met het onderwerp.</strong><br />
                        Als tekenen minder passend is bij het onderwerp, worden er automatisch minder tekenopdrachten gegenereerd.
                      </p>
                    </div>
                  )}
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
          </div>

          <div className="ai-generator-section">
            <h4>Stap 2: Bepaal en verzamel bronmateriaal (optioneel)</h4>
            <p className="instruction-text">
              Zoek en verzamel zelf bronmateriaal waarop je de opdrachten wilt baseren. Denk aan:
            </p>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: '12px 0',
              color: '#cbd5e0'
            }}>
              <li style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: '8px', 
                lineHeight: '1.4',
                gap: '8px'
              }}>
                <span style={{ 
                  backgroundColor: '#4a5568', 
                  color: '#e2e8f0', 
                  borderRadius: '50%', 
                  width: '20px', 
                  height: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>•</span>
                <span>YouTube/kennisclips (tip: met tijdstempel – de app ondersteunt <code>?t=…</code> of <code>?start=…</code> waardoor de video exact start waar het relevant is voor de opdracht)</span>
              </li>
              <li style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: '8px', 
                lineHeight: '1.4',
                gap: '8px'
              }}>
                <span style={{ 
                  backgroundColor: '#4a5568', 
                  color: '#e2e8f0', 
                  borderRadius: '50%', 
                  width: '20px', 
                  height: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>•</span>
                <span>Artikelen en (kursus)boeken</span>
              </li>
              <li style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: '8px', 
                lineHeight: '1.4',
                gap: '8px'
              }}>
                <span style={{ 
                  backgroundColor: '#4a5568', 
                  color: '#e2e8f0', 
                  borderRadius: '50%', 
                  width: '20px', 
                  height: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>•</span>
                <span>Transcripties, hoorcolleges, slides</span>
              </li>
              <li style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: '8px', 
                lineHeight: '1.4',
                gap: '8px'
              }}>
                <span style={{ 
                  backgroundColor: '#4a5568', 
                  color: '#e2e8f0', 
                  borderRadius: '50%', 
                  width: '20px', 
                  height: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>•</span>
                <span>Websites en richtlijnen</span>
              </li>
            </ul>
            <p className="instruction-text">
              Dit is optioneel. Zonder bronnen zal het taalmodel zijn eigen kennis gebruiken.
              Dat werkt vaak prima, maar verhoogt de kans op bias en hallucinaties. Controleer
              de inhoud dan extra kritisch en voeg bij voorkeur toch concrete bronnen toe.
            </p>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 3: Download bijlagen voor AI chatbot</h4>
            <p className="instruction-text">
              Download de benodigde bijlagen om mee te geven aan je AI chatbot. Deze helpen de AI om de juiste structuur en niveau-indeling te begrijpen.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
              <button className="download-knop" onClick={handleDownloadTemplate}>
                📊 Download Excel Sjabloon
              </button>
              <button className="download-knop" onClick={generateNiveauBepalingPDF}>
                📋 Download Niveau Bepaling Instructies
              </button>
              <button className="download-knop" onClick={generateOpdrachtTypeInstructiesPDF}>
                📚 Download Instructies per Opdrachttype
              </button>
            </div>
            
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              backgroundColor: '#2d3748', 
              borderRadius: '8px', 
              border: '1px solid #4a5568',
              borderLeft: '4px solid #48bb78'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '8px' 
              }}>
                <span style={{ 
                  fontSize: '16px', 
                  color: '#48bb78'
                }}>ℹ️</span>
                <strong style={{ 
                  color: '#e2e8f0', 
                  fontSize: '14px'
                }}>Wat download je?</strong>
              </div>
              <ul style={{ 
                margin: '0', 
                color: '#cbd5e0', 
                lineHeight: '1.5',
                fontSize: '13px',
                paddingLeft: '20px'
              }}>
                <li><strong>Excel Sjabloon:</strong> De juiste kolomstructuur voor je opdrachten</li>
                <li><strong>Niveau Bepaling Instructies:</strong> Gedetailleerde richtlijnen voor het bepalen van niveau 1, 2 of 3 per opdrachttype</li>
                <li><strong>Instructies per Opdrachttype:</strong> Overzicht van alle opdrachttypes met beschrijvingen en werkwoorden</li>
              </ul>
            </div>
            
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              backgroundColor: '#2d3748', 
              borderRadius: '8px', 
              border: '1px solid #4a5568',
              borderLeft: '4px solid #ed8936'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '8px' 
              }}>
                <span style={{ 
                  fontSize: '16px', 
                  color: '#ed8936'
                }}>🔗</span>
                <strong style={{ 
                  color: '#e2e8f0', 
                  fontSize: '14px'
                }}>Instructies per opdrachttype</strong>
              </div>
              <p style={{ 
                margin: '0 0 12px 0', 
                color: '#cbd5e0', 
                lineHeight: '1.5',
                fontSize: '13px'
              }}>
                Bekijk hieronder welke werkwoorden en beschrijvingen passen bij elk opdrachttype:
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '12px' 
              }}>
                {BESCHIKBARE_TYPES.map((type) => (
                  <div key={type} style={{ 
                    padding: '12px', 
                    backgroundColor: '#1a202c', 
                    borderRadius: '6px', 
                    border: '1px solid #2d3748' 
                  }}>
                    <strong style={{ color: '#e2e8f0', fontSize: '13px' }}>{type}</strong>
                    <p style={{ 
                      margin: '8px 0 0 0', 
                      color: '#cbd5e0', 
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}>
                      {TYPE_BESCHRIJVINGEN[type]}
                    </p>
                    <p style={{ 
                      margin: '4px 0 0 0', 
                      color: '#a0aec0', 
                      fontSize: '11px',
                      fontStyle: 'italic'
                    }}>
                      <strong>Werkwoorden:</strong> {getWerkwoordenVoorType(type)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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
            <div style={{ 
              marginTop: 16, 
              padding: '16px', 
              backgroundColor: '#2d3748', 
              borderRadius: '8px', 
              border: '1px solid #4a5568',
              borderLeft: '4px solid #f6ad55'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '8px' 
              }}>
                <span style={{ 
                  fontSize: '16px', 
                  color: '#f6ad55'
                }}>💡</span>
                <strong style={{ 
                  color: '#e2e8f0', 
                  fontSize: '14px'
                }}>Tip voor betere resultaten</strong>
              </div>
              <p style={{ 
                margin: 0, 
                color: '#cbd5e0', 
                lineHeight: '1.5',
                fontSize: '13px'
              }}>
                Valt het resultaat tegen? Maak het onderwerp concreter (subthema) en gebruik gerichte bronnen over hetzelfde onderwerp. 
                Hoe concreter, afgebakender en met toevoeging van relevante bronnen, hoe beter de output zal zijn. 
                Vage, heel uitgebreide onderwerpen zonder bronnen leveren vaak minder bruikbare of minder kwalitatieve output op.
              </p>
            </div>
          </div>

          <div className="ai-generator-section">
            <h4>Stap 7: Voeg opdrachten toe</h4>
            <p className="instruction-text">
              Upload het Excel-bestand met de door AI gegenereerde en door jou gecontroleerde/aangepaste opdrachten in de app via Instellingen → Opdrachtenbeheer.
            </p>
            <button 
              onClick={onClose}
              className="ai-generator-knop"
              style={{ 
                marginTop: '12px',
                backgroundColor: '#4ea3ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🎯 Sluit deze instructie en klik in instellingen op de 'Kies een bestand' knop
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