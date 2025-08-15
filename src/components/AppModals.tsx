import React, { lazy, Suspense, useState, useEffect } from 'react';
import type { Opdracht } from '../data/types';
import type { HighScoreLibrary } from '../data/highScoreManager';
import { Instellingen } from './Instellingen';
import { Uitleg } from './Uitleg';
import { SessieSamenvatting } from './SessieSamenvatting';
import { CategorieSelectieModal } from './CategorieSelectieModal';
import { LeitnerCategorieBeheer } from './LeitnerCategorieBeheer';
import { LimietBereiktModal } from './LimietBereiktModal';
import { OpdrachtenVoltooidModal } from './OpdrachtenVoltooidModal';
import { LeerstrategienModal } from './LeerstrategienModal';
import { BestandsUploader } from './BestandsUploader';
import { generateCertificaat } from '../utils/certificaatGenerator';
import { getLeerDataManager } from '../data/leerDataManager';

const LeeranalyseLazy = lazy(() => import('./Leeranalyse').then(m => ({ default: m.Leeranalyse })));
const CertificaatModalLazy = lazy(() => import('./CertificaatModal').then(m => ({ default: m.CertificaatModal })));

type Props = {
  // Instellingen
  isInstellingenOpen: boolean;
  onCloseInstellingen: () => void;
  onVerwijderGebruikerOpdrachten: (verwijderSysteemDataOok?: boolean) => void;
  bonusOpdrachten: { opdracht: string; punten: number[] }[];
  setBonusOpdrachten: (v: { opdracht: string; punten: number[] }[]) => void;
  basisBonusOpdrachten: { opdracht: string; punten: number[] }[];
  isSpelGestart: boolean;
  onSpelReset: () => void;
  onOpenCategorieBeheer: () => void;
  onOpenCategorieSelectie: () => void;
  currentGameMode: 'highscore' | 'multiplayer' | 'vrijeleermodus' | 'leitnerleermodus';
  hoofdcategorieen?: string[];
  subcategorieenPerHoofdcategorie?: Record<string, string[]>;

  // BestandsUploader
  onFileSelected: (file: File) => void;
  onAnnuleerUpload: () => void;
  onVerwerkBestand: (vervang: boolean) => void;
  geselecteerdBestand: File | null;

  // Uitleg
  isUitlegOpen: boolean;
  onCloseUitleg: () => void;

  // Sessie samenvatting
  isSessieSamenvattingOpen: boolean;
  onCloseSessieSamenvatting: () => void;
  eindigdeSessieData: any;
  onOpenLeeranalyse: (openToAchievements?: boolean) => void;

  // Leeranalyse
  isLeeranalyseOpen: boolean;
  onCloseLeeranalyse: () => void;
  onStartFocusSessie: (categorie: string, leermodusType?: 'normaal' | 'leitner') => void;
  openLeeranalyseToAchievements: boolean;

  // Categorie selectie
  isCategorieSelectieOpen: boolean;
  onCloseCategorieSelectie: () => void;
  opdrachten: Opdracht[];
  geselecteerdeCategorieen: string[];
  onCategorieSelectie: (categorie: string) => void;
  onBulkCategorieSelectie: (bulkCategorieen: string[], type: 'select' | 'deselect') => void;
  onOpenLeitnerBeheer: () => void;
  highScoreLibrary: HighScoreLibrary;
  setGeselecteerdeHighscoreCategorieen: (categorieen: string[] | ((prev: string[]) => string[])) => void;
  geselecteerdeLeitnerCategorieen: string[];
  setGeselecteerdeLeitnerCategorieen: (categorieen: string[] | ((prev: string[]) => string[])) => void;
  geselecteerdeMultiplayerCategorieen: string[];
  setGeselecteerdeMultiplayerCategorieen: (categorieen: string[] | ((prev: string[]) => string[])) => void;
  geselecteerdeHighscoreCategorieen: string[];
  initialActiveTab: 'highscore' | 'multiplayer' | 'normaal' | 'leitner';
  initialInnerTabForCategorieSelectie?: 'categories' | 'filters' | 'saved';
  filters: any;
  setFilters: (f: any) => void;

  // Leitner categorie beheer
  isCategorieBeheerOpen: boolean;
  onCloseCategorieBeheer: () => void;
  alleUniekeCategorieen: string[];

  // Limiet bereikt
  isLimietModalOpen: boolean;
  onCloseLimietModal: () => void;
  onConfirmLimiet: () => void;
  maxVragen: number;
  onOpenInstellingenFromLimiet: () => void;

  // Opdrachten voltooid
  isOpdrachtenVoltooidModalOpen: boolean;
  onCloseOpdrachtenVoltooid: () => void;
  onOpenCategorieSelectieFromVoltooid: () => void;
  // Leerstrategieën
  isLeerstrategienOpen?: boolean;
  onCloseLeerstrategien?: () => void;
};

export const AppModals: React.FC<Props> = (props) => {
  const [isCertificaatModalOpen, setIsCertificaatModalOpen] = useState(false);

  const handleCertificaatGenereren = async (studentName: string) => {
    try {
      const leerDataManager = getLeerDataManager();
      const leerData = leerDataManager.loadLeerData();
      const achievements = leerDataManager.loadAchievements();

      if (!leerData) {
        window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Geen leerdata beschikbaar. Start eerst een sessie in serieuze leer-modus.', type: 'fout', timeoutMs: 7000 } }));
        return;
      }

      const certificaatData = {
        studentName,
        leerData,
        achievements,
        datum: new Date().toISOString()
      };

      await generateCertificaat(certificaatData);
      setIsCertificaatModalOpen(false);
    } catch (error) {
      console.error('Fout bij certificaat generatie:', error);
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Er is een fout opgetreden bij het genereren van het certificaat. Probeer het opnieuw.', type: 'fout', timeoutMs: 7000 } }));
    }
  };

  // Event listener voor het openen van de certificaat modal
  useEffect(() => {
    const handleOpenCertificaat = () => {
      setIsCertificaatModalOpen(true);
    };

    window.addEventListener('openCertificaat', handleOpenCertificaat);
    
    return () => {
      window.removeEventListener('openCertificaat', handleOpenCertificaat);
    };
  }, []);

  const {
    // Instellingen
    isInstellingenOpen, onCloseInstellingen, onVerwijderGebruikerOpdrachten,
    bonusOpdrachten, setBonusOpdrachten, basisBonusOpdrachten, isSpelGestart, onSpelReset,
    onOpenCategorieBeheer, onOpenCategorieSelectie, currentGameMode,
    // Uploader
    onFileSelected, onAnnuleerUpload, onVerwerkBestand, geselecteerdBestand,
    // Uitleg
    isUitlegOpen, onCloseUitleg,
    // Sessie samenvatting
    isSessieSamenvattingOpen, onCloseSessieSamenvatting, eindigdeSessieData, onOpenLeeranalyse,
    // Leeranalyse
    isLeeranalyseOpen, onCloseLeeranalyse, onStartFocusSessie, openLeeranalyseToAchievements,
    // Categorie selectie
    isCategorieSelectieOpen, onCloseCategorieSelectie, opdrachten, geselecteerdeCategorieen,
    onCategorieSelectie, onBulkCategorieSelectie, onOpenLeitnerBeheer, highScoreLibrary,
    setGeselecteerdeHighscoreCategorieen, geselecteerdeLeitnerCategorieen, setGeselecteerdeLeitnerCategorieen,
    geselecteerdeMultiplayerCategorieen, setGeselecteerdeMultiplayerCategorieen, geselecteerdeHighscoreCategorieen,
    initialActiveTab, initialInnerTabForCategorieSelectie, filters, setFilters,
    // Categorie beheer
    isCategorieBeheerOpen, onCloseCategorieBeheer, alleUniekeCategorieen,
    // Limiet bereikt
    isLimietModalOpen, onCloseLimietModal, onConfirmLimiet, maxVragen, onOpenInstellingenFromLimiet,
    // Voltooid
    isOpdrachtenVoltooidModalOpen, onCloseOpdrachtenVoltooid, onOpenCategorieSelectieFromVoltooid,
    hoofdcategorieen,
    subcategorieenPerHoofdcategorie,
  } = props;

  return (
    <>
      {isInstellingenOpen && (
        <Instellingen
          isOpen={isInstellingenOpen}
          onClose={onCloseInstellingen}
          onVerwijderGebruikerOpdrachten={onVerwijderGebruikerOpdrachten}
          bonusOpdrachten={bonusOpdrachten}
          setBonusOpdrachten={setBonusOpdrachten}
          basisBonusOpdrachten={basisBonusOpdrachten}
          isSpelGestart={isSpelGestart}
          onSpelReset={onSpelReset}
          onOpenCategorieBeheer={onOpenCategorieBeheer}
          onOpenCategorieSelectie={onOpenCategorieSelectie}
          currentGameMode={currentGameMode}
          hoofdcategorieen={hoofdcategorieen || Array.from(new Set(opdrachten.map(o => o.Hoofdcategorie).filter((v): v is string => Boolean(v)))).sort((a,b) => a.localeCompare(b))}
          subcategorieenPerHoofdcategorie={subcategorieenPerHoofdcategorie || (() => {
            const map: Record<string, Set<string>> = {};
            for (const o of opdrachten) {
              const hc = o.Hoofdcategorie || '';
              const sc = o.Categorie || '';
              if (!hc || !sc) continue;
              if (!map[hc]) map[hc] = new Set();
              map[hc].add(sc);
            }
            const out: Record<string, string[]> = {};
            Object.keys(map).forEach(h => out[h] = Array.from(map[h]).sort((a,b)=>a.localeCompare(b)));
            return out;
          })()}
        >
          <BestandsUploader
            onFileSelected={onFileSelected}
            onAnnuleer={onAnnuleerUpload}
            onVerwerk={onVerwerkBestand}
            geselecteerdBestand={geselecteerdBestand}
          />

        </Instellingen>
      )}

      <Uitleg isOpen={isUitlegOpen} onClose={onCloseUitleg} />

      {props.isLeerstrategienOpen && (
        <LeerstrategienModal isOpen={props.isLeerstrategienOpen} onClose={props.onCloseLeerstrategien || (() => {})} />
      )}

      <SessieSamenvatting
        isOpen={isSessieSamenvattingOpen}
        onClose={onCloseSessieSamenvatting}
        sessieData={eindigdeSessieData}
        onOpenLeeranalyse={onOpenLeeranalyse}
      />

      <Suspense fallback={null}>
        <LeeranalyseLazy
          isOpen={isLeeranalyseOpen}
          onClose={onCloseLeeranalyse}
          key={isLeeranalyseOpen ? 'open' : 'closed'}
          onStartFocusSessie={onStartFocusSessie}
          openToAchievements={openLeeranalyseToAchievements}
        />
      </Suspense>

      <CategorieSelectieModal
        isOpen={isCategorieSelectieOpen}
        onClose={onCloseCategorieSelectie}
        opdrachten={opdrachten}
        geselecteerdeCategorieen={geselecteerdeCategorieen}
        onCategorieSelectie={onCategorieSelectie}
        onBulkCategorieSelectie={onBulkCategorieSelectie}
        onOpenLeitnerBeheer={onOpenLeitnerBeheer}
        highScoreLibrary={highScoreLibrary}
        onHighScoreSelect={setGeselecteerdeHighscoreCategorieen}
        geselecteerdeLeitnerCategorieen={geselecteerdeLeitnerCategorieen}
        setGeselecteerdeLeitnerCategorieen={setGeselecteerdeLeitnerCategorieen}
        geselecteerdeMultiplayerCategorieen={geselecteerdeMultiplayerCategorieen}
        setGeselecteerdeMultiplayerCategorieen={setGeselecteerdeMultiplayerCategorieen}
        geselecteerdeHighscoreCategorieen={geselecteerdeHighscoreCategorieen}
        setGeselecteerdeHighscoreCategorieen={setGeselecteerdeHighscoreCategorieen}
        initialActiveTab={initialActiveTab}
        initialInnerTab={initialInnerTabForCategorieSelectie}
        filters={filters}
        setFilters={setFilters}
      />

      {isCategorieBeheerOpen && (
        <LeitnerCategorieBeheer
          isOpen={isCategorieBeheerOpen}
          onClose={onCloseCategorieBeheer}
          geselecteerdeCategorieen={geselecteerdeLeitnerCategorieen}
          setGeselecteerdeCategorieen={setGeselecteerdeLeitnerCategorieen}
          alleCategorieen={alleUniekeCategorieen}
          alleOpdrachten={opdrachten}
          filters={filters}
          setFilters={setFilters}
        />
      )}

      <LimietBereiktModal
        isOpen={isLimietModalOpen}
        onClose={onCloseLimietModal}
        onConfirm={onConfirmLimiet}
        maxVragen={maxVragen}
        onOpenInstellingen={onOpenInstellingenFromLimiet}
      />

      <OpdrachtenVoltooidModal
        isOpen={isOpdrachtenVoltooidModalOpen}
        onClose={onCloseOpdrachtenVoltooid}
        onOpenCategorieSelectie={onOpenCategorieSelectieFromVoltooid}
      />

      <Suspense fallback={null}>
        <CertificaatModalLazy
          isOpen={isCertificaatModalOpen}
          onClose={() => setIsCertificaatModalOpen(false)}
          onGenerate={handleCertificaatGenereren}
        />
      </Suspense>
    </>
  );
};


