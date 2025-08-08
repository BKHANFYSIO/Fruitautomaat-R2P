import React, { lazy, Suspense } from 'react';
import type { Opdracht, Achievement } from '../data/types';
import type { HighScore, HighScoreLibrary } from '../data/highScoreManager';
import { Instellingen } from './Instellingen';
import { Uitleg } from './Uitleg';
import { SessieSamenvatting } from './SessieSamenvatting';
import { CategorieSelectieModal } from './CategorieSelectieModal';
import { LeitnerCategorieBeheer } from './LeitnerCategorieBeheer';
import { LimietBereiktModal } from './LimietBereiktModal';
import { OpdrachtenVoltooidModal } from './OpdrachtenVoltooidModal';
import { BestandsUploader } from './BestandsUploader';

const LeeranalyseLazy = lazy(() => import('./Leeranalyse').then(m => ({ default: m.Leeranalyse })));

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
  onStartFocusSessie: (categorie: string, leermodusType: 'normaal' | 'leitner') => void;
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
  setGeselecteerdeHighscoreCategorieen: (cats: string[]) => void;
  geselecteerdeLeitnerCategorieen: string[];
  setGeselecteerdeLeitnerCategorieen: (cats: string[]) => void;
  geselecteerdeMultiplayerCategorieen: string[];
  setGeselecteerdeMultiplayerCategorieen: (cats: string[]) => void;
  geselecteerdeHighscoreCategorieen: string[];
  initialActiveTab: 'highscore' | 'multiplayer' | 'normaal' | 'leitner';
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
};

export const AppModals: React.FC<Props> = (props) => {
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
    initialActiveTab, filters, setFilters,
    // Categorie beheer
    isCategorieBeheerOpen, onCloseCategorieBeheer, alleUniekeCategorieen,
    // Limiet bereikt
    isLimietModalOpen, onCloseLimietModal, onConfirmLimiet, maxVragen, onOpenInstellingenFromLimiet,
    // Voltooid
    isOpdrachtenVoltooidModalOpen, onCloseOpdrachtenVoltooid, onOpenCategorieSelectieFromVoltooid,
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
        >
          <BestandsUploader
            onFileSelected={onFileSelected}
            onAnnuleer={onAnnuleerUpload}
            onVerwerk={onVerwerkBestand}
            geselecteerdBestand={geselecteerdBestand}
          />
          <p className="setting-description" style={{ marginLeft: 0, marginTop: '20px', marginBottom: '15px' }}>
            <strong>Categorieën selectie:</strong> Categorieën kunnen nu worden aangepast via de knoppen in het linker menu.
            Elke spelmodus heeft zijn eigen categorie selectie.
          </p>
        </Instellingen>
      )}

      <Uitleg isOpen={isUitlegOpen} onClose={onCloseUitleg} />

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
    </>
  );
};


