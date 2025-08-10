import React, { useMemo, useState, useEffect } from 'react';
import type { Opdracht } from '../data/types';
import { opdrachtTypeIconen } from '../data/constants';
import './FilterDashboard.css';
import { InfoTooltip } from './ui/InfoTooltip';

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
  // State voor accordeon functionaliteit
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('filterDashboardExpanded');
    return saved ? JSON.parse(saved) : false; // Standaard ingeklapt
  });

  // Sla de expanded state op in localStorage
  useEffect(() => {
    localStorage.setItem('filterDashboardExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

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
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Er moet minimaal één bron geselecteerd zijn', type: 'fout', timeoutMs: 3000 } }));
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
          </div>
        )}
      </div>
    </div>
  );
};
