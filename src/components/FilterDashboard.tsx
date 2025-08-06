import React, { useMemo } from 'react';
import type { Opdracht } from '../data/types';
import { opdrachtTypeIconen } from '../data/constants';
import './FilterDashboard.css';

interface FilterDashboardProps {
  filters: {
    bronnen: ('systeem' | 'gebruiker')[];
    opdrachtTypes: string[];
  };
  setFilters: (filters: { bronnen: ('systeem' | 'gebruiker')[]; opdrachtTypes: string[] }) => void;
  opdrachten: Opdracht[];
  actieveCategorieSelectie: string[];
}

export const FilterDashboard: React.FC<FilterDashboardProps> = ({ filters, setFilters, opdrachten }) => {

  const { alleOpdrachtTypes, opdrachtenPerType, opdrachtenPerBron } = useMemo(() => {
    const opdrachtenPerType: { [key: string]: number } = {};
    const opdrachtenPerBron: { [key: string]: number } = {};
    
    // Gebruik alle opdrachten voor de filter tellingen, niet alleen geselecteerde
    opdrachten.forEach(op => {
      const type = op.opdrachtType || 'Onbekend';
      opdrachtenPerType[type] = (opdrachtenPerType[type] || 0) + 1;
      const bron = op.bron || 'systeem';
      opdrachtenPerBron[bron] = (opdrachtenPerBron[bron] || 0) + 1;
    });
    
    // Zorg ervoor dat alle types altijd zichtbaar blijven, ook als ze 0 opdrachten hebben
    const alleOpdrachtTypes = Array.from(new Set(opdrachten.map(op => op.opdrachtType || 'Onbekend'))).sort((a, b) => {
      if (a === 'Onbekend') return 1;
      if (b === 'Onbekend') return -1;
      return a.localeCompare(b);
    });
    
    return { alleOpdrachtTypes, opdrachtenPerType, opdrachtenPerBron };
  }, [opdrachten]);

  const handleBronToggle = (bron: 'systeem' | 'gebruiker') => {
    // Voorkom dat beide bronnen worden uitgeschakeld
    if (filters.bronnen.includes(bron) && filters.bronnen.length === 1) {
      alert('Er moet minimaal één bron geselecteerd zijn');
      return; // Laat minimaal één bron geselecteerd
    }
    
    const nieuweBronnen = filters.bronnen.includes(bron)
      ? filters.bronnen.filter(b => b !== bron)
      : [...filters.bronnen, bron];
    setFilters({ ...filters, bronnen: nieuweBronnen });
  };

  const handleTypeToggle = (type: string) => {
    const nieuweTypes = filters.opdrachtTypes.includes(type)
      ? filters.opdrachtTypes.filter(t => t !== type)
      : [...filters.opdrachtTypes, type];
    setFilters({ ...filters, opdrachtTypes: nieuweTypes });
  };

  return (
    <div className="filter-dashboard">
      <div className="filter-section">
        <div className="filter-header">
          <h5 className="filter-titel">Actieve Filters</h5>
        </div>
        <div className="filter-icon-group">
          <span
            className={`filter-icon ${filters.bronnen.includes('systeem') ? 'active' : 'inactive'}`}
            title={`Systeem: ${opdrachtenPerBron['systeem'] || 0} opdr.`}
            onClick={() => handleBronToggle('systeem')}
          >
            🏛️
          </span>
          <span
            className={`filter-icon ${filters.bronnen.includes('gebruiker') ? 'active' : 'inactive'}`}
            title={`Eigen: ${opdrachtenPerBron['gebruiker'] || 0} opdr.`}
            onClick={() => handleBronToggle('gebruiker')}
          >
            👤
          </span>
        </div>
        <div className="filter-icon-group">
          {alleOpdrachtTypes.map(type => {
            const count = opdrachtenPerType[type] || 0;
            const titleText = `${type}: ${count} opdr.`;

            return (
              <span
                key={type}
                className={`filter-icon ${filters.opdrachtTypes.includes(type) ? 'active' : 'inactive'}`}
                title={titleText}
                onClick={() => handleTypeToggle(type)}
              >
                {opdrachtTypeIconen[type] || '❓'}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
