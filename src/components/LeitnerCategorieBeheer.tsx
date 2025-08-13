import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getLeerDataManager } from '../data/leerDataManager';
import type { Opdracht } from '../data/types';
import './LeitnerCategorieBeheer.css';
import { OpdrachtenDetailModal } from './OpdrachtenDetailModal';
import { opdrachtTypeIconen, NIVEAU_LABELS, OPDRACHT_TYPE_ORDER } from '../data/constants';
import { InfoTooltip } from './ui/InfoTooltip';

// ... (rest van de interfaces en utility functions blijven hetzelfde)

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
    if (bronnen.has('systeem')) iconen += '📖';
    if (bronnen.has('gebruiker')) iconen += '👨‍💼';
    
  return (
    <InfoTooltip asChild content={`Bronnen: ${Array.from(bronnen).join(', ')}`}>
      <span className="categorie-bron-iconen">{iconen}</span>
    </InfoTooltip>
  );
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
              <span className="score-result">−1 box (min B0)</span>
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
  // Nieuwe props voor filters
  filters?: {
    bronnen: ('systeem' | 'gebruiker')[];
    opdrachtTypes: string[];
    niveaus?: Array<1 | 2 | 3 | 'undef'>;
    tekenen?: Array<'ja' | 'mogelijk' | 'nee'>;
  };
  setFilters?: (filters: { bronnen: ('systeem' | 'gebruiker')[]; opdrachtTypes: string[]; niveaus?: Array<1|2|3|'undef'>; tekenen?: Array<'ja'|'mogelijk'|'nee'> }) => void;
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
      filters = { bronnen: ['systeem'], opdrachtTypes: [] },
  setFilters,
}) => {
    // Subtabs binnen deze modal
    const [innerTab, setInnerTab] = useState<'categories' | 'filters' | 'saved' | 'paused'>('categories');
    const categorieRef = useRef<HTMLDivElement | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [geselecteerdeCategorieVoorDetail, setGeselecteerdeCategorieVoorDetail] = useState<string | null>(null);
    const [opdrachtenVoorDetail, setOpdrachtenVoorDetail] = useState<any[]>([]);
    const [geselecteerdeOpdrachtenVoorDetail, setGeselecteerdeOpdrachtenVoorDetail] = useState<string[]>([]);



    // Filter functionaliteit
    const { alleOpdrachtTypes, opdrachtenPerType, opdrachtenPerBron, niveausTelling } = useMemo(() => {
      const opdrachtenPerType: { [key: string]: number } = {};
      const opdrachtenPerBron: { [key: string]: number } = {};
      const niveausTelling: { [k in 1|2|3|'undef']?: number } = {};

      // Tellingen beperken tot reeds geselecteerde categorieën indien aanwezig
      const isCatSelActief = Array.isArray(geselecteerdeCategorieen) && geselecteerdeCategorieen.length > 0;
      const subset = isCatSelActief
        ? alleOpdrachten.filter(op => {
            const key = `${op.Hoofdcategorie || 'Overig'} - ${op.Categorie}`;
            return geselecteerdeCategorieen.includes(key);
          })
        : alleOpdrachten;

      subset.forEach(op => {
        const type = op.opdrachtType || 'Onbekend';
        opdrachtenPerType[type] = (opdrachtenPerType[type] || 0) + 1;
        const bron = op.bron || 'systeem';
        opdrachtenPerBron[bron] = (opdrachtenPerBron[bron] || 0) + 1;
        const niv = (op as any).niveau as (1|2|3|undefined);
        const key = (typeof niv === 'number' ? niv : 'undef') as 1|2|3|'undef';
        niveausTelling[key] = (niveausTelling[key] || 0) + 1;
      });

      const alleOpdrachtTypes = OPDRACHT_TYPE_ORDER;

      return { alleOpdrachtTypes, opdrachtenPerType, opdrachtenPerBron, niveausTelling };
    }, [alleOpdrachten, geselecteerdeCategorieen]);

    useEffect(() => {
      if (isOpen) {
        setInnerTab('categories');
      setIsSubtabHidden(false);
      lastScrollTopRef.current = 0;
        requestAnimationFrame(() => {
          categorieRef.current?.scrollIntoView({ block: 'start' });
          categorieRef.current?.focus?.();
        });
      }
    }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const bodyEl = modalBodyRef.current;
    if (!bodyEl) return;

    const handleScroll = () => {
      const current = bodyEl.scrollTop;
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

    bodyEl.addEventListener('scroll', handleScroll, { passive: true } as any);
    return () => {
      bodyEl.removeEventListener('scroll', handleScroll as any);
    };
  }, [isOpen]);

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

    const handleNiveauToggle = (niv: 1 | 2 | 3 | 'undef') => {
      if (!setFilters) return;
      const huidige = filters.niveaus || [];
      const nieuw = huidige.includes(niv)
        ? huidige.filter(n => n !== niv)
        : [...huidige, niv];
      setFilters({ ...filters, niveaus: nieuw });
    };

    const handleBekijkOpdrachten = (categorie: CategorieStatistiek) => {
        const isHoofd = categorie.isHoofd;
        const [hoofd, sub] = categorie.uniekeNaam.split(' - ');

        const opdrachten = isHoofd
            ? alleOpdrachten.filter(op => (op.Hoofdcategorie || 'Overig') === hoofd)
            : alleOpdrachten.filter(op => (op.Hoofdcategorie || 'Overig') === hoofd && op.Categorie === sub);

        const leerDataManager = getLeerDataManager();
        const leitnerData = leerDataManager.loadLeitnerData();
        const leerData = leerDataManager.loadLeerData();

        // Bereken welke opdrachten geselecteerd zijn op basis van categorie selectie en filters
        const geselecteerdeOpdrachten = opdrachten
            .filter(op => {
                // Filter op bron
                if (filters.bronnen.length > 0 && op.bron && !filters.bronnen.includes(op.bron)) {
                    return false;
                }
                // Filter op type
                if (filters.opdrachtTypes.length > 0 && op.opdrachtType && !filters.opdrachtTypes.includes(op.opdrachtType)) {
                    return false;
                }
                return true;
            })
            .map(op => op.Opdracht);

        setOpdrachtenVoorDetail(opdrachten.map(op => {
            const opId = `${op.Hoofdcategorie || 'Overig'}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
            const leitnerInfo = leitnerData.boxes.find(box => box.opdrachten.includes(opId));
            const leerInfo = leerData?.opdrachten[opId];

            let succesPercentage = 0;
            if (leerInfo && leerInfo.aantalKeerGedaan > 0) {
                succesPercentage = Math.round((leerInfo.gemiddeldeScore / 5) * 100);
            }

            return {
                opdracht: op.Opdracht,
                antwoord: op.Antwoordsleutel || '',
                bron: op.bron,
                opdrachtType: op.opdrachtType,
                box: leitnerInfo?.boxId,
                status: leerDataManager.isOpdrachtPaused(opId) ? 'gepauzeerd' : 'actief',
                pogingen: leerInfo?.aantalKeerGedaan ?? 0,
                succesPercentage: succesPercentage
            }
        }));
        setGeselecteerdeCategorieVoorDetail(categorie.naam);
        setDetailModalOpen(true);
        
        // Sla de geselecteerde opdrachten op voor de modal
        setGeselecteerdeOpdrachtenVoorDetail(geselecteerdeOpdrachten);
      };
      
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

  // const toggleAccordion = (categorie: string) => {
  //   setOpenAccordionItems(prev => 
  //     prev.includes(categorie) 
  //       ? prev.filter(item => item !== categorie)
  //       : [...prev, categorie]
  //   );
  // };

  const toggleHoofdCategorieAccordion = (hoofdCategorie: string) => {
    setOpenHoofdCategorieItems(prev => 
      prev.includes(hoofdCategorie) 
        ? prev.filter(item => item !== hoofdCategorie)
        : [...prev, hoofdCategorie]
    );
  };

  const toggleSubCategorieAccordion = (subCategorie: string) => {
    setOpenSubCategorieItems(prev => 
      prev.includes(subCategorie) 
        ? prev.filter(item => item !== subCategorie)
        : [...prev, subCategorie]
    );
  };

  const togglePauzeBeheer = () => {
    setIsPauzeBeheerOpen(prev => !prev);
  };

  const handleResumeAllOpdrachten = () => {
    pausedOpdrachten.forEach(opdrachtId => {
      leerDataManager.resumeOpdracht(opdrachtId);
    });
    setToastBericht(`✅ Alle ${pausedOpdrachten.length} opdrachten hervat!`);
    setIsToastZichtbaar(true);
    // Force re-render
    window.location.reload();
  };



  const getOpdrachtTitel = (opdrachtId: string): string => {
    // Zoek naar de volledige opdracht in alleOpdrachten
    const gevondenOpdracht = alleOpdrachten.find(op => {
      const hoofdcategorie = op.Hoofdcategorie || 'Overig';
      const generatedId = `${hoofdcategorie}_${op.Categorie}_${op.Opdracht.substring(0, 20)}`;
      return generatedId === opdrachtId;
    });
    
    if (gevondenOpdracht) {
      return gevondenOpdracht.Opdracht; // Volledige opdracht tekst
    }
    
    // Fallback: probeer de titel uit de opdrachtId te halen
    const parts = opdrachtId.split('_');
    if (parts.length >= 3) {
      // Combineer alle delen na de eerste twee en vervang underscores door spaties
      const titel = parts.slice(2).join(' ').replace(/_/g, ' ');
      return titel;
    }
    return opdrachtId; // Laatste fallback
  };

  const handleResumeAllInCategorie = (categorie: string) => {
    const opdrachtenInCategorie = opdrachtenPerCategorie[categorie]?.filter(op => op.isPaused) || [];
    opdrachtenInCategorie.forEach(op => {
      leerDataManager.resumeOpdracht(op.opdrachtId);
    });
    setToastBericht(`✅ ${opdrachtenInCategorie.length} opdrachten in ${categorie.replace('_', ' - ')} hervat!`);
    setIsToastZichtbaar(true);
    // Force re-render
    window.location.reload();
  };
  const [statistieken, setStatistieken] = useState<CategorieStatistiek[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [openHoofdCategorieItems, setOpenHoofdCategorieItems] = useState<string[]>([]);
  const [openSubCategorieItems, setOpenSubCategorieItems] = useState<string[]>([]);
  const [isPauzeBeheerOpen, setIsPauzeBeheerOpen] = useState(false);

  const [isInstructieOpen, setIsInstructieOpen] = useState(false);
  // Standaard alfabetisch op categorienaam
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

  // Sticky subtabbalk: verberg bij naar beneden scrollen, toon bij klein stukje omhoog
  const modalBodyRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef(0);
  const [isSubtabHidden, setIsSubtabHidden] = useState(false);



  // Laad opgeslagen selecties bij component mount
  useEffect(() => {
    const opgeslagen = localStorage.getItem('leitner_categorie_selecties');
    if (opgeslagen) {
      setOpgeslagenSelecties(JSON.parse(opgeslagen));
    }
  }, []);

  // Gefilterde opdrachten op basis van huidige filters
    const gefilterdeOpdrachten = useMemo(() => {
    return alleOpdrachten.filter(op => {
      // Filter op bron
      const bronMatch = filters.bronnen.length === 0 || filters.bronnen.includes(op.bron as 'systeem' | 'gebruiker');
      if (!bronMatch) return false;

      // Filter op opdrachtType
        const typeMatch = filters.opdrachtTypes.length === 0 || filters.opdrachtTypes.includes(op.opdrachtType || 'Onbekend');
        if (!typeMatch) return false;
        // Filter op tekenen tri-status
        if (Array.isArray(filters.tekenen) && filters.tekenen.length > 0) {
          const status = (op as any).tekenStatus || ((op as any).isTekenen ? 'ja' : 'nee');
          if (!filters.tekenen.includes(status)) return false;
        }
        // Filter op niveau
        const nivs = filters.niveaus || [];
        if (nivs.length === 0) return true;
        const niv = (op as any).niveau as (1|2|3|undefined);
        if (typeof niv === 'number') return nivs.includes(niv);
        return nivs.includes('undef');
    });
  }, [alleOpdrachten, filters]);

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
            // Controleer of de opdracht niet gepauzeerd is
            const isPaused = leerDataManager.isOpdrachtPaused(opdrachtId);

            if (reviewTijd && !isPaused) {
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
          totaalOpdrachten: gefilterdeOpdrachten.filter(op => (op.Hoofdcategorie || 'Overig') === hoofd && op.Categorie === sub).length,
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
      // standaard alles dicht bij openen
      setOpenHoofdCategorieen({});
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
        <td className="actie-cell">
            <button onClick={() => handleBekijkOpdrachten(stat)} className="bekijk-opdrachten-knop" title="Bekijk opdrachten">
            👁️
            </button>
        </td>
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
          </div>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        {/* Bovenste tabbalk (zelfde als algemene modal) - buiten de scrollende body */}
        <div className="tab-navigatie" style={{ marginBottom: 10 }}>
            <button
              className="tab-knop"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('openCategorieSelectie', { detail: { tab: 'multiplayer' } })
                );
              }}
            >
              🎮 Multiplayer
            </button>
            <button
              className="tab-knop"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('openCategorieSelectie', { detail: { tab: 'highscore' } })
                );
              }}
            >
              🏆 Highscore
            </button>
            <button
              className="tab-knop"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('openCategorieSelectie', { detail: { tab: 'normaal' } })
                );
              }}
            >
              📖 Vrije Leermodus
            </button>
            <button className="tab-knop actief">📚 Leitner</button>
          </div>
        <div className="modal-body" ref={modalBodyRef}>
          {/* Subtabbalk */}
          <div className={`tab-navigatie sticky-subtabs ${isSubtabHidden ? 'hidden' : ''}`} style={{ marginBottom: 8 }}>
            <button className={`tab-knop ${innerTab === 'categories' ? 'actief' : ''}`} onClick={() => setInnerTab('categories')}>📂 Categorieën</button>
            <button className={`tab-knop ${innerTab === 'filters' ? 'actief' : ''}`} onClick={() => setInnerTab('filters')}>🔍 Filters</button>
            <button className={`tab-knop ${innerTab === 'saved' ? 'actief' : ''}`} onClick={() => setInnerTab('saved')}>💾 Opgeslagen</button>
            <button className={`tab-knop ${innerTab === 'paused' ? 'actief' : ''}`} onClick={() => setInnerTab('paused')}>⏸️ Gepauzeerd</button>
          </div>

          {/* Opgeslagen selecties sectie */}
          {innerTab === 'saved' && (
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
          )}

          {/* Pauze beheer sectie */}
          {innerTab === 'paused' && (
          <div className="pauze-beheer-sectie">
            <div className="pauze-beheer-header">
              <h4>⏸️ Gepauzeerde Opdrachten Beheer</h4>
              {pausedOpdrachten.length > 0 && (
                <div className="pauze-overview">
                  <span className="pauze-count">
                    {pausedOpdrachten.length} gepauzeerde opdracht{pausedOpdrachten.length !== 1 ? 'en' : ''}
                  </span>
                  <button 
                    onClick={() => togglePauzeBeheer()}
                    className="pauze-toggle-knop"
                  >
                    {isPauzeBeheerOpen ? '▼ Verberg' : '▶ Bekijk en herstel'}
                  </button>
                </div>
              )}
            </div>
            
            {pausedOpdrachten.length > 0 && isPauzeBeheerOpen && (
              <div className="pauze-beheer-content">
                {/* Snelle actie */}
                <div className="bulk-acties">
                  <h5>🚀 Snelle Actie</h5>
                  <div className="bulk-actie-knoppen">
                    <button 
                      onClick={handleResumeAllOpdrachten}
                      className="bulk-actie-knop primary"
                      title="Hervat alle gepauzeerde opdrachten"
                    >
                      🔄 Hervat Alles
                    </button>
                  </div>
                </div>

                                {/* Hiërarchische categorieën accordion */}
                <div className="paused-opdrachten-accordion">
                  {(() => {
                    // Groepeer opdrachten per hoofdcategorie
                    const opdrachtenPerHoofdCategorie: { [hoofdCategorie: string]: { [subCategorie: string]: any[] } } = {};
                    
                    Object.entries(opdrachtenPerCategorie)
                      .filter(([_, opdrachten]) => opdrachten.some(op => op.isPaused))
                      .forEach(([categorie, opdrachten]) => {
                        const [hoofdCategorie, subCategorie] = categorie.split('_');
                        if (!opdrachtenPerHoofdCategorie[hoofdCategorie]) {
                          opdrachtenPerHoofdCategorie[hoofdCategorie] = {};
                        }
                        opdrachtenPerHoofdCategorie[hoofdCategorie][subCategorie] = opdrachten.filter(op => op.isPaused);
                      });

                    return Object.entries(opdrachtenPerHoofdCategorie)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([hoofdCategorie, subCategorieen]) => {
                        const totaalPausedInHoofdCategorie = Object.values(subCategorieen)
                          .flat()
                          .length;
                        
                        return (
                          <div key={hoofdCategorie} className="hoofd-categorie-accordion-item">
                            <button 
                              className="accordion-header hoofd-categorie-header"
                              onClick={() => toggleHoofdCategorieAccordion(hoofdCategorie)}
                            >
                              <span className="categorie-naam">
                                <strong>{hoofdCategorie}</strong>
                              </span>
                              <div className="categorie-actions">
                                <span className="opdracht-count">
                                  {totaalPausedInHoofdCategorie} opdracht{totaalPausedInHoofdCategorie !== 1 ? 'en' : ''}
                                </span>
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Hervat alle opdrachten in deze hoofdcategorie
                                    const opdrachtenInHoofdCategorie = Object.values(subCategorieen).flat();
                                    opdrachtenInHoofdCategorie.forEach(op => {
                                      leerDataManager.resumeOpdracht(op.opdrachtId);
                                    });
                                    setToastBericht(`✅ ${opdrachtenInHoofdCategorie.length} opdrachten in ${hoofdCategorie} hervat!`);
                                    setIsToastZichtbaar(true);
                                    window.location.reload();
                                  }}
                                  className="categorie-resume-knop"
                                  title={`Hervat alle opdrachten in ${hoofdCategorie}`}
                                >
                                  🔄
                                </div>
                              </div>
                              <span className="accordion-icon">
                                {openHoofdCategorieItems.includes(hoofdCategorie) ? '▼' : '▶'}
                              </span>
                            </button>
                            
                            {openHoofdCategorieItems.includes(hoofdCategorie) && (
                              <div className="accordion-content">
                                {Object.entries(subCategorieen)
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([subCategorie, opdrachten]) => (
                                    <div key={`${hoofdCategorie}_${subCategorie}`} className="sub-categorie-accordion-item">
                                      <button 
                                        className="accordion-header sub-categorie-header"
                                        onClick={() => toggleSubCategorieAccordion(`${hoofdCategorie}_${subCategorie}`)}
                                      >
                                        <span className="categorie-naam">
                                          <span className="sub-categorie-indicator">└─</span> {subCategorie}
                                        </span>
                                        <div className="categorie-actions">
                                          <span className="opdracht-count">
                                            {opdrachten.length} opdracht{opdrachten.length !== 1 ? 'en' : ''}
                                          </span>
                                          <div 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleResumeAllInCategorie(`${hoofdCategorie}_${subCategorie}`);
                                            }}
                                            className="categorie-resume-knop"
                                            title={`Hervat alle opdrachten in ${subCategorie}`}
                                          >
                                            🔄
                                          </div>
                                        </div>
                                        <span className="accordion-icon">
                                          {openSubCategorieItems.includes(`${hoofdCategorie}_${subCategorie}`) ? '▼' : '▶'}
                                        </span>
                                      </button>
                                      
                                      {openSubCategorieItems.includes(`${hoofdCategorie}_${subCategorie}`) && (
                                        <div className="accordion-content sub-categorie-content">
                                          <div className="paused-opdrachten-grid">
                                            {opdrachten.map(op => (
                                              <div key={op.opdrachtId} className="paused-opdracht-card">
                                                <div className="paused-opdracht-info">
                                                  <span className="opdracht-titel">
                                                    {getOpdrachtTitel(op.opdrachtId)}
                                                  </span>
                                                  <span className="box-indicator">
                                                    {op.boxId > 0 ? `Box ${op.boxId}` : 'Niet in box'}
                                                  </span>
                                                  <span className="pause-time">
                                                    Gepauzeerd: {op.pauseTime ? formatPauseTime(op.pauseTime) : 'Onbekend'}
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
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            )}
            
            {pausedOpdrachten.length === 0 && (
              <div className="geen-paused-melding">
                <p>Geen gepauzeerde opdrachten. Je kunt opdrachten pauzeren na het voltooien ervan in de Leitner leermodus.</p>
                
                <div className="instructie-sectie">
                  <button 
                    onClick={() => setIsInstructieOpen(!isInstructieOpen)}
                    className="instructie-toggle"
                  >
                    <span className="instructie-icon">
                      {isInstructieOpen ? '▼' : '▶'}
                    </span>
                    <span className="instructie-tekst">
                      {isInstructieOpen ? 'Verberg instructie' : 'Klop open voor instructie'}
                    </span>
                  </button>
                  
                  {isInstructieOpen && (
                    <div className="instructie-content">
                      <p><strong>Om een opdracht te pauzeren:</strong></p>
                      <ol>
                        <li>Start een Leitner leermodus sessie</li>
                        <li>Voltooi een opdracht</li>
                        <li>Klik op "⏸️ Pauzeer deze opdracht" in de footer</li>
                        <li>De opdracht verschijnt hier voor beheer</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Filter sectie */}
          {innerTab === 'filters' && setFilters && (
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
                    <InfoTooltip asChild content={`Filter op Tekenen-status: Ja, Mogelijk of Nee (klik om te wisselen).`}>
                      <span
                        className={`filter-icon ${Array.isArray(filters.tekenen) && filters.tekenen.includes('ja') ? 'active' : 'inactive'}`}
                        onClick={() => {
                          if (!setFilters) return;
                          const huidige = new Set(filters.tekenen || []);
                          huidige.has('ja') ? huidige.delete('ja') : huidige.add('ja');
                          setFilters({ ...filters, tekenen: Array.from(huidige) as any });
                        }}
                        title="Ja (expliciet tekenen)"
                      >
                        ✏️
                      </span>
                    </InfoTooltip>
                    <InfoTooltip asChild content={`Mogelijk: tekenen is optioneel/helpend.`}>
                      <span
                        className={`filter-icon ${Array.isArray(filters.tekenen) && filters.tekenen.includes('mogelijk') ? 'active' : 'inactive'}`}
                        onClick={() => {
                          if (!setFilters) return;
                          const huidige = new Set(filters.tekenen || []);
                          huidige.has('mogelijk') ? huidige.delete('mogelijk') : huidige.add('mogelijk');
                          setFilters({ ...filters, tekenen: Array.from(huidige) as any });
                        }}
                        title="Mogelijk (optioneel)"
                      >
                        ✏️?
                      </span>
                    </InfoTooltip>
                    <InfoTooltip asChild content={`Nee: geen tekenen.`}>
                      <span
                        className={`filter-icon ${Array.isArray(filters.tekenen) && filters.tekenen.includes('nee') ? 'active' : 'inactive'}`}
                        onClick={() => {
                          if (!setFilters) return;
                          const huidige = new Set(filters.tekenen || []);
                          huidige.has('nee') ? huidige.delete('nee') : huidige.add('nee');
                          setFilters({ ...filters, tekenen: Array.from(huidige) as any });
                        }}
                        title="Nee (geen tekenen)"
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
                      setFilters({ bronnen: ['systeem', 'gebruiker'], opdrachtTypes: [], niveaus: [], tekenen: [] });
                      setToastBericht('Filters hersteld naar standaard');
                      setIsToastZichtbaar(true);
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {innerTab === 'categories' && (
          <>
          <div className="categorie-lijst-header" ref={categorieRef} tabIndex={-1}>
            <h4>Categorieën</h4>
            <div className="snelle-selectie-knoppen">
              <button onClick={handleSelectAll} className="snelle-selectie-knop">
                Selecteer Alles
              </button>
              <button onClick={handleDeselectAll} className="snelle-selectie-knop">
                Deselecteer Alles
              </button>
              <button
                onClick={() => {
                  const map: Record<string, boolean> = {};
                  sortedStatistieken.forEach(s => { map[s.naam] = true; });
                  setOpenHoofdCategorieen(map);
                }}
                className="snelle-selectie-knop"
              >
                Klap Alles Uit
              </button>
              <button
                onClick={() => setOpenHoofdCategorieen({})}
                className="snelle-selectie-knop"
              >
                Klap Alles In
              </button>
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
                  <th rowSpan={2}>Acties</th>
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
          </>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>Sluiten</button>
        </div>
      </div>
      {isUitlegOpen && <BoxUitlegPopup onClose={() => setIsUitlegOpen(false)} />}
      
      <OpdrachtenDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        categorieNaam={geselecteerdeCategorieVoorDetail || ''}
        opdrachten={opdrachtenVoorDetail}
        geselecteerdeOpdrachten={geselecteerdeOpdrachtenVoorDetail}
      />
      
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