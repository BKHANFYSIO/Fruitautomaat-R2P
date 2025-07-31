import React, { useState, useMemo } from 'react';
import type { Opdracht } from '../data/types';

interface CategorieFilterProps {
  opdrachten: Opdracht[];
  geselecteerdeCategorieen: string[];
  onCategorieSelectie: (categorie: string) => void;
  onBulkCategorieSelectie: (categorieen: string[], type: 'select' | 'deselect') => void;
  gameMode?: 'single' | 'multi';
  highScoreLibrary?: { [key: string]: { score: number; spelerNaam: string } };
  onHighScoreSelect?: (categories: string[]) => void;
}

export const CategorieFilter = ({
  opdrachten,
  geselecteerdeCategorieen,
  onCategorieSelectie,
  onBulkCategorieSelectie,
  gameMode,
  highScoreLibrary,
  onHighScoreSelect,
}: CategorieFilterProps) => {
  const [openHoofdCategorieen, setOpenHoofdCategorieen] = useState<Record<string, boolean>>({});

  const gegroepeerdeCategorieen = useMemo(() => {
    const groepen: Record<string, string[]> = {
      'Overig': []
    };

    const alleSubcategorieen = new Set<string>();

    opdrachten.forEach(opdracht => {
      alleSubcategorieen.add(opdracht.Categorie);
      if (opdracht.Hoofdcategorie) {
        if (!groepen[opdracht.Hoofdcategorie]) {
          groepen[opdracht.Hoofdcategorie] = [];
        }
        if (!groepen[opdracht.Hoofdcategorie].includes(opdracht.Categorie)) {
          groepen[opdracht.Hoofdcategorie].push(opdracht.Categorie);
        }
      } else {
        if (!groepen['Overig'].includes(opdracht.Categorie)) {
          groepen['Overig'].push(opdracht.Categorie);
        }
      }
    });

    if (groepen['Overig'].length === 0) {
      delete groepen['Overig'];
    }
    
    // Zorg ervoor dat elke subcategorie maar één keer voorkomt
    Object.keys(groepen).forEach(hoofd => {
        groepen[hoofd] = [...new Set(groepen[hoofd])];
    });

    return groepen;
  }, [opdrachten]);

  const toggleHoofdCategorie = (hoofd: string) => {
    setOpenHoofdCategorieen(prev => ({ ...prev, [hoofd]: !prev[hoofd] }));
  };

  const handleHoofdCategorieSelectie = (subcategorieen: string[], isGeselecteerd: boolean) => {
    onBulkCategorieSelectie(subcategorieen, isGeselecteerd ? 'deselect' : 'select');
  };

  const alleCategorieen = useMemo(() => {
    return [...new Set(opdrachten.map(o => o.Categorie))];
  }, [opdrachten]);

  const handleSelectAll = () => {
    onBulkCategorieSelectie(alleCategorieen, 'select');
  };

  const handleDeselectAll = () => {
    onBulkCategorieSelectie(alleCategorieen, 'deselect');
  };
  
  const handleHighScoreSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value;
    if (onHighScoreSelect) {
        if (selectedKey) {
            const categories = selectedKey.split(',');
            onHighScoreSelect(categories);
        } else {
            onHighScoreSelect(alleCategorieen);
        }
    }
  };

  const highScoresExist = highScoreLibrary && Object.keys(highScoreLibrary).length > 0;

  return (
    <div className="categorie-filter-container">
      <div className="categorie-filter-acties">
        <button onClick={handleSelectAll} className="categorie-filter-knop selecteer">
          ✅ Alles Selecteren
        </button>
        <button onClick={handleDeselectAll} className="categorie-filter-knop deselecteer">
          ❌ Alles Deselecteren
        </button>
      </div>
      
      {gameMode === 'single' && highScoresExist && (
        <div className="recordpoging-selector">
          <label htmlFor="highscore-select">
            <strong>Kies een eerdere recordpoging:</strong>
          </label>
          <p>Selecteer een eerdere recordpoging om dezelfde categorieën te laden.</p>
          <select id="highscore-select" onChange={handleHighScoreSelect}>
            <option value="">-- Herstel naar alle categorieën --</option>
            {Object.entries(highScoreLibrary!).map(([key, value]) => (
              <option key={key} value={key}>
                {value.score.toFixed(1)} pnt door {value.spelerNaam} ({key.replace(/,/g, ', ')})
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="categorie-lijst">
        {Object.entries(gegroepeerdeCategorieen).map(([hoofd, subs]) => {
            const isAllesGeselecteerd = subs.every(sub => geselecteerdeCategorieen.includes(sub));
            const isDeelsGeselecteerd = subs.some(sub => geselecteerdeCategorieen.includes(sub)) && !isAllesGeselecteerd;

            return (
                <div key={hoofd} className="hoofd-categorie-groep">
                    <div className="hoofd-categorie-header" onClick={() => toggleHoofdCategorie(hoofd)}>
                        <input
                            type="checkbox"
                            checked={isAllesGeselecteerd}
                            ref={input => {
                                if (input) input.indeterminate = isDeelsGeselecteerd;
                            }}
                            onChange={() => handleHoofdCategorieSelectie(subs, isAllesGeselecteerd)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <span className="hoofd-categorie-naam">{hoofd}</span>
                        <span className={`pijl ${openHoofdCategorieen[hoofd] ? 'open' : ''}`}>▶</span>
                    </div>
                    {openHoofdCategorieen[hoofd] && (
                        <div className="sub-categorie-lijst">
                        {subs.map(sub => (
                            <label key={sub} className="sub-categorie-label">
                            <input
                                type="checkbox"
                                checked={geselecteerdeCategorieen.includes(sub)}
                                onChange={() => onCategorieSelectie(sub)}
                            />
                            {sub}
                            </label>
                        ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
}; 