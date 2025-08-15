import React, { useMemo, useState, useEffect } from 'react';
import type { Opdracht } from '../data/types';
import { opdrachtTypeIconen, OPDRACHT_TYPE_ORDER, NIVEAU_LABELS } from '../data/constants';
import './FilterDashboard.css';
import { InfoTooltip } from './ui/InfoTooltip';

interface FilterDashboardProps {
  filters: {
    bronnen: ('systeem' | 'gebruiker')[];
    opdrachtTypes: string[];
    niveaus?: Array<1 | 2 | 3 | 'undef'>;
    tekenen?: Array<'ja' | 'mogelijk' | 'nee'>;
  };
  setFilters: (filters: { bronnen: ('systeem' | 'gebruiker')[]; opdrachtTypes: string[]; niveaus?: Array<1|2|3|'undef'>; tekenen?: Array<'ja' | 'mogelijk' | 'nee'> }) => void;
  opdrachten: Opdracht[];
  actieveCategorieSelectie: string[];
  // Wanneer deze sleutel verandert, klapt het dashboard automatisch in
  collapseKey?: string;
  // Of het spel bezig is - filters worden uitgeschakeld tijdens het spel
  isSpelGestart?: boolean;
}

export const FilterDashboard: React.FC<FilterDashboardProps> = ({ filters, setFilters, opdrachten, actieveCategorieSelectie, collapseKey, isSpelGestart = false }) => {
  // State voor accordeon functionaliteit (standaard ingeklapt, niet persistent)
  const [isExpanded, setIsExpanded] = useState(false);
  // Klap automatisch in bij wisselen van spelmodus/sessie/refresh (collapseKey wijzigt)
  useEffect(() => { setIsExpanded(false); }, [collapseKey]);

  const { alleOpdrachtTypes, opdrachtenPerType, opdrachtenPerBron, niveausTelling } = useMemo(() => {
    // Beperk tellingen tot geselecteerde categorieën (indien aanwezig)
    const isCategorieFilterActief = Array.isArray(actieveCategorieSelectie) && actieveCategorieSelectie.length > 0;
    const subset = isCategorieFilterActief
      ? opdrachten.filter(op => {
          const key = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
          return actieveCategorieSelectie.includes(key);
        })
      : opdrachten;

    const opdrachtenPerType: { [key: string]: number } = {};
    const opdrachtenPerBron: { [key: string]: number } = {};
    const niveausTelling: { [k in 1|2|3|'undef']?: number } = {};
    
    // Tellingen binnen subset
    subset.forEach(op => {
      const type = op.opdrachtType || 'Onbekend';
      opdrachtenPerType[type] = (opdrachtenPerType[type] || 0) + 1;
      const bron = op.bron || 'systeem';
      opdrachtenPerBron[bron] = (opdrachtenPerBron[bron] || 0) + 1;
      const niv = (op as any).niveau as (1|2|3|undefined);
      const key = (typeof niv === 'number' ? niv : 'undef') as 1|2|3|'undef';
      niveausTelling[key] = (niveausTelling[key] || 0) + 1;
    });
    
    // Zorg ervoor dat alle types altijd zichtbaar blijven, ook als ze 0 opdrachten hebben
    // Gebruik vaste set i.p.v. dynamische uitbreiding vanuit Excel
    const alleOpdrachtTypes = OPDRACHT_TYPE_ORDER;
    
    return { alleOpdrachtTypes, opdrachtenPerType, opdrachtenPerBron, niveausTelling };
  }, [opdrachten, actieveCategorieSelectie]);

  // Tel aantal actieve filters voor opvallende badge in header
  const actiefCount = useMemo(() => {
    let count = 0;
    // Bron: tel alleen als exact één bron actief is (dus afwijking van default én niet leeg)
    const hasSystem = filters.bronnen.includes('systeem');
    const hasUser = filters.bronnen.includes('gebruiker');
    if ((hasSystem && !hasUser) || (!hasSystem && hasUser)) count++;
    // type
    count += filters.opdrachtTypes.length;
    // niveaus
    count += (filters.niveaus?.length || 0);
    // tekenen
    count += (filters.tekenen?.length || 0);
    return count;
  }, [filters]);

  const handleBronToggle = (bron: 'systeem' | 'gebruiker') => {
    if (isSpelGestart) return; // Uitgeschakeld tijdens het spel
    
    // Zorg dat minimaal één bron aan blijft en toggle de andere
    const heeftBeide = filters.bronnen.length === 2;
    const include = filters.bronnen.includes(bron);
    if (heeftBeide && include) {
      // als beide aan zijn en je klikt op één, zet alleen die uit → houdt de andere aan
      const andere = bron === 'systeem' ? 'gebruiker' : 'systeem';
      setFilters({ ...filters, bronnen: [andere] as ('systeem'|'gebruiker')[] });
      return;
    }
    const nieuweBronnen = include
      ? filters.bronnen.filter(b => b !== bron)
      : [...filters.bronnen, bron];
    // voorkom leegte
    if (nieuweBronnen.length === 0) {
      setFilters({ ...filters, bronnen: ['systeem', 'gebruiker'] });
    } else {
      setFilters({ ...filters, bronnen: nieuweBronnen });
    }
  };

  const handleTypeToggle = (type: string) => {
    if (isSpelGestart) return; // Uitgeschakeld tijdens het spel
    
    const nieuweTypes = filters.opdrachtTypes.includes(type)
      ? filters.opdrachtTypes.filter(t => t !== type)
      : [...filters.opdrachtTypes, type];
    setFilters({ ...filters, opdrachtTypes: nieuweTypes });
  };

  const handleNiveauToggle = (niv: 1 | 2 | 3 | 'undef') => {
    if (isSpelGestart) return; // Uitgeschakeld tijdens het spel
    
    const huidige = filters.niveaus || [];
    const nieuw = huidige.includes(niv)
      ? huidige.filter(n => n !== niv)
      : [...huidige, niv];
    setFilters({ ...filters, niveaus: nieuw });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="filter-dashboard">
      <div className="filter-section">
        <div className="filter-header">
          <button 
            className="filter-toggle-button"
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
          >
            <span className="filter-titel">Filters Snel Aanpassen</span>
            {actiefCount > 0 && (
              <span className="filter-active-badge" title="Aantal actieve filters">{actiefCount} actief</span>
            )}
            <span className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}>
              ▼
            </span>
          </button>
        </div>
        
        {isExpanded && (
          <div className="filter-content">
            <div className="filter-hint" style={{ fontSize: '0.85rem', color: '#9aa0a6', margin: '4px 0 10px 0' }}>
              Aantallen hieronder zijn binnen je huidige categorie‑selectie.
            </div>
            {/* Bron filters */}
            <div className="filter-group">
              <div className="filter-label-container">
                <span className="filter-label">Bron:</span>
              </div>
              <div className="filter-icon-group">
                <InfoTooltip asChild content={`Systeem: ${opdrachtenPerBron['systeem'] || 0} opdr.`}>
                  <span
                    className={`filter-icon bron ${filters.bronnen.includes('systeem') ? 'active' : 'inactive'} ${isSpelGestart ? 'disabled' : ''}`}
                    onClick={() => handleBronToggle('systeem')}
                  >
                    📖
                  </span>
                </InfoTooltip>
                <InfoTooltip asChild content={`Eigen: ${opdrachtenPerBron['gebruiker'] || 0} opdr.`}>
                  <span
                    className={`filter-icon bron ${filters.bronnen.includes('gebruiker') ? 'active' : 'inactive'} ${isSpelGestart ? 'disabled' : ''}`}
                    onClick={() => handleBronToggle('gebruiker')}
                  >
                    👨‍💼
                  </span>
                </InfoTooltip>
              </div>
            </div>

            {/* Type filters */}
            <div className="filter-group">
              <div className="filter-label-container">
                <span className="filter-label">Type:</span>
              </div>
              <div className="filter-icon-group">
                {alleOpdrachtTypes.map(type => {
                  const count = opdrachtenPerType[type] || 0;
                  const titleText = `${type}: ${count} opdr.`;

                  return (
                    <InfoTooltip asChild content={titleText} key={type}>
                      <span
                        className={`filter-icon ${filters.opdrachtTypes.includes(type) ? 'active' : 'inactive'} ${isSpelGestart ? 'disabled' : ''}`}
                        onClick={() => handleTypeToggle(type)}
                      >
                        {opdrachtTypeIconen[type] || '❓'}
                      </span>
                    </InfoTooltip>
                  );
                })}
              </div>
            </div>

            {/* Niveau filters */}
            <div className="filter-group">
              <div className="filter-label-container">
                <span className="filter-label">Niveau:</span>
              </div>
              <div className="filter-icon-group">
                {[1,2,3].map((niv) => (
                  <InfoTooltip asChild content={`Niv. ${niv}: ${NIVEAU_LABELS[niv as 1|2|3]} — ${(niveausTelling as any)[niv] || 0} opdr.`} key={`niv-${niv}`}>
                    <span
                      className={`filter-icon ${filters.niveaus?.includes(niv as any) ? 'active' : 'inactive'} ${isSpelGestart ? 'disabled' : ''}`}
                      onClick={() => handleNiveauToggle(niv as 1|2|3)}
                    >
                      {`N${niv}`}
                    </span>
                  </InfoTooltip>
                ))}
                <InfoTooltip asChild content={`Ongedefinieerd: ${(niveausTelling as any)['undef'] || 0} opdr.`}>
                  <span
                    className={`filter-icon ${filters.niveaus?.includes('undef') ? 'active' : 'inactive'} ${isSpelGestart ? 'disabled' : ''}`}
                    onClick={() => handleNiveauToggle('undef')}
                  >
                    ∅
                  </span>
                </InfoTooltip>
              </div>
            </div>

            {/* Tekenen filter tri-status */}
            <div className="filter-group">
              <div className="filter-label-container">
                <span className="filter-label">Tekenen:</span>
              </div>
              <div className="filter-icon-group">
                <InfoTooltip asChild content={`Ja: expliciet tekenen vereist.`}>
                  <span
                    className={`filter-icon ${Array.isArray(filters.tekenen) && filters.tekenen.includes('ja') ? 'active' : 'inactive'} ${isSpelGestart ? 'disabled' : ''}`}
                    onClick={() => {
                      if (isSpelGestart) return; // Uitgeschakeld tijdens het spel
                      const huidige = new Set(filters.tekenen || []);
                      huidige.has('ja') ? huidige.delete('ja') : huidige.add('ja');
                      setFilters({ ...filters, tekenen: Array.from(huidige) as any });
                    }}
                  >
                    ✏️
                  </span>
                </InfoTooltip>
                <InfoTooltip asChild content={`Mogelijk: tekenen is optioneel/helpend.`}>
                  <span
                    className={`filter-icon ${Array.isArray(filters.tekenen) && filters.tekenen.includes('mogelijk') ? 'active' : 'inactive'} ${isSpelGestart ? 'disabled' : ''}`}
                    onClick={() => {
                      if (isSpelGestart) return; // Uitgeschakeld tijdens het spel
                      const huidige = new Set(filters.tekenen || []);
                      huidige.has('mogelijk') ? huidige.delete('mogelijk') : huidige.add('mogelijk');
                      setFilters({ ...filters, tekenen: Array.from(huidige) as any });
                    }}
                  >
                    ✏️?
                  </span>
                </InfoTooltip>
                <InfoTooltip asChild content={`Nee: geen tekenen.`}>
                  <span
                    className={`filter-icon ${Array.isArray(filters.tekenen) && filters.tekenen.includes('nee') ? 'active' : 'inactive'} ${isSpelGestart ? 'disabled' : ''}`}
                    onClick={() => {
                      if (isSpelGestart) return; // Uitgeschakeld tijdens het spel
                      const huidige = new Set(filters.tekenen || []);
                      huidige.has('nee') ? huidige.delete('nee') : huidige.add('nee');
                      setFilters({ ...filters, tekenen: Array.from(huidige) as any });
                    }}
                  >
                    ∅
                  </span>
                </InfoTooltip>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                className={`snelle-selectie-knop ${isSpelGestart ? 'disabled' : ''}`}
                onClick={() => {
                  if (isSpelGestart) return; // Uitgeschakeld tijdens het spel
                  setFilters({ bronnen: ['systeem', 'gebruiker'], opdrachtTypes: [], niveaus: [], tekenen: [] });
                }}
              >
                Reset filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
