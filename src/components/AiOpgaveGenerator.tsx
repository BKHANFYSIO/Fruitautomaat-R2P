import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
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
  // niveau-filter is niet meer nodig in compacte prompt
  const [studentNiveau, setStudentNiveau] = useState<'1e jaar' | '2e jaar' | '3e/4e jaar' | ''>('');
  const [subcatMode, setSubcatMode] = useState<'ai' | 'handmatig'>('ai');
  // legacy input verwijderd; vervangen door handmatige lijst met aantallen
  const [onderwerpBeschrijving, setOnderwerpBeschrijving] = useState('');
  const [handmatigeSubcats, setHandmatigeSubcats] = useState<Array<{ naam: string; aantal: number }>>([{ naam: '', aantal: 15 }]);
  const TYPE_BESCHRIJVINGEN: Record<string, string> = {
    'Feitenkennis': 'Opdrachten die gericht zijn op het reproduceren van concrete, losse feiten zonder verdere interpretatie of toepassing.',
    'Begripsuitleg': 'Opdrachten waarin studenten een concept, proces of verschil uitleggen, beschrijven of verklaren. Het draait om inzicht in verbanden en (causale) relaties.',
    'Toepassing': 'Opdrachten waarbij kennis in een herkenbare (casus)context wordt gebruikt om een keuze te maken, oplossing te bedenken of plan op te stellen. Vereist korte onderbouwing of motivatie.',
    'Vaardigheid – Onderzoek': 'Opdrachten gericht op het demonstreren en uitvoeren van een onderzoekstechniek of test, inclusief (basis)beredenering en interpretatie van resultaten.',
    'Vaardigheid – Behandeling': 'Opdrachten waarin studenten een behandeling of oefening uitvoeren of samenstellen. Focus ligt op correcte uitvoering, met toenemende complexiteit in onderbouwing en opbouw.',
    'Communicatie met patiënt': 'Opdrachten waarin studenten uitleg geven, motiveren, adviseren of begeleiden van patiënten. De nadruk ligt op begrijpelijke taal, afstemming, motivatie en omgaan met weerstand.',
    'Klinisch redeneren': 'Opdrachten die vragen om een gestructureerd redeneerproces met meerdere gegevens uit een casus, waarbij hypotheses, onderzoek en interventierichtingen gekozen en onderbouwd worden.'
  };
  const BESCHIKBARE_TYPES = OPDRACHT_TYPE_ORDER.filter(t => TYPE_BESCHRIJVINGEN[t as keyof typeof TYPE_BESCHRIJVINGEN]);
  // TYPE_VOORBEELDEN verwijderd (niet gebruikt)

  const TYPE_OPDRACHTEN_VOORBEELDEN: Record<string, string> = {
    'Feitenkennis': 'Benoemen van structuren, functies, fasen, data of namen; eenvoudige tekenopdrachten van structuren; vragen met "wat", "welke", "noem", "benoem".',
    'Begripsuitleg': 'Uitleg van fysiologische processen (bv. sliding filament theorie), beschrijven van verschillen (acute vs. chronische pijn), tekenen en toelichten van processen of grafieken.',
    'Toepassing': 'Kiezen van een oefening of meetmethode in een casus, motiveren van een keuze, opstellen van een eenvoudig oefenplan.',
    'Vaardigheid – Onderzoek': 'Uitvoeren/demonstreren van een test (bv. Lachman test), meten van vitale functies, observeren en analyseren van onderzoeksuitkomsten.',
    'Vaardigheid – Behandeling': 'Demonstreren van een oefening, opstellen van een oefenprogramma, behandelen volgens een richtlijn, inclusief dosering, progressie en alternatieven.',
    'Communicatie met patiënt': 'Eenvoudig uitleggen van een begrip, motiveren tot gedragsverandering, geven van instructies, oefenen van motiverende gespreksvoering, gezamenlijke besluitvorming.',
    'Klinisch redeneren': 'Formuleren van hypothesen, differentiëren tussen diagnoses, beslissen over vervolgonderzoek en eerste interventie, maken van een differentiaaldiagnose met argumentatie.'
  };
  const [geselecteerdeTypes, setGeselecteerdeTypes] = useState<string[]>([]);
  // Tekenen tri-status filter voor generatie
  const [allowTekenenJa, setAllowTekenenJa] = useState<boolean>(true);
  const [allowTekenenMogelijk, setAllowTekenenMogelijk] = useState<boolean>(true);
  const [allowTekenenNee, setAllowTekenenNee] = useState<boolean>(true);
  const [isTekenenUitlegOpen, setIsTekenenUitlegOpen] = useState(false);
  const [openTypeUitleg, setOpenTypeUitleg] = useState<string | null>(null);
  const [alleTypesUitgeklapt, setAlleTypesUitgeklapt] = useState(false);
  
  // State voor het beheren van links
  const [linkInput, setLinkInput] = useState('');
  const [addedLinks, setAddedLinks] = useState<string[]>([]);
  const [useBronnenExpliciet, setUseBronnenExpliciet] = useState(true);
  const [promptVariant, setPromptVariant] = useState<'standaard' | 'video'>('standaard');
  // Accordion state: welke stap is geopend (null = alles ingeklapt)
  const [openStep, setOpenStep] = useState<number | null>(null);
  // Keuze in stap 2
  type BronKeuze = 'model' | 'video' | 'bronnen' | 'mix';
  const [bronKeuze, setBronKeuze] = useState<BronKeuze>('model');

  // Scroll-naar-stap refs en handler
  type StepIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  const stepSectionRefs = {
    1: useRef<HTMLDivElement | null>(null),
    2: useRef<HTMLDivElement | null>(null),
    3: useRef<HTMLDivElement | null>(null),
    4: useRef<HTMLDivElement | null>(null),
    5: useRef<HTMLDivElement | null>(null),
    6: useRef<HTMLDivElement | null>(null),
    7: useRef<HTMLDivElement | null>(null),
    8: useRef<HTMLDivElement | null>(null),
  } as const;
  const stepHeaderRefs = {
    1: useRef<HTMLHeadingElement | null>(null),
    2: useRef<HTMLHeadingElement | null>(null),
    3: useRef<HTMLHeadingElement | null>(null),
    4: useRef<HTMLHeadingElement | null>(null),
    5: useRef<HTMLHeadingElement | null>(null),
    6: useRef<HTMLHeadingElement | null>(null),
    7: useRef<HTMLHeadingElement | null>(null),
    8: useRef<HTMLHeadingElement | null>(null),
  } as const;

  const handleToggleStep = (step: StepIndex) => {
    const next = openStep === step ? null : step;
    setOpenStep(next);
    if (next !== null) {
      requestAnimationFrame(() => {
        const headerEl = stepHeaderRefs[next].current || stepSectionRefs[next].current;
        if (headerEl) {
          const top = (headerEl as HTMLElement).getBoundingClientRect().top + window.scrollY - 8;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    }
  };

  // Functie om een link toe te voegen
  const handleAddLink = () => {
    const trimmedLink = linkInput.trim();
    if (trimmedLink && !addedLinks.includes(trimmedLink)) {
      setAddedLinks(prev => [...prev, trimmedLink]);
      setLinkInput('');
    }
  };

  // Functie om een link te verwijderen
  const handleRemoveLink = (index: number) => {
    setAddedLinks(prev => prev.filter((_, i) => i !== index));
  };

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

  const toggleAlleTypesUitklappen = () => {
    if (alleTypesUitgeklapt) {
      // Alles inklappen
      setOpenTypeUitleg(null);
      setAlleTypesUitgeklapt(false);
    } else {
      // Alles uitklappen
      setOpenTypeUitleg('all');
      setAlleTypesUitgeklapt(true);
    }
  };

  /*
   * legacy generatePrompt (voorheen lange prompt) – behouden als comment voor referentie
   * const generatePrompt = () => { ... }
   */
  // Verwijderd i.v.m. compacte promptvariant
    /* LEGACY_PROMPT_BLOCK_START
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

    // Links context voor de prompt
    const linksContext = addedLinks.length > 0 
      ? `\n\n**BRONMATERIAAL EN LINKS:**
${useBronnenExpliciet ? '**BELANGRIJK: Gebruik EXCLUSIEF de volgende bronnen en links als basis voor het genereren van opdrachten. Baseer je antwoordsleutels en opdrachtinhoud op deze specifieke bronmateriaal.**' : 'De volgende links en bronmateriaal zijn beschikbaar voor het maken van opdrachten. Gebruik deze als basis waar mogelijk en verwijs ernaar in de antwoordsleutels:'}

${addedLinks.map((link, index) => {
  const url = link.toLowerCase();
  let type = 'Website';
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    type = 'YouTube video';
  } else if (url.includes('vimeo.com')) {
    type = 'Vimeo video';
  } else if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    type = 'Afbeelding';
  }
  return `${index + 1}. ${type}: ${link}`;
}).join('\n')}

**INSTRUCTIES VOOR GEBRUIK VAN LINKS:**
- Voor YouTube en Vimeo video's: Gebruik de links in antwoordsleutels met eventuele timestamps (?t=... of ?start=...)
- Voor afbeeldingen: Voeg de links toe in antwoordsleutels voor visuele ondersteuning
- Voor websites: Verwijs naar relevante pagina's in antwoordsleutels
- Als er timestamps in video links staan, neem dan een transcriptie van het relevante deel mee in de antwoordsleutel
${useBronnenExpliciet ? '\n**EXPLICIETE INSTRUCTIE:** Baseer alle opdrachten en antwoordsleutels op de bovenstaande bronnen. Gebruik geen algemene kennis die niet in deze bronnen voorkomt.' : ''}`
      : '';

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

**BELANGRIJK: Download de bijlagen uit stap 4 van de AI Generator om de juiste structuur en niveau-indeling te begrijpen:**
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

${linksContext}

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
  LEGACY_PROMPT_BLOCK_END */

  const generatePromptCompact = () => {
    const toegestaneTekenenStatuses = [
      allowTekenenJa ? 'Ja' : null,
      allowTekenenMogelijk ? 'Mogelijk' : null,
      allowTekenenNee ? 'Nee' : null,
    ].filter(Boolean) as string[];
    const effectieveTekenenStatuses = toegestaneTekenenStatuses.length > 0 ? toegestaneTekenenStatuses : ['Ja', 'Mogelijk', 'Nee'];

    const totaalGevraagd = subcatMode === 'handmatig'
      ? handmatigeSubcats.filter(s => s.naam.trim()).reduce((sum, s) => sum + (Number.isFinite(s.aantal) ? s.aantal : 0), 0)
      : aantalOpdrachten;

    const subcatsParam = subcatMode === 'handmatig' && handmatigeSubcats.some(s => s.naam.trim())
      ? handmatigeSubcats.filter(s => s.naam.trim()).map(s => `${s.naam} (${s.aantal})`).join(', ')
      : 'laat AI verdelen binnen onderwerp';
    const typesParam = (geselecteerdeTypes && geselecteerdeTypes.length > 0)
      ? geselecteerdeTypes.join(', ')
      : 'geschikt uit lijst';
    const linksParam = addedLinks.length
      ? addedLinks.map((l, i) => `${i + 1}. ${l}`).join('\n')
      : '- (geen links toegevoegd)';

    const bronnenLijn = useBronnenExpliciet
      ? 'Gebruik exclusief de meegeleverde bijlagen (Excel-sjabloon, Niveau-instructie, Opdracht-typen) en onderstaande links; geen externe/algemene kennis.'
      : 'Baseer je primair op bijlagen en onderstaande links; vul aan met eigen kennis indien nodig.';
    const videoLijn = promptVariant === 'video'
      ? '\nVoeg bij video-opdrachten timestamp-links toe in de antwoordsleutel en citeer het relevante fragment (zie bijlage "Instructie voor AI - Video met timestamps.pdf").'
      : '';
    const videoRegel = promptVariant === 'video'
      ? ' Als een video-link is gebruikt, voeg een timestamp toe (?t=... of ?start=...) en citeer kort de relevante zin/onderdeel uit het transcript.'
      : '';

    return `ROL
Je bent docent/curriculumontwikkelaar voor ${onderwerpBeschrijving}. Genereer toetsbare, korte opdrachten voor hbo-fysiotherapie.

BRONNEN
${bronnenLijn}${videoLijn}
Links:
${linksParam}

PARAMETERS
- Doelgroep: ${studentNiveau}
- Hoofdcategorie: ${hoofdcategorie}
- Subcategorieën: ${subcatsParam}
- Types: ${typesParam}
- Tekenen: alleen deze waarden toestaan en filteren: ${effectieveTekenenStatuses.join(', ')}

OPDRACHT
Genereer precies ${totaalGevraagd} unieke opdrachten die passen bij het onderwerp en de doelgroep, verdeeld volgens bovenstaande restricties (subcategorie-aantallen zijn hard; anders evenredige verdeling). Schrijf per opdracht een kort, toetsbaar modelantwoord met bronverwijzing (URL of bijlage-naam + pag./sectie).${videoRegel}

REGELS
- Taal: Nederlands. Kort en eenduidig. Geen meta-uitleg of extra tekst buiten de CSV.
- Media: links naar websites/afbeeldingen/video's zijn toegestaan in de antwoordsleutel; de app embedt automatisch.
- Tijdslimiet: alleen invullen als functioneel nodig (getal in seconden).
- Extra_Punten (max 2): 0–2, alleen als gerechtvaardigd.
- Type moet uit de geselecteerde lijst komen${geselecteerdeTypes.length ? '' : ' of anders een geschikt type uit de app-lijst'}. Tekenen ∈ {${effectieveTekenenStatuses.join(', ')}}.
- Kwaliteit: geen duplicaten, geen hallucinaties, bronverwijzing verplicht.

OUTPUT (CSV, geen Markdown, exact deze header)
Hoofdcategorie,Categorie,Type,Tekenen,Opdracht,Antwoordsleutel,Tijdslimiet,Extra_Punten (max 2),Niveau,Casus

Controleer intern: (1) aantallen per subcategorie kloppen, (2) alleen toegestane "Tekenen"-waarden, (3) types conform restrictie, (4) elke rij citeert bron. Geef daarna uitsluitend de CSV-rijen terug.`;
  };

  const handleCopyPrompt = async () => {
    const prompt = generatePromptCompact();
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
          <div className="ai-generator-section" ref={stepSectionRefs[1]}>
            <h4 ref={stepHeaderRefs[1]} onClick={() => handleToggleStep(1)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Stap 1: Vul de parameters in</span>
              <span style={{ marginLeft: 'auto' }}>{openStep === 1 ? '▾' : '▸'}</span>
              <span aria-label="status stap 1">{(onderwerpBeschrijving.trim() && studentNiveau) ? '✅' : '⚠️'}</span>
            </h4>
            <div style={{ display: openStep === 1 ? 'block' : 'none' }}>
            <p className="instruction-text">
              De waarden hieronder (hoofdcategorie, onderwerp-beschrijving, aantal, studentniveau en eventuele subcategorieën) worden automatisch verwerkt in de prompt die je in stap 6 kunt kopiëren.
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
                  <strong>Uitleg:</strong> Kies het studiejaar van de studenten waarvoor je opdrachten wilt genereren. Dit helpt de AI om de complexiteit en diepgang van de opdrachten aan te passen aan het kennisniveau. <strong>Verplicht veld.</strong>
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
            
            {/* Blokken voor Opdracht types en Tekenen‑status verplaatst naar nieuwe Stap 3 */}
                </div>
                </div>
                

          <div className="ai-generator-section" ref={stepSectionRefs[2]}>
            <h4 ref={stepHeaderRefs[2]} onClick={() => handleToggleStep(2)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Stap 2: Kies hoe de AI moet genereren</span>
              <span style={{ marginLeft: 'auto' }}>{openStep === 2 ? '▾' : '▸'}</span>
              <span aria-label="status stap 2">{(bronKeuze === 'model') || (bronKeuze !== ('model' as BronKeuze) && addedLinks.length > 0) ? '✅' : 'ℹ️'}</span>
            </h4>
            <div style={{ display: openStep === 2 ? 'block' : 'none' }}>
            <p className="instruction-text">
              Kies hieronder of de AI puur op het taalmodel genereert, of (ook) op basis van video/links/documenten. Afhankelijk van je keuze verschijnen passende velden.
            </p>
            <div style={{ margin: '8px 0 16px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="bronKeuze" value="model" checked={bronKeuze === 'model'} onChange={() => setBronKeuze('model')} />
                Alleen taalmodel
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="bronKeuze" value="video" checked={bronKeuze === 'video'} onChange={() => setBronKeuze('video')} />
                Video‑links
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="bronKeuze" value="bronnen" checked={bronKeuze === 'bronnen'} onChange={() => setBronKeuze('bronnen')} />
                Bronnen/links
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="bronKeuze" value="mix" checked={bronKeuze === 'mix'} onChange={() => setBronKeuze('mix')} />
                Mix
              </label>
            </div>
            <p className="instruction-text">
              {bronKeuze === 'model' ? 'De AI gebruikt alleen zijn interne kennis. Tip: voor hogere kwaliteit kun je alsnog bronnen toevoegen in de onderstaande secties.' : 'Voeg relevante bronnen toe. Deze worden meegenomen in de prompt en antwoordsleutels.'}
            </p>
            { (bronKeuze === 'video' || bronKeuze === 'bronnen' || bronKeuze === 'mix') && (
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
                <span>YouTube/kennisclips (met tijdstempel: <strong>youtu.be</strong> met <code>?t=…</code> of <code>?start=…</code>; bij <strong>watch</strong>-URL gebruik <code>&t=…</code> of <code>&start=…</code>. Vimeo: <code>#t=…s</code>)</span>
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
            )}
            { (bronKeuze === 'video' || bronKeuze === 'bronnen' || bronKeuze === 'mix') && (
            <p className="instruction-text">
              Dit is optioneel. Zonder bronnen zal het taalmodel zijn eigen kennis gebruiken.
              Dat werkt vaak prima, maar verhoogt de kans op bias en hallucinaties. Controleer
              de inhoud dan extra kritisch en voeg bij voorkeur toch concrete bronnen toe.
              <strong>Tip:</strong> Gebruik de link functionaliteit hieronder om video's, afbeeldingen en websites toe te voegen die automatisch in de prompt worden meegenomen.
            </p>
            )}
            { (bronKeuze === 'bronnen' || bronKeuze === 'mix') && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#2d3748', 
              borderRadius: '6px', 
              border: '1px solid #4a5568',
              borderLeft: '4px solid #4299e1'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                <input
                  type="checkbox"
                  checked={useBronnenExpliciet}
                  onChange={(e) => setUseBronnenExpliciet(e.target.checked)}
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                <span>AI moet expliciet uit opgegeven bronnen genereren</span>
              </label>
              <p style={{ 
                margin: '8px 0 0 0', 
                color: '#a0aec0', 
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                {useBronnenExpliciet 
                  ? 'De AI zal alleen de toegevoegde bronnen en links gebruiken als basis voor opdrachten en antwoordsleutels. Geen algemene kennis die niet in deze bronnen voorkomt.'
                  : 'De AI kan zowel de toegevoegde bronnen als algemene kennis gebruiken voor het genereren van opdrachten.'
                }
              </p>
            </div>
            )}
            { bronKeuze !== 'model' && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              backgroundColor: '#2d3748', 
              borderRadius: '8px', 
              border: '1px solid #4a5568',
              borderLeft: '4px solid #48bb78'
            }}>
              <h5 style={{ 
                margin: '0 0 12px 0', 
                color: '#48bb78', 
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔗 Voeg video- en afbeeldingslinks toe
              </h5>
              <p style={{ 
                margin: '0 0 16px 0', 
                color: '#cbd5e0', 
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Voeg hier links toe naar video's en afbeeldingen die gebruikt kunnen worden in de opdrachten. 
                Deze links worden automatisch meegenomen in de prompt die je later kunt kopiëren.
              </p>

              {/* Link input sectie */}
              <div style={{ marginBottom: '16px' }}>
                <div className="link-input-container">
                  <input
                    type="text"
                    placeholder="Plak hier je link (YouTube, Vimeo, afbeelding, website)..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddLink();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddLink}
                    disabled={!linkInput.trim()}
                    className="link-add-button"
                  >
                    Voeg toe
                  </button>
                </div>
                
                {/* Link type indicator */}
                {linkInput && (
                  <div className="link-type-indicator">
                    <span>Type:</span>
                    {(() => {
                      const url = linkInput.toLowerCase();
                      if (url.includes('youtube.com') || url.includes('youtu.be')) {
                        return <span style={{ color: '#f56565' }}>🎬 YouTube video</span>;
                      } else if (url.includes('vimeo.com')) {
                        return <span style={{ color: '#4299e1' }}>🎬 Vimeo video</span>;
                      } else if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                        return <span style={{ color: '#48bb78' }}>🖼️ Afbeelding</span>;
                      } else if (url.startsWith('http')) {
                        return <span style={{ color: '#ed8936' }}>🌐 Website</span>;
                      } else {
                        return <span style={{ color: '#a0aec0' }}>❓ Onbekend</span>;
                      }
                    })()}
                  </div>
                )}
              </div>

              {/* Toegevoegde links lijst */}
              {addedLinks.length > 0 && (
                <div>
                  <h6 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#e2e8f0', 
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    Toegevoegde links ({addedLinks.length}):
                  </h6>
                  <div className="links-list">
                    {addedLinks.map((link, index) => (
                      <div key={index} className="link-item">
                        <span className="link-icon" style={{ 
                          color: (() => {
                            const url = link.toLowerCase();
                            if (url.includes('youtube.com') || url.includes('youtu.be')) return '#f56565';
                            if (url.includes('vimeo.com')) return '#4299e1';
                            if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return '#48bb78';
                            return '#ed8936';
                          })()
                        }}>
                          {(() => {
                            const url = link.toLowerCase();
                            if (url.includes('youtube.com') || url.includes('youtu.be')) return '🎬';
                            if (url.includes('vimeo.com')) return '🎬';
                            if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return '🖼️';
                            return '🌐';
                          })()}
                        </span>
                        <span className="link-text">
                          {link}
                        </span>
                        <button
                          onClick={() => handleRemoveLink(index)}
                          className="link-remove-button"
                          title="Verwijder link"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips sectie */}
              <div className="links-tips">
                <h6>
                  💡 Tips voor het gebruik van links:
                </h6>
                <ul>
                  <li>
                    <strong>YouTube:</strong> Gebruik de link uit de adresbalk (niet de deel-link). De app leest automatisch video ID en titel uit.
                  </li>
                  <li>
                    <strong>Transcripties:</strong> Voor video's met timestamps wordt automatisch een transcriptie meegenomen in de prompt.
                  </li>
                  <li>
                    <strong>Afbeeldingen:</strong> Ondersteunde formaten: .png, .jpg, .jpeg, .gif, .webp, .svg
                  </li>
                  <li>
                    <strong>Websites:</strong> Normale klikbare links die in antwoordsleutels worden getoond.
                  </li>
                </ul>
              </div>
            </div>
            )}
          </div>
            </div>

          {/* Nieuwe Stap 3: Kies opdrachttypes en Tekenen‑status (verplaatst onder Stap 2) */}
          <div className="ai-generator-section">
            <h4 onClick={() => setOpenStep(openStep === 3 ? null : 3)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Stap 3: Kies vraagtypen en Tekenen‑status</span>
              <span style={{ marginLeft: 'auto' }}>{openStep === 3 ? '▾' : '▸'}</span>
              <span aria-label="status stap 3">{geselecteerdeTypes.length > 0 ? '✅' : '⚠️'}</span>
            </h4>
            <div style={{ display: openStep === 3 ? 'block' : 'none' }}>
            <p className="instruction-text">
              Selecteer welke opdrachttypes en welke Tekenen‑status de AI moet genereren. Deze instellingen worden meegenomen in de prompt.
            </p>

            {/* Opdracht types blok */}
            <div className="form-group">
              <div style={{ marginTop: 12, padding: '16px', backgroundColor: '#2d3748', borderRadius: '8px', border: '1px solid #4a5568' }}>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
                    Opdracht types (meerdere mogelijk):
                  </label>
                  {geselecteerdeTypes.length > 0 && (
                    <span style={{ backgroundColor: '#4CAF50', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      {geselecteerdeTypes.length} geselecteerd
                    </span>
                  )}
                </div>
                <div className="instruction-text" style={{ marginBottom: 12 }}>
                  <strong>Uitleg:</strong> Vink de typen aan die je wilt laten genereren. <strong>Tip:</strong> Kies maximaal 2-3 types tegelijk voor betere output.
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={toggleAlleTypesUitklappen}
                    style={{ backgroundColor: alleTypesUitgeklapt ? '#e53e3e' : '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title={alleTypesUitgeklapt ? 'Klik om alle types in te klappen' : 'Klik om alle types uit te klappen'}
                  >
                    {alleTypesUitgeklapt ? '🔽 Alles inklappen' : '🔼 Alles uitklappen'}
                  </button>
                </div>
                <ul className="type-list">
                  {BESCHIKBARE_TYPES.map((t) => (
                    <li key={t} className={`type-item ${geselecteerdeTypes.includes(t) ? 'selected' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <label style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="checkbox" checked={geselecteerdeTypes.includes(t)} onChange={() => toggleType(t)} style={{ cursor: 'pointer' }} />
                          <span className="type-title" style={{ cursor: 'pointer' }} onClick={() => toggleType(t)}>
                            <span className="type-icon" aria-hidden>{opdrachtTypeIconen[t] || '❓'}</span>
                            {t}
                          </span>
                        </label>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', backgroundColor: (openTypeUitleg === t || openTypeUitleg === 'all') ? '#4a5568' : 'transparent', transition: 'background-color 0.2s' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openTypeUitleg === 'all') {
                              setOpenTypeUitleg(null);
                              setAlleTypesUitgeklapt(false);
                            } else {
                              setOpenTypeUitleg(openTypeUitleg === t ? null : t);
                            }
                          }}
                          title="Klik voor uitleg en voorbeelden"
                        >
                          <span style={{ fontSize: '12px', transition: 'transform 0.2s', transform: (openTypeUitleg === t || openTypeUitleg === 'all') ? 'rotate(90deg)' : 'rotate(0deg)', color: '#a0aec0' }}>▶</span>
                        </div>
                      </div>
                      {(openTypeUitleg === t || openTypeUitleg === 'all') && (
                        <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#1a202c', borderRadius: '6px', border: '1px solid #2d3748' }}>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#90cdf4', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📖 Definitie</div>
                            <div style={{ color: '#cbd5e0', fontSize: '13px', lineHeight: '1.5' }}>{TYPE_BESCHRIJVINGEN[t]}</div>
                          </div>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#90cdf4', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎯 Wat voor opdrachten vallen hieronder?</div>
                            <div style={{ color: '#a0aec0', fontSize: '12px', lineHeight: '1.5' }}>{TYPE_OPDRACHTEN_VOORBEELDEN[t]}</div>
                          </div>
                          <div>
                            <div style={{ color: '#90cdf4', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💡 Concrete voorbeelden</div>
                            <div style={{ color: '#a0aec0', fontSize: '12px', lineHeight: '1.4' }} />
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tekenen-status blok */}
            <div className="form-group">
              <div style={{ marginTop: 12, padding: '16px', backgroundColor: '#2d3748', borderRadius: '8px', border: '1px solid #4a5568' }}>
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
                      <p style={{ margin: '0 0 8px 0', color: '#e2e8f0' }}><strong>Standaardinstelling:</strong> alle drie categorieën.</p>
                      <p style={{ margin: '8px 0', color: '#cbd5e0' }}><strong>Als alle drie zijn geselecteerd:</strong> genereert de AI opdrachten uit alle categorieën.</p>
                      <p style={{ margin: '8px 0', color: '#cbd5e0' }}><strong>Als alleen Ja is geselecteerd:</strong> genereert de AI uitsluitend opdrachten waarbij tekenen verplicht is.</p>
                      <p style={{ margin: '8px 0', color: '#cbd5e0' }}><strong>Als alleen Mogelijk is geselecteerd:</strong> genereert de AI opdrachten waar tekenen optioneel is.</p>
                      <p style={{ margin: '8px 0', color: '#cbd5e0' }}><strong>Als alleen Nee is geselecteerd:</strong> genereert de AI opdrachten zonder tekenen.</p>
                    </div>
                  )}
                </div>
                <div className="tekenen-toggle-row">
                  <label><input type="checkbox" checked={allowTekenenJa} onChange={(e) => setAllowTekenenJa(e.target.checked)} />Expliciet tekenen (Ja)</label>
                  <label><input type="checkbox" checked={allowTekenenMogelijk} onChange={(e) => setAllowTekenenMogelijk(e.target.checked)} />Tekenen helpt (Mogelijk)</label>
                  <label><input type="checkbox" checked={allowTekenenNee} onChange={(e) => setAllowTekenenNee(e.target.checked)} />Zonder tekenen (Nee)</label>
                </div>
              </div>
            </div>
          </div>
            </div>

          <div className="ai-generator-section">
            <h4 onClick={() => setOpenStep(openStep === 4 ? null : 4)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Stap 4: Download bijlagen voor AI chatbot</span>
              <span style={{ marginLeft: 'auto' }}>{openStep === 4 ? '▾' : '▸'}</span>
            </h4>
            <div style={{ display: openStep === 4 ? 'block' : 'none' }}>
            <p className="instruction-text">
              Download de benodigde bijlagen om mee te geven aan je AI chatbot. Deze helpen de AI om de juiste structuur en niveau-indeling te begrijpen.
              <strong>Kies zelf welke bestanden je nodig hebt, maar download altijd:</strong>
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
              <button className="download-knop" onClick={handleDownloadTemplate}>
                📊 Download Excel Sjabloon
              </button>
              <button className="download-knop" onClick={generateNiveauBepalingPDF}>
                📋 Download Niveau Bepaling Instructies
              </button>
              <a 
                href="/Downloads/Instructie voor AI - Opdracht Types.pdf" 
                download="Instructie voor AI - Opdracht Types.pdf"
                className="download-knop"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                📚 Download Instructies per Opdrachttype
              </a>
            </div>

            <p className="instruction-text" style={{ marginTop: '16px', fontSize: '14px', color: '#a0aec0' }}>
              <strong>Excel sjablonen per vakgebied:</strong> Download Excel sjablonen die je aan de AI meegeeft om een goed voorbeeld te geven. 
              Dit maakt de kwaliteit van de output een stuk beter. Je kunt de sjablonen na downloaden nog aanpassen of verrijken 
              zodat de output meer op maat gemaakt wordt passend bij jouw wensen.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
              <button className="download-knop" onClick={handleDownloadTemplate}>
                📊 Sjabloon Algemeen
              </button>
              <button className="download-knop" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                🦴 Sjabloon Anatomie
              </button>
              <button className="download-knop" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                🫀 Sjabloon Pathfysiologie
              </button>
              <button className="download-knop" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                🏥 Sjabloon Fysiotherapie
              </button>
              <button className="download-knop" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                💬 Sjabloon Communicatie
              </button>
            </div>

            <p className="instruction-text" style={{ marginTop: '16px', fontSize: '14px', color: '#a0aec0' }}>
              <strong>Video met timestamps:</strong> Alleen nodig als je video bronnen gebruikt als basis voor het genereren van opdrachten. 
              De fruitautomaat kan automatisch timestamps toevoegen aan antwoordsleutels en bij ondersteunde formaten (zoals YouTube en Vimeo) 
              de video direct embedden op het relevante tijdstip.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
              <a 
                href="/Downloads/Instructie voor AI - Video met timestamps.pdf" 
                download="Instructie voor AI - Video met timestamps.pdf"
                className="download-knop"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                🎬 Download Video met Timestamps Instructie
              </a>
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
                <li><strong>Video met Timestamps Instructie:</strong> Uitleg over het gebruik van video bronnen met timestamps en automatische embedding</li>
                <li><strong>Excel Sjablonen:</strong> Vakspecifieke sjablonen die je aan de AI meegeeft voor betere output kwaliteit</li>
              </ul>
            </div>
          </div>
            </div>

          <div className="ai-generator-section">
            <h4 onClick={() => setOpenStep(openStep === 5 ? null : 5)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Stap 5: Kies je AI‑chatbot</span>
              <span style={{ marginLeft: 'auto' }}>{openStep === 5 ? '▾' : '▸'}</span>
            </h4>
            <div style={{ display: openStep === 5 ? 'block' : 'none' }}>
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
            </div>

          <div className="ai-generator-section">
            <h4 onClick={() => setOpenStep(openStep === 6 ? null : 6)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Stap 6: Kopieer de prompt</span>
              <span style={{ marginLeft: 'auto' }}>{openStep === 6 ? '▾' : '▸'}</span>
            </h4>
            <div style={{ display: openStep === 6 ? 'block' : 'none' }}>
            <p className="instruction-text">
              Klik op "Kopieer Prompt" om de gegenereerde prompt naar je klembord te kopiëren. 
              <strong>Let op:</strong> Je moet eerst het studentniveau selecteren in Stap 1 en ten minste één opdrachttype selecteren in Stap 3 voordat je de prompt kunt kopiëren.
              Plak deze vervolgens in je favoriete AI-tool (zoals ChatGPT, Claude, NotebookLM, etc.).
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0 12px' }}>
              <label htmlFor="promptVariant" style={{ color: '#e2e8f0', fontWeight: 'bold' }}>Prompt variant:</label>
              <select
                id="promptVariant"
                value={promptVariant}
                onChange={(e) => setPromptVariant(e.target.value as 'standaard' | 'video')}
                style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #4a5568', background: '#1a202c', color: '#e2e8f0' }}
              >
                <option value="standaard">Standaard</option>
                <option value="video">Video (timestamps)</option>
              </select>
            </div>
            <button 
              className="kopieer-knop"
              onClick={() => {
                if (!onderwerpBeschrijving.trim()) {
                  window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Vul eerst de onderwerp-beschrijving in (Stap 1).', type: 'error', timeoutMs: 6000 } }));
                  return;
                }
                if (!studentNiveau) {
                  window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Selecteer eerst het studentniveau voordat je de prompt kunt kopiëren.', type: 'error', timeoutMs: 6000 } }));
                  return;
                }
                if (geselecteerdeTypes.length === 0) {
                  window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Selecteer ten minste één opdrachttype voordat je de prompt kunt kopiëren.', type: 'error', timeoutMs: 6000 } }));
                  return;
                }
                handleCopyPrompt();
              }}
              disabled={!onderwerpBeschrijving.trim() || !studentNiveau || geselecteerdeTypes.length === 0}
            >
              Kopieer Prompt
            </button>
          </div>
            </div>

          <div className="ai-generator-section">
            <h4 onClick={() => setOpenStep(openStep === 7 ? null : 7)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Stap 7: Stappen in de AI‑chatbot</span>
              <span style={{ marginLeft: 'auto' }}>{openStep === 7 ? '▾' : '▸'}</span>
            </h4>
            <div style={{ display: openStep === 7 ? 'block' : 'none' }}>
            <ol className="steps-list">
              <li className="step-item">
                <span className="step-badge">1</span>
                <div className="step-content">
                  <strong>Bestanden toevoegen</strong>
                  <ul className="substeps-list">
                    <li className="substep-item"><span className="substep-badge">a</span><span>Sjabloon toevoegen.</span></li>
                    <li className="substep-item"><span className="substep-badge">b</span><span>Instructies voor niveau bepaling en opdracht types toevoegen (de gedownloade PDF's).</span></li>
                    <li className="substep-item"><span className="substep-badge">c</span><span>Br(on)nen toevoegen (indien van toepassing).</span></li>
                    <li className="substep-item"><span className="substep-badge">d</span><span>Links naar video's en afbeeldingen toevoegen via de link functionaliteit in Stap 2.</span></li>
                    <li className="substep-item"><span className="substep-badge">e</span><span>Controleer of het vinkje "AI moet expliciet uit opgegeven bronnen genereren" is aangevinkt (standaard aan).</span></li>
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
                    <li className="substep-item"><span className="substep-badge">a</span><span>Geef bijsturing: extra instructies, voorbeelden of specificaties.</span></li>
                    <li className="substep-item"><span className="substep-badge">b</span><span>Vraag om extra opdrachten of aanpassingen.</span></li>
                    <li className="substep-item"><span className="substep-badge">c</span><span>Wijzig opdrachten handmatig waar nodig.</span></li>
                    <li className="substep-item"><span className="substep-badge">d</span><span>Voeg links toe voor afbeeldingen/video's met timestamps in antwoordsleutels (of gebruik de link functionaliteit in Stap 2).</span></li>
                    <li className="substep-item"><span className="substep-badge">e</span><span>Controleer alles op juistheid, volledigheid en consistentie.</span></li>
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
                Valt het resultaat tegen? Maak het onderwerp concreter (subthema), selecteer maximaal 2-3 opdrachttypes tegelijk, en gebruik gerichte bronnen over hetzelfde onderwerp. 
                Hoe concreter, afgebakender en met toevoeging van relevante bronnen, hoe beter de output zal zijn. 
                Vage, heel uitgebreide onderwerpen zonder bronnen zullen eerder minder bruikbare of minder kwalitatieve output opleveren.
              </p>
            </div>
          </div>
            </div>

          <div className="ai-generator-section">
            <h4 onClick={() => setOpenStep(openStep === 8 ? null : 8)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Stap 8: Voeg opdrachten toe</span>
              <span style={{ marginLeft: 'auto' }}>{openStep === 8 ? '▾' : '▸'}</span>
            </h4>
            <div style={{ display: openStep === 8 ? 'block' : 'none' }}>
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