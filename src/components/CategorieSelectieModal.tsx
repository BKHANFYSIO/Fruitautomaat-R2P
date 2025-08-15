import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import type { Opdracht } from '../data/types';
import './LeitnerCategorieBeheer.css'; // Hergebruik de modal styling
import { OpdrachtenDetailModal } from './OpdrachtenDetailModal';
import { opdrachtTypeIconen, NIVEAU_LABELS, OPDRACHT_TYPE_ORDER } from '../data/constants';
import { InfoTooltip } from './ui/InfoTooltip';


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
      if (bronnen.has('systeem')) iconen += '📖';
    if (bronnen.has('gebruiker')) iconen += '👨‍💼';
  
  return (
    <InfoTooltip asChild content={`Bronnen: ${Array.from(bronnen).join(', ')}`}>
      <span className="categorie-bron-iconen">{iconen}</span>
    </InfoTooltip>
  );
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
    niveaus?: Array<1 | 2 | 3 | 'undef'>;
    tekenen?: Array<'ja' | 'mogelijk' | 'nee'>;
  };
  setFilters?: (filters: { bronnen: ('systeem' | 'gebruiker')[]; opdrachtTypes: string[]; niveaus?: Array<1|2|3|'undef'>; tekenen?: Array<'ja'|'mogelijk'|'nee'> }) => void;
  // Optioneel: gewenste subtab bij openen (alleen van toepassing voor highscore)
  initialInnerTab?: 'categories' | 'filters' | 'saved';
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
  initialInnerTab,
}: CategorieSelectieModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialActiveTab || 'normaal');
  const [innerTab, setInnerTab] = useState<'categories' | 'filters' | 'saved'>(initialInnerTab || 'categories');
  const categorieLijstRef = useRef<HTMLDivElement | null>(null);
  const modalTopRef = useRef<HTMLDivElement | null>(null);
  const [opgeslagenSelecties, setOpgeslagenSelecties] = useState<OpgeslagenCategorieSelectie[]>([]);
  const [opgeslagenVrijeLeermodusSelecties, setOpgeslagenVrijeLeermodusSelecties] = useState<OpgeslagenCategorieSelectie[]>([]);
  const [toonOpslaanModal, setToonOpslaanModal] = useState(false);
  const [nieuweSelectieNaam, setNieuweSelectieNaam] = useState('');
  const [openHoofdCategorieen, setOpenHoofdCategorieen] = useState<Record<string, boolean>>({});
  const [toastBericht, setToastBericht] = useState('');
  const [isToastZichtbaar, setIsToastZichtbaar] = useState(false);
  
  // State voor het bewerken van highscore namen
  const [editingHighscoreKey, setEditingHighscoreKey] = useState<string | null>(null);
  const [editingHighscoreName, setEditingHighscoreName] = useState('');
  

  
  // Sticky subtabbalk: verberg bij naar beneden scrollen, toon bij klein stukje omhoog
  const tabContentRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef(0);
  const [isSubtabHidden, setIsSubtabHidden] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const el = tabContentRef.current;
    if (!el) return;

    const handleScroll = () => {
      const current = el.scrollTop;
      const delta = current - lastScrollTopRef.current;
      const thresholdShow = 8;
      const thresholdHide = 12;

      if (current <= 0) {
        setIsSubtabHidden(false);
      } else if (delta > thresholdHide) {
        setIsSubtabHidden(true);
      } else if (delta < -thresholdShow) {
        setIsSubtabHidden(false);
      }

      lastScrollTopRef.current = current;
    };

    el.addEventListener('scroll', handleScroll, { passive: true } as any);
    return () => {
      el.removeEventListener('scroll', handleScroll as any);
    };
  }, [isOpen]);

  // Sorteer functionaliteit (standaard alfabetisch op categorienaam)
  const [sortConfig, setSortConfig] = useState<{
    key: 'naam' | 'aantalOpdrachten' | 'geselecteerd' | 'status';
    direction: 'ascending' | 'descending';
  } | null>({ key: 'naam', direction: 'ascending' });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [geselecteerdeCategorieVoorDetail, setGeselecteerdeCategorieVoorDetail] = useState<string | null>(null);
  const [opdrachtenVoorDetail, setOpdrachtenVoorDetail] = useState<any[]>([]);

  // Sync activeTab vóór paint wanneer de modal opent of de gewenste tab wijzigt,
  // om visuele 'switch' te voorkomen bij eerste render
  useLayoutEffect(() => {
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



  // Reset subtabs en scroll-gedrag bij openen of tabwissel
  useEffect(() => {
    if (!isOpen) return;
    // Als expliciet gevraagd is om 'saved' te openen in highscore, doe dat.
    const desired = activeTab === 'highscore' && initialInnerTab ? initialInnerTab : 'categories';
    setInnerTab(desired);
    // Standaard alle hoofd-categorieën dicht bij openen/tabwissel
    setOpenHoofdCategorieen({});
    setIsSubtabHidden(false);
    lastScrollTopRef.current = 0;
    requestAnimationFrame(() => {
      if (activeTab !== 'leitner') {
        // Bij Vrije Leermodus, Multiplayer en Highscore: naar top zodat subtabbladen zichtbaar zijn
        modalTopRef.current?.scrollIntoView({ block: 'start' });
        modalTopRef.current?.focus?.();
      } else {
        // Overige tabs: direct focussen op categorieën
        categorieLijstRef.current?.scrollIntoView({ block: 'start' });
        categorieLijstRef.current?.focus?.();
      }
    });
  }, [isOpen, activeTab, initialInnerTab]);

  // Zorg ervoor dat filters tab niet actief is bij highscore modus
  useEffect(() => {
    if (activeTab === 'highscore' && innerTab === 'filters') {
      setInnerTab('categories');
    }
  }, [activeTab, innerTab]);

  // Zorg ervoor dat filters altijd op standaard waarden staan bij highscore modus
  useEffect(() => {
    if (activeTab === 'highscore' && setFilters) {
      setFilters({ bronnen: ['systeem', 'gebruiker'], opdrachtTypes: [], niveaus: [], tekenen: [] });
    }
  }, [activeTab]); // Verwijder setFilters uit dependencies om oneindige loop te voorkomen

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
  const { alleOpdrachtTypes, opdrachtenPerType, opdrachtenPerBron, niveausTelling } = useMemo(() => {
    const opdrachtenPerType: { [key: string]: number } = {};
    const opdrachtenPerBron: { [key: string]: number } = {};
    const niveausTelling: { [k in 1|2|3|'undef']?: number } = {};
    
    // Gebruik alleen opdrachten binnen actieve categorie selectie
    const isCategorieFilterActief = Array.isArray(actieveCategorieSelectie) && actieveCategorieSelectie.length > 0;
    const subset = isCategorieFilterActief
      ? opdrachten.filter(op => {
          const key = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
          return actieveCategorieSelectie.includes(key);
        })
      : opdrachten;

    subset.forEach(op => {
      const type = op.opdrachtType || 'Onbekend';
      opdrachtenPerType[type] = (opdrachtenPerType[type] || 0) + 1;
      const bron = op.bron || 'systeem';
      opdrachtenPerBron[bron] = (opdrachtenPerBron[bron] || 0) + 1;
      const niv = (op as any).niveau as (1|2|3|undefined);
      const key = (typeof niv === 'number' ? niv : 'undef') as 1|2|3|'undef';
      niveausTelling[key] = (niveausTelling[key] || 0) + 1;
    });
    
    // Zorg ervoor dat alle types altijd zichtbaar blijven, ook als ze 0 opdrachten hebben
    const alleOpdrachtTypes = OPDRACHT_TYPE_ORDER;
    
    return { alleOpdrachtTypes, opdrachtenPerType, opdrachtenPerBron, niveausTelling };
  }, [opdrachten, actieveCategorieSelectie]);

  const handleBronToggle = (bron: 'systeem' | 'gebruiker') => {
    if (!setFilters) return;
    
    // Bij highscore modus: filters niet aanpassen, altijd op standaard waarden
    if (activeTab === 'highscore') {
      setToastBericht('Filters kunnen niet worden aangepast in highscore modus');
      setIsToastZichtbaar(true);
      return;
    }
    
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
    
    // Bij highscore modus: filters niet aanpassen, altijd op standaard waarden
    if (activeTab === 'highscore') {
      setToastBericht('Filters kunnen niet worden aangepast in highscore modus');
      setIsToastZichtbaar(true);
      return;
    }
    
    const nieuweTypes = filters.opdrachtTypes.includes(type)
      ? filters.opdrachtTypes.filter(t => t !== type)
      : [...filters.opdrachtTypes, type];
    setFilters({ ...filters, opdrachtTypes: nieuweTypes });
  };

  const handleNiveauToggle = (niv: 1 | 2 | 3 | 'undef') => {
    if (!setFilters) return;
    
    // Bij highscore modus: filters niet aanpassen, altijd op standaard waarden
    if (activeTab === 'highscore') {
      setToastBericht('Filters kunnen niet worden aangepast in highscore modus');
      setIsToastZichtbaar(true);
      return;
    }
    
    const huidige = filters.niveaus || [];
    const nieuw = huidige.includes(niv)
      ? huidige.filter(n => n !== niv)
      : [...huidige, niv];
    setFilters({ ...filters, niveaus: nieuw });
  };

  // Gefilterde opdrachten op basis van huidige filters
  const gefilterdeOpdrachten = useMemo(() => {
      return opdrachten.filter(op => {
      // Filter op bron
      const bronMatch = filters.bronnen.length === 0 || filters.bronnen.includes(op.bron as 'systeem' | 'gebruiker');
      if (!bronMatch) return false;

      // Filter op opdrachtType
        if (filters.opdrachtTypes.length > 0 && !filters.opdrachtTypes.includes(op.opdrachtType || 'Onbekend')) return false;
        // Filter op tekenen tri-status
        if (Array.isArray(filters.tekenen) && filters.tekenen.length > 0) {
          const status = (op as any).tekenStatus || ((op as any).isTekenen ? 'ja' : 'nee');
          if (!filters.tekenen.includes(status)) return false;
        }
        return true;
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

  const handleKlapAllesUit = () => {
    const map: Record<string, boolean> = {};
    Object.keys(gegroepeerdeCategorieen).forEach(hoofd => { map[hoofd] = true; });
    setOpenHoofdCategorieen(map);
  };

  const handleKlapAllesIn = () => {
    setOpenHoofdCategorieen({});
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

  // Functies voor het bewerken van highscore namen
  const handleStartEditHighscoreName = (categories: string, currentName: string) => {
    setEditingHighscoreKey(categories);
    setEditingHighscoreName(currentName || '');
  };

  const handleSaveHighscoreName = () => {
    if (!editingHighscoreKey || !highScoreLibrary) return;
    
    try {
      // Update de highscore library met de nieuwe naam
      const updatedLibrary = { ...highScoreLibrary };
      if (updatedLibrary[editingHighscoreKey]) {
        updatedLibrary[editingHighscoreKey] = {
          ...(updatedLibrary[editingHighscoreKey] as any),
          customNaam: editingHighscoreName.trim() || undefined
        };
        
        // Sla de bijgewerkte library op in localStorage
        localStorage.setItem('fruitautomaat_highScores', JSON.stringify(updatedLibrary));
        
        // Update de parent component
        if (onHighScoreSelect) {
          // Trigger een refresh van de highscore library
          window.dispatchEvent(new CustomEvent('highscoreLibraryUpdated'));
        }
        
        setToastBericht('Naam succesvol bijgewerkt!');
        setIsToastZichtbaar(true);
      }
    } catch (error) {
      console.error('Fout bij het opslaan van highscore naam:', error);
      setToastBericht('Fout bij het opslaan van de naam');
      setIsToastZichtbaar(true);
    }
    
    setEditingHighscoreKey(null);
    setEditingHighscoreName('');
  };

  const handleCancelEditHighscoreName = () => {
    setEditingHighscoreKey(null);
    setEditingHighscoreName('');
  };

  const handleDeleteHighscore = (categories: string) => {
    if (!highScoreLibrary) return;
    
    const bevestiging = window.confirm(
      'Weet je zeker dat je dit record wilt verwijderen? Dit kan niet ongedaan worden gemaakt.'
    );
    
    if (bevestiging) {
      try {
        // Verwijder de highscore uit de library
        const updatedLibrary = { ...highScoreLibrary };
        delete (updatedLibrary as any)[categories];
        
        // Sla de bijgewerkte library op in localStorage
        localStorage.setItem('fruitautomaat_highScores', JSON.stringify(updatedLibrary));
        
        // Update de parent component
        window.dispatchEvent(new CustomEvent('highscoreLibraryUpdated'));
        
        setToastBericht('Record succesvol verwijderd!');
        setIsToastZichtbaar(true);
      } catch (error) {
        console.error('Fout bij het verwijderen van highscore:', error);
        setToastBericht('Fout bij het verwijderen van het record');
        setIsToastZichtbaar(true);
      }
    }
  };
  
  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'multiplayer': return '🎮 Multiplayer';
      case 'highscore': return '🏆 Highscore';
      case 'normaal': return '📖 Vrije Leermodus';
      case 'leitner': return '📚 Leitner';
    }
  };

  // Verwijderd: contextuele beschrijving onder de hoofdtabbalk voor uniformiteit met Leitner modal
  


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
      {/* Subtabs: Categorieën / Filters / Opgeslagen */}
      <div className={`tab-navigatie sticky-subtabs ${isSubtabHidden ? 'hidden' : ''}`} style={{ marginBottom: 8 }}>
        {(() => {
          // Verberg filters tab bij highscore modus
          const tabs = activeTab === 'highscore' ? ['categories', 'saved'] : ['categories', 'filters', 'saved'];
          return tabs.map(t => (
            <button key={t} className={`tab-knop ${innerTab === t ? 'actief' : ''}`} onClick={() => setInnerTab(t as 'categories' | 'filters' | 'saved')}>
              {t === 'categories' ? '📂 Categorieën' : t === 'filters' ? '🔍 Filters' : '💾 Opgeslagen'}
            </button>
          ));
        })()}
      </div>

      {(innerTab === 'saved') && (activeTab === 'multiplayer' || activeTab === 'normaal') && (
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

      {(innerTab === 'saved') && activeTab === 'highscore' && (
        <div className="recordpogingen">
          <h4>🏆 Opgeslagen Records</h4>
          
          {/* Uitleg bovenaan */}
          <div className="highscore-uitleg" style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            fontSize: '0.9rem',
            color: '#e0e0e0',
            border: '1px solid #333'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>💡 Hoe werkt het?</strong>
            </p>
            <p style={{ margin: '0', fontSize: '0.85rem', lineHeight: '1.4' }}>
              Hier zie je de beste scores per categorie-combinatie. Klik op "Probeer te verbeteren" om dezelfde categorieën te selecteren en het record te proberen te breken. 
              Alleen de hoogste score per combinatie wordt bewaard, ongeacht door wie deze is behaald. Je kunt om de beurt spelen en elkaars records proberen te verbeteren!
              <br /><br />
              <strong>💡 Tip:</strong> Klik op het ✏️ icoon om een record een eigen naam te geven, zoals "Casus Amir" of "Anatomie Test".
            </p>
          </div>

          {highScoreLibrary && Object.keys(highScoreLibrary).length > 0 ? (
            <div className="opgeslagen-selecties-lijst">
              {Object.entries(highScoreLibrary).map(([categories, data]) => {
              const categoryArray = categories.split(',');
              const hoofdCategorieen = [...new Set(categoryArray.map(cat => cat.split(' - ')[0]))];
              const hoofdCategorieenString = hoofdCategorieen.slice(0, 3).join(', ') + (hoofdCategorieen.length > 3 ? '...' : '');
                const datum = new Date((data as any).timestamp).toLocaleDateString('nl-NL');
              
              return (
                  <div key={categories} className="opgeslagen-selectie-item" style={{
                    backgroundColor: '#1a1a1a',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid #333'
                  }}>
                    <div className="selectie-info">
                      {/* Eigen naam of standaard naam */}
                      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {editingHighscoreKey === categories ? (
                          // Bewerkingsmodus
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <input
                              type="text"
                              value={editingHighscoreName}
                              onChange={(e) => setEditingHighscoreName(e.target.value)}
                              placeholder="Geef een naam aan je record..."
                              style={{
                                flex: 1,
                                padding: '6px 8px',
                                borderRadius: '4px',
                                border: '1px solid #555',
                                backgroundColor: '#2a2a2a',
                                color: '#fff',
                                fontSize: '0.9rem'
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveHighscoreName();
                                } else if (e.key === 'Escape') {
                                  handleCancelEditHighscoreName();
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveHighscoreName}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              ✅
                            </button>
                            <button
                              onClick={handleCancelEditHighscoreName}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          // Weergavemodus
                          <>
                            <span className="selectie-naam" style={{ 
                              fontSize: '1.1rem', 
                              fontWeight: 'bold',
                              color: '#4CAF50',
                              flex: 1
                            }}>
                              🏆 {(data as any).customNaam || `${hoofdCategorieenString} Record`}
                            </span>
                            <button
                              onClick={() => handleStartEditHighscoreName(categories, (data as any).customNaam || '')}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: 'transparent',
                                color: '#888',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                              title="Bewerk naam"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteHighscore(categories)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: 'transparent',
                                color: '#f44336',
                                border: '1px solid #f44336',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                              title="Verwijder record"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Alle categorieën zichtbaar */}
                      <div style={{ 
                        marginBottom: '8px',
                        fontSize: '0.85rem',
                        color: '#b0b0b0',
                        backgroundColor: '#252525',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #404040'
                      }}>
                        <strong>Categorieën:</strong> {categoryArray.join(', ')}
                      </div>
                      
                      {/* Score en datum info */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.9rem',
                        color: '#d0d0d0'
                      }}>
                        <span>
                          <strong>Score:</strong> {(data as any).score.toFixed(1)} punten
                        </span>
                        <span>
                          <strong>Datum:</strong> {datum}
                        </span>
                        <span>
                          <strong>Speler:</strong> {(data as any).spelerNaam}
                        </span>
                      </div>
                    </div>
                    
                    <div className="selectie-acties" style={{ marginTop: '12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleHighScoreSelect({ target: { value: categories } } as any)}
                        className="laad-selectie-knop" 
                        title="Selecteer deze categorieën en probeer je record te verbeteren"
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          margin: '0 auto'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#45a049';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#4CAF50';
                        }}
                      >
                        🎯 Probeer te verbeteren
                      </button>
                    </div>
                  </div>
              );
            })}
            </div>
          ) : (
            <div className="geen-selecties-melding" style={{
              textAlign: 'center',
              padding: '32px',
              color: '#888',
              fontSize: '1rem'
            }}>
              <p>🏆 Nog geen recordpogingen</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                Speel een highscore spel om hier je recordpogingen te zien.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter sectie */}
      {(innerTab === 'filters') && setFilters && (
          <div className="filter-sectie">
          <div className="filter-header">
            <h4 className="filter-titel">🔍 Filters Aanpassen</h4>
            <span className="filter-info">Selecteer op bron, type en niveau. Combinaties mogelijk. Selecties worden bewaard.</span>
          </div>
          <div className="filter-groepen">
            <div style={{ fontSize: '0.85rem', color: '#9aa0a6', margin: '0 0 8px 0' }}>
              Aantallen hieronder zijn binnen je huidige categorie‑selectie.
            </div>
            <div className="filter-groep">
              <span className="filter-label">Bron:</span>
              <div className="filter-iconen">
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
            <div className="filter-groep">
              <span className="filter-label">Type:</span>
              <div className="filter-iconen">
                {alleOpdrachtTypes.map(type => {
                  const count = opdrachtenPerType[type] || 0;
                  return (
                    <InfoTooltip asChild content={`${type}: ${count} opdr.`} key={type}>
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
            <div className="filter-groep">
              <span className="filter-label">Tekenen:</span>
              <div className="filter-iconen">
                <InfoTooltip asChild content={`Ja: expliciet tekenen vereist.`}>
                  <span
                    className={`filter-icon ${Array.isArray(filters.tekenen) && filters.tekenen.includes('ja') ? 'active' : 'inactive'}`}
                    onClick={() => {
                      if (!setFilters) return;
                      
                      // Bij highscore modus: filters niet aanpassen, altijd op standaard waarden
                      if (activeTab === 'highscore') {
                        setToastBericht('Filters kunnen niet worden aangepast in highscore modus');
                        setIsToastZichtbaar(true);
                        return;
                      }
                      
                      const huidige = new Set(filters.tekenen || []);
                      huidige.has('ja') ? huidige.delete('ja') : huidige.add('ja');
                      setFilters({ ...filters, tekenen: Array.from(huidige) as any });
                    }}
                  >
                    ✏️
                  </span>
                </InfoTooltip>
                <InfoTooltip asChild content={`Mogelijk: tekenen is optioneel/helpend.`}>
                  <span
                    className={`filter-icon ${Array.isArray(filters.tekenen) && filters.tekenen.includes('mogelijk') ? 'active' : 'inactive'}`}
                    onClick={() => {
                      if (!setFilters) return;
                      
                      // Bij highscore modus: filters niet aanpassen, altijd op standaard waarden
                      if (activeTab === 'highscore') {
                        setToastBericht('Filters kunnen niet worden aangepast in highscore modus');
                        setIsToastZichtbaar(true);
                        return;
                      }
                      
                      const huidige = new Set(filters.tekenen || []);
                      huidige.has('mogelijk') ? huidige.delete('mogelijk') : huidige.add('mogelijk');
                      setFilters({ ...filters, tekenen: Array.from(huidige) as any });
                    }}
                  >
                    ✏️?
                  </span>
                </InfoTooltip>
                <InfoTooltip asChild content={`Nee: geen tekenen.`}>
                  <span
                    className={`filter-icon ${Array.isArray(filters.tekenen) && filters.tekenen.includes('nee') ? 'active' : 'inactive'}`}
                    onClick={() => {
                      if (!setFilters) return;
                      
                      // Bij highscore modus: filters niet aanpassen, altijd op standaard waarden
                      if (activeTab === 'highscore') {
                        setToastBericht('Filters kunnen niet worden aangepast in highscore modus');
                        setIsToastZichtbaar(true);
                        return;
                      }
                      
                      const huidige = new Set(filters.tekenen || []);
                      huidige.has('nee') ? huidige.delete('nee') : huidige.add('nee');
                      setFilters({ ...filters, tekenen: Array.from(huidige) as any });
                    }}
                  >
                    ∅
                  </span>
                </InfoTooltip>
              </div>
            </div>
            <div className="filter-groep">
              <span className="filter-label">Niveau:</span>
              <div className="filter-iconen">
                {[1,2,3].map((niv) => (
                  <InfoTooltip asChild content={`Niv. ${niv}: ${NIVEAU_LABELS[niv as 1|2|3]} — ${(niveausTelling as any)[niv] || 0} opdr.`} key={`niv-${niv}`}>
                    <span
                      className={`filter-icon ${filters.niveaus?.includes(niv as any) ? 'active' : 'inactive'}`}
                      onClick={() => handleNiveauToggle(niv as 1|2|3)}
                    >
                      {`N${niv}`}
                    </span>
                  </InfoTooltip>
                ))}
                <InfoTooltip asChild content={`∅ – ongedefinieerd: ${(niveausTelling as any)['undef'] || 0} opdr.`}>
                  <span
                    className={`filter-icon ${filters.niveaus?.includes('undef') ? 'active' : 'inactive'}`}
                    onClick={() => handleNiveauToggle('undef')}
                  >
                    ∅
                  </span>
                </InfoTooltip>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                className="snelle-selectie-knop"
                onClick={() => {
                  if (!setFilters) return;
                  
                  // Bij highscore modus: filters niet aanpassen, altijd op standaard waarden
                  if (activeTab === 'highscore') {
                    setToastBericht('Filters kunnen niet worden aangepast in highscore modus');
                    setIsToastZichtbaar(true);
                    return;
                  }
                  
                  setFilters({ bronnen: ['systeem', 'gebruiker'], opdrachtTypes: [], niveaus: [], tekenen: [] });
                  setToastBericht('Filters hersteld naar standaard');
                  setIsToastZichtbaar(true);
                  setTimeout(() => setIsToastZichtbaar(false), 2000);
                }}
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>
      )}

      {innerTab === 'categories' && (
      <div className="categorie-lijst" ref={categorieLijstRef} tabIndex={-1}>
        <div className="categorie-lijst-header">
          <h4>Categorieën</h4>
          <div className="snelle-selectie-knoppen">
            <button onClick={handleSelecteerAlles} className="snelle-selectie-knop">Selecteer Alles</button>
            <button onClick={handleDeselecteerAlles} className="snelle-selectie-knop">Deselecteer Alles</button>
            <button onClick={handleKlapAllesUit} className="snelle-selectie-knop">Klap Alles Uit</button>
            <button onClick={handleKlapAllesIn} className="snelle-selectie-knop">Klap Alles In</button>
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
                      <div className="categorie-naam-cell-inner">
                        <span className={`pijl ${openHoofdCategorieen[hoofd] ? 'open' : ''}`}>▶</span>
                        <span className="hoofd-categorie-naam">{hoofd}</span>
                      </div>
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
                          <div className="categorie-naam-cell-inner">
                            <span className="sub-categorie-naam">{sub}</span>
                            {getBronIconen(opdrachten, hoofd, sub)}
                          </div>
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
      )}
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
          </div>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>

        {/* Tab navigatie */}
        <div className="tab-navigatie" ref={modalTopRef} tabIndex={-1}>
          {(['multiplayer', 'highscore', 'normaal', 'leitner'] as TabType[]).map(tab => (
            <button
              key={tab}
              className={`tab-knop ${activeTab === tab ? 'actief' : ''}`}
              onClick={() => {
                if (tab === 'leitner') {
                  onOpenLeitnerBeheer();
                } else {
                  setActiveTab(tab);
                }
              }}
            >
              {getTabTitle(tab)}
            </button>
          ))}
        </div>

        {/* Geen beschrijving voor visuele consistentie met Leitner modal */}

        {/* Tab content */}
        <div className="tab-content" ref={tabContentRef}>
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