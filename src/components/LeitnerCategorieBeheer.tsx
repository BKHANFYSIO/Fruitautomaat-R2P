import React, { useState, useEffect, useMemo } from 'react';
import { getLeerDataManager } from '../data/leerDataManager';
import './LeitnerCategorieBeheer.css';

const BoxUitlegPopup = ({ onClose }: { onClose: () => void }) => (
  <div className="box-uitleg-popup-overlay">
    <div className="box-uitleg-popup-content">
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
  setGeselecteerdeCategorieen: (categorieen: string[]) => void;
  alleCategorieen: string[];
  alleOpdrachten: { Categorie: string }[]; // Voeg alle opdrachten toe
}

interface CategorieStatistiek {
  categorie: string;
  totaalOpdrachten: number; // Nieuw
  aanHetLeren: number; // Vervangt geleerdeOpdrachten
  pogingen: number; // Vervangt totaalGestart
  klaarVoorHerhaling: number; // Vervangt vandaagTeHerhalen
  perBox: { [boxId: number]: number };
}

type SortConfig = {
  key: keyof CategorieStatistiek;
  direction: 'ascending' | 'descending';
} | null;

export const LeitnerCategorieBeheer: React.FC<LeitnerCategorieBeheerProps> = ({
  isOpen,
  onClose,
  geselecteerdeCategorieen,
  setGeselecteerdeCategorieen,
  alleCategorieen,
  alleOpdrachten // Ontvang alle opdrachten
}) => {
  const [categorieStatistieken, setCategorieStatistieken] = useState<CategorieStatistiek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [isUitlegOpen, setIsUitlegOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const berekenCategorieStatistieken = () => {
        setIsLoading(true);
        const leerDataManager = getLeerDataManager();
        const leitnerData = leerDataManager.loadLeitnerData();
        const leerData = leerDataManager.loadLeerData();

        const opdrachtenPerCategorie = alleOpdrachten.reduce((acc, op) => {
          acc[op.Categorie] = (acc[op.Categorie] || 0) + 1;
          return acc;
        }, {} as { [cat: string]: number });

        const statistieken: CategorieStatistiek[] = alleCategorieen.map(categorie => {
          const totaalOpdrachten = opdrachtenPerCategorie[categorie] || 0;
          let aanHetLeren = 0;
          let klaarVoorHerhaling = 0;
          const perBox: { [boxId: number]: number } = {};

          leitnerData.boxes.forEach(box => {
            const categorieOpdrachten = box.opdrachten.filter(opdrachtId => {
              const opdrachtCategorie = opdrachtId.split('_')[0];
              return opdrachtCategorie === categorie;
            });
            
            perBox[box.boxId] = categorieOpdrachten.length;
            aanHetLeren += categorieOpdrachten.length;

            const interval = leitnerData.boxIntervallen[box.boxId] || 1440;
            const nu = new Date();

            categorieOpdrachten.forEach(opdrachtId => {
              const laatsteReview = new Date(leitnerData.opdrachtReviewTimes[opdrachtId] || 0);
              const minutenSindsLaatsteReview = Math.floor(
                (nu.getTime() - laatsteReview.getTime()) / (1000 * 60)
              );
              if (minutenSindsLaatsteReview >= interval) {
                klaarVoorHerhaling++;
              }
            });
          });

          let pogingen = 0;
          if (leerData) {
            Object.values(leerData.opdrachten).forEach(opdracht => {
              if (opdracht.categorie === categorie) {
                pogingen += opdracht.aantalKeerGedaan;
              }
            });
          }

          return {
            categorie,
            totaalOpdrachten,
            aanHetLeren,
            pogingen,
            klaarVoorHerhaling,
            perBox
          };
        });

        setCategorieStatistieken(statistieken);
        setIsLoading(false);
      };

      berekenCategorieStatistieken();
    }
  }, [isOpen, alleCategorieen, alleOpdrachten]);

  const sortedStatistieken = useMemo(() => {
    let sortableItems = [...categorieStatistieken];
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
  }, [categorieStatistieken, sortConfig]);

  const requestSort = (key: keyof CategorieStatistiek) => {
    let direction: 'ascending' | 'descending' = 'descending'; // Standaard van hoog naar laag
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const getSortClass = (key: keyof CategorieStatistiek) => {
    if (!sortConfig || sortConfig.key !== key) {
      return '';
    }
    return sortConfig.direction === 'descending' ? 'sorted-desc' : 'sorted-asc';
  };

  const handleCategorieToggle = (categorie: string) => {
    const updatedSelection = geselecteerdeCategorieen.includes(categorie)
      ? geselecteerdeCategorieen.filter(c => c !== categorie)
      : [...geselecteerdeCategorieen, categorie];
    setGeselecteerdeCategorieen(updatedSelection);
  };

  const handleSelecteerAlles = () => setGeselecteerdeCategorieen(alleCategorieen);
  const handleSelecteerNiets = () => setGeselecteerdeCategorieen([]);



  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>📚 Leitner Categorie Beheer</h2>
          <button onClick={onClose} className="leitner-modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="controls">
            <button onClick={handleSelecteerAlles}>Selecteer Alles</button>
            <button onClick={handleSelecteerNiets}>Selecteer Niets</button>
          </div>
          {isLoading ? (
            <p>Statistieken laden...</p>
          ) : (
            <table className="categorie-table">
              <thead>
                <tr>
                  <th rowSpan={2} onClick={() => requestSort('categorie')} className={`sortable ${getSortClass('categorie')}`}>
                    Categorie
                  </th>
                  <th rowSpan={2}>Selectie</th>
                  <th rowSpan={2} onClick={() => requestSort('totaalOpdrachten')} className={`sortable ${getSortClass('totaalOpdrachten')}`}>
                    <span className="tooltip-container">
                      Totaal
                      <span className="tooltip-text">Totaal aantal beschikbare opdrachten voor deze categorie in het bronbestand.</span>
                    </span>
                  </th>
                  <th rowSpan={2} onClick={() => requestSort('aanHetLeren')} className={`sortable ${getSortClass('aanHetLeren')}`}>
                    <span className="tooltip-container">
                      Aan het leren
                      <span className="tooltip-text">Aantal unieke opdrachten die je aan het leren bent (in een van de boxen).</span>
                    </span>
                  </th>
                  <th rowSpan={2} onClick={() => requestSort('pogingen')} className={`sortable ${getSortClass('pogingen')}`}>
                    <span className="tooltip-container">
                      Pogingen
                      <span className="tooltip-text">Totaal aantal keren dat je opdrachten in deze categorie hebt gedaan.</span>
                    </span>
                  </th>
                  <th rowSpan={2} onClick={() => requestSort('klaarVoorHerhaling')} className={`sortable ${getSortClass('klaarVoorHerhaling')}`}>
                    <span className="tooltip-container">
                      Klaar voor herhaling
                      <span className="tooltip-text">Aantal opdrachten dat nu herhaald kan worden volgens het Leitner-systeem.</span>
                    </span>
                  </th>
                  <th colSpan={7} className="box-verdeling-header">
                    Box Verdeling
                    <span className="info-icon" onClick={() => setIsUitlegOpen(true)}>
                      &#9432;
                    </span>
                  </th>
                </tr>
                <tr>
                  {[0, 1, 2, 3, 4, 5, 6].map(boxId => (
                    <th key={boxId} className="box-header">
                      B{boxId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStatistieken.map((stat) => (
                  <tr key={stat.categorie}>
                    <td>{stat.categorie}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={geselecteerdeCategorieen.includes(stat.categorie)}
                        onChange={() => handleCategorieToggle(stat.categorie)}
                      />
                    </td>
                    <td>{stat.totaalOpdrachten}</td>
                    <td>{stat.aanHetLeren}</td>
                    <td>{stat.pogingen}</td>
                    <td>
                      {stat.klaarVoorHerhaling > 0 ? (
                        <span className="badge">{stat.klaarVoorHerhaling}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    {[0, 1, 2, 3, 4, 5, 6].map(boxId => (
                      <td key={boxId} className="box">
                        {stat.perBox[boxId] || 0}
                      </td>
                    ))}
                  </tr>
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