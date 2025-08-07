import React from 'react';
import { getLeerDataManager } from '../../data/leerDataManager';
import type { TabProps } from './LeeranalyseTypes';
import { formatNumber } from './LeeranalyseUtils';

interface OverzichtTabProps extends TabProps {
  showInfoModal: (title: string, content: string) => void;
  formatTijd: (seconds: number) => string;
}

const OverzichtTab: React.FC<OverzichtTabProps> = ({ 
  leerData, 
  showInfoModal, 
  formatTijd 
}) => {
  if (!leerData) {
    return (
      <div className="geen-data">
        <p>Geen leerdata beschikbaar.</p>
      </div>
    );
  }

  const leerDataManager = getLeerDataManager();
  const modusStats = leerDataManager.getStatistiekenPerModus();
  const highlights = leerDataManager.getPrestatieHighlights();
  const hoofdcategorieStatistieken = leerDataManager.getHoofdcategorieStatistieken();
  
  // Bereken opdrachten per modus
  const normaalOpdrachten = leerDataManager.getOpdrachtenPerModus('normaal');
  const leitnerOpdrachten = leerDataManager.getOpdrachtenPerModus('leitner');
  
  // Bereken hoofdcategorieën statistieken
  const geprobeerdeHoofdcategorieen = Object.values(hoofdcategorieStatistieken).filter((hc: any) => 
    hc.subCategorieen.some((sc: any) => sc.aantalOpdrachten > 0)
  ).length;
  const totaalHoofdcategorieen = Object.keys(hoofdcategorieStatistieken).length;
  
  // Bereken subcategorieën statistieken
  const alleSubcategorieen = Object.values(hoofdcategorieStatistieken).flatMap((hc: any) => hc.subCategorieen);
  const geprobeerdeSubcategorieen = alleSubcategorieen.filter((sc: any) => sc.aantalOpdrachten > 0).length;
  const totaalSubcategorieen = alleSubcategorieen.length;

  return (
    <div className="overzicht-tab">
      {/* Info Box */}
      <div className="leeranalyse-info-box">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h4>
            Over deze leeranalyse
            <button 
              className="info-knop" 
              onClick={() => showInfoModal(
                'ℹ️ Over deze leeranalyse',
                `Deze leeranalyse toont uw voortgang, prestaties en leerpatronen. Gebruik de verschillende tabs om specifieke aspecten van uw leerproces te verkennen.`
              )}
            >
              ℹ️
            </button>
          </h4>
          <p>Deze leeranalyse toont je prestaties van <strong>Leer Modus sessies</strong>. Highscore Modus en multiplayer data worden niet meegenomen in deze analyse.</p>
        </div>
      </div>

      {/* Spelmodus Overzicht */}
      <div className="spelmodus-overzicht">
        <h3>🎮 Spelmodus Overzicht</h3>
        <div className="spelmodus-grid">
          <div className="spelmodus-card leermodus">
            <h4>📚 Vrije Leermodus</h4>
            <div className="modus-statistieken">
              <p><strong>Sessies:</strong> {modusStats.normaal.sessies}</p>
              <p><strong>Gemiddelde score:</strong> {formatNumber(modusStats.normaal.gemiddeldeScore)}/5</p>
              <p><strong>Speeltijd:</strong> {formatTijd(modusStats.normaal.speeltijd)}</p>
              <p><strong>Categorieën:</strong> {modusStats.normaal.categorieen.length}</p>
            </div>
          </div>
          <div className="spelmodus-card leitner">
            <h4>🔄 Leitner Leer Modus</h4>
            <div className="modus-statistieken">
              <p><strong>Sessies:</strong> {modusStats.leitner.sessies}</p>
              <p><strong>Gemiddelde score:</strong> {formatNumber(modusStats.leitner.gemiddeldeScore)}/5</p>
              <p><strong>Speeltijd:</strong> {formatTijd(modusStats.leitner.speeltijd)}</p>
              <p><strong>Categorieën:</strong> {modusStats.leitner.categorieen.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verbeterde Statistiek Cards */}
      <div className="statistieken-grid">
        <div className="statistiek-card">
          <div className="statistiek-card-header">
            <h3>🔥 Streak</h3>
            <button 
              className="info-knop" 
              title="Aantal opeenvolgende dagen actief"
              onClick={() => showInfoModal(
                '🔥 Streak',
                'Het aantal opeenvolgende dagen dat je actief bent geweest. Streaks motiveren om dagelijks te oefenen en consistent te blijven.'
              )}
            >
              ℹ️
            </button>
          </div>
          <p className="statistiek-waarde">
            {highlights.streak.dagen} dag{highlights.streak.dagen !== 1 ? 'en' : ''}
          </p>
          <p className="statistiek-context">
            {highlights.streak.dagen > 0 ? 'Actief' : 'Niet actief'}
          </p>
        </div>

        <div className="statistiek-card">
          <div className="statistiek-card-header">
            <h3>🏷️ Hoofd-categorieën</h3>
            <button 
              className="info-knop" 
              title="Aantal hoofdcategorieën met opdrachten"
              onClick={() => showInfoModal(
                '🏷️ Hoofdcategorieën',
                'Het aantal hoofdcategorieën waar je al opdrachten hebt gedaan, vergeleken met het totale aantal beschikbare hoofdcategorieën.'
              )}
            >
              ℹ️
            </button>
          </div>
          <p className="statistiek-waarde">
            {geprobeerdeHoofdcategorieen}/{totaalHoofdcategorieen}
          </p>
          <p className="statistiek-context">
            Hoofdcategorieën met opdrachten gedaan
          </p>
        </div>

        <div className="statistiek-card">
          <div className="statistiek-card-header">
            <h3>📂 Sub-categorieën</h3>
            <button 
              className="info-knop" 
              title="Aantal subcategorieën met opdrachten"
              onClick={() => showInfoModal(
                '📂 Subcategorieën',
                'Het aantal subcategorieën waar je al opdrachten hebt gedaan, vergeleken met het totale aantal beschikbare subcategorieën.'
              )}
            >
              ℹ️
            </button>
          </div>
          <p className="statistiek-waarde">
            {geprobeerdeSubcategorieen}/{totaalSubcategorieen}
          </p>
          <p className="statistiek-context">
            Subcategorieën met opdrachten gedaan
          </p>
        </div>

        <div className="statistiek-card">
          <div className="statistiek-card-header">
            <h3>📚 Totaal Opdrachten</h3>
            <button 
              className="info-knop" 
              title="Totaal aantal voltooide opdrachten"
              onClick={() => showInfoModal(
                '📚 Totaal Opdrachten',
                'Het totale aantal opdrachten dat je hebt voltooid. Dit getal is gebaseerd op alle opdrachten die je hebt afgerond, ongeacht in welke modus.'
              )}
            >
              ℹ️
            </button>
          </div>
          <p className="statistiek-waarde">
            {leerData.statistieken.totaalOpdrachten}/{leerDataManager.getTotaalBeschikbareOpdrachten()}
          </p>
          <p className="statistiek-context">
            Vrije Leermodus: {normaalOpdrachten} opdrachten, Leitner: {leitnerOpdrachten} opdrachten
          </p>
        </div>

        <div className="statistiek-card">
          <div className="statistiek-card-header">
            <h3>🎮 Totaal Sessies</h3>
            <button 
              className="info-knop" 
              title="Totaal aantal voltooide sessies"
              onClick={() => showInfoModal(
                '🎮 Totaal Sessies',
                'Het aantal keer dat je een leer-sessie hebt afgerond. Alleen sessies die volledig zijn voltooid worden geteld.'
              )}
            >
              ℹ️
            </button>
          </div>
          <p className="statistiek-waarde">{leerData.statistieken.totaalSessies}</p>
          <p className="statistiek-context">
            Vrije Leermodus: {modusStats.normaal.sessies} sessies, Leitner: {modusStats.leitner.sessies} sessies
          </p>
        </div>

        <div className="statistiek-card">
          <div className="statistiek-card-header">
            <h3>⏱️ Totaal Speeltijd</h3>
            <button 
              className="info-knop" 
              title="Totaal speeltijd in alle sessies"
              onClick={() => showInfoModal(
                '⏱️ Totaal Speeltijd',
                'De totale tijd die je hebt besteed aan het leren in alle voltooide sessies.'
              )}
            >
              ℹ️
            </button>
          </div>
          <p className="statistiek-waarde">{formatTijd(leerData.statistieken.totaalSpeeltijd)}</p>
          <p className="statistiek-context">
            Vrije Leermodus: {formatTijd(modusStats.normaal.speeltijd)}, Leitner: {formatTijd(modusStats.leitner.speeltijd)}
          </p>
        </div>

        <div className="statistiek-card">
          <div className="statistiek-card-header">
            <h3>📊 Gemiddelde Score</h3>
            <button 
              className="info-knop" 
              title="Gemiddelde score over alle opdrachten"
              onClick={() => showInfoModal(
                '📊 Gemiddelde Score',
                'Je gemiddelde score over alle opdrachten die je hebt voltooid (schaal van 0-5). Dit is een zelfscore en moet in context geplaatst worden. Het gaat om leren en herhalen. Bij veel nieuwe opdrachten over een onderwerp waar je nog weinig van weet zal de score laag zijn. Maar na een aantal herhalingen in leitner boxen wordt de score steeds hoger.'
              )}
            >
              ℹ️
            </button>
          </div>
          <p className="statistiek-waarde">{formatNumber(leerData.statistieken.gemiddeldeScore)}/5</p>
          <p className="statistiek-context">
            Vrije Leermodus: {formatNumber(modusStats.normaal.gemiddeldeScore)}, Leitner: {formatNumber(modusStats.leitner.gemiddeldeScore)}
          </p>
        </div>

        <div className="statistiek-card">
          <div className="statistiek-card-header">
            <h3>📈 Vooruitgang</h3>
            <button 
              className="info-knop" 
              title="Verbetering in score over tijd"
              onClick={() => showInfoModal(
                '📈 Vooruitgang',
                'Je verbetering in score over de afgelopen periode. Dit is slechts een indicatie en kan fluctueren. Bij het starten van veel nieuwe opdrachten is het logisch als de vooruitgang tijdelijk daalt. Ook als je lang niet meer hebt geoefend kan de vooruitgang lager uitvallen. Het gaat om de langetermijntrend.'
              )}
            >
              ℹ️
            </button>
          </div>
          <p className="statistiek-waarde">
            {highlights.vooruitgang.verbetering > 0 ? '+' : ''}{formatNumber(highlights.vooruitgang.verbetering)} punt
          </p>
          <p className="statistiek-context">
            {highlights.vooruitgang.periode}
          </p>
        </div>

        <div className="statistiek-card">
          <div className="statistiek-card-header">
            <h3>🆕 Nieuwe Opdrachten</h3>
            <button 
              className="info-knop" 
              title="Aantal nieuwe opdrachten vandaag gestart"
              onClick={() => showInfoModal(
                '🆕 Nieuwe Opdrachten',
                'Het aantal nieuwe opdrachten dat je vandaag hebt gestart in het Leitner-systeem. Dit helpt je om je dagelijkse leerdoelen bij te houden.'
              )}
            >
              ℹ️
            </button>
          </div>
          <p className="statistiek-waarde">{leerDataManager.getNewQuestionsTodayCount()}</p>
          <p className="statistiek-context">
            Nieuwe opdrachten toegevoegd aan Box 0 vandaag
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverzichtTab;
