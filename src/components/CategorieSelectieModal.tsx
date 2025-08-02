import React, { useState, useMemo, useEffect } from 'react';
import type { Opdracht } from '../data/types';
import './LeitnerCategorieBeheer.css'; // Hergebruik de modal styling

// Toast melding component
const ToastMelding = ({ bericht, isZichtbaar, onClose }: { bericht: string; isZichtbaar: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (isZichtbaar) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isZichtbaar, onClose]);

  return (
    <div className={`toast-melding ${isZichtbaar ? 'zichtbaar' : ''}`}>
      <div className="toast-content">
        <span className="toast-icon">✅</span>
        <span className="toast-bericht">{bericht}</span>
      </div>
    </div>
  );
};

type TabType = 'leitner' | 'highscore' | 'multiplayer' | 'normaal';

const getBronIconen = (opdrachten: Opdracht[], hoofd: string, sub: string) => {
  const relevanteOpdrachten = opdrachten.filter(op => (op.Hoofdcategorie || 'Overig') === hoofd && op.Categorie === sub);
  const bronnen = new Set(relevanteOpdrachten.map(op => op.bron));
  
  let iconen = '';
  if (bronnen.has('systeem')) iconen += '⚙️';
  if (bronnen.has('gebruiker')) iconen += '👤';
  
  return <span className="categorie-bron-iconen" title={`Bronnen: ${Array.from(bronnen).join(', ')}`}>{iconen}</span>;
};

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
  opdrachtBronFilter: 'alle' | 'systeem' | 'gebruiker';
  setOpdrachtBronFilter: (filter: 'alle' | 'systeem' | 'gebruiker') => void;
  onOpenLeitnerBeheer: () => void;
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
  opdrachtBronFilter,
  setOpdrachtBronFilter,
  onOpenLeitnerBeheer,
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
  const [toastBericht, setToastBericht] = useState('');
  const [isToastZichtbaar, setIsToastZichtbaar] = useState(false);
  
  // Sorteer functionaliteit
  const [sortConfig, setSortConfig] = useState<{
    key: 'naam' | 'aantalOpdrachten' | 'geselecteerd';
    direction: 'ascending' | 'descending';
  } | null>(null);

  // Effect om activeTab bij te werken wanneer initialActiveTab verandert
  useEffect(() => {
    if (isOpen && initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [isOpen, initialActiveTab]);

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

  const gefilterdeOpdrachten = useMemo(() => {
    if (opdrachtBronFilter === 'alle') return opdrachten;
    return opdrachten.filter(op => op.bron === opdrachtBronFilter);
  }, [opdrachten, opdrachtBronFilter]);

  const gegroepeerdeCategorieen = useMemo(() => {
    const groepen: Record<string, string[]> = { 'Overig': [] };
    gefilterdeOpdrachten.forEach(opdracht => {
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
  }, [gefilterdeOpdrachten]);

  

  const alleCategorieen = useMemo(() => {
    const uniekeNamen = new Set<string>();
    opdrachten.forEach(op => {
      const uniekeIdentifier = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
      uniekeNamen.add(uniekeIdentifier);
    });
    return [...uniekeNamen];
  }, [opdrachten]);

  const toggleHoofdCategorie = (hoofd: string) => {
    setOpenHoofdCategorieen(prev => ({ ...prev, [hoofd]: !prev[hoofd] }));
  };

  const handleHoofdCategorieSelectie = (hoofd: string, subcategorieen: string[], isGeselecteerd: boolean) => {
    const uniekeSubcategorieen = subcategorieen.map(sub => `${hoofd} - ${sub}`);
    if (isGeselecteerd) {
      actieveBulkHandler(uniekeSubcategorieen, 'deselect');
    } else {
      actieveBulkHandler(uniekeSubcategorieen, 'select');
    }
  };

  const handleOpslaanSelectie = () => {
    const maxSelecties = 5;
    const huidigeSelecties = activeTab === 'multiplayer' ? opgeslagenSelecties : opgeslagenVrijeLeermodusSelecties;
    
    if (huidigeSelecties.length >= maxSelecties) {
      setToastBericht('Je kunt maximaal 5 opgeslagen selecties hebben. Verwijder eerst een oude selectie.');
      setIsToastZichtbaar(true);
      return;
    }
    setToonOpslaanModal(true);
  };

  const handleBevestigOpslaan = () => {
    if (!nieuweSelectieNaam.trim()) {
      setToastBericht('Geef een naam op voor je selectie.');
      setIsToastZichtbaar(true);
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
    setToastBericht('Selectie opgeslagen!');
    setIsToastZichtbaar(true);
  };

  const handleLaadSelectie = (selectie: OpgeslagenCategorieSelectie) => {
    if (activeTab === 'multiplayer' && setGeselecteerdeMultiplayerCategorieen) {
      setGeselecteerdeMultiplayerCategorieen([...selectie.categorieen]);
      setToastBericht(`Selectie "${selectie.naam}" is geladen!`);
      setIsToastZichtbaar(true);
    } else if (activeTab === 'normaal') {
      actieveBulkHandler([], 'select'); // Clear current selection
      actieveBulkHandler(selectie.categorieen, 'select');
      setToastBericht(`Selectie "${selectie.naam}" is geladen!`);
      setIsToastZichtbaar(true);
    }
  };
  
  const handleVerwijderSelectie = (id: string) => {
    if (activeTab === 'multiplayer') {
      const nieuweSelecties = opgeslagenSelecties.filter(s => s.id !== id);
      setOpgeslagenSelecties(nieuweSelecties);
      localStorage.setItem('multiplayer_categorie_selecties', JSON.stringify(nieuweSelecties));
      setToastBericht('Selectie verwijderd!');
      setIsToastZichtbaar(true);
    } else if (activeTab === 'normaal') {
      const nieuweSelecties = opgeslagenVrijeLeermodusSelecties.filter(s => s.id !== id);
      setOpgeslagenVrijeLeermodusSelecties(nieuweSelecties);
      localStorage.setItem('vrije_leermodus_categorie_selecties', JSON.stringify(nieuweSelecties));
      setToastBericht('Selectie verwijderd!');
      setIsToastZichtbaar(true);
    }
  };

  const handleHighScoreSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue && onHighScoreSelect) {
      const categories = selectedValue.split(',');
      onHighScoreSelect(categories);
      
      if (setGeselecteerdeHighscoreCategorieen) {
        setGeselecteerdeHighscoreCategorieen(categories);
        setToastBericht(`Recordpoging geladen! Categorieën aangepast.`);
        setIsToastZichtbaar(true);
      }
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
  
  const handleSelecteerBron = (bron: 'systeem' | 'gebruiker') => {
    const bronCategorieen = opdrachten
      .filter(op => op.bron === bron)
      .map(op => `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`);
    
    actieveBulkHandler(alleCategorieen, 'deselect'); // Deselect all from current view first
    actieveBulkHandler([...new Set(bronCategorieen)], 'select');
  };

  const requestSort = (key: 'naam' | 'aantalOpdrachten' | 'geselecteerd') => {
    let direction: 'ascending' | 'descending' = 'descending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const getSortClass = (key: 'naam' | 'aantalOpdrachten' | 'geselecteerd') => {
    if (!sortConfig || sortConfig.key !== key) return '';
    return sortConfig.direction === 'descending' ? 'sorted-desc' : 'sorted-asc';
  };

  const getAantalOpdrachten = (hoofd: string, sub: string) => {
    return gefilterdeOpdrachten.filter(opdracht => (opdracht.Hoofdcategorie || 'Overig') === hoofd && opdracht.Categorie === sub).length;
  };

  const getGesorteerdeCategorieen = () => {
    const categorieenMetData = Object.entries(gegroepeerdeCategorieen).map(([hoofd, subs]) => ({
      hoofd,
      subs,
      totaalOpdrachten: subs.reduce((sum, sub) => sum + getAantalOpdrachten(hoofd, sub), 0)
    }));

    if (!sortConfig) return categorieenMetData;

    return categorieenMetData.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'naam':
          aValue = a.hoofd.toLowerCase();
          bValue = b.hoofd.toLowerCase();
          break;
        case 'aantalOpdrachten':
          aValue = a.totaalOpdrachten;
          bValue = b.totaalOpdrachten;
          break;
        case 'geselecteerd':
          aValue = 0;
          bValue = 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const renderBasisCategorieSelectie = () => (
    <div className="categorie-selectie-container">
      <div className="snelle-selecties">
        <h4>Snelle Selecties</h4>
        <div className="snelle-selectie-knoppen">
          <button onClick={() => actieveBulkHandler(alleCategorieen, 'select')} className="snelle-selectie-knop">
            Alles
          </button>
          <button onClick={() => actieveBulkHandler(alleCategorieen, 'deselect')} className="snelle-selectie-knop">
            Niets
          </button>
          <button onClick={() => handleSelecteerBron('systeem')} className="snelle-selectie-knop">
            ⚙️ Alleen Systeem
          </button>
          <button onClick={() => handleSelecteerBron('gebruiker')} className="snelle-selectie-knop">
            👤 Alleen Eigen
          </button>
        </div>
      </div>
      
      {activeTab === 'multiplayer' && (
        <div className="opgeslagen-selecties-sectie">
          <h4>📚 Opgeslagen Selecties</h4>
          {opgeslagenSelecties.length > 0 ? (
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
                      title="Herstel deze selectie"
                    >
                      🔄
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
            </div>
          ) : (
            <div className="geen-selecties-melding">
              <p>Nog geen selecties opgeslagen. Maak een selectie en klik op de 'Huidige Selectie Opslaan' knop.</p>
            </div>
          )}
          
          <div className="opslaan-sectie">
            <button 
              onClick={handleOpslaanSelectie}
              disabled={actieveCategorieSelectie.length === 0 || opgeslagenSelecties.length >= 5}
              className="opslaan-selectie-knop"
            >
              💾 Huidige Selectie Opslaan
            </button>
            {opgeslagenSelecties.length >= 5 && (
              <p className="max-selecties-melding">
                Maximum van 5 opgeslagen selecties bereikt. Verwijder eerst een selectie om een nieuwe op te slaan.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'normaal' && (
        <div className="opgeslagen-selecties-sectie">
          <h4>📚 Opgeslagen Selecties</h4>
          {opgeslagenVrijeLeermodusSelecties.length > 0 ? (
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
                      title="Herstel deze selectie"
                    >
                      🔄
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
            </div>
          ) : (
            <div className="geen-selecties-melding">
              <p>Nog geen selecties opgeslagen. Maak een selectie en klik op de 'Huidige Selectie Opslaan' knop.</p>
            </div>
          )}
          
          <div className="opslaan-sectie">
            <button 
              onClick={handleOpslaanSelectie}
              disabled={actieveCategorieSelectie.length === 0 || opgeslagenVrijeLeermodusSelecties.length >= 5}
              className="opslaan-selectie-knop"
            >
              💾 Huidige Selectie Opslaan
            </button>
            {opgeslagenVrijeLeermodusSelecties.length >= 5 && (
              <p className="max-selecties-melding">
                Maximum van 5 opgeslagen selecties bereikt. Verwijder eerst een selectie om een nieuwe op te slaan.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'highscore' && (
        <div className="recordpogingen">
          <h4>🏆 Eerdere Recordpogingen</h4>
          <select onChange={handleHighScoreSelect} className="recordpoging-select">
            <option value="">-- Selecteer een recordpoging --</option>
            {highScoreLibrary && Object.entries(highScoreLibrary).map(([categories, data]) => {
              const categoryArray = categories.split(',');
              const hoofdCategorieen = [...new Set(categoryArray.map(cat => cat.split(' - ')[0]))];
              const hoofdCategorieenString = hoofdCategorieen.slice(0, 3).join(', ') + (hoofdCategorieen.length > 3 ? '...' : '');
              const datum = new Date().toLocaleDateString('nl-NL');
              
              return (
                <option key={categories} value={categories}>
                  {datum} | {hoofdCategorieenString} ({categoryArray.length} categorieën) - {data.score} punten ({data.spelerNaam})
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className="categorie-lijst">
        <div className="categorie-lijst-header">
          <h4>Categorieën</h4>
          <div className="bron-filter">
            <p className="filter-uitleg">Toon alleen de opdrachten van een specifieke bron.</p>
            <div className="bron-filter-knoppen">
              <button onClick={() => setOpdrachtBronFilter('alle')} className={`snelle-selectie-knop ${opdrachtBronFilter === 'alle' ? 'actief' : ''}`}>
                Allemaal
              </button>
              <button onClick={() => setOpdrachtBronFilter('systeem')} className={`snelle-selectie-knop ${opdrachtBronFilter === 'systeem' ? 'actief' : ''}`}>
                    ⚙️ Systeem
                    </button>
                    <button onClick={() => setOpdrachtBronFilter('gebruiker')} className={`snelle-selectie-knop ${opdrachtBronFilter === 'gebruiker' ? 'actief' : ''}`}>
                    👤 Eigen
                    </button>
            </div>
          </div>
        </div>
        
        <table className="categorie-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('naam')} className={`sortable ${getSortClass('naam')}`}>
                Categorie
                <span className="sort-indicator">▼</span>
              </th>
              <th>Selectie</th>
              <th onClick={() => requestSort('aantalOpdrachten')} className={`sortable ${getSortClass('aantalOpdrachten')}`}>
                Opdrachten
                <span className="sort-indicator">▼</span>
              </th>
              <th onClick={() => requestSort('geselecteerd')} className={`sortable ${getSortClass('geselecteerd')}`}>
                Status
                <span className="sort-indicator">▼</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {getGesorteerdeCategorieen().map(({ hoofd, subs, totaalOpdrachten }) => {
              const uniekeSubs = subs.map(sub => `${hoofd} - ${sub}`);
              const geselecteerdeUniekeSubs = uniekeSubs.filter(sub => actieveCategorieSelectie.includes(sub));
              
              const isAllesGeselecteerd = geselecteerdeUniekeSubs.length === uniekeSubs.length && uniekeSubs.length > 0;
              const isDeelsGeselecteerd = geselecteerdeUniekeSubs.length > 0 && !isAllesGeselecteerd;
              const geselecteerdeSubsCount = geselecteerdeUniekeSubs.length;
              
              return (
                <React.Fragment key={hoofd}>
                  <tr className="hoofd-categorie-rij">
                    <td onClick={() => toggleHoofdCategorie(hoofd)} className="categorie-naam-cell">
                      <span className={`pijl ${openHoofdCategorieen[hoofd] ? 'open' : ''}`}>▶</span>
                      <span className="hoofd-categorie-naam">{hoofd}</span>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={isAllesGeselecteerd}
                        ref={input => { if (input) input.indeterminate = isDeelsGeselecteerd; }}
                        onChange={() => handleHoofdCategorieSelectie(hoofd, subs, isAllesGeselecteerd)}
                      />
                    </td>
                    <td className="opdrachten-cell">
                      <span className="opdrachten-aantal">{totaalOpdrachten}</span>
                    </td>
                    <td className="status-cell">
                      <span className="geselecteerd-aantal">{geselecteerdeSubsCount}/{subs.length}</span>
                    </td>
                  </tr>
                  
                  {openHoofdCategorieen[hoofd] && subs.map(sub => {
                    const aantalOpdrachten = getAantalOpdrachten(hoofd, sub);
                    const uniekeIdentifier = `${hoofd} - ${sub}`;
                    const isGeselecteerd = actieveCategorieSelectie.includes(uniekeIdentifier);
                    
                    return (
                      <tr key={uniekeIdentifier} className="sub-categorie-rij">
                        <td className="categorie-naam-cell sub-categorie">
                          {getBronIconen(opdrachten, hoofd, sub)}
                          <span className="sub-categorie-naam">{sub}</span>
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={isGeselecteerd}
                            onChange={() => actieveCategorieHandler(uniekeIdentifier)}
                          />
                        </td>
                        <td className="opdrachten-cell">
                          <span className="opdrachten-aantal">{aantalOpdrachten}</span>
                        </td>
                        <td className="status-cell">
                          <span className="geselecteerd-status">{isGeselecteerd ? '✓' : ''}</span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLeitnerTabContent = () => (
    <div className="leitner-tab-content">
      <p>Het Leitner-systeem gebruikt een eigen, gespecialiseerd beheerscherm voor de beste leerervaring.</p>
      <button onClick={onOpenLeitnerBeheer} className="snelle-selectie-knop">
        Open Leitner Beheer
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-container">
            <h3>CATEGORIE SELECTIE</h3>
            <h4 className="modal-subtitle">Voor Spel & Vrije Leermodus</h4>
          </div>
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
          {activeTab === 'leitner' ? renderLeitnerTabContent() : renderBasisCategorieSelectie()}
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
      {toastBericht && <ToastMelding bericht={toastBericht} isZichtbaar={isToastZichtbaar} onClose={() => setIsToastZichtbaar(false)} />}
    </div>
  );
};