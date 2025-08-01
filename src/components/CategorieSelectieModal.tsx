import React, { useState, useMemo, useEffect } from 'react';
import type { Opdracht } from '../data/types';
import './LeitnerCategorieBeheer.css'; // Hergebruik de modal styling

type TabType = 'leitner' | 'highscore' | 'multiplayer' | 'normaal';

interface OpgeslagenCategorieSelectie {
  id: string;
  naam: string;
  categorieen: string[];
  datum: string;
}

interface CategorieSelectieModalProps {
  isOpen: boolean;
  onClose: () => void;
  opdrachten: Opdracht[];
  geselecteerdeCategorieen: string[];
  onCategorieSelectie: (categorie: string) => void;
  onBulkCategorieSelectie: (categorieen: string[], type: 'select' | 'deselect') => void;
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
  const [opgeslagenSelecties, setOpgeslagenSelecties] = useState<OpgeslagenCategorieSelectie[]>([]);
  const [opgeslagenVrijeLeermodusSelecties, setOpgeslagenVrijeLeermodusSelecties] = useState<OpgeslagenCategorieSelectie[]>([]);
  const [toonOpslaanModal, setToonOpslaanModal] = useState(false);
  const [nieuweSelectieNaam, setNieuweSelectieNaam] = useState('');
  const [openHoofdCategorieen, setOpenHoofdCategorieen] = useState<Record<string, boolean>>({});

  // Effect om activeTab bij te werken wanneer initialActiveTab verandert
  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  // Laad opgeslagen selecties bij component mount
  useEffect(() => {
    const opgeslagen = localStorage.getItem('multiplayer_categorie_selecties');
    if (opgeslagen) {
      setOpgeslagenSelecties(JSON.parse(opgeslagen));
    }
    
    const opgeslagenVrijeLeermodus = localStorage.getItem('vrije_leermodus_categorie_selecties');
    if (opgeslagenVrijeLeermodus) {
      setOpgeslagenVrijeLeermodusSelecties(JSON.parse(opgeslagenVrijeLeermodus));
    }
  }, []);

  // Bepaal welke categorie selectie actief is voor de huidige tab
  const getActieveCategorieSelectie = () => {
    switch (activeTab) {
      case 'leitner': return geselecteerdeLeitnerCategorieen;
      case 'highscore': return geselecteerdeHighscoreCategorieen;
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
      case 'normaal':
        return onCategorieSelectie;
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
            if (type === 'select') {
              setGeselecteerdeLeitnerCategorieen([...new Set([...prev, ...categorieen])]);
            } else {
              setGeselecteerdeLeitnerCategorieen(prev.filter(c => !categorieen.includes(c)));
            }
          }
        };
      case 'multiplayer':
        return (categorieen: string[], type: 'select' | 'deselect') => {
          if (setGeselecteerdeMultiplayerCategorieen) {
            const prev = geselecteerdeMultiplayerCategorieen;
            if (type === 'select') {
              setGeselecteerdeMultiplayerCategorieen([...new Set([...prev, ...categorieen])]);
            } else {
              setGeselecteerdeMultiplayerCategorieen(prev.filter(c => !categorieen.includes(c)));
            }
          }
        };
      case 'highscore':
        return (categorieen: string[], type: 'select' | 'deselect') => {
          if (setGeselecteerdeHighscoreCategorieen) {
            const prev = geselecteerdeHighscoreCategorieen;
            if (type === 'select') {
              setGeselecteerdeHighscoreCategorieen([...new Set([...prev, ...categorieen])]);
            } else {
              setGeselecteerdeHighscoreCategorieen(prev.filter(c => !categorieen.includes(c)));
            }
          }
        };
      case 'normaal':
        return onBulkCategorieSelectie;
      default:
        return onBulkCategorieSelectie;
    }
  };

  const actieveCategorieSelectie = getActieveCategorieSelectie();
  const actieveCategorieHandler = getActieveCategorieHandler();
  const actieveBulkHandler = getActieveBulkHandler();

  // Groepeer categorieën per hoofdcategorie
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

  // Alle unieke categorieën uit de opdrachten
  const alleCategorieen = useMemo(() => {
    const categorieen = new Set<string>();
    opdrachten.forEach(opdracht => {
      if (opdracht.Categorie) {
        categorieen.add(opdracht.Categorie);
      }
    });
    return Array.from(categorieen).sort();
  }, [opdrachten]);



  const toggleHoofdCategorie = (hoofd: string) => {
    setOpenHoofdCategorieen(prev => ({ ...prev, [hoofd]: !prev[hoofd] }));
  };

  const handleHoofdCategorieSelectie = (subcategorieen: string[], isGeselecteerd: boolean) => {
    if (isGeselecteerd) {
      actieveBulkHandler(subcategorieen, 'select');
    } else {
      actieveBulkHandler(subcategorieen, 'deselect');
    }
  };

  // Herstel laatste selectie functionaliteit
  const handleHerstelLaatste = () => {
    const opgeslagenSelectie = localStorage.getItem('geselecteerdeCategorieen_normaal');
    if (opgeslagenSelectie) {
      const categorieen = JSON.parse(opgeslagenSelectie);
      actieveBulkHandler(alleCategorieen, 'deselect');
      actieveBulkHandler(categorieen, 'select');
    }
  };

  // Multiplayer selectie opslaan functionaliteit
  const handleOpslaanSelectie = () => {
    const maxSelecties = 5;
    const huidigeSelecties = activeTab === 'multiplayer' ? opgeslagenSelecties : opgeslagenVrijeLeermodusSelecties;
    
    if (huidigeSelecties.length >= maxSelecties) {
      alert('Je kunt maximaal 5 opgeslagen selecties hebben. Verwijder eerst een oude selectie.');
      return;
    }
    setToonOpslaanModal(true);
  };

  const handleBevestigOpslaan = () => {
    if (!nieuweSelectieNaam.trim()) {
      alert('Geef een naam op voor je selectie.');
      return;
    }

    const nieuweSelectie: OpgeslagenCategorieSelectie = {
      id: Date.now().toString(),
      naam: nieuweSelectieNaam.trim(),
      categorieen: [...actieveCategorieSelectie],
      datum: new Date().toISOString()
    };

    if (activeTab === 'multiplayer') {
      const nieuweSelecties = [...opgeslagenSelecties, nieuweSelectie];
      setOpgeslagenSelecties(nieuweSelecties);
      localStorage.setItem('multiplayer_categorie_selecties', JSON.stringify(nieuweSelecties));
    } else if (activeTab === 'normaal') {
      const nieuweSelecties = [...opgeslagenVrijeLeermodusSelecties, nieuweSelectie];
      setOpgeslagenVrijeLeermodusSelecties(nieuweSelecties);
      localStorage.setItem('vrije_leermodus_categorie_selecties', JSON.stringify(nieuweSelecties));
    }
    
    setNieuweSelectieNaam('');
    setToonOpslaanModal(false);
  };

  const handleLaadSelectie = (selectie: OpgeslagenCategorieSelectie) => {
    if (activeTab === 'multiplayer' && setGeselecteerdeMultiplayerCategorieen) {
      setGeselecteerdeMultiplayerCategorieen([...selectie.categorieen]);
    } else if (activeTab === 'normaal' && onBulkCategorieSelectie) {
      // Voor vrije leermodus gebruiken we de normale categorie selectie
      onBulkCategorieSelectie(alleCategorieen, 'deselect');
      onBulkCategorieSelectie(selectie.categorieen, 'select');
    }
  };

  const handleVerwijderSelectie = (id: string) => {
    if (activeTab === 'multiplayer') {
      const nieuweSelecties = opgeslagenSelecties.filter(s => s.id !== id);
      setOpgeslagenSelecties(nieuweSelecties);
      localStorage.setItem('multiplayer_categorie_selecties', JSON.stringify(nieuweSelecties));
    } else if (activeTab === 'normaal') {
      const nieuweSelecties = opgeslagenVrijeLeermodusSelecties.filter(s => s.id !== id);
      setOpgeslagenVrijeLeermodusSelecties(nieuweSelecties);
      localStorage.setItem('vrije_leermodus_categorie_selecties', JSON.stringify(nieuweSelecties));
    }
  };

  const handleHighScoreSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue && onHighScoreSelect) {
      const categories = selectedValue.split(',');
      onHighScoreSelect(categories);
    }
  };

  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'multiplayer': return '🎮 Multiplayer Modus';
      case 'highscore': return '🏆 Highscore Modus';
      case 'normaal': return '📖 Vrije Leermodus';
      case 'leitner': return '📚 Leitner Modus';
    }
  };

  const getTabDescription = (tab: TabType) => {
    switch (tab) {
      case 'multiplayer': return 'Kies categorieën voor multiplayer spelsessies.';
      case 'highscore': return 'Selecteer categorieën voor highscore pogingen en bekijk eerdere recordpogingen.';
      case 'normaal': return 'Selecteer categorieën voor vrije leersessies zonder herhalingen of opslag.';
      case 'leitner': return 'Beheer categorieën voor het Leitner leersysteem met statistieken en box verdeling.';
    }
  };

  const handleSelectAll = () => actieveBulkHandler(alleCategorieen, 'select');
  const handleDeselectAll = () => actieveBulkHandler(alleCategorieen, 'deselect');

  const renderBasisCategorieSelectie = () => (
    <div className="categorie-selectie-container">
      {/* Snelle selecties */}
      <div className="snelle-selecties">
        <h4>Snelle Selecties</h4>
        <div className="snelle-selectie-knoppen">
          <button onClick={handleSelectAll} className="snelle-selectie-knop">
            Selecteer Alles
          </button>
          <button onClick={handleDeselectAll} className="snelle-selectie-knop">
            Deselecteer Alles
          </button>
          {activeTab === 'normaal' && (
            <button onClick={handleHerstelLaatste} className="snelle-selectie-knop">
              Herstel Laatste Selectie
            </button>
          )}
        </div>
      </div>

      {/* Multiplayer opgeslagen selecties */}
      {activeTab === 'multiplayer' && (
        <div className="opgeslagen-selecties">
          <h4>Opgeslagen Selecties</h4>
          <div className="opgeslagen-selecties-lijst">
            {opgeslagenSelecties.map(selectie => (
              <div key={selectie.id} className="opgeslagen-selectie-item">
                <div className="selectie-info">
                  <span className="selectie-naam">{selectie.naam}</span>
                  <span className="selectie-datum">
                    {new Date(selectie.datum).toLocaleDateString()}
                  </span>
                  <span className="selectie-aantal">
                    {selectie.categorieen.length} categorieën
                  </span>
                </div>
                <div className="selectie-acties">
                  <button 
                    onClick={() => handleLaadSelectie(selectie)}
                    className="laad-selectie-knop"
                    title="Laad deze selectie"
                  >
                    📂
                  </button>
                  <button 
                    onClick={() => handleVerwijderSelectie(selectie.id)}
                    className="verwijder-selectie-knop"
                    title="Verwijder deze selectie"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {opgeslagenSelecties.length < 5 && (
              <button 
                onClick={handleOpslaanSelectie}
                className="opslaan-selectie-knop"
                disabled={actieveCategorieSelectie.length === 0}
              >
                💾 Huidige Selectie Opslaan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Vrije Leermodus opgeslagen selecties */}
      {activeTab === 'normaal' && (
        <div className="opgeslagen-selecties">
          <h4>Opgeslagen Selecties</h4>
          <div className="opgeslagen-selecties-lijst">
            {opgeslagenVrijeLeermodusSelecties.map(selectie => (
              <div key={selectie.id} className="opgeslagen-selectie-item">
                <div className="selectie-info">
                  <span className="selectie-naam">{selectie.naam}</span>
                  <span className="selectie-datum">
                    {new Date(selectie.datum).toLocaleDateString()}
                  </span>
                  <span className="selectie-aantal">
                    {selectie.categorieen.length} categorieën
                  </span>
                </div>
                <div className="selectie-acties">
                  <button 
                    onClick={() => handleLaadSelectie(selectie)}
                    className="laad-selectie-knop"
                    title="Laad deze selectie"
                  >
                    📂
                  </button>
                  <button 
                    onClick={() => handleVerwijderSelectie(selectie.id)}
                    className="verwijder-selectie-knop"
                    title="Verwijder deze selectie"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {opgeslagenVrijeLeermodusSelecties.length < 5 && (
              <button 
                onClick={handleOpslaanSelectie}
                className="opslaan-selectie-knop"
                disabled={actieveCategorieSelectie.length === 0}
              >
                💾 Huidige Selectie Opslaan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Highscore recordpogingen */}
      {activeTab === 'highscore' && (
        <div className="recordpogingen">
          <h4>Kies een eerdere recordpoging:</h4>
          <select onChange={handleHighScoreSelect} className="recordpoging-select">
            <option value="">-- Selecteer een recordpoging --</option>
            {highScoreLibrary && Object.entries(highScoreLibrary).map(([categories, data]) => (
              <option key={categories} value={categories}>
                {categories} - {data.score} punten ({data.spelerNaam})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Categorie lijst met hoofdcategorieën */}
      <div className="categorie-lijst">
        <h4>Categorieën</h4>
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
    </div>
  );

  const renderLeitnerRedirect = () => (
    <div className="leitner-redirect">
      <h4>📚 Leitner Categorie Beheer</h4>
      <p>
        Voor gedetailleerde Leitner categorie beheer met statistieken en box verdeling, 
        gebruik de speciale Leitner modal.
      </p>
      <button 
        onClick={() => {
          onClose();
          window.dispatchEvent(new CustomEvent('openLeitnerCategorieBeheer'));
        }}
        className="leitner-redirect-knop"
      >
        🔄 Open Leitner Categorie Beheer
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🎯 CATEGORIE SELECTIE</h3>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>

        {/* Tab navigatie */}
        <div className="tab-navigatie">
          {(['multiplayer', 'highscore', 'normaal', 'leitner'] as TabType[]).map(tab => (
            <button
              key={tab}
              className={`tab-knop ${activeTab === tab ? 'actief' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {getTabTitle(tab)}
            </button>
          ))}
        </div>

        {/* Tab beschrijving */}
        <div className="tab-beschrijving">
          <p>{getTabDescription(activeTab)}</p>
        </div>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 'leitner' ? renderLeitnerRedirect() : renderBasisCategorieSelectie()}
        </div>

        {/* Opslaan modal */}
        {toonOpslaanModal && (
          <div className="opslaan-modal-overlay" onClick={() => setToonOpslaanModal(false)}>
            <div className="opslaan-modal-content" onClick={(e) => e.stopPropagation()}>
              <h4>💾 Selectie Opslaan</h4>
              <p>Geef een naam op voor je categorie selectie:</p>
              <input
                type="text"
                value={nieuweSelectieNaam}
                onChange={(e) => setNieuweSelectieNaam(e.target.value)}
                placeholder="Bijv. 'Anatomie Focus'"
                className="selectie-naam-input"
                maxLength={30}
              />
              <div className="opslaan-modal-acties">
                <button onClick={() => setToonOpslaanModal(false)} className="annuleer-knop">
                  Annuleren
                </button>
                <button onClick={handleBevestigOpslaan} className="bevestig-knop">
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};