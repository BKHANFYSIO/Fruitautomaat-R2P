import React from 'react';
import type { Opdracht, Speler } from '../data/types';
import type { HighScore } from '../data/highScoreManager';
import { SpelerInput } from './SpelerInput';
import { Scorebord } from './Scorebord';
import { FilterDashboard } from './FilterDashboard';

type Props = {
  // Layout/state
  isScoreLadeOpen: boolean;

  // Spel info
  isSpelGestart: boolean;
  gameMode: 'single' | 'multi';
  spelers: Speler[];
  huidigeSpeler: Speler | null;
  huidigeRonde: number;
  effectieveMaxRondes: number;
  isSerieuzeLeerModusActief: boolean;
  leermodusType: 'normaal' | 'leitner';
  aantalBeurtenGespeeld: number;
  isFocusStandActief?: boolean;

  // Score info
  currentHighScore: HighScore | null;
  currentPersonalBest: HighScore | null;

  // Selecties en aantallen
  alleUniekeCategorieen: string[];
  gefilterdeGeselecteerdeHighscoreCategorieen: string[];
  gefilterdeGeselecteerdeMultiplayerCategorieen: string[];
  gefilterdeGeselecteerdeLeitnerCategorieen: string[];
  gefilterdeGeselecteerdeCategorieen: string[];
  aantalOpdrachtenHighscore: number;
  aantalOpdrachtenMultiplayer: number;
  aantalOpdrachtenLeitner: number;
  aantalOpdrachtenNormaal: number;

  // Leitner stats
  aantalNieuweLeitnerOpdrachten: number;
  isBox0OverrideActief: boolean;
  vandaagBeschikbaar: number;
  isModeSelectedThisSession?: boolean;

  // Handlers (navigatie/acties)
  onSpelerToevoegen: (naam: string) => void;
  setGameMode: (mode: 'single' | 'multi') => void;
  isSpelerInputDisabled: boolean;
  setIsSerieuzeLeerModusActief: (v: boolean) => void;
  setLeermodusType: (t: 'normaal' | 'leitner') => void;
  onSpelReset: () => void;

  onOpenHighscoreCategorieSelectie: () => void;
  onOpenMultiplayerCategorieSelectie: () => void;
  onOpenNormaleLeermodusCategorieSelectie: () => void;
  onOpenLeitnerCategorieBeheer: () => void;
  onEindigSessie: () => void;
  onEindigSpel: () => void;
  onOpenInstellingen: () => void;
  onOpenUitleg: () => void;

  // Filter dashboard
  filters: any;
  setFilters: (f: any) => void;
  opdrachten: Opdracht[];
  actieveCategorieSelectie: string[];
};

export const LeftPanel: React.FC<Props> = ({
  isScoreLadeOpen,
  isSpelGestart,
  gameMode,
  spelers,
  huidigeSpeler,
  huidigeRonde,
  effectieveMaxRondes,
  isSerieuzeLeerModusActief,
  leermodusType,
  aantalBeurtenGespeeld,
  isFocusStandActief = false,
  currentHighScore,
  currentPersonalBest,
  alleUniekeCategorieen,
  gefilterdeGeselecteerdeHighscoreCategorieen,
  gefilterdeGeselecteerdeMultiplayerCategorieen,
  gefilterdeGeselecteerdeLeitnerCategorieen,
  gefilterdeGeselecteerdeCategorieen,
  aantalOpdrachtenHighscore,
  aantalOpdrachtenMultiplayer,
  aantalOpdrachtenLeitner,
  aantalOpdrachtenNormaal,
  aantalNieuweLeitnerOpdrachten,
  isBox0OverrideActief,
  vandaagBeschikbaar,
  isModeSelectedThisSession = false,
  onSpelerToevoegen,
  setGameMode,
  isSpelerInputDisabled,
  setIsSerieuzeLeerModusActief,
  setLeermodusType,
  onSpelReset,
  onOpenHighscoreCategorieSelectie,
  onOpenMultiplayerCategorieSelectie,
  onOpenNormaleLeermodusCategorieSelectie,
  onOpenLeitnerCategorieBeheer,
  onEindigSessie,
  onEindigSpel,
  onOpenInstellingen,
  onOpenUitleg,
  filters,
  setFilters,
  opdrachten,
  actieveCategorieSelectie,
}) => {
  return (
    <aside className={`left-panel ${isScoreLadeOpen ? 'open' : ''}`}>
      {!isSpelGestart && (
        <SpelerInput
          onSpelerToevoegen={onSpelerToevoegen}
          gameMode={gameMode}
          setGameMode={setGameMode}
          isSpelerInputDisabled={isSpelerInputDisabled}
          isSpelGestart={isSpelGestart}
          isSerieuzeLeerModusActief={isSerieuzeLeerModusActief}
          setIsSerieuzeLeerModusActief={setIsSerieuzeLeerModusActief}
          leermodusType={leermodusType}
          setLeermodusType={setLeermodusType}
          onSpelReset={onSpelReset}
          spelersCount={spelers.length}
        />
      )}

      <Scorebord
        spelers={spelers}
        huidigeSpeler={huidigeSpeler}
        huidigeRonde={huidigeRonde}
        maxRondes={effectieveMaxRondes}
        gameMode={gameMode}
        highScore={currentHighScore}
        personalBest={currentPersonalBest}
        isSerieuzeLeerModusActief={isSerieuzeLeerModusActief}
        isFocusStandActief={isFocusStandActief}
        aantalBeurtenGespeeld={aantalBeurtenGespeeld}
      />

      {gameMode === 'single' && !isSerieuzeLeerModusActief && (
        <>
          {!isSpelGestart && (
            <h3 className={`mode-selector-title ${isModeSelectedThisSession && spelers.length >= 1 ? 'step-pulse' : ''}`}>3. Categorieën & filters</h3>
          )}
          <div className="highscore-sectie">
          <div className="highscore-header">
            <h5>🏆 Highscore Modus</h5>
          </div>
          <div className="highscore-info">
            <button
              onClick={onOpenHighscoreCategorieSelectie}
              className="categorie-beheer-knop"
              disabled={isSpelGestart}
            >
              <span className="knop-titel">Categorieën Aanpassen</span>
              <span className="knop-details">
                {gefilterdeGeselecteerdeHighscoreCategorieen.length}/{alleUniekeCategorieen.length} Cat. | {aantalOpdrachtenHighscore} Opdr.
              </span>
              {isSpelGestart && <span className="disabled-hint"> - Spel is bezig</span>}
            </button>
            <div className="highscore-info-text">
              <p>Probeer je beste score te behalen met de geselecteerde categorieën!</p>
            </div>
          </div>
          </div>
        </>
      )}

      {gameMode === 'multi' && (
        <>
          {!isSpelGestart && (
            <h3 className={`mode-selector-title ${isModeSelectedThisSession && spelers.length >= 2 ? 'step-pulse' : ''}`}>3. Categorieën & filters</h3>
          )}
          <div className="multiplayer-sectie">
          <div className="multiplayer-header">
            <h5>🎮 Multiplayer Modus</h5>
          </div>
          <div className="multiplayer-info">
            <button
              onClick={onOpenMultiplayerCategorieSelectie}
              className="categorie-beheer-knop"
              disabled={isSpelGestart}
            >
              <span className="knop-titel">Categorieën Aanpassen</span>
              <span className="knop-details">
                {gefilterdeGeselecteerdeMultiplayerCategorieen.length}/{alleUniekeCategorieen.length} Cat. | {aantalOpdrachtenMultiplayer} Opdr.
              </span>
              {isSpelGestart && <span className="disabled-hint"> - Spel is bezig</span>}
            </button>
            <div className="multiplayer-info-text">
              <p>Speel samen met vrienden en familie!</p>
            </div>
          </div>
          </div>
        </>
      )}

      {gameMode === 'single' && isSerieuzeLeerModusActief && (
        <>
          {!isSpelGestart && (
            <h3 className={`mode-selector-title ${isModeSelectedThisSession ? 'step-pulse' : ''}`}>2. Categorieën & filters</h3>
          )}
          <div className="serieuze-leermodus-uitleg">
            {leermodusType === 'leitner' && (
              <div className="leitner-sectie">
                <div className="leitner-header">
                <h5>🔄 Leitner</h5>
                </div>
                <div className="leitner-stats">
                <button onClick={onOpenLeitnerCategorieBeheer} className="categorie-beheer-knop">
                  <span className="knop-titel">Categorieën Aanpassen</span>
                  <span className="knop-details">
                    {gefilterdeGeselecteerdeLeitnerCategorieen.length}/{alleUniekeCategorieen.length} Cat. | {aantalOpdrachtenLeitner} Opdr.
                  </span>
                </button>
                <div className="leitner-stats-info">
                  <p>Nieuwe opdrachten: <strong>{aantalNieuweLeitnerOpdrachten}</strong></p>
                  <p>
                    {isBox0OverrideActief ? 'Box 0 (wachttijd genegeerd):' : 'Klaar voor herhaling:'}
                    <strong> {vandaagBeschikbaar}</strong> opdrachten
                  </p>
                </div>
                {vandaagBeschikbaar > 0 && (
                  <p className="leitner-priority">⭐ Herhalingen komen eerst, nieuwe opdrachten daarna.</p>
                )}
                </div>
              </div>
            )}
            {leermodusType === 'normaal' && (
              <div className="vrije-leermodus-sectie">
                <div className="vrije-leermodus-header">
                  <h5>📚 Vrije Leermodus</h5>
                </div>
                <div className="vrije-leermodus-info">
                  <button onClick={onOpenNormaleLeermodusCategorieSelectie} className="categorie-beheer-knop">
                    <span className="knop-titel">Categorieën Aanpassen</span>
                    <span className="knop-details">
                      {gefilterdeGeselecteerdeCategorieen.length}/{alleUniekeCategorieen.length} Cat. | {aantalOpdrachtenNormaal} Opdr.
                    </span>
                  </button>
                  <div className="vrije-leermodus-info-text">
                    <p>Je leert op basis van herhalingen met opslaan van data voor leeranalyses en certificaat.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <FilterDashboard
        filters={filters}
        setFilters={setFilters}
        opdrachten={opdrachten}
        actieveCategorieSelectie={actieveCategorieSelectie}
        collapseKey={`${gameMode}|${isSerieuzeLeerModusActief?'1':'0'}|${isSpelGestart?'1':'0'}|${leermodusType}`}
      />

      {isSpelGestart && gameMode === 'single' && isSerieuzeLeerModusActief && (
        <div className="spel-controle-knoppen">
          <button className="eindig-knop" onClick={onEindigSessie}>🏁 Sessie Beëindigen</button>
          <p className="sessie-controle-tekst">Sluit je leersessie af voor een samenvatting.</p>
        </div>
      )}

      {isSpelGestart && !isSerieuzeLeerModusActief && (
        <div className="spel-controle-knoppen">
          <button className="eindig-knop" onClick={onEindigSpel}>🛑 Spel Beëindigen</button>
          <p className="sessie-controle-tekst">Hiermee reset je het spel en de scores.</p>
        </div>
      )}

      <div className="instellingen-knoppen instellingen-grid">
        <div className="instellingen-row">
          <button className="instellingen-knop" onClick={onOpenInstellingen}>⚙️ Instellingen</button>
          <button className="instellingen-knop" onClick={onOpenUitleg}>📖 Uitleg</button>
        </div>
        <div className="instellingen-row">
          <button
            className="instellingen-knop"
            onClick={() => window.dispatchEvent(new CustomEvent('openLeeranalyse', { detail: { tab: 'overzicht' } }))}
            title="Leeranalyse & Certificaat"
          >
            📊 Leeranalyse
          </button>
          <button
            className="instellingen-knop"
            onClick={() => window.dispatchEvent(new CustomEvent('openCertificaat'))}
            title="Certificaat"
          >
            🎓 Certificaat
          </button>
        </div>
      </div>

      <div className="han-logo-container">
        <img src="/images/Logo-HAN.webp" alt="Logo Hogeschool van Arnhem en Nijmegen" className="han-logo" />
        <p>Ontwikkeld door de opleiding Fysiotherapie van de Hogeschool van Arnhem en Nijmegen.</p>
      </div>
    </aside>
  );
};


