import { SYMBOLEN } from '../data/constants';
import './Uitleg.css';

interface UitlegProps {
  isOpen: boolean;
  onClose: () => void;
}

const bonusCombinaties = [
  { naam: 'Twee Kersen', symbolen: ['🍒', '🍒', '🍉'], beschrijving: '+1 bonuspunt' },
  { naam: 'Drie Kersen', symbolen: ['🍒', '🍒', '🍒'], beschrijving: '+3 bonuspunten' },
  { naam: 'Drie Citroenen', symbolen: ['🍋', '🍋', '🍋'], beschrijving: '+3 bonuspunten' },
  { naam: 'Drie Meloenen', symbolen: ['🍉', '🍉', '🍉'], beschrijving: '+5 bonuspunten' },
  { naam: 'Drie Lucky 7s', symbolen: ['7️⃣', '7️⃣', '7️⃣'], beschrijving: '+7 bonuspunten' },
  { naam: 'Drie Bellen', symbolen: ['🔔', '🔔', '🔔'], beschrijving: 'Verdubbel je punten met Kop of Munt.' },
  { naam: 'Drie Vraagtekens', symbolen: ['❓', '❓', '❓'], beschrijving: 'Speel een bonusopdracht voor extra punten. (Alleen bij 3+ spelers, anders 1-10 willekeurige punten)' },
  { naam: 'Drie Jokers', symbolen: ['🃏', '🃏', '🃏'], beschrijving: 'Kies een partner en krijg beiden 5 bonuspunten. (Alleen bij 3+ spelers, anders 5 punten)' },
];

const getSymbolData = (symbool: string) => {
  return SYMBOLEN.find(s => s.symbool === symbool);
};

export const Uitleg = ({ isOpen, onClose }: UitlegProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="uitleg-overlay" onClick={onClose}>
      <div className="uitleg-content" onClick={(e) => e.stopPropagation()}>
        <div className="uitleg-header">
          <h2>Uitleg & Toepassing</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="uitleg-body">
          <h4>Wat is de Fruitautomaat?</h4>
          <p>
            De Fruitautomaat is een interactieve studietool die het leren leuker maakt door een spelelement toe te voegen. Met één trek aan de hendel worden willekeurig een opdracht, een categorie en een speler geselecteerd. Het is een leuke manier om kennis en vaardigheden te oefenen, zowel voor de fun als voor serieuze studie.
          </p>
          <p>
            Door regelmatig te spelen maak je gebruik van sterke leerstrategieën zoals <strong>retrieval practice</strong> (actief ophalen van kennis), <strong>spaced repetition</strong> (verspreide herhaling) en <strong>elaboratie</strong> (verdieping door uitleg). De discussies die kunnen ontstaan tijdens het spelen dragen ook bij aan een beter begrip en langdurige kennisretentie.
          </p>

          <h4>Spelmodi</h4>
          <p>
            De Fruitautomaat ondersteunt twee hoofdspelmodi:
          </p>
          <ul>
            <li>
              <strong>Single Player:</strong> Speel alleen met drie verschillende modi:
              <ul>
                <li><strong>🏆 Highscore Modus:</strong> Competitieve modus met punten en highscores. Perfect voor het verbeteren van je records en competitief leren.</li>
                <li><strong>📚 Vrije Leermodus:</strong> Focus op leren zonder punten. Geen data opslag - perfect voor snelle leersessies en eenvoudige herhaling.</li>
                <li><strong>🔄 Leitner Leer Modus:</strong> Geavanceerde leer modus met het Leitner-systeem voor effectieve herhaling van opdrachten.</li>
              </ul>
            </li>
            <li><strong>Multiplayer:</strong> Speel met meerdere spelers en vergelijk je prestaties. Ideaal voor groepslessen en competitief leren. Alle gegevens worden direct verwijderd bij het verversen van de pagina.</li>
          </ul>
          <p>
            <strong>Let op:</strong> Bonusopdrachten (???) en partner hulp inschakelen (🃏🃏🃏) zijn alleen beschikbaar bij 3 of meer spelers.
          </p>

          <h4>Beoordeling & Fair Play</h4>
          <p>
            <strong>Multiplayer:</strong> Je medestudenten zijn de jury. Zij beoordelen je prestaties en bonusopdrachten. Fair play staat bovenaan - have fun maar gedraag je als professionals.
          </p>
          <p>
            <strong>Single Player:</strong> Je beoordeelt jezelf. Doe dit zo eerlijk mogelijk voor een betrouwbare meting van je voortgang.
          </p>
          <p>
            <strong>Human in the Loop:</strong> De app is een hulpmiddel, maar menselijke beoordeling blijft cruciaal. Dit geldt zeker bij zelf toegevoegde opdrachten en gebruik van de AI-generator. Controleer altijd de kwaliteit en relevantie van opdrachten.
          </p>

          <h4>Data Opslag & Privacy</h4>
          <p>
            <strong>Single Player:</strong>
          </p>
          <ul>
            <li><strong>🏆 Highscore Modus:</strong> Je records en persoonlijke bests worden opgeslagen in je browser. Bonusopdrachten zijn niet beschikbaar.</li>
            <li><strong>📚 Vrije Leermodus:</strong> Geen data opslag - perfect voor snelle leersessies zonder herhalingen of opslag.</li>
            <li><strong>🔄 Leitner Leer Modus:</strong> Geavanceerde leerdata inclusief herhalingsschema's en progressie worden opgeslagen voor optimale leerervaring.</li>
          </ul>
          <p>
            <strong>Multiplayer:</strong> Alle gegevens worden direct verwijderd bij het verversen van de pagina. Bonusopdrachten kunnen lokaal worden opgeslagen zodat ze niet verloren gaan bij refresh.
          </p>
          <p>
            <strong>Privacy:</strong> Alle lokaal opgeslagen gegevens (records, bests, bonusopdrachten, leerdata) worden alleen in je browser bewaard en niet gedeeld. Je kunt deze altijd verwijderen via de instellingen onder "Data Beheer".
          </p>

          <h4>Leermodi & Leeranalyse</h4>
          <p>
            <strong>Vrije Leermodus:</strong> In single player mode kun je de Vrije Leermodus activeren via de instellingen. In deze modus worden geen punten gegeven en geen data opgeslagen. Perfect voor snelle leersessies en eenvoudige herhaling.
          </p>
          <p>
            Tip: bekijk ook de korte uitleg over de gebruikte <button className="link-button" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('openLeerstrategien')); }}>leerstrategieën</button> in deze app.
          </p>
          <p>
            <strong>Leitner Leermodus:</strong> Geavanceerde leermodus met het Leitner-systeem voor effectieve herhaling van opdrachten. Je leeractiviteiten worden lokaal opgeslagen voor analyses en certificaten. Dit omvat welke opdrachten je hebt voltooid, hoe je jezelf hebt beoordeeld, en de tijd die je hebt genomen.
          </p>
          <p>
            <strong>Leeranalyse:</strong> Via de leeranalyse functie kun je inzicht krijgen in hoe je leert en verbetert (alleen beschikbaar in Leitner modus). Je kunt je voortgang bekijken, patronen herkennen in je leerproces, en zien welke categorieën je sterker of zwakker vindt. Dit helpt je om je studiestrategieën te optimaliseren.
          </p>
          <p>
            <strong>Certificaat Generatie:</strong> Binnenkort kun je een certificaat genereren op basis van je leeractiviteiten (alleen beschikbaar in Leitner modus). Dit certificaat toont je inzet, voortgang en ontwikkeling, en kun je gebruiken in je portfolio om te laten zien hoe je systematisch werkt aan je professionele ontwikkeling.
          </p>

          <h4>Leitner Boxen (Spaced Repetition)</h4>
          <p>
            In de Leitner-leermodus wordt elke opdracht in een box geplaatst. Hoe hoger de box, hoe langer de pauze tot de volgende herhaling. Een goed antwoord promoveert meestal één box; een onvoldoende antwoord degradeert één box. De volgende herhaling kan je in de pauze-footer sneller of later plannen (vanaf Box 2).
          </p>
          <table className="leitner-tabel">
            <thead>
              <tr>
                <th>Box</th>
                <th>Interval (normaal)</th>
                <th>Effect beoordeling</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>B0</td><td>10 min</td><td>Goed: naar B1 • Niet goed: blijft of naar B0</td></tr>
              <tr><td>B1</td><td>1 dag</td><td>Goed: naar B2 • Niet goed: naar B0</td></tr>
              <tr><td>B2</td><td>2 dagen</td><td>Goed: naar B3 • Niet goed: naar B1</td></tr>
              <tr><td>B3</td><td>4 dagen</td><td>Goed: naar B4 • Niet goed: naar B2</td></tr>
              <tr><td>B4</td><td>7 dagen</td><td>Goed: naar B5 • Niet goed: naar B3</td></tr>
              <tr><td>B5</td><td>14 dagen</td><td>Goed: naar B6 • Niet goed: naar B4</td></tr>
              <tr><td>B6</td><td>45 dagen</td><td>Goed: naar B7 • Niet goed: naar B5</td></tr>
              <tr><td>B7</td><td>—</td><td>Doelbox (geen geplande herhaling)</td></tr>
            </tbody>
          </table>
          <ul>
            <li><strong>Sneller/Later:</strong> vanaf B2 kun je in de footer de volgende herhaling vervroegen of uitstellen met ongeveer de helft van het normale interval.</li>
            <li><strong>Volgende herhaling:</strong> tekst zoals “morgen”, “over X uur/dagen”, of “nu beschikbaar”.</li>
            <li><strong>Pin & Focus:</strong> pin opdrachten om ze direct achter elkaar te oefenen in een focussessie.</li>
          </ul>



          <h4>Portfolio & de VRAAK-methode</h4>
          <p>
            Deze app is ook een krachtig hulpmiddel voor je portfolio. Omdat je van tevoren niet weet welke opdracht je krijgt, is de situatie zeer authentiek. Dit sluit perfect aan bij de <strong>VRAAK-methode</strong> voor effectieve feedback:
          </p>
          <ul>
            <li><strong>Authenticiteit:</strong> De onvoorspelbaarheid van de opdracht zorgt voor een realistische, authentieke situatie, zeker met een externe feedbackgever erbij.</li>
            <li><strong>Tip:</strong> Voeg de uitgevoerde opdracht en de ontvangen feedback direct toe als datapunt in je eJournal. Dit creëert een zeer waardevol en concreet bewijsstuk van je ontwikkeling.</li>
            <li><strong>Relevantie & Kwantiteit:</strong> Door veel verschillende categorieën aan te vinken, vergroot je de variatie (Kwantiteit) en de kans op onderwerpen die voor jou relevant zijn (Relevantie).</li>
          </ul>

          <div className="bonus-info-sectie">
            <h4>Bonuspunten & Speciale Combinaties</h4>
            <p>Draai drie dezelfde symbolen op de fruitautomaat voor een beloning! Een Joker telt als elk ander symbool.</p>
            <ul className="bonus-lijst">
              {bonusCombinaties.map(combo => (
                <li key={combo.naam} className="bonus-item">
                  <div className="symbolen-container">
                    {combo.symbolen.map((sym, index) => {
                      const symbolData = getSymbolData(sym);
                      return (
                        <div key={index} className="symbool-wrapper">
                          {symbolData?.img ? (
                            <img src={symbolData.img} alt={symbolData.naam} className="uitleg-symbool-img" />
                          ) : (
                            <span className={`uitleg-symbool-text ${symbolData?.className || ''}`}>{sym}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="combo-beschrijving">
                    <strong>{combo.naam}:</strong> {combo.beschrijving}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="han-logo-container-uitleg">
            <img src="/images/Logo-HAN.webp" alt="Logo Hogeschool van Arnhem en Nijmegen" className="han-logo" />
            <p>Deze fruitautomaat is ontwikkeld door de opleiding Fysiotherapie van de Hogeschool van Arnhem en Nijmegen.</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 