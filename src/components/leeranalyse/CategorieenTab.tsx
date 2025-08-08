import React, { useState } from 'react';
import { getLeerDataManager } from '../../data/leerDataManager';
import StatBar from '../StatBar';
import type { TabProps, RankingData } from './LeeranalyseTypes';
import { 
  MasteryIndicator, 
  RankingCard 
} from './LeeranalyseComponents';

interface CategorieenTabProps extends TabProps {
  showInfoModal: (title: string, content: string) => void;
  hoofdcategorieRanking: { categorieRanking: RankingData[] } | null;
  subcategorieRanking: { categorieRanking: RankingData[] } | null;
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
  const hoofdcategorieDataOngefilterd = Object.values(leerDataManager.getHoofdcategorieStatistieken());

  // Sorteer: eerst categorieën met data (aantalOpdrachten>0), daarna alfabetisch (nl)
  const hoofdcategorieData = React.useMemo(() => {
    const kopie = [...hoofdcategorieDataOngefilterd];
    kopie.sort((a: any, b: any) => {
      const aHas = (a?.aantalOpdrachten || 0) > 0;
      const bHas = (b?.aantalOpdrachten || 0) > 0;
      if (aHas !== bHas) return aHas ? -1 : 1;
      return String(a?.categorie || '').localeCompare(String(b?.categorie || ''), 'nl', { sensitivity: 'base' });
    });
    return kopie;
  }, [hoofdcategorieDataOngefilterd]);
  
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
              const totaalOpdrachtenInHoofd: number = dekking.totaalOpdrachten || 0;
              
              // Helper: compacte verdelingsbalk voor Leitner (7 → 0)
              const renderLeitnerVerdelingCompact = () => {
                const verdeling = leerDataManager.getLeitnerBoxVerdelingVoorCategorie(hoofdCat.categorie);
                const totaal = totaalOpdrachtenInHoofd;
                const volgorde = [7, 6, 5, 4, 3, 2, 1, 0];
                const kleuren: Record<number, string> = {
                  0: '#805ad5',
                  1: '#ff6b6b',
                  2: '#feca57',
                  3: '#48dbfb',
                  4: '#0abde3',
                  5: '#54a0ff',
                  6: '#2c3e50',
                  7: '#ffd700',
                };
                return (
                  <div className="bar-row">
                    <small className="bar-label">Leitner verdeling</small>
                    <div className="compact-bar" aria-label="Leitner verdeling">
                      {totaal === 0 ? (
                        <div className="compact-bar-empty">Geen data</div>
                      ) : (
                        volgorde.map(boxId => {
                          const count = verdeling[boxId] || 0;
                          if (count === 0) return null;
                          const perc = (count / totaal) * 100;
                          const label = boxId === 7 ? 'Beheerst' : `Box ${boxId}`;
                          return (
                            <div
                              key={`leitner-${boxId}`}
                              className="compact-segment"
                              style={{ width: `${perc}%`, backgroundColor: kleuren[boxId] }}
                              title={`${label}: ${count} (${perc.toFixed(1)}%)`}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              };

              // Helper: compacte verdelingsbalk voor Vrije modus herhalingen
              const renderVrijeHerhalingenCompact = () => {
                const subcats: string[] = (hoofdCat.subCategorieen || []).map((sc: any) => sc.categorie);
                const totaalInHoofd: number = totaalOpdrachtenInHoofd;
                const leer = leerDataManager.loadLeerData();
                const buckets: Record<string, { label: string; kleur: string; count: number }>
                  = {
                    '6+': { label: '≥6x', kleur: '#8b5cf6', count: 0 },
                    '5': { label: '5x', kleur: '#22c55e', count: 0 },
                    '4': { label: '4x', kleur: '#f59e0b', count: 0 },
                    '3': { label: '3x', kleur: '#3b82f6', count: 0 },
                    '2': { label: '2x', kleur: '#06b6d4', count: 0 },
                    '1': { label: '1x', kleur: '#eab308', count: 0 },
                    '0': { label: '0x (nooit in vrije modus)', kleur: '#6b7280', count: 0 },
                  };
                const relevante = leer?.opdrachten ? Object.values(leer.opdrachten).filter((op: any) => subcats.includes(op.categorie)) : [];
                const uniekeAssignments = new Set<string>();
                relevante.forEach((op: any) => {
                  uniekeAssignments.add(op.opdrachtId);
                  const vrijeCount = (op.modusGeschiedenis || [])
                    .filter((m: any) => m.modus === 'normaal').length;
                  if (vrijeCount >= 6) buckets['6+'].count += 1;
                  else if (vrijeCount === 5) buckets['5'].count += 1;
                  else if (vrijeCount === 4) buckets['4'].count += 1;
                  else if (vrijeCount === 3) buckets['3'].count += 1;
                  else if (vrijeCount === 2) buckets['2'].count += 1;
                  else if (vrijeCount === 1) buckets['1'].count += 1;
                  else buckets['0'].count += 1; // bestaat wel maar nooit in vrije modus gedaan
                });
                const missing = Math.max(0, totaalInHoofd - uniekeAssignments.size);
                buckets['0'].count += missing; // nooit gedaan (ontbreekt in leerdata)

                const order = ['6+', '5', '4', '3', '2', '1', '0'];
                const totaal = Object.values(buckets).reduce((s, b) => s + b.count, 0);
                return (
                  <div className="bar-row">
                    <small className="bar-label">Vrije modus herhalingen</small>
                    <div className="compact-bar" aria-label="Vrije modus herhalingen">
                      {totaal === 0 ? (
                        <div className="compact-bar-empty">Geen data</div>
                      ) : (
                        order.map(key => {
                          const b = buckets[key];
                          if (!b.count) return null;
                          const perc = (b.count / totaal) * 100;
                          return (
                            <div
                              key={`vrij-${key}`}
                              className="compact-segment"
                              style={{ width: `${perc}%`, backgroundColor: b.kleur }}
                              title={`${b.label}: ${b.count} (${perc.toFixed(1)}%)`}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <React.Fragment key={hoofdCat.categorie}>
                  <div className={`categorie-card hoofd-categorie ${!heeftStatistieken ? 'nog-niet-geprobeerd' : ''}`} onClick={() => toggleHoofdCategorie(hoofdCat.categorie)}>
                      <div className="categorie-card-header">
                      <h4>
                        <span className={`pijl ${isOpen ? 'open' : ''}`}>▶</span>
                        {hoofdCat.categorie}
                      </h4>
                      {mastery.percentage > 20 && (
                        <div className="tooltip-container">
                          <MasteryIndicator level={mastery.level} percentage={mastery.percentage} />
                          <span className="tooltip-text">
                            <strong>Mastery-indicator</strong>
                            Deze verschijnt zodra je boven de drempel komt. De score is een gewogen percentage op basis van je Leitner-boxverdeling.
                            Drempels: Brons &gt; 20%, Zilver &gt; 50%, Goud &gt; 80%.
                          </span>
                        </div>
                      )}
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
                        <div className="categorie-progress-bars" onClick={(e) => e.stopPropagation()}>
                          {renderLeitnerVerdelingCompact()}
                          {renderVrijeHerhalingenCompact()}
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
                      {[...hoofdCat.subCategorieen]
                        .sort((a: any, b: any) => {
                          const aHas = (a?.aantalOpdrachten || 0) > 0;
                          const bHas = (b?.aantalOpdrachten || 0) > 0;
                          if (aHas !== bHas) return aHas ? -1 : 1;
                          return String(a?.categorie || '').localeCompare(String(b?.categorie || ''), 'nl', { sensitivity: 'base' });
                        })
                        .map((subCat: any) => {
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
                              {subMastery.percentage > 20 && (
                                <div className="tooltip-container">
                                  <MasteryIndicator level={subMastery.level} percentage={subMastery.percentage} />
                                  <span className="tooltip-text">
                                    <strong>Mastery-indicator</strong>
                                    Deze verschijnt na het overschrijden van de drempel. Gewogen percentage o.b.v. Leitner-boxen (Brons &gt; 20%, Zilver &gt; 50%, Goud &gt; 80%).
                                  </span>
                                </div>
                              )}
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
