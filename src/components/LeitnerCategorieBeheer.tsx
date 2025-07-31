import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getLeerDataManager } from '../data/leerDataManager';
import type { Opdracht } from '../data/types';
import './LeitnerCategorieBeheer.css';

const BoxUitlegPopup = ({ onClose }: { onClose: () => void }) => (
  <div className="box-uitleg-popup-overlay" onClick={onClose}>
    <div className="box-uitleg-popup-content" onClick={(e) => e.stopPropagation()}>
      <button onClick={onClose} className="box-uitleg-popup-close">&times;</button>
      <h4>Uitleg van de Boxen</h4>
      <p>Het Leitner-systeem helpt je efficiënt te leren door opdrachten slim te herhalen. De box bepaalt wanneer je een opdracht opnieuw ziet:</p>
      <ul>
        <li><b>B0:</b> Nieuw (herhaling na 10 min)</li>
        <li><b>B1:</b> Herhaling na 1 dag</li>
        <li><b>B2:</b> Herhaling na 2 dagen</li>
        <li><b>B3:</b> Herhaling na 4 dagen</li>
        <li><b>B4:</b> Herhaling na 7 dagen</li>
        <li><b>B5:</b> Herhaling na 14 dagen</li>
        <li><b>B6:</b> "Geleerd" (herhaling na 45 dagen)</li>
      </ul>
      <p>Na elke opdracht verplaatst deze op basis van je antwoord:</p>
      <ul>
        <li><b>Heel Goed:</b> De opdracht gaat één box omhoog.</li>
        <li><b>Redelijk:</b> De opdracht blijft in dezelfde box.</li>
        <li><b>Niet Goed:</b> De opdracht gaat terug naar Box 1 (of blijft in Box 0).</li>
      </ul>
    </div>
  </div>
);

interface LeitnerCategorieBeheerProps {
  isOpen: boolean;
  onClose: () => void;
  geselecteerdeCategorieen: string[];
  setGeselecteerdeCategorieen: (categorieen: string[] | ((prev: string[]) => string[])) => void;
  alleCategorieen: string[];
  alleOpdrachten: Opdracht[];
}

interface CategorieStatistiek {
  naam: string;
  isHoofd: boolean;
  totaalOpdrachten: number;
  aanHetLeren: number;
  pogingen: number;
  klaarVoorHerhaling: number;
  perBox: { [boxId: number]: number };
  subCategorieen?: CategorieStatistiek[];
}

type SortConfig = {
  key: keyof Omit<CategorieStatistiek, 'isHoofd' | 'subCategorieen' | 'perBox' >;
  direction: 'ascending' | 'descending';
} | null;

export const LeitnerCategorieBeheer: React.FC<LeitnerCategorieBeheerProps> = ({
  isOpen,
  onClose,
  geselecteerdeCategorieen,
  setGeselecteerdeCategorieen,
  alleOpdrachten
}) => {
  const [statistieken, setStatistieken] = useState<CategorieStatistiek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'naam', direction: 'ascending' });
  const [isUitlegOpen, setIsUitlegOpen] = useState(false);
  const [openHoofdCategorieen, setOpenHoofdCategorieen] = useState<Record<string, boolean>>({});

  const berekenStatistieken = useCallback(() => {
    setIsLoading(true);
    const leerDataManager = getLeerDataManager();
    const leitnerData = leerDataManager.loadLeitnerData();
    const leerData = leerDataManager.loadLeerData();

    const opdrachtenPerSubcategorie = alleOpdrachten.reduce((acc, op) => {
      if (!acc[op.Categorie]) {
        acc[op.Categorie] = 0;
      }
      acc[op.Categorie]++;
      return acc;
    }, {} as { [cat: string]: number });

    const hoofdcategorieMap: Record<string, string[]> = alleOpdrachten.reduce((acc, op) => {
      const hoofd = op.Hoofdcategorie || 'Overig';
      if (!acc[hoofd]) {
        acc[hoofd] = [];
      }
      if (!acc[hoofd].includes(op.Categorie)) {
        acc[hoofd].push(op.Categorie);
      }
      return acc;
    }, {} as Record<string, string[]>);
    
    const alleSubcategorieen = [...new Set(alleOpdrachten.map(op => op.Categorie))];

    const subcatStats: Record<string, CategorieStatistiek> = alleSubcategorieen.reduce((acc, subcat) => {
      let aanHetLeren = 0;
      let klaarVoorHerhaling = 0;
      const perBox: { [boxId: number]: number } = {};
      leitnerData.boxes.forEach(box => {
        const categorieOpdrachten = box.opdrachten.filter(id => id.startsWith(subcat + '_'));
        perBox[box.boxId] = (perBox[box.boxId] || 0) + categorieOpdrachten.length;
        aanHetLeren += categorieOpdrachten.length;
        
        categorieOpdrachten.forEach(opdrachtId => {
          const reviewTijd = leitnerData.opdrachtReviewTimes[opdrachtId];
          if (reviewTijd) {
            const msSindsReview = new Date().getTime() - new Date(reviewTijd).getTime();
            const minutenSindsReview = msSindsReview / 60000;
            if (minutenSindsReview >= (leitnerData.boxIntervallen[box.boxId] || 10)) {
              klaarVoorHerhaling++;
            }
          }
        });
      });

      let pogingen = 0;
      Object.values(leerData?.opdrachten || {}).forEach(opData => {
        if (opData.categorie === subcat) {
          pogingen += opData.aantalKeerGedaan;
        }
      });

      acc[subcat] = {
        naam: subcat,
        isHoofd: false,
        totaalOpdrachten: opdrachtenPerSubcategorie[subcat] || 0,
        aanHetLeren,
        pogingen,
        klaarVoorHerhaling,
        perBox,
      };
      return acc;
    }, {} as Record<string, CategorieStatistiek>);

    const finaleStatistieken: CategorieStatistiek[] = Object.entries(hoofdcategorieMap).map(([hoofd, subs]) => {
      const subCategorieStats = subs.map(sub => subcatStats[sub]).filter(Boolean);
      
      const hoofdStat: CategorieStatistiek = {
        naam: hoofd,
        isHoofd: true,
        totaalOpdrachten: subCategorieStats.reduce((sum, s) => sum + s.totaalOpdrachten, 0),
        aanHetLeren: subCategorieStats.reduce((sum, s) => sum + s.aanHetLeren, 0),
        pogingen: subCategorieStats.reduce((sum, s) => sum + s.pogingen, 0),
        klaarVoorHerhaling: subCategorieStats.reduce((sum, s) => sum + s.klaarVoorHerhaling, 0),
        perBox: subCategorieStats.reduce((acc, s) => {
          for (const boxId in s.perBox) {
            acc[boxId] = (acc[boxId] || 0) + s.perBox[boxId];
          }
          return acc;
        }, {} as { [key: number]: number}),
        subCategorieen: subCategorieStats,
      };
      return hoofdStat;
    });

    setStatistieken(finaleStatistieken);
    setIsLoading(false);
  }, [alleOpdrachten]);

  useEffect(() => {
    if (isOpen) {
      berekenStatistieken();
    }
  }, [isOpen, berekenStatistieken]);

  const sortedStatistieken = useMemo(() => {
    let sortableItems = [...statistieken];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [statistieken, sortConfig]);

  const requestSort = (key: CategorieStatistiek['naam'] | keyof Omit<CategorieStatistiek, 'isHoofd' | 'subCategorieen' | 'perBox'>) => {
    let direction: 'ascending' | 'descending' = 'descending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key: key as any, direction });
  };
  
  const getSortClass = (key: CategorieStatistiek['naam'] | keyof Omit<CategorieStatistiek, 'isHoofd' | 'subCategorieen' | 'perBox'>) => {
    if (!sortConfig || sortConfig.key !== key) return '';
    return sortConfig.direction === 'descending' ? 'sorted-desc' : 'sorted-asc';
  };

  const handleSelectAll = () => {
    const alleSubCats = statistieken.flatMap(s => s.subCategorieen?.map(sub => sub.naam) || []);
    setGeselecteerdeCategorieen([...new Set(alleSubCats)]);
  };

  const handleDeselectAll = () => setGeselecteerdeCategorieen([]);

  const handleHoofdCategorieSelectie = (hoofdStat: CategorieStatistiek) => {
    const subNamen = hoofdStat.subCategorieen?.map(s => s.naam) || [];
    const zijnAllemaalGeselecteerd = subNamen.every(naam => geselecteerdeCategorieen.includes(naam));

    setGeselecteerdeCategorieen(prev => {
        const newSet = new Set(prev);
        if (zijnAllemaalGeselecteerd) {
            subNamen.forEach(naam => newSet.delete(naam));
        } else {
            subNamen.forEach(naam => newSet.add(naam));
        }
        return Array.from(newSet);
    });
  };

  const handleSubCategorieSelectie = (subNaam: string) => {
    setGeselecteerdeCategorieen(prev => 
        prev.includes(subNaam) ? prev.filter(n => n !== subNaam) : [...prev, subNaam]
    );
  };
  
  const toggleHoofdCategorie = (hoofd: string) => {
    setOpenHoofdCategorieen(prev => ({ ...prev, [hoofd]: !prev[hoofd] }));
  };

  if (!isOpen) return null;

  const renderRij = (stat: CategorieStatistiek) => {
    const isHoofd = stat.isHoofd;
    const subNamen = stat.subCategorieen?.map(s => s.naam) || [];
    const isAllesGeselecteerd = isHoofd ? subNamen.every(n => geselecteerdeCategorieen.includes(n)) : geselecteerdeCategorieen.includes(stat.naam);
    const isDeelsGeselecteerd = isHoofd && subNamen.some(n => geselecteerdeCategorieen.includes(n)) && !isAllesGeselecteerd;

    return (
      <tr key={stat.naam} className={isHoofd ? 'hoofd-categorie-rij' : 'sub-categorie-rij'}>
        <td onClick={() => isHoofd && toggleHoofdCategorie(stat.naam)}>
            {isHoofd && <span className={`pijl ${openHoofdCategorieen[stat.naam] ? 'open' : ''}`}>▶</span>}
            {stat.naam}
        </td>
        <td>
          <input
            type="checkbox"
            checked={isAllesGeselecteerd}
            ref={input => { if (input) input.indeterminate = isDeelsGeselecteerd; }}
            onChange={() => isHoofd ? handleHoofdCategorieSelectie(stat) : handleSubCategorieSelectie(stat.naam)}
          />
        </td>
        <td>{stat.totaalOpdrachten}</td>
        <td>{stat.aanHetLeren}</td>
        <td>{stat.pogingen}</td>
        <td>
          {stat.klaarVoorHerhaling > 0 ? (
            <span className="badge">{stat.klaarVoorHerhaling}</span>
          ) : ('-')}
        </td>
        {[0, 1, 2, 3, 4, 5, 6].map(boxId => (
          <td key={boxId} className="box">{stat.perBox[boxId] || 0}</td>
        ))}
      </tr>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content leitner-beheer-modal">
        <div className="modal-header">
          <h2>📚 Leitner Categorie Beheer</h2>
          <button onClick={onClose} className="leitner-modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="controls">
            <button onClick={handleSelectAll}>Selecteer Alles</button>
            <button onClick={handleDeselectAll}>Selecteer Niets</button>
          </div>
          {isLoading ? (
            <p>Statistieken laden...</p>
          ) : (
            <table className="categorie-table">
              <thead>
                <tr>
                  <th rowSpan={2} onClick={() => requestSort('naam')} className={`sortable ${getSortClass('naam')}`}>Categorie</th>
                  <th rowSpan={2}>Selectie</th>
                  <th rowSpan={2} onClick={() => requestSort('totaalOpdrachten')} className={`sortable ${getSortClass('totaalOpdrachten')}`}>Totaal</th>
                  <th rowSpan={2} onClick={() => requestSort('aanHetLeren')} className={`sortable ${getSortClass('aanHetLeren')}`}>Leren</th>
                  <th rowSpan={2} onClick={() => requestSort('pogingen')} className={`sortable ${getSortClass('pogingen')}`}>Pogingen</th>
                  <th rowSpan={2} onClick={() => requestSort('klaarVoorHerhaling')} className={`sortable ${getSortClass('klaarVoorHerhaling')}`}>Klaar</th>
                  <th colSpan={7} className="box-verdeling-header">
                    Box Verdeling
                    <span className="info-icon" onClick={() => setIsUitlegOpen(true)}>&#9432;</span>
                  </th>
                </tr>
                <tr>
                  {[0, 1, 2, 3, 4, 5, 6].map(boxId => (<th key={boxId} className="box-header">B{boxId}</th>))}
                </tr>
              </thead>
              <tbody>
                {sortedStatistieken.map(hoofdStat => (
                    <React.Fragment key={hoofdStat.naam}>
                        {renderRij(hoofdStat)}
                        {openHoofdCategorieen[hoofdStat.naam] && hoofdStat.subCategorieen?.map(subStat => renderRij(subStat))}
                    </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>Sluiten</button>
        </div>
      </div>
      {isUitlegOpen && <BoxUitlegPopup onClose={() => setIsUitlegOpen(false)} />}
    </div>
  );
}; 