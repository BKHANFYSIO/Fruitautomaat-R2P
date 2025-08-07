import React, { useState } from 'react';
import { getLeerDataManager } from '../../data/leerDataManager';
import StatBar from '../StatBar';
import type { TabProps } from './LeeranalyseTypes';
import { 
  ScoreTrendSparkline, 
  LeitnerVerdelingBar, 
  MasteryIndicator, 
  RankingCard 
} from './LeeranalyseComponents';

interface CategorieenTabProps extends TabProps {
  showInfoModal: (title: string, content: string) => void;
  hoofdcategorieRanking: any;
  subcategorieRanking: any;
}

const CategorieenTab: React.FC<CategorieenTabProps> = ({ 
  leerData, 
  onStartFocusSessie, 
  showInfoModal,
  hoofdcategorieRanking,
  subcategorieRanking
}) => {
  const [openAnalyseCategorieen, setOpenAnalyseCategorieen] = useState<Record<string, boolean>>({});

  if (!leerData) {
    return (
      <div className="geen-data">
        <p>Geen leerdata beschikbaar.</p>
      </div>
    );
  }

  const leerDataManager = getLeerDataManager();
  const hoofdcategorieData = Object.values(leerDataManager.getHoofdcategorieStatistieken());
  
  const toggleHoofdCategorie = (categorie: string) => {
    setOpenAnalyseCategorieen(prev => ({ ...prev, [categorie]: !prev[categorie] }));
  };

  return (
    <div className="categorieen-tab">
      {hoofdcategorieData.length === 0 ? (
        <div className="geen-categorieen-melding">
          <h3>🎯 Nog geen categorieën geprobeerd</h3>
          <p>Start een sessie in de Leer Modus om statistieken te verzamelen voor de verschillende categorieën.</p>
          <div className="categorie-acties">
            <button
              className="focus-knop"
              onClick={() => {
                if (onStartFocusSessie) onStartFocusSessie('Algemeen', 'normaal');
              }}
            >
              🎯 Start Eerste Sessie
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="categorie-vergelijking">
            <h4 className="ranking-header">
              🏆 Categorie Ranking
              <button 
                className="info-knop" 
                onClick={() => showInfoModal(
                  '🏆 Combi-Score Uitleg',
                  `De ranking is gebaseerd op een combi-score die als volgt is berekend:
                  (Dekking * 40%) + (Gem. Box * 40%) + (Beheersing * 20%).
                  Dit geeft een gebalanceerd beeld van uw voortgang.`
                )}
              >
                ℹ️
              </button>
            </h4>
            <div className="vergelijking-cards">
              {hoofdcategorieRanking && hoofdcategorieRanking.categorieRanking && hoofdcategorieRanking.categorieRanking.length >= 2 && (
                <>
                  <RankingCard rankingData={hoofdcategorieRanking.categorieRanking[0]} type="Beste" categoryType="Hoofd" />
                  <RankingCard rankingData={hoofdcategorieRanking.categorieRanking[hoofdcategorieRanking.categorieRanking.length - 1]} type="Verbeterpunt" categoryType="Hoofd" />
                </>
              )}
              {subcategorieRanking && subcategorieRanking.categorieRanking && subcategorieRanking.categorieRanking.length >= 2 && (
                <>
                  <RankingCard rankingData={subcategorieRanking.categorieRanking[0]} type="Beste" categoryType="Sub" />
                  <RankingCard rankingData={subcategorieRanking.categorieRanking[subcategorieRanking.categorieRanking.length - 1]} type="Verbeterpunt" categoryType="Sub" />
                </>
              )}
            </div>
            {((hoofdcategorieRanking && hoofdcategorieRanking.categorieRanking && hoofdcategorieRanking.categorieRanking.length < 2) || 
              (subcategorieRanking && subcategorieRanking.categorieRanking && subcategorieRanking.categorieRanking.length < 2)) && (
              <div className="geen-categorieen-melding">
                <p>Doe opdrachten in meerdere hoofd- én subcategorieën om een volledige vergelijking te kunnen maken.</p>
              </div>
            )}
          </div>

          <div className="categorieen-lijst">
            <h4 className="ranking-header">
              📚 Categorieën Overzicht
              <button 
                className="info-knop" 
                onClick={() => showInfoModal(
                  '📚 Categorieën Overzicht',
                  `Hier vindt u een gedetailleerd overzicht van alle beschikbare categorieën met hun voortgang, statistieken en leerdoelen.`
                )}
              >
                ℹ️
              </button>
            </h4>
            {hoofdcategorieData.map((hoofdCat: any) => {
              const mastery = leerDataManager.getCategorieMastery(hoofdCat.categorie);
              const isOpen = openAnalyseCategorieen[hoofdCat.categorie];
              const heeftStatistieken = hoofdCat.aantalOpdrachten > 0;
              const beheersing = leerDataManager.getCategorieBeheersing(hoofdCat.categorie);
              const dekking = leerDataManager.getCategorieDekking(hoofdCat.categorie);

              return (
                <React.Fragment key={hoofdCat.categorie}>
                  <div className={`categorie-card hoofd-categorie ${!heeftStatistieken ? 'nog-niet-geprobeerd' : ''}`} onClick={() => toggleHoofdCategorie(hoofdCat.categorie)}>
                    <div className="categorie-card-header">
                      <h4>
                        <span className={`pijl ${isOpen ? 'open' : ''}`}>▶</span>
                        {hoofdCat.categorie}
                      </h4>
                      <MasteryIndicator level={mastery.level} percentage={mastery.percentage} />
                    </div>
                    
                    {heeftStatistieken ? (
                      <>
                        <div className="categorie-info-compact">
                          <div className="tooltip-container">
                            <StatBar 
                              label="📚 Dekking" 
                              value={`${dekking.dekkingsPercentage.toFixed(0)}%`}
                              percentage={dekking.dekkingsPercentage} 
                            />
                            <span className="tooltip-text">
                              <strong>Dekking</strong>
                              Dit percentage toont hoeveel van alle beschikbare opdrachten in deze categorie je ten minste één keer hebt geprobeerd, ongeacht de leermodus.
                            </span>
                          </div>
                          <div className="tooltip-container">
                            <StatBar 
                              label="🎯 Beheersing" 
                              value={`${beheersing.beheersingPercentage.toFixed(1)}%`}
                              percentage={beheersing.beheersingPercentage} 
                            />
                            <span className="tooltip-text">
                              <strong>Beheersing</strong>
                              Dit percentage toont hoeveel van de opdrachten in deze categorie je 'volledig beheerst' (in Leitner Box 7). Het is een directe meting van je kennisniveau.
                            </span>
                          </div>
                          <div className="tooltip-container">
                            <StatBar 
                              label="📦 Gem. box" 
                              value={beheersing.gemiddeldeBox.toFixed(1)}
                              percentage={(beheersing.gemiddeldeBox / 7) * 100}
                              color="#f59e0b"
                            />
                            <span className="tooltip-text">
                              <strong>Gemiddelde Leitner Box</strong>
                              De gemiddelde Leitner-box van alle opdrachten in deze categorie. Een hoger getal duidt op betere kennis.
                            </span>
                          </div>
                          <div className="tooltip-container">
                            <StatBar 
                              label="🎯 Consistentie" 
                              value={beheersing.consistentieScore === -1 ? 'N/A' : `${beheersing.consistentieScore.toFixed(0)}%`}
                              percentage={beheersing.consistentieScore === -1 ? 0 : beheersing.consistentieScore}
                              color="#3b82f6"
                            />
                            <span className="tooltip-text">
                              <strong>Consistentie</strong>
                              Meet hoe voorspelbaar je prestaties zijn op basis van de scores van de laatste 30 nieuwe opdrachten in de Vrije Leermodus. Een hoge consistentie betekent dat je prestaties voorspelbaar zijn. De score wordt zichtbaar na 5 opdrachten.
                            </span>
                          </div>
                          <div className="tooltip-container">
                            <div className="categorie-info-item">
                              <span className="label">⚡ Vandaag:</span>
                              <span className="waarde">{beheersing.vandaagBeschikbaar} beschikbaar</span>
                            </div>
                            <span className="tooltip-text">
                              <strong>Vandaag Beschikbaar</strong>
                              Het aantal opdrachten dat vandaag beschikbaar is voor herhaling in de Leitner-modus.
                            </span>
                          </div>
                          <div className="tooltip-container">
                            <div className="categorie-info-item">
                              <span className="label">📈 Score trend:</span>
                              <span className={`waarde blauw ${beheersing.scoreTrend}`}>
                                {beheersing.scoreTrend === 'stijgend' ? '↗️ Stijgend' : 
                                 beheersing.scoreTrend === 'dalend' ? '↘️ Dalend' : '➡️ Stabiel'}
                              </span>
                            </div>
                            <span className="tooltip-text">
                              <strong>Score Trend</strong>
                              Laat zien of je gemiddelde score voor <em>nieuwe opdrachten in de Vrije Leermodus</em> stijgt, daalt of stabiel blijft.
                            </span>
                          </div>
                        </div>
                        <div className="categorie-acties">
                          <div className="tooltip-container">
                            <button
                              className="oefen-knop vrije-leermodus"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onStartFocusSessie) onStartFocusSessie(hoofdCat.categorie, 'normaal');
                              }}
                            >
                              📚 Vrije Leermodus
                            </button>
                            <span className="tooltip-text">
                              <strong>Vrije Leermodus</strong>
                              Oefen alle vragen uit deze categorie zonder de beperkingen van het Leitner-systeem. Ideaal om de stof vrij te verkennen.
                            </span>
                          </div>
                          <div className="tooltip-container">
                            <button
                              className="oefen-knop leitner-leermodus"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onStartFocusSessie) onStartFocusSessie(hoofdCat.categorie, 'leitner');
                              }}
                            >
                              📖 Leitner Leermodus
                            </button>
                            <span className="tooltip-text">
                              <strong>Leitner Leermodus</strong>
                              Oefen de vragen die vandaag beschikbaar zijn voor herhaling volgens het Leitner-systeem. Dit is de meest efficiënte manier om kennis te verankeren.
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="categorie-info-compact">
                          <div className="categorie-info-item">
                            <span className="label">🎯 Nog niet geprobeerd</span>
                          </div>
                        </div>
                        <div className="categorie-acties">
                          <div className="tooltip-container">
                            <button
                              className="oefen-knop vrije-leermodus"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onStartFocusSessie) onStartFocusSessie(hoofdCat.categorie, 'normaal');
                              }}
                            >
                              📚 Vrije Leermodus
                            </button>
                            <span className="tooltip-text">
                              <strong>Vrije Leermodus</strong>
                              Oefen alle vragen uit deze categorie zonder de beperkingen van het Leitner-systeem. Ideaal om de stof vrij te verkennen.
                            </span>
                          </div>
                          <div className="tooltip-container">
                            <button
                              className="oefen-knop leitner-leermodus"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onStartFocusSessie) onStartFocusSessie(hoofdCat.categorie, 'leitner');
                              }}
                            >
                              📖 Leitner Leermodus
                            </button>
                            <span className="tooltip-text">
                              <strong>Leitner Leermodus</strong>
                              Oefen de vragen die vandaag beschikbaar zijn voor herhaling volgens het Leitner-systeem. Dit is de meest efficiënte manier om kennis te verankeren.
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {isOpen && (
                    <div className="subcategorieen-grid">
                      {hoofdCat.subCategorieen.map((subCat: any) => {
                        const subMastery = leerDataManager.getCategorieMastery(subCat.categorie);
                        const subHeeftStatistieken = subCat.aantalOpdrachten > 0;
                        const subBeheersing = leerDataManager.getCategorieBeheersing(subCat.categorie);
                        const subDekking = leerDataManager.getCategorieDekking(subCat.categorie);
                      
                        return (
                          <div key={subCat.categorie} className={`categorie-card sub-categorie ${!subHeeftStatistieken ? 'nog-niet-geprobeerd' : ''}`}>
                            <div className="categorie-card-header">
                              <h4>
                                {subCat.categorie}
                              </h4>
                              <MasteryIndicator level={subMastery.level} percentage={subMastery.percentage} />
                            </div>
                            
                            {subHeeftStatistieken ? (
                              <>
                                <div className="categorie-info-compact">
                                  <div className="tooltip-container">
                                    <StatBar 
                                      label="📚 Dekking" 
                                      value={`${subDekking.dekkingsPercentage.toFixed(0)}%`}
                                      percentage={subDekking.dekkingsPercentage} 
                                    />
                                    <span className="tooltip-text">
                                      <strong>Dekking</strong>
                                      Dit percentage toont hoeveel van alle beschikbare opdrachten in deze categorie je ten minste één keer hebt geprobeerd.
                                    </span>
                                  </div>
                                  <div className="tooltip-container">
                                    <StatBar 
                                      label="🎯 Beheersing" 
                                      value={`${subBeheersing.beheersingPercentage.toFixed(1)}%`}
                                      percentage={subBeheersing.beheersingPercentage} 
                                    />
                                    <span className="tooltip-text">
                                      <strong>Beheersing</strong>
                                      Dit percentage toont hoeveel opdrachten je 'volledig beheerst' (in Leitner Box 7).
                                    </span>
                                  </div>
                                  <div className="tooltip-container">
                                    <StatBar 
                                      label="📦 Gem. box" 
                                      value={subBeheersing.gemiddeldeBox.toFixed(1)}
                                      percentage={(subBeheersing.gemiddeldeBox / 7) * 100}
                                      color="#f59e0b"
                                    />
                                    <span className="tooltip-text">
                                      <strong>Gemiddelde Leitner Box</strong>
                                      De gemiddelde Leitner-box voor deze categorie.
                                    </span>
                                  </div>
                                  <div className="tooltip-container">
                                    <StatBar 
                                      label="🎯 Consistentie" 
                                      value={subBeheersing.consistentieScore === -1 ? 'N/A' : `${subBeheersing.consistentieScore.toFixed(0)}%`}
                                      percentage={subBeheersing.consistentieScore === -1 ? 0 : subBeheersing.consistentieScore}
                                      color="#3b82f6"
                                    />
                                    <span className="tooltip-text">
                                      <strong>Consistentie</strong>
                                      Meet hoe voorspelbaar je prestaties zijn. Wordt berekend na 5 opdrachten.
                                    </span>
                                  </div>
                                  <div className="tooltip-container">
                                    <div className="categorie-info-item">
                                      <span className="label">⚡ Vandaag:</span>
                                      <span className="waarde">{subBeheersing.vandaagBeschikbaar} beschikbaar</span>
                                    </div>
                                    <span className="tooltip-text">
                                      <strong>Vandaag Beschikbaar</strong>
                                      Aantal opdrachten dat vandaag beschikbaar is voor herhaling.
                                    </span>
                                  </div>
                                  <div className="tooltip-container">
                                    <div className="categorie-info-item">
                                      <span className="label">📈 Score trend:</span>
                                      <span className={`waarde blauw ${subBeheersing.scoreTrend}`}>
                                        {subBeheersing.scoreTrend === 'stijgend' ? '↗️ Stijgend' :
                                         subBeheersing.scoreTrend === 'dalend' ? '↘️ Dalend' : '➡️ Stabiel'}
                                      </span>
                                    </div>
                                    <span className="tooltip-text">
                                      <strong>Score Trend</strong>
                                      Laat zien of je gemiddelde score voor nieuwe opdrachten stijgt, daalt of stabiel blijft.
                                    </span>
                                  </div>
                                </div>
                                <div className="categorie-acties">
                                  <button
                                    className="oefen-knop vrije-leermodus"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onStartFocusSessie) onStartFocusSessie(subCat.categorie, 'normaal');
                                    }}
                                  >
                                    📚 Vrije Leermodus
                                  </button>
                                  <button
                                    className="oefen-knop leitner-leermodus"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onStartFocusSessie) onStartFocusSessie(subCat.categorie, 'leitner');
                                    }}
                                  >
                                    📖 Leitner Leermodus
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="nog-niet-geprobeerd-content">
                                <p>🎯 Deze subcategorie is nog niet geprobeerd.</p>
                                <div className="categorie-acties">
                                  <button
                                    className="oefen-knop vrije-leermodus"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onStartFocusSessie) onStartFocusSessie(subCat.categorie, 'normaal');
                                    }}
                                  >
                                    📚 Vrije Leermodus
                                  </button>
                                  <button
                                    className="oefen-knop leitner-leermodus"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onStartFocusSessie) onStartFocusSessie(subCat.categorie, 'leitner');
                                    }}
                                  >
                                    📖 Leitner Leermodus
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CategorieenTab;
