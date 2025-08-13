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
    alleenTekenen?: boolean;
  };
  setFilters: (filters: { bronnen: ('systeem' | 'gebruiker')[]; opdrachtTypes: string[]; niveaus?: Array<1|2|3|'undef'>; alleenTekenen?: boolean }) => void;
  opdrachten: Opdracht[];
  actieveCategorieSelectie: string[];
}

export const FilterDashboard: React.FC<FilterDashboardProps> = ({ filters, setFilters, opdrachten, actieveCategorieSelectie }) => {
  // State voor accordeon functionaliteit
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('filterDashboardExpanded');
    return saved ? JSON.parse(saved) : false; // Standaard ingeklapt
  });

  // Sla de expanded state op in localStorage
  useEffect(() => {
    localStorage.setItem('filterDashboardExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

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

  const handleBronToggle = (bron: 'systeem' | 'gebruiker') => {
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
    const nieuweTypes = filters.opdrachtTypes.includes(type)
      ? filters.opdrachtTypes.filter(t => t !== type)
      : [...filters.opdrachtTypes, type];
    setFilters({ ...filters, opdrachtTypes: nieuweTypes });
  };

  const handleNiveauToggle = (niv: 1 | 2 | 3 | 'undef') => {
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
                    className={`filter-icon ${filters.bronnen.includes('systeem') ? 'active' : 'inactive'}`}
                    onClick={() => handleBronToggle('systeem')}
                  >
                    📖
                  </span>
                </InfoTooltip>
                <InfoTooltip asChild content={`Eigen: ${opdrachtenPerBron['gebruiker'] || 0} opdr.`}>
                  <span
                    className={`filter-icon ${filters.bronnen.includes('gebruiker') ? 'active' : 'inactive'}`}
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
                        className={`filter-icon ${filters.opdrachtTypes.includes(type) ? 'active' : 'inactive'}`}
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
                      className={`filter-icon ${filters.niveaus?.includes(niv as any) ? 'active' : 'inactive'}`}
                      onClick={() => handleNiveauToggle(niv as 1|2|3)}
                    >
                      {`N${niv}`}
                    </span>
                  </InfoTooltip>
                ))}
                <InfoTooltip asChild content={`Ongedefinieerd: ${(niveausTelling as any)['undef'] || 0} opdr.`}>
                  <span
                    className={`filter-icon ${filters.niveaus?.includes('undef') ? 'active' : 'inactive'}`}
                    onClick={() => handleNiveauToggle('undef')}
                  >
                    ∅
                  </span>
                </InfoTooltip>
              </div>
            </div>

            {/* Tekenen filter */}
            <div className="filter-group">
              <div className="filter-label-container">
                <span className="filter-label">Tekenen:</span>
              </div>
              <div className="filter-icon-group">
                <InfoTooltip asChild content={`Toon alleen opdrachten waarbij tekenen is gevraagd.`}>
                  <span
                    className={`filter-icon ${filters.alleenTekenen ? 'active' : 'inactive'}`}
                    onClick={() => setFilters({ ...filters, alleenTekenen: !filters.alleenTekenen })}
                  >
                    ✏️
                  </span>
                </InfoTooltip>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
