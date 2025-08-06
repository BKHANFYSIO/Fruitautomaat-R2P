import React, { useState, useMemo, useEffect } from 'react';
import type { Opdracht } from '../data/types';
import './LeitnerCategorieBeheer.css'; // Hergebruik de modal styling
import { OpdrachtenDetailModal } from './OpdrachtenDetailModal';
import { opdrachtTypeIconen } from '../data/constants';


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
  if (bronnen.has('systeem')) iconen += '🏛️';
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
  // Nieuwe props voor filters
  filters?: {
    bronnen: ('systeem' | 'gebruiker')[];
    opdrachtTypes: string[];
  };
  setFilters?: (filters: { bronnen: ('systeem' | 'gebruiker')[]; opdrachtTypes: string[] }) => void;
}

export const CategorieSelectieModal = ({
  isOpen,
  onClose,
  opdrachten,
  geselecteerdeCategorieen,
  onCategorieSelectie,
  onBulkCategorieSelectie,
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
      filters = { bronnen: ['systeem'], opdrachtTypes: [] },
  setFilters,
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
    key: 'naam' | 'aantalOpdrachten' | 'geselecteerd' | 'status';
    direction: 'ascending' | 'descending';
  } | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [geselecteerdeCategorieVoorDetail, setGeselecteerdeCategorieVoorDetail] = useState<string | null>(null);
  const [opdrachtenVoorDetail, setOpdrachtenVoorDetail] = useState<any[]>([]);

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

  // Filter functionaliteit
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
    if (!setFilters) return;
    
    // Voorkom dat beide bronnen worden uitgeschakeld
    if (filters.bronnen.includes(bron) && filters.bronnen.length === 1) {
      setToastBericht('Er moet minimaal één bron geselecteerd zijn');
      setIsToastZichtbaar(true);
      return; // Laat minimaal één bron geselecteerd
    }
    
    const nieuweBronnen = filters.bronnen.includes(bron)
      ? filters.bronnen.filter(b => b !== bron)
      : [...filters.bronnen, bron];
    setFilters({ ...filters, bronnen: nieuweBronnen });
  };

  const handleTypeToggle = (type: string) => {
    if (!setFilters) return;
    const nieuweTypes = filters.opdrachtTypes.includes(type)
      ? filters.opdrachtTypes.filter(t => t !== type)
      : [...filters.opdrachtTypes, type];
    setFilters({ ...filters, opdrachtTypes: nieuweTypes });
  };

  // Gefilterde opdrachten op basis van huidige filters
  const gefilterdeOpdrachten = useMemo(() => {
    return opdrachten.filter(op => {
      // Filter op bron
      const bronMatch = filters.bronnen.length === 0 || filters.bronnen.includes(op.bron as 'systeem' | 'gebruiker');
      if (!bronMatch) return false;

      // Filter op opdrachtType
      if (filters.opdrachtTypes.length === 0) return true;
      return filters.opdrachtTypes.includes(op.opdrachtType || 'Onbekend');
    });
  }, [opdrachten, filters]);

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
    return Object.entries(gegroepeerdeCategorieen).flatMap(([hoofd, subs]) => 
      subs.map(sub => `${hoofd} - ${sub}`)
    );
  }, [gegroepeerdeCategorieen]);

  const handleSelecteerAlles = () => {
    actieveBulkHandler(alleCategorieen, 'select');
  };

  const handleDeselecteerAlles = () => {
    actieveBulkHandler(alleCategorieen, 'deselect');
  };

  const toggleHoofdCategorie = (hoofd: string) => {
    setOpenHoofdCategorieen(prev => ({ ...prev, [hoofd]: !prev[hoofd] }));
  };

  const handleHoofdCategorieSelectie = (hoofd: string, subcategorieen: string[], isGeselecteerd: boolean) => {
    const uniekeSubcategorieen = subcategorieen.map(sub => `${hoofd} - ${sub}`);
    actieveBulkHandler(uniekeSubcategorieen, isGeselecteerd ? 'deselect' : 'select');
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
    } else if (activeTab === 'normaal') {
      actieveBulkHandler(alleCategorieen, 'deselect');
      actieveBulkHandler(selectie.categorieen, 'select');
    } else if (activeTab === 'highscore' && setGeselecteerdeHighscoreCategorieen) {
      setGeselecteerdeHighscoreCategorieen([...selectie.categorieen]);
    }
    setToastBericht(`Selectie "${selectie.naam}" is geladen!`);
    setIsToastZichtbaar(true);
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
    setToastBericht('Selectie verwijderd!');
    setIsToastZichtbaar(true);
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
      case 'multiplayer': return '🎮 Multiplayer';
      case 'highscore': return '🏆 Highscore';
      case 'normaal': return '📖 Vrije Leer';
      case 'leitner': return '📚 Leitner';
    }
  };

  const getTabDescription = (tab: TabType) => {
    switch (tab) {
      case 'multiplayer': return 'Kies categorieën voor multiplayer spelsessies en beheer je opgeslagen selecties.';
      case 'highscore': return 'Selecteer categorieën voor highscore pogingen en bekijk eerdere recordpogingen.';
      case 'normaal': return 'Selecteer categorieën voor vrije leersessies en beheer je opgeslagen selecties.';
      case 'leitner': return 'Selecteer categorieën voor de Leitner leermodus. Gebruik de knop hieronder voor gedetailleerd beheer.';
    }
  };
  


  const requestSort = (key: 'naam' | 'aantalOpdrachten' | 'geselecteerd' | 'status') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortClass = (key: 'naam' | 'aantalOpdrachten' | 'geselecteerd' | 'status') => {
    if (!sortConfig || sortConfig.key !== key) return '';
    return sortConfig.direction === 'ascending' ? 'sorted-asc' : 'sorted-desc';
  };

  const getAantalOpdrachten = (hoofd: string, sub: string) => {
    return gefilterdeOpdrachten.filter(opdracht => (opdracht.Hoofdcategorie || 'Overig') === hoofd && opdracht.Categorie === sub).length;
  };

  const getTotaalAantalOpdrachtenVoorSelectie = (categorieen: string[]) => {
    return categorieen.reduce((totaal, categorie) => {
      const [hoofd, sub] = categorie.split(' - ');
      return totaal + getAantalOpdrachten(hoofd, sub);
    }, 0);
  };

  const handleBekijkOpdrachten = (isHoofd: boolean, naam: string) => {
    const gefilterdeOpdrachten = isHoofd
        ? opdrachten.filter(op => (op.Hoofdcategorie || 'Overig') === naam)
        : opdrachten.filter(op => {
            const [hoofd, sub] = naam.split(' - ');
            return (op.Hoofdcategorie || 'Overig') === hoofd && op.Categorie === sub;
        });

    setOpdrachtenVoorDetail(gefilterdeOpdrachten.map(op => ({
        opdracht: op.Opdracht,
        antwoord: op.Antwoordsleutel || '',
        bron: op.bron,
    })));
    setGeselecteerdeCategorieVoorDetail(isHoofd ? naam : naam.split(' - ')[1]);
    setDetailModalOpen(true);
  };

  const getGesorteerdeCategorieen = () => {
    const categorieenMetData = Object.entries(gegroepeerdeCategorieen).map(([hoofd, subs]) => ({
      hoofd,
      subs,
      totaalOpdrachten: subs.reduce((sum, sub) => sum + getAantalOpdrachten(hoofd, sub), 0),
      geselecteerdeCount: subs.filter(sub => actieveCategorieSelectie.includes(`${hoofd} - ${sub}`)).length,
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
        case 'status':
            aValue = `${a.geselecteerdeCount}/${a.subs.length}`;
            bValue = `${b.geselecteerdeCount}/${b.subs.length}`;
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
      {(activeTab === 'multiplayer' || activeTab === 'normaal') && (
        <div className="opgeslagen-selecties-sectie">
          <h4>📚 Opgeslagen Selecties</h4>
          {((activeTab === 'multiplayer' && opgeslagenSelecties.length > 0) || (activeTab === 'normaal' && opgeslagenVrijeLeermodusSelecties.length > 0)) ? (
            <div className="opgeslagen-selecties-lijst">
              {(activeTab === 'multiplayer' ? opgeslagenSelecties : opgeslagenVrijeLeermodusSelecties).map(selectie => (
                <div key={selectie.id} className="opgeslagen-selectie-item">
                  <div className="selectie-info">
                    <span className="selectie-naam">{selectie.naam}</span>
                    <span className="selectie-datum">{new Date(selectie.datum).toLocaleDateString()}</span>
                    <span className="selectie-aantal">{selectie.categorieen.length} cat. • {getTotaalAantalOpdrachtenVoorSelectie(selectie.categorieen)} opdr.</span>
                  </div>
                  <div className="selectie-acties">
                    <button onClick={() => handleLaadSelectie(selectie)} className="laad-selectie-knop" title="Herstel deze selectie">🔄</button>
                    <button onClick={() => handleVerwijderSelectie(selectie.id)} className="verwijder-selectie-knop" title="Verwijder deze selectie">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="geen-selecties-melding">
              <p>Nog geen selecties opgeslagen. Maak een selectie en klik op de 'Opslaan' knop.</p>
            </div>
          )}
          
          <div className="opslaan-sectie">
            <button 
              onClick={handleOpslaanSelectie}
              disabled={actieveCategorieSelectie.length === 0 || (activeTab === 'multiplayer' && opgeslagenSelecties.length >= 5) || (activeTab === 'normaal' && opgeslagenVrijeLeermodusSelecties.length >= 5)}
              className="opslaan-selectie-knop"
            >
              💾 Huidige Selectie Opslaan
            </button>
            {((activeTab === 'multiplayer' && opgeslagenSelecties.length >= 5) || (activeTab === 'normaal' && opgeslagenVrijeLeermodusSelecties.length >= 5)) && (
              <p className="max-selecties-melding">Max van 5 selecties bereikt.</p>
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
                  {datum} | {hoofdCategorieenString} ({categoryArray.length} cat.) - {data.score} pnt ({data.spelerNaam})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Filter sectie */}
      {setFilters && (
        <div className="filter-sectie">
          <div className="filter-header">
            <h4>🔍 Filters</h4>
            <span className="filter-info">Filters synchroniseren met hoofdmenu</span>
          </div>
          <div className="filter-groepen">
            <div className="filter-groep">
              <span className="filter-label">Bron:</span>
              <div className="filter-iconen">
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
            </div>
            <div className="filter-groep">
              <span className="filter-label">Type:</span>
              <div className="filter-iconen">
                {alleOpdrachtTypes.map(type => {
                  const count = opdrachtenPerType[type] || 0;
                  return (
                    <span
                      key={type}
                      className={`filter-icon ${filters.opdrachtTypes.includes(type) ? 'active' : 'inactive'}`}
                      title={`${type}: ${count} opdr.`}
                      onClick={() => handleTypeToggle(type)}
                    >
                      {opdrachtTypeIconen[type] || '❓'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="categorie-lijst">
        <div className="categorie-lijst-header">
          <h4>Categorieën</h4>
          <div className="snelle-selectie-knoppen">
            <button onClick={handleSelecteerAlles} className="snelle-selectie-knop">Selecteer Alles</button>
            <button onClick={handleDeselecteerAlles} className="snelle-selectie-knop">Deselecteer Alles</button>
          </div>
        </div>
        
        <table className="categorie-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('naam')} className={`sortable ${getSortClass('naam')}`}>
                Categorie <span className="sort-indicator">↕</span>
              </th>
              <th>Selectie</th>
              <th onClick={() => requestSort('aantalOpdrachten')} className={`sortable ${getSortClass('aantalOpdrachten')}`}>
                Opdr. <span className="sort-indicator">↕</span>
              </th>
              <th onClick={() => requestSort('status')} className={`sortable ${getSortClass('status')}`}>
                Status <span className="sort-indicator">↕</span>
              </th>
              <th>Acties</th>
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
                    <td className="actie-cell">
                        <button onClick={() => handleBekijkOpdrachten(true, hoofd)} className="bekijk-opdrachten-knop" title={`Bekijk opdrachten in ${hoofd}`}>
                            👁️
                        </button>
                    </td>
                  </tr>
                  
                  {openHoofdCategorieen[hoofd] && subs.map(sub => {
                    const aantalOpdrachten = getAantalOpdrachten(hoofd, sub);
                    const uniekeIdentifier = `${hoofd} - ${sub}`;
                    const isGeselecteerd = actieveCategorieSelectie.includes(uniekeIdentifier);
                    
                    return (
                      <tr key={uniekeIdentifier} className="sub-categorie-rij">
                        <td className="categorie-naam-cell sub-categorie">
                          <span className="sub-categorie-naam">{sub}</span>
                          {getBronIconen(opdrachten, hoofd, sub)}
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
                        <td className="actie-cell">
                            <button onClick={() => handleBekijkOpdrachten(false, uniekeIdentifier)} className="bekijk-opdrachten-knop" title={`Bekijk opdrachten in ${sub}`}>
                                👁️
                            </button>
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

  const renderLeitnerTabContent = () => {
    return (
      <div className="leitner-tab-content">
        <div className="leitner-overview">
          <h4>📚 Leitner Systeem Overzicht</h4>
          <p>Beheer je opdrachten en pauzeer functionaliteit via de aparte Leitner modal.</p>
          
          <div className="leitner-actions">
            <button onClick={onOpenLeitnerBeheer} className="snelle-selectie-knop">
              📊 Open Leitner Beheer
            </button>
            <p className="leitner-info">
              In de Leitner Beheer modal kun je:
            </p>
            <ul className="leitner-features">
              <li>📚 Opgeslagen Leitner selecties beheren</li>
              <li>⏸️ Gepauzeerde opdrachten herstellen</li>
              <li>📊 Gedetailleerde statistieken bekijken</li>
              <li>🔄 Categorieën resetten</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

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
                <button onClick={() => setToonOpslaanModal(false)} className="annuleer-knop">Annuleren</button>
                <button onClick={handleBevestigOpslaan} className="bevestig-knop">Opslaan</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {toastBericht && <ToastMelding bericht={toastBericht} isZichtbaar={isToastZichtbaar} onClose={() => setIsToastZichtbaar(false)} />}
      
      <OpdrachtenDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        categorieNaam={geselecteerdeCategorieVoorDetail || ''}
        opdrachten={opdrachtenVoorDetail}
      />
    </div>
  );
};