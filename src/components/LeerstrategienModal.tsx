import React from 'react';
import './Uitleg.css';

type Props = { isOpen: boolean; onClose: () => void };

export const LeerstrategienModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="uitleg-overlay" onClick={onClose}>
      <div className="uitleg-content" onClick={(e) => e.stopPropagation()}>
        <div className="uitleg-header">
          <h2>Leerstrategieën in deze app</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="uitleg-body">
          <p>Kort en toegepast op de Fruitautomaat. Gebruik deze strategieën bewust voor meer leerrendement.</p>

          <div className="strategy-section" id="retrieval-practice">
            <h4>🧠 Retrieval Practice (ophalen uit je geheugen)</h4>
            <ul>
              <li>Wat je hier doet: na de spin haal je het antwoord uit je <em>eigen</em> geheugen.</li>
              <li><strong>Let op:</strong> kijk niet te snel naar de antwoordsleutel. Herlezen voelt vertrouwd, maar ophalen is effectiever.</li>
              <li>Lukt het niet (nog niet)? Noteer de gap, check de sleutel of bronnen (video/boek/peer/AI) en probeer opnieuw.</li>
            </ul>
          </div>

          <div className="strategy-section" id="focus-pin">
            <h4>🎯 Focus (gaps gericht dichten)</h4>
            <ul>
              <li>Pin opdrachten met een gap en start daarna een <strong>focussessie</strong> (📌 → 🎯). Oefen ze kort erna opnieuw.</li>
              <li>Waarom werkt dit: snel opnieuw ophalen na verduidelijking versterkt het geheugenspoor enorm.</li>
            </ul>
          </div>

          <div className="strategy-section" id="spaced-repetition">
            <h4>⏳ Spaced Repetition (Leitner & vergeetcurve)</h4>
            <ul>
              <li>In Leitner gaan goede antwoorden naar een hogere box (langer interval), fouten één box terug.</li>
              <li>De footer toont “volgende herhaling” (vandaag/morgen/over X dagen). Vanaf B2 kun je sneller/later plannen.</li>
              <li>Tip: beoordeel eerlijk. Dat houdt de timing realistisch en voorkomt overbodige herhaling of te lange gaten.</li>
            </ul>
          </div>

          <div className="strategy-section" id="interleaving">
            <h4>🔀 Interleaving (mix van categorieën)</h4>
            <ul>
              <li>Selecteer meerdere gerelateerde categorieën tegelijk. De spin wisselt ze door elkaar.</li>
              <li>Waarom werkt dit: je leert schakelen tussen concepten en herkent overeenkomsten/verschillen beter.</li>
            </ul>
          </div>

          <div className="strategy-section" id="elaboration">
            <h4>💬 Elaboration (uitleggen/onderbouwen)</h4>
            <ul>
              <li>Leg je antwoord hardop uit. Verbind het met eerdere kennis en geef een kort voorbeeld uit de praktijk.</li>
              <li>In multiplayer: laat peers doorvragen. In single player: spreek het uit of schrijf 2 kernzinnen.</li>
            </ul>
          </div>

          <div className="strategy-section" id="feedback">
            <h4>🧩 Feedback (sleutel/AI/peer)</h4>
            <ul>
              <li>Vergelijk pas na je poging met de antwoordsleutel. Vraag peers of AI om gerichte feedback op je <em>uitleg</em>.</li>
              <li>Gebruik feedback om een gap te pinnen en snel te herhalen (zie Focus).</li>
            </ul>
          </div>

          <div className="strategy-section" id="toetsing">
            <h4>✅ Toetsing (formatief)</h4>
            <ul>
              <li>Beoordeel eerlijk: Heel goed / Redelijk / Niet goed. Dit stuurt je Leitner-timing en je volgende focus.</li>
              <li>Maak aan het einde gebruik van de leeranalyse om progressie en aandachtspunten te zien.</li>
            </ul>
          </div>

          <div className="strategy-section" id="zelfsturend">
            <h4>🧭 Zelfsturend leren (leeranalyse)</h4>
            <ul>
              <li>Gebruik de leeranalyse om te zien wat je vaak fout/goed doet en plan je volgende sessie bewust.</li>
              <li>Pas categorieën aan op basis van je data. Minder sterke onderwerpen vaker in de mix (interleaving).</li>
            </ul>
          </div>

          <div className="strategy-section" id="gamification">
            <h4>🏅 Gamification</h4>
            <ul>
              <li>Score, achievements en spelelementen houden je gemotiveerd, maar de kern blijft: <strong>eerlijk ophalen en uitleggen</strong>.</li>
            </ul>
          </div>

          <p style={{ marginTop: 8 }}>Later voegen we linkjes toe vanaf tips in de leermodus naar deze specifieke secties.</p>
        </div>
      </div>
    </div>
  );
};


