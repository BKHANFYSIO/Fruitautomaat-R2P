import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getLeerDataManager } from '../data/leerDataManager';
import type { Opdracht } from '../data/types';
import './LeitnerCategorieBeheer.css';

interface OpgeslagenLeitnerSelectie {
  id: string;
  naam: string;
  categorieen: string[];
  datum: string;
}

const getBronIconen = (opdrachten: Opdracht[], hoofd: string, sub: string) => {
    const relevanteOpdrachten = opdrachten.filter(op => (op.Hoofdcategorie || 'Overig') === hoofd && op.Categorie === sub);
    const bronnen = new Set(relevanteOpdrachten.map(op => op.bron));
    
    let iconen = '';
    if (bronnen.has('systeem')) iconen += '🏛️';
    if (bronnen.has('gebruiker')) iconen += '👤';
    
    return <span className="categorie-bron-iconen" title={`Bronnen: ${Array.from(bronnen).join(', ')}`}>{iconen}</span>;
  };

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

const BoxUitlegPopup = ({ onClose }: { onClose: () => void }) => (
  <div className="box-uitleg-popup-overlay" onClick={onClose}>
    <div className="box-uitleg-popup-content" onClick={(e) => e.stopPropagation()}>
      <button onClick={onClose} className="box-uitleg-popup-close">&times;</button>
      <h4>📚 Uitleg van de Boxen</h4>
      <p>Het Leitner-systeem helpt je efficiënt te leren door opdrachten slim te herhalen. Nieuwe opdrachten beginnen buiten de boxen en worden na de eerste keer beantwoorden in een box geplaatst.</p>
      
      <div className="box-overview">
        <h5>🔄 Herhalingsintervallen</h5>
        <div className="box-grid">
          <div className="box-item">
            <span className="box-number">B0</span>
            <span className="box-label">Eerste herhaling</span>
            <span className="box-time">10 minuten</span>
          </div>
          <div className="box-item">
            <span className="box-number">B1</span>
            <span className="box-label">Herhaling</span>
            <span className="box-time">1 dag</span>
          </div>
          <div className="box-item">
            <span className="box-number">B2</span>
            <span className="box-label">Herhaling</span>
            <span className="box-time">2 dagen</span>
          </div>
          <div className="box-item">
            <span className="box-number">B3</span>
            <span className="box-label">Herhaling</span>
            <span className="box-time">4 dagen</span>
          </div>
          <div className="box-item">
            <span className="box-number">B4</span>
            <span className="box-label">Herhaling</span>
            <span className="box-time">7 dagen</span>
          </div>
          <div className="box-item">
            <span className="box-number">B5</span>
            <span className="box-label">Herhaling</span>
            <span className="box-time">14 dagen</span>
          </div>
          <div className="box-item">
            <span className="box-number">B6</span>
            <span className="box-label">"Geleerd"</span>
            <span className="box-time">45 dagen</span>
          </div>
          <div className="box-item">
            <span className="box-number">B7</span>
            <span className="box-label">"Meester"</span>
            <span className="box-time">Geen herhaling</span>
          </div>
        </div>
      </div>

      <div className="scoring-rules">
        <h5>🎯 Scoring Regels</h5>
        
        <div className="rule-section">
          <h6>🆕 Eerste keer beantwoorden</h6>
          <div className="rule-grid">
            <div className="rule-item">
              <span className="score-icon">✅</span>
              <span className="score-label">Heel Goed</span>
              <span className="score-result">→ Box 1</span>
            </div>
            <div className="rule-item">
              <span className="score-icon">⚠️</span>
              <span className="score-label">Redelijk</span>
              <span className="score-result">→ Box 0</span>
            </div>
            <div className="rule-item">
              <span className="score-icon">❌</span>
              <span className="score-label">Niet Goed</span>
              <span className="score-result">→ Box 0</span>
            </div>
          </div>
        </div>

        <div className="rule-section">
          <h6>🔄 Bij herhalingen</h6>
          <div className="rule-grid">
            <div className="rule-item">
              <span className="score-icon">✅</span>
              <span className="score-label">Heel Goed</span>
              <span className="score-result">+1 box (max B7)</span>
            </div>
            <div className="rule-item">
              <span className="score-icon">⚠️</span>
              <span className="score-label">Redelijk</span>
              <span className="score-result">Blijft in box</span>
            </div>
            <div className="rule-item">
              <span className="score-icon">❌</span>
              <span className="score-label">Niet Goed</span>
              <span className="score-result">→ Box 1 (of B0)</span>
            </div>
          </div>
        </div>
      </div>
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
  opdrachtBronFilter: 'alle' | 'systeem' | 'gebruiker';
  setOpdrachtBronFilter: (filter: 'alle' | 'systeem' | 'gebruiker') => void;
}

interface CategorieStatistiek {
  naam: string;
  uniekeNaam: string;
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
  alleOpdrachten,
  opdrachtBronFilter,
  setOpdrachtBronFilter,
}) => {
  // Leitner data hooks voor pauze functionaliteit
  const leerDataManager = getLeerDataManager();
  const leitnerData = leerDataManager.loadLeitnerData();
  const pausedOpdrachten = leerDataManager.getPausedOpdrachten();
  
  // Groepeer opdrachten per categorie met pauze status
  const opdrachtenPerCategorie = useMemo(() => {
    const categorieen: { [key: string]: { opdrachtId: string; boxId: number; isPaused: boolean; pauseTime?: string }[] } = {};
    
    // Voeg eerst alle opdrachten uit de boxes toe
    leitnerData.boxes.forEach(box => {
      box.opdrachten.forEach(opdrachtId => {
        const isPaused = leerDataManager.isOpdrachtPaused(opdrachtId);
        const pauseTime = isPaused ? leerDataManager.getPauseTime(opdrachtId) || undefined : undefined;
        
        // Extraheer categorie uit opdrachtId (format: "Hoofdcategorie_Categorie_OpdrachtText")
        const parts = opdrachtId.split('_');
        if (parts.length >= 2) {
          const categorie = `${parts[0]}_${parts[1]}`;
          if (!categorieen[categorie]) {
            categorieen[categorie] = [];
          }
          categorieen[categorie].push({
            opdrachtId,
            boxId: box.boxId,
            isPaused,
            pauseTime
          });
        }
      });
    });
    
    // Voeg gepauzeerde opdrachten toe die niet in boxes staan
    pausedOpdrachten.forEach(opdrachtId => {
      const isPaused = leerDataManager.isOpdrachtPaused(opdrachtId);
      if (isPaused) {
        const pauseTime = leerDataManager.getPauseTime(opdrachtId) || undefined;
        
        // Extraheer categorie uit opdrachtId (format: "Hoofdcategorie_Categorie_OpdrachtText")
        const parts = opdrachtId.split('_');
        if (parts.length >= 2) {
          const categorie = `${parts[0]}_${parts[1]}`;
          if (!categorieen[categorie]) {
            categorieen[categorie] = [];
          }
          
          // Check of deze opdracht al bestaat (uit boxes)
          const bestaatAl = categorieen[categorie].some(op => op.opdrachtId === opdrachtId);
          if (!bestaatAl) {
            categorieen[categorie].push({
              opdrachtId,
              boxId: 0, // Niet in een box
              isPaused,
              pauseTime
            });
          }
        }
      }
    });
    
    return categorieen;
  }, [leitnerData, pausedOpdrachten]);

  const handleResumeOpdracht = (opdrachtId: string) => {
    leerDataManager.resumeOpdracht(opdrachtId);
    setToastBericht('Opdracht hervat!');
    setIsToastZichtbaar(true);
  };

  const formatPauseTime = (pauseTime: string) => {
    const date = new Date(pauseTime);
    return date.toLocaleDateString('nl-NL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const [statistieken, setStatistieken] = useState<CategorieStatistiek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'naam', direction: 'ascending' });
  const [isUitlegOpen, setIsUitlegOpen] = useState(false);
  const [openHoofdCategorieen, setOpenHoofdCategorieen] = useState<Record<string, boolean>>({});
  const [opgeslagenSelecties, setOpgeslagenSelecties] = useState<OpgeslagenLeitnerSelectie[]>([]);
  const [toonOpslaanModal, setToonOpslaanModal] = useState(false);
  const [nieuweSelectieNaam, setNieuweSelectieNaam] = useState('');
  const [toastBericht, setToastBericht] = useState('');
  const [isToastZichtbaar, setIsToastZichtbaar] = useState(false);
  const [toonResetModal, setToonResetModal] = useState(false);
  const [resetCategorie, setResetCategorie] = useState<string>('');

  const heeftSysteemOpdrachten = useMemo(() => alleOpdrachten.some(op => op.bron === 'systeem'), [alleOpdrachten]);
  const heeftGebruikerOpdrachten = useMemo(() => alleOpdrachten.some(op => op.bron === 'gebruiker'), [alleOpdrachten]);

  // Laad opgeslagen selecties bij component mount
  useEffect(() => {
    const opgeslagen = localStorage.getItem('leitner_categorie_selecties');
    if (opgeslagen) {
      setOpgeslagenSelecties(JSON.parse(opgeslagen));
    }
  }, []);

  const gefilterdeOpdrachten = useMemo(() => {
    if (opdrachtBronFilter === 'alle') return alleOpdrachten;
    return alleOpdrachten.filter(op => op.bron === opdrachtBronFilter);
  }, [alleOpdrachten, opdrachtBronFilter]);

  const berekenStatistieken = useCallback(() => {
    setIsLoading(true);
    const leerDataManager = getLeerDataManager();
    const leitnerData = leerDataManager.loadLeitnerData();
    const leerData = leerDataManager.loadLeerData();

    const hoofdcategorieMap: Record<string, string[]> = gefilterdeOpdrachten.reduce((acc, op) => {
      const hoofd = op.Hoofdcategorie || 'Overig';
      if (!acc[hoofd]) {
        acc[hoofd] = [];
      }
      if (!acc[hoofd].includes(op.Categorie)) {
        acc[hoofd].push(op.Categorie);
      }
      return acc;
    }, {} as Record<string, string[]>);

    const finaleStatistieken: CategorieStatistiek[] = Object.entries(hoofdcategorieMap).map(([hoofd, subs]) => {
      const subCategorieStats = subs.map(sub => {
        const uniekeIdentifier = `${hoofd} - ${sub}`;
        
        let aanHetLeren = 0;
        let klaarVoorHerhaling = 0;
        const perBox: { [boxId: number]: number } = {};
        
        leitnerData.boxes.forEach(box => {
          const categorieOpdrachten = box.opdrachten.filter(id => id.startsWith(`${hoofd}_${sub}_`));
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
            const opIdentifier = `${opData.hoofdcategorie || 'Overig'} - ${opData.categorie}`;
            if (opIdentifier === uniekeIdentifier) {
                pogingen += opData.aantalKeerGedaan;
            }
        });

        return {
          naam: sub,
          uniekeNaam: uniekeIdentifier,
          isHoofd: false,
          totaalOpdrachten: alleOpdrachten.filter(op => (op.Hoofdcategorie || 'Overig') === hoofd && op.Categorie === sub).length,
          aanHetLeren,
          pogingen,
          klaarVoorHerhaling,
          perBox,
        };
      });

      const hoofdStat: CategorieStatistiek = {
        naam: hoofd,
        uniekeNaam: hoofd,
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
  }, [gefilterdeOpdrachten, alleOpdrachten]);

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
    const alleSubCats = statistieken.flatMap(s => s.subCategorieen?.map(sub => sub.uniekeNaam) || []);
    setGeselecteerdeCategorieen([...new Set(alleSubCats)]);
  };

  const handleDeselectAll = () => setGeselecteerdeCategorieen([]);

  const getTotaalAantalOpdrachtenVoorSelectie = (categorieen: string[]) => {
    return categorieen.reduce((totaal, categorie) => {
      const [hoofd, sub] = categorie.split(' - ');
      const relevanteOpdrachten = alleOpdrachten.filter(op => 
        (op.Hoofdcategorie || 'Overig') === hoofd && op.Categorie === sub
      );
      return totaal + relevanteOpdrachten.length;
    }, 0);
  };

  const handleSelecteerBron = (bron: 'systeem' | 'gebruiker') => {
    setGeselecteerdeCategorieen([]); // Eerst alles deselecteren

    const bronCategorieen = alleOpdrachten
      .filter(op => op.bron === bron)
      .map(op => `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`);
    
    setGeselecteerdeCategorieen([...new Set(bronCategorieen)]);
  };

  // Leitner selectie opslaan functionaliteit
  const handleOpslaanSelectie = () => {
    if (opgeslagenSelecties.length >= 5) {
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

    const nieuweSelectie: OpgeslagenLeitnerSelectie = {
      id: Date.now().toString(),
      naam: nieuweSelectieNaam.trim(),
      categorieen: [...geselecteerdeCategorieen],
      datum: new Date().toISOString()
    };

    const nieuweSelecties = [...opgeslagenSelecties, nieuweSelectie];
    setOpgeslagenSelecties(nieuweSelecties);
    localStorage.setItem('leitner_categorie_selecties', JSON.stringify(nieuweSelecties));
    
    setNieuweSelectieNaam('');
    setToonOpslaanModal(false);
    setToastBericht('Selectie opgeslagen!');
    setIsToastZichtbaar(true);
  };

  const handleLaadSelectie = (selectie: OpgeslagenLeitnerSelectie) => {
    setGeselecteerdeCategorieen([...selectie.categorieen]);
    setToastBericht(`Selectie "${selectie.naam}" is geladen!`);
    setIsToastZichtbaar(true);
  };

  const handleVerwijderSelectie = (id: string) => {
    const nieuweSelecties = opgeslagenSelecties.filter(s => s.id !== id);
    setOpgeslagenSelecties(nieuweSelecties);
    localStorage.setItem('leitner_categorie_selecties', JSON.stringify(nieuweSelecties));
    setToastBericht('Selectie verwijderd!');
    setIsToastZichtbaar(true);
  };

  const handleHoofdCategorieSelectie = (hoofdStat: CategorieStatistiek) => {
    const subUniekeNamen = hoofdStat.subCategorieen?.map(s => s.uniekeNaam) || [];
    const zijnAllemaalGeselecteerd = subUniekeNamen.every(naam => geselecteerdeCategorieen.includes(naam));

    setGeselecteerdeCategorieen(prev => {
        const newSet = new Set(prev);
        if (zijnAllemaalGeselecteerd) {
            subUniekeNamen.forEach(naam => newSet.delete(naam));
        } else {
            subUniekeNamen.forEach(naam => newSet.add(naam));
        }
        return Array.from(newSet);
    });
  };

  const handleSubCategorieSelectie = (subUniekeNaam: string) => {
    setGeselecteerdeCategorieen(prev => 
        prev.includes(subUniekeNaam) ? prev.filter(n => n !== subUniekeNaam) : [...prev, subUniekeNaam]
    );
  };
  
  const toggleHoofdCategorie = (hoofd: string) => {
    setOpenHoofdCategorieen(prev => ({ ...prev, [hoofd]: !prev[hoofd] }));
  };

  const handleResetCategorie = (categorie: string) => {
    setResetCategorie(categorie);
    setToonResetModal(true);
  };

  const handleBevestigReset = () => {
    const leerDataManager = getLeerDataManager();
    const result = leerDataManager.resetCategorieInLeitner(resetCategorie);
    
    setToonResetModal(false);
    setResetCategorie('');
    
    // Toon bevestiging
    setToastBericht(`✅ ${result.gereset} opdrachten van categorie "${resetCategorie}" gereset`);
    setIsToastZichtbaar(true);
    setTimeout(() => setIsToastZichtbaar(false), 3000);
    
    // Herlaad statistieken
    berekenStatistieken();
  };

  if (!isOpen) return null;

  const renderRij = (stat: CategorieStatistiek) => {
    const isHoofd = stat.isHoofd;
    const subUniekeNamen = stat.subCategorieen?.map(s => s.uniekeNaam) || [];
    const isAllesGeselecteerd = isHoofd ? subUniekeNamen.length > 0 && subUniekeNamen.every(n => geselecteerdeCategorieen.includes(n)) : geselecteerdeCategorieen.includes(stat.uniekeNaam);
    const isDeelsGeselecteerd = isHoofd && subUniekeNamen.some(n => geselecteerdeCategorieen.includes(n)) && !isAllesGeselecteerd;

    return (
      <tr key={stat.uniekeNaam} className={isHoofd ? 'hoofd-categorie-rij' : 'sub-categorie-rij'}>
        <td onClick={() => isHoofd && toggleHoofdCategorie(stat.naam)}>
            {isHoofd && <span className={`pijl ${openHoofdCategorieen[stat.naam] ? 'open' : ''}`}>▶</span>}
            {!isHoofd && getBronIconen(alleOpdrachten, stat.uniekeNaam.split(' - ')[0], stat.naam)}
            {stat.naam}
        </td>
        <td>
          <input
            type="checkbox"
            checked={isAllesGeselecteerd}
            ref={input => { if (input) input.indeterminate = isDeelsGeselecteerd; }}
            onChange={() => isHoofd ? handleHoofdCategorieSelectie(stat) : handleSubCategorieSelectie(stat.uniekeNaam)}
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
        {[0, 1, 2, 3, 4, 5, 6, 7].map(boxId => (
          <td key={boxId} className="box">{stat.perBox[boxId] || 0}</td>
        ))}
        <td className="reset-cell">
          {!stat.isHoofd && stat.aanHetLeren > 0 && (
            <button 
              onClick={() => handleResetCategorie(stat.uniekeNaam)}
              className="reset-knop"
              title={`Reset alle ${stat.aanHetLeren} opdrachten van ${stat.naam}`}
            >
              🔄
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content leitner-beheer-modal">
        <div className="modal-header">
          <div className="modal-title-container">
            <h2>CATEGORIE SELECTIE</h2>
            <h3 className="modal-subtitle">(Leitner)</h3>
          </div>
          <button onClick={onClose} className="leitner-modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          {/* Navigatie sectie */}
          <div className="navigatie-sectie">
            <p className="navigatie-tekst">
              Voor het selecteren van categorieën van andere spelmodi ga je naar de algemene categorie selectie.
            </p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('openCategorieSelectie'))} 
              className="navigatie-knop"
            >
              🔄 Ga naar Algemene Categorie Selectie
            </button>
          </div>

          {/* Opgeslagen selecties sectie */}
          <div className="opgeslagen-selecties-sectie">
            <h4>📚 Opgeslagen Leitner Selecties</h4>
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
                      {selectie.categorieen.length} categorieën • {getTotaalAantalOpdrachtenVoorSelectie(selectie.categorieen)} opdrachten
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
            
            {/* Opslaan knop sectie */}
            <div className="opslaan-sectie">
              <button 
                onClick={handleOpslaanSelectie}
                disabled={geselecteerdeCategorieen.length === 0 || opgeslagenSelecties.length >= 5}
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

          {/* Pauze beheer sectie */}
          <div className="pauze-beheer-sectie">
            <h4>⏸️ Gepauzeerde Opdrachten Beheer</h4>
            <div className="debug-info">
              <p>Debug info:</p>
              <p>Aantal gepauzeerde opdrachten: {pausedOpdrachten.length}</p>
              <p>Aantal categorieën met opdrachten: {Object.keys(opdrachtenPerCategorie).length}</p>
              <p>Gepauzeerde opdrachten: {JSON.stringify(pausedOpdrachten)}</p>
              <button 
                onClick={() => {
                  // Test: pauzeer een opdracht
                  const testOpdrachtId = 'Test_Categorie_TestOpdracht';
                  leerDataManager.pauseOpdracht(testOpdrachtId);
                  setToastBericht('Test opdracht gepauzeerd!');
                  setIsToastZichtbaar(true);
                  // Force re-render
                  window.location.reload();
                }}
                className="test-pause-knop"
              >
                🧪 Test: Pauzeer een opdracht
              </button>
            </div>
            {pausedOpdrachten.length > 0 ? (
              <div className="paused-opdrachten-list">
                {Object.entries(opdrachtenPerCategorie)
                  .filter(([_, opdrachten]) => opdrachten.some(op => op.isPaused))
                  .map(([categorie, opdrachten]) => (
                    <div key={categorie} className="categorie-paused-group">
                      <h6>{categorie.replace('_', ' - ')}</h6>
                      <div className="paused-opdrachten-grid">
                        {opdrachten
                          .filter(op => op.isPaused)
                          .map(op => (
                            <div key={op.opdrachtId} className="paused-opdracht-card">
                              <div className="paused-opdracht-info">
                                <span className="box-indicator">
                                  {op.boxId > 0 ? `Box ${op.boxId}` : 'Niet in box'}
                                </span>
                                <span className="pause-time">
                                  Gepauzeerd: {op.pauseTime ? formatPauseTime(op.pauseTime) : 'Onbekend'}
                                </span>
                                <span className="opdracht-id">
                                  ID: {op.opdrachtId}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleResumeOpdracht(op.opdrachtId)}
                                className="resume-knop"
                              >
                                ▶️ Hervatten
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="geen-paused-melding">
                <p>Geen gepauzeerde opdrachten. Je kunt opdrachten pauzeren na het voltooien ervan in de Leitner leermodus.</p>
                <p>Om een opdracht te pauzeren:</p>
                <ol>
                  <li>Start een Leitner leermodus sessie</li>
                  <li>Voltooi een opdracht</li>
                  <li>Klik op "⏸️ Pauzeer deze opdracht" in de footer</li>
                  <li>De opdracht verschijnt hier voor beheer</li>
                </ol>
              </div>
            )}
          </div>

          <div className="snelle-selecties">
            <h4>Snelle Selecties</h4>
            <div className="snelle-selectie-knoppen">
              <button onClick={handleSelectAll} className="snelle-selectie-knop">
                Selecteer Alles
              </button>
              <button onClick={handleDeselectAll} className="snelle-selectie-knop">
                Deselecteer Alles
              </button>
              <button 
                onClick={() => handleSelecteerBron('systeem')} 
                className="snelle-selectie-knop"
                disabled={!heeftSysteemOpdrachten}
                title={!heeftSysteemOpdrachten ? 'Geen systeemopdrachten gevonden' : 'Selecteer alleen systeemopdrachten'}
              >
                🏛️ Alleen Systeem
              </button>
              <button 
                onClick={() => handleSelecteerBron('gebruiker')} 
                className="snelle-selectie-knop"
                disabled={!heeftGebruikerOpdrachten}
                title={!heeftGebruikerOpdrachten ? 'Geen eigen opdrachten gevonden' : 'Selecteer alleen eigen opdrachten'}
              >
                👤 Alleen Eigen
              </button>
            </div>
          </div>
            <div className="categorie-lijst-header">
                <h4>Categorieën</h4>
                <div className="bron-filter">
                <p className="filter-uitleg">Toon alleen de opdrachten van een specifieke bron.</p>
                <div className="bron-filter-knoppen">
                    <button onClick={() => setOpdrachtBronFilter('alle')} className={`snelle-selectie-knop ${opdrachtBronFilter === 'alle' ? 'actief' : ''}`}>
                    Allemaal
                    </button>
                    <button 
                        onClick={() => setOpdrachtBronFilter('systeem')} 
                        className={`snelle-selectie-knop ${opdrachtBronFilter === 'systeem' ? 'actief' : ''}`}
                        disabled={!heeftSysteemOpdrachten}
                        title={!heeftSysteemOpdrachten ? 'Geen systeemopdrachten gevonden' : 'Filter op systeemopdrachten'}
                    >
                    🏛️ Systeem
                    </button>
                    <button 
                        onClick={() => setOpdrachtBronFilter('gebruiker')} 
                        className={`snelle-selectie-knop ${opdrachtBronFilter === 'gebruiker' ? 'actief' : ''}`}
                        disabled={!heeftGebruikerOpdrachten}
                        title={!heeftGebruikerOpdrachten ? 'Geen eigen opdrachten gevonden' : 'Filter op eigen opdrachten'}
                    >
                    👤 Eigen
                    </button>
                </div>
                </div>
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
                  <th colSpan={8} className="box-verdeling-header">
                    Box Verdeling
                    <span className="info-icon" onClick={() => setIsUitlegOpen(true)}>&#9432;</span>
                  </th>
                  <th rowSpan={2}>Reset</th>
                </tr>
                <tr>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(boxId => (<th key={boxId} className="box-header">B{boxId}</th>))}
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
      
      {/* Opslaan modal */}
      {toonOpslaanModal && (
        <div className="opslaan-modal-overlay" onClick={() => setToonOpslaanModal(false)}>
          <div className="opslaan-modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>💾 Leitner Selectie Opslaan</h4>
            <p>Geef een naam op voor je Leitner categorie selectie:</p>
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
      
      {/* Reset modal */}
      {toonResetModal && (
        <div className="opslaan-modal-overlay" onClick={() => setToonResetModal(false)}>
          <div className="opslaan-modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>⚠️ Categorie Reset</h4>
            <p>
              Weet je zeker dat je alle opdrachten van categorie <strong>"{resetCategorie}"</strong> wilt resetten?
            </p>
            <p className="reset-waarschuwing">
              ⚠️ Dit zal alle opdrachten van deze categorie uit alle boxen verwijderen. 
              Ze worden niet meer meegenomen in de leeranalyse en je moet opnieuw beginnen.
            </p>
            <div className="opslaan-modal-acties">
              <button onClick={() => setToonResetModal(false)} className="annuleer-knop">
                Annuleren
              </button>
              <button onClick={handleBevestigReset} className="bevestig-knop reset-bevestig-knop">
                Reset Categorie
              </button>
            </div>
          </div>
        </div>
      )}
      {toastBericht && <ToastMelding bericht={toastBericht} isZichtbaar={isToastZichtbaar} onClose={() => setIsToastZichtbaar(false)} />}
    </div>
  );
}; 