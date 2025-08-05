import React, { useMemo } from 'react';
import type { Opdracht } from '../data/types';
import { opdrachtTypeIconen } from '../data/constants';
import './CriteriaModal.css';

interface CriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  opdrachten: Opdracht[];
  filters: {
    bronnen: ('systeem' | 'gebruiker')[];
    opdrachtTypes: string[];
  };
  setFilters: (filters: any) => void;
  actieveCategorieSelectie: string[];
}

export const CriteriaModal: React.FC<CriteriaModalProps> = ({ isOpen, onClose, opdrachten, filters, setFilters, actieveCategorieSelectie }) => {
  const { hoofdcategorieen, alleTypes, dataMatrix, totaalRij, totaalActiefRij } = useMemo(() => {
    const alleOpdrachten = opdrachten; // Gebruik de volledige, ongefilterde lijst voor de basis
    
    // Stap 1: Bepaal álle mogelijke types en hoofdcategorieën uit de volledige dataset
    const alleTypes = Array.from(new Set(alleOpdrachten.map(op => op.opdrachtType || 'Onbekend'))).sort((a, b) => {
      if (a === 'Onbekend') return 1;
      if (b === 'Onbekend') return -1;
      return a.localeCompare(b);
    });
    const hoofdcategorieen = Array.from(new Set(alleOpdrachten.map(op => op.Hoofdcategorie || 'Ongecategoriseerd'))).sort();

    // Stap 2: Creëer een gefilterde lijst op basis van de actieve bron-filters
    const gefilterdeOpdrachten = alleOpdrachten.filter(op => {
      const bronMatch = filters.bronnen.length === 0 || filters.bronnen.includes(op.bron as 'systeem' | 'gebruiker');
      // BELANGRIJK: Voor de tabel zelf negeren we het type filter, omdat we alle types willen tonen.
      return bronMatch;
    });
    
    // Stap 3: Creëer een lijst die ook gefilterd is op de geselecteerde categorieën
    const geselecteerdeOpdrachten = actieveCategorieSelectie.length > 0
      ? gefilterdeOpdrachten.filter(op => actieveCategorieSelectie.includes(`${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`))
      : [];

    // Stap 4: Bouw de datamatrix op
    const dataMatrix = hoofdcategorieen.map(hc => {
      const rij: { [key: string]: { actief: number; totaal: number } } = {};
      const opdrachtenInHoofdCat = gefilterdeOpdrachten.filter(op => (op.Hoofdcategorie || 'Ongecategoriseerd') === hc);
      const actieveOpdrachtenInHoofdCat = geselecteerdeOpdrachten.filter(op => (op.Hoofdcategorie || 'Ongecategoriseerd') === hc);
      
      alleTypes.forEach(type => {
        rij[type] = {
          totaal: opdrachtenInHoofdCat.filter(op => (op.opdrachtType || 'Onbekend') === type).length,
          actief: actieveOpdrachtenInHoofdCat.filter(op => (op.opdrachtType || 'Onbekend') === type).length,
        };
      });
      rij['Totaal'] = {
        totaal: opdrachtenInHoofdCat.length,
        actief: actieveOpdrachtenInHoofdCat.length,
      };
      return rij;
    });

    // Stap 5: Bereken de totaalrijen
    const totaalRij: { [key: string]: number } = {};
    alleTypes.forEach(type => {
      totaalRij[type] = gefilterdeOpdrachten.filter(op => (op.opdrachtType || 'Onbekend') === type).length;
    });
    totaalRij['Totaal'] = gefilterdeOpdrachten.length;

    const totaalActiefRij: { [key: string]: number } = {};
    alleTypes.forEach(type => {
      totaalActiefRij[type] = geselecteerdeOpdrachten.filter(op => (op.opdrachtType || 'Onbekend') === type).length;
    });
    totaalActiefRij['Totaal'] = geselecteerdeOpdrachten.length;

    return { hoofdcategorieen, alleTypes, dataMatrix, totaalRij, totaalActiefRij };
  }, [opdrachten, filters.bronnen, actieveCategorieSelectie]); // filters.opdrachtTypes hier weggelaten zodat kolommen blijven staan


  const handleTypeToggle = (type: string) => {
    const nieuweTypes = filters.opdrachtTypes.includes(type)
      ? filters.opdrachtTypes.filter(t => t !== type)
      : [...filters.opdrachtTypes, type];
    setFilters({ ...filters, opdrachtTypes: nieuweTypes });
  };

  if (!isOpen) return null;

  return (
    <div className="criteria-modal-overlay" onClick={onClose}>
      <div className="criteria-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="criteria-modal-header">
          <h3>Filter Details & Overzicht</h3>
          <button onClick={onClose} className="criteria-modal-close">&times;</button>
        </div>
        <div className="criteria-modal-body">
          <p>Klik op de icoontjes in de header om opdrachttypes te filteren voor de gehele applicatie.</p>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hoofdcategorie</th>
                  {alleTypes.map(type => (
                    <th key={type} onClick={() => handleTypeToggle(type)} className="clickable-header">
                      <span
                        className={`filter-icon ${!filters.opdrachtTypes.includes(type) ? 'active' : 'inactive'}`}
                        title={!filters.opdrachtTypes.includes(type) ? `Type "${type}" actief` : `Filter op type "${type}"`}
                      >
                        {opdrachtTypeIconen[type] || '❓'}
                      </span>
                    </th>
                  ))}
                  <th>Totaal</th>
                </tr>
              </thead>
              <tbody>
                <tr className="totaal-rij">
                  <td><strong>Totaal Beschikbaar</strong></td>
                  {alleTypes.map(type => (
                    <td key={type}><strong>{totaalRij[type]}</strong></td>
                  ))}
                  <td><strong>{totaalRij['Totaal']}</strong></td>
                </tr>
                <tr className="totaal-rij actief">
                  <td><strong>Totaal Actief (Geselecteerd)</strong></td>
                  {alleTypes.map(type => (
                    <td key={type}><strong>{totaalActiefRij[type]}</strong></td>
                  ))}
                  <td><strong>{totaalActiefRij['Totaal']}</strong></td>
                </tr>
                {hoofdcategorieen.map((hc, rowIndex) => (
                  <tr key={hc}>
                    <td>{hc}</td>
                    {alleTypes.map(type => (
                      <td key={type} className={dataMatrix[rowIndex][type].actief > 0 ? 'cell-actief' : ''}>
                        {dataMatrix[rowIndex][type].actief} / {dataMatrix[rowIndex][type].totaal}
                      </td>
                    ))}
                    <td className={dataMatrix[rowIndex]['Totaal'].actief > 0 ? 'cell-actief' : ''}>
                      <strong>{dataMatrix[rowIndex]['Totaal'].actief} / {dataMatrix[rowIndex]['Totaal'].totaal}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
