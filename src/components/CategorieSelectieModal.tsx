import React, { useState, useMemo, useEffect } from 'react';
import type { Opdracht } from '../data/types';
import './LeitnerCategorieBeheer.css'; // Hergebruik de modal styling

type TabType = 'leitner' | 'highscore' | 'multiplayer' | 'normaal';

interface CategorieSelectieModalProps {
  isOpen: boolean;
  onClose: () => void;
  opdrachten: Opdracht[];
  geselecteerdeCategorieen: string[];
  onCategorieSelectie: (categorie: string) => void;
  onBulkCategorieSelectie: (categorieen: string[], type: 'select' | 'deselect') => void;
  gameMode?: 'single' | 'multi';
  highScoreLibrary?: { [key: string]: { score: number; spelerNaam: string } };
  onHighScoreSelect?: (categories: string[]) => void;
  // Nieuwe props voor Leitner
  geselecteerdeLeitnerCategorieen?: string[];
  setGeselecteerdeLeitnerCategorieen?: (categorieen: string[]) => void;
  // Nieuwe props voor multiplayer
  geselecteerdeMultiplayerCategorieen?: string[];
  setGeselecteerdeMultiplayerCategorieen?: (categorieen: string[]) => void;
  // Nieuwe props voor highscore
  geselecteerdeHighscoreCategorieen?: string[];
  setGeselecteerdeHighscoreCategorieen?: (categorieen: string[]) => void;
  // Props voor directe tab navigatie
  initialActiveTab?: TabType;
}

export const CategorieSelectieModal = ({
  isOpen,
  onClose,
  opdrachten,
  geselecteerdeCategorieen,
  onCategorieSelectie,
  onBulkCategorieSelectie,
  gameMode,
  highScoreLibrary,
  onHighScoreSelect,
  geselecteerdeLeitnerCategorieen = [],
  setGeselecteerdeLeitnerCategorieen,
  geselecteerdeMultiplayerCategorieen = [],
  setGeselecteerdeMultiplayerCategorieen,
  geselecteerdeHighscoreCategorieen = [],
  setGeselecteerdeHighscoreCategorieen,
  initialActiveTab,
}: CategorieSelectieModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialActiveTab || 'normaal');

  // Effect om activeTab bij te werken wanneer initialActiveTab verandert
  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  // Bepaal welke categorie selectie actief is voor de huidige tab
  const getActieveCategorieSelectie = () => {
    switch (activeTab) {
      case 'leitner': return geselecteerdeLeitnerCategorieen;
      case 'highscore': return geselecteerdeHighscoreCategorieen; // ✅ Nieuwe aparte state
      case 'multiplayer': return geselecteerdeMultiplayerCategorieen;
      case 'normaal': return geselecteerdeCategorieen;
      default: return geselecteerdeCategorieen;
    }
  };

  const getActieveCategorieHandler = () => {
    switch (activeTab) {
      case 'leitner': 
        return (categorie: string) => {
          if (setGeselecteerdeLeitnerCategorieen) {
            const prev = geselecteerdeLeitnerCategorieen;
            setGeselecteerdeLeitnerCategorieen(
              prev.includes(categorie) 
                ? prev.filter((c: string) => c !== categorie)
                : [...prev, categorie]
            );
          }
        };
      case 'multiplayer':
        return (categorie: string) => {
          if (setGeselecteerdeMultiplayerCategorieen) {
            const prev = geselecteerdeMultiplayerCategorieen;
            setGeselecteerdeMultiplayerCategorieen(
              prev.includes(categorie) 
                ? prev.filter((c: string) => c !== categorie)
                : [...prev, categorie]
            );
          }
        };
      case 'highscore':
        return (categorie: string) => {
          if (setGeselecteerdeHighscoreCategorieen) {
            const prev = geselecteerdeHighscoreCategorieen;
            setGeselecteerdeHighscoreCategorieen(
              prev.includes(categorie) 
                ? prev.filter((c: string) => c !== categorie)
                : [...prev, categorie]
            );
          }
        };
      default:
        return onCategorieSelectie;
    }
  };

  const getActieveBulkHandler = () => {
    switch (activeTab) {
      case 'leitner':
        return (categorieen: string[], type: 'select' | 'deselect') => {
          if (setGeselecteerdeLeitnerCategorieen) {
            const prev = geselecteerdeLeitnerCategorieen;
            const categorieenSet = new Set(prev);
            if (type === 'select') {
              categorieen.forEach(cat => categorieenSet.add(cat));
            } else {
              categorieen.forEach(cat => categorieenSet.delete(cat));
            }
            setGeselecteerdeLeitnerCategorieen(Array.from(categorieenSet));
          }
        };
      case 'multiplayer':
        return (categorieen: string[], type: 'select' | 'deselect') => {
          if (setGeselecteerdeMultiplayerCategorieen) {
            const prev = geselecteerdeMultiplayerCategorieen;
            const categorieenSet = new Set(prev);
            if (type === 'select') {
              categorieen.forEach(cat => categorieenSet.add(cat));
            } else {
              categorieen.forEach(cat => categorieenSet.delete(cat));
            }
            setGeselecteerdeMultiplayerCategorieen(Array.from(categorieenSet));
          }
        };
      case 'highscore':
        return (categorieen: string[], type: 'select' | 'deselect') => {
          if (setGeselecteerdeHighscoreCategorieen) {
            const prev = geselecteerdeHighscoreCategorieen;
            const categorieenSet = new Set(prev);
            if (type === 'select') {
              categorieen.forEach(cat => categorieenSet.add(cat));
            } else {
              categorieen.forEach(cat => categorieenSet.delete(cat));
            }
            setGeselecteerdeHighscoreCategorieen(Array.from(categorieenSet));
          }
        };
      default:
        return onBulkCategorieSelectie;
    }
  };

  const actieveCategorieSelectie = getActieveCategorieSelectie();
  const actieveCategorieHandler = getActieveCategorieHandler();
  const actieveBulkHandler = getActieveBulkHandler();

  const [openHoofdCategorieen, setOpenHoofdCategorieen] = useState<Record<string, boolean>>({});

  const gegroepeerdeCategorieen = useMemo(() => {
    const groepen: Record<string, string[]> = { 'Overig': [] };
    opdrachten.forEach(opdracht => {
      const hoofdCat = opdracht.Hoofdcategorie || 'Overig';
      if (!groepen[hoofdCat]) {
        groepen[hoofdCat] = [];
      }
      if (!groepen[hoofdCat].includes(opdracht.Categorie)) {
        groepen[hoofdCat].push(opdracht.Categorie);
      }
    });
    if (groepen['Overig'].length === 0) {
      delete groepen['Overig'];
    }
    return groepen;
  }, [opdrachten]);

  const toggleHoofdCategorie = (hoofd: string) => {
    setOpenHoofdCategorieen(prev => ({ ...prev, [hoofd]: !prev[hoofd] }));
  };

  const handleHoofdCategorieSelectie = (subcategorieen: string[], isGeselecteerd: boolean) => {
    actieveBulkHandler(subcategorieen, isGeselecteerd ? 'deselect' : 'select');
  };

  const alleCategorieen = useMemo(() => {
    return [...new Set(opdrachten.map(o => o.Categorie))];
  }, [opdrachten]);

  const handleSelectAll = () => actieveBulkHandler(alleCategorieen, 'select');
  const handleDeselectAll = () => actieveBulkHandler(alleCategorieen, 'deselect');
  
  const handleHighScoreSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value;
    if (selectedKey && setGeselecteerdeHighscoreCategorieen) {
      // Herstel naar highscore categorieën
      setGeselecteerdeHighscoreCategorieen(selectedKey.split(','));
    } else if (onHighScoreSelect) {
      // Fallback naar oude methode
      onHighScoreSelect(selectedKey ? selectedKey.split(',') : alleCategorieen);
    }
  };

  const highScoresExist = highScoreLibrary && Object.keys(highScoreLibrary).length > 0;

  const handleHerstelLaatste = () => {
    const opgeslagenSelectie = localStorage.getItem('geselecteerdeCategorieen_normaal');
    if (opgeslagenSelectie && onHighScoreSelect) {
      onHighScoreSelect(JSON.parse(opgeslagenSelectie));
    }
  };

  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'leitner': return '📚 Leitner Modus';
      case 'highscore': return '🏆 Highscore Modus';
      case 'multiplayer': return '🎮 Multiplayer Modus';
      case 'normaal': return '📖 Normale Leermodus';
    }
  };

  const getTabDescription = (tab: TabType) => {
    switch (tab) {
      case 'leitner': return 'Beheer categorieën voor het Leitner leersysteem met statistieken en box verdeling.';
      case 'highscore': return 'Selecteer categorieën voor highscore pogingen en bekijk eerdere recordpogingen.';
      case 'multiplayer': return 'Kies categorieën voor multiplayer spelsessies.';
      case 'normaal': return 'Selecteer categorieën voor normale leersessies zonder Leitner systeem.';
    }
  };

  // Render de basis categorie selectie (voor alle tabs behalve Leitner)
  const renderBasisCategorieSelectie = () => (
    <>
      <div className="controls">
        <button onClick={handleSelectAll}>Selecteer Alles</button>
        <button onClick={handleDeselectAll}>Deselecteer Alles</button>
      </div>
      
      <div className="categorie-lijst">
        {Object.entries(gegroepeerdeCategorieen).map(([hoofd, subs]) => {
            const isAllesGeselecteerd = subs.every(sub => actieveCategorieSelectie.includes(sub));
            const isDeelsGeselecteerd = subs.some(sub => actieveCategorieSelectie.includes(sub)) && !isAllesGeselecteerd;
            return (
                <div key={hoofd} className="hoofd-categorie-rij">
                    <div className="hoofd-categorie-header" onClick={() => toggleHoofdCategorie(hoofd)}>
                        <input
                            type="checkbox"
                            checked={isAllesGeselecteerd}
                            ref={input => { if (input) input.indeterminate = isDeelsGeselecteerd; }}
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
                                checked={actieveCategorieSelectie.includes(sub)}
                                onChange={() => actieveCategorieHandler(sub)}
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
    </>
  );

  // Render de Leitner redirect (alleen voor Leitner tab)
  const renderLeitnerRedirect = () => {
    return (
      <div className="leitner-redirect">
        <div className="leitner-info">
          <h3>📚 Leitner Categorie Beheer</h3>
          <p>Voor de volledige Leitner functionaliteit met statistieken, box verdeling en gedetailleerde informatie, gebruik de "Pas te leren categorieën aan" knop in het menu.</p>
          <p>Deze knop opent de volledige Leitner interface met:</p>
          <ul>
            <li>📊 Gedetailleerde statistieken per categorie</li>
            <li>📦 Box verdeling (B0-B6)</li>
            <li>🔄 Aantal pogingen en herhalingen</li>
            <li>⏰ Klaar voor herhaling indicatoren</li>
            <li>📈 Sorteerbare tabellen</li>
          </ul>
          <button 
            className="leitner-redirect-button"
            onClick={() => {
              onClose(); // Sluit deze modal
              // Open de LeitnerCategorieBeheer modal via een custom event
              window.dispatchEvent(new CustomEvent('openLeitnerCategorieBeheer'));
            }}
          >
            🔗 Open Volledige Leitner Interface
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content leitner-beheer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎯 Categorie Selectie</h2>
          <button onClick={onClose} className="leitner-modal-close-button">&times;</button>
        </div>
        
        {/* Tabbladen */}
        <div className="tab-navigation">
          {(['normaal', 'leitner', 'highscore', 'multiplayer'] as TabType[]).map(tab => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {getTabTitle(tab)}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {/* Tab beschrijving */}
          <div className="tab-description">
            <p>{getTabDescription(activeTab)}</p>
          </div>

          {/* Tab-specifieke content */}
          {activeTab === 'highscore' && (
            <div className="snelle-selecties">
              <h4>Snelle Selecties</h4>
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
              <button onClick={handleHerstelLaatste} className="categorie-filter-knop herstel">
                🔄 Herstel Laatste Selectie
              </button>
            </div>
          )}

          {/* Render de juiste content op basis van de actieve tab */}
          {activeTab === 'leitner' ? renderLeitnerRedirect() : renderBasisCategorieSelectie()}
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>Sluiten</button>
        </div>
      </div>
    </div>
  );
};