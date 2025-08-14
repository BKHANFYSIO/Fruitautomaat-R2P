import React, { useState, useEffect, useCallback } from 'react';
import { lazy, Suspense } from 'react';
import { BonusOpdrachtBeheer } from './BonusOpdrachtBeheer';
const AiOpgaveGeneratorLazy = lazy(() => import('./AiOpgaveGenerator').then(m => ({ default: m.AiOpgaveGenerator })));
const LeeranalyseLazy = lazy(() => import('./Leeranalyse').then(m => ({ default: m.Leeranalyse })));
const CertificaatModalLazy = lazy(() => import('./CertificaatModal').then(m => ({ default: m.CertificaatModal })));
import * as XLSX from 'xlsx';
import { Modal as SimpleModal } from './Modal';
import './Instellingen.css';
import { generateCertificaat } from '../utils/certificaatGenerator';
import { getLeerDataManager } from '../data/leerDataManager';
import { useSettings } from '../context/SettingsContext';

type BonusOpdracht = { opdracht: string; punten: number[] };

interface InstellingenProps {
  isOpen: boolean;
  onClose: () => void;
  // Opdrachtenbeheer
  children: React.ReactNode; // Voor de bestands-uploader en categorie-filter
  onVerwijderGebruikerOpdrachten: () => void;
  // Geavanceerd
  bonusOpdrachten: BonusOpdracht[];
  setBonusOpdrachten: (opdrachten: BonusOpdracht[]) => void;
  basisBonusOpdrachten: { opdracht: string; punten: number[] }[];
  // Spel status
  isSpelGestart: boolean;
  onSpelReset: () => void;
  // Categorie beheer
  onOpenCategorieBeheer: () => void;
  onOpenCategorieSelectie?: () => void;
  // Huidige modus voor automatische tab selectie
  currentGameMode?: 'highscore' | 'multiplayer' | 'vrijeleermodus' | 'leitnerleermodus';
  // Lijst van huidige hoofdcategorieën (voor AI generator)
  hoofdcategorieen?: string[];
  // Mapping van hoofdcategorie -> subcategorieën (voor AI generator)
  subcategorieenPerHoofdcategorie?: Record<string, string[]>;
}

export const Instellingen = React.memo(({
  isOpen,
  onClose,
  // Opdrachtenbeheer
  children,
  onVerwijderGebruikerOpdrachten,
  // Geavanceerd
  bonusOpdrachten,
  setBonusOpdrachten,
  basisBonusOpdrachten,
  // Spel status
  // isSpelGestart, // Niet meer gebruikt
  onSpelReset,
  // Categorie beheer
  onOpenCategorieBeheer,
  // onOpenCategorieSelectie, // Niet meer gebruikt
  // Huidige modus voor automatische tab selectie
  currentGameMode,
  hoofdcategorieen = [],
  subcategorieenPerHoofdcategorie = {},
}: InstellingenProps) => {
  // Settings context
  const {
    // gameMode, // Niet meer gebruikt
    setGameMode,
    maxRondes,
    setMaxRondes,
    isGeluidActief,
    setIsGeluidActief,
    isTimerActief,
    setIsTimerActief,
    isEerlijkeSelectieActief,
    setIsEerlijkeSelectieActief,
    // isJokerSpinActief, // Niet meer gebruikt
    setIsJokerSpinActief,
    isBonusOpdrachtenActief,
    setIsBonusOpdrachtenActief,
    isSpinVergrendelingActief,
    setIsSpinVergrendelingActief,
    isAutomatischScorebordActief,
    setIsAutomatischScorebordActief,
    bonusKans,
    setBonusKans,
    forceerMobieleWeergave,
    setForceerMobieleWeergave,
    // isSerieuzeLeerModusActief, // Niet meer gebruikt
    setIsSerieuzeLeerModusActief,
    isLeerFeedbackActief, // legacy
    setIsLeerFeedbackActief, // legacy
    isLeerstrategietipsActiefVrijeLeermodus,
    setIsLeerstrategietipsActiefVrijeLeermodus,
    isLeerstrategietipsActiefLeitnerLeermodus,
    setIsLeerstrategietipsActiefLeitnerLeermodus,
    leermodusType,
    setLeermodusType,
    isLokaleBonusOpslagActief,
    setIsLokaleBonusOpslagActief,
    maxNewLeitnerQuestionsPerDay,
    setMaxNewLeitnerQuestionsPerDay,
    isMaxNewQuestionsLimitActief,
    setIsMaxNewQuestionsLimitActief,
    negeerBox0Wachttijd,
    setNegeerBox0Wachttijd,
    // Per-modus settings
    isSpinVergrendelingActiefHighscore,
    setIsSpinVergrendelingActiefHighscore,
    isJokerSpinActiefHighscore,
    setIsJokerSpinActiefHighscore,
    isFocusStandActiefHighscore,
    setIsFocusStandActiefHighscore,
    isSpinVergrendelingActiefMultiplayer,
    setIsSpinVergrendelingActiefMultiplayer,
    isJokerSpinActiefMultiplayer,
    setIsJokerSpinActiefMultiplayer,
    isFocusStandActiefMultiplayer,
    setIsFocusStandActiefMultiplayer,
    isSpinVergrendelingActiefVrijeLeermodus,
    setIsSpinVergrendelingActiefVrijeLeermodus,
    isSpinVergrendelingActiefLeitnerLeermodus,
    setIsSpinVergrendelingActiefLeitnerLeermodus,
    // Kale modus instellingen
    isKaleModusActiefVrijeLeermodus,
    setIsKaleModusActiefVrijeLeermodus,
    isKaleModusActiefLeitnerLeermodus,
    setIsKaleModusActiefLeitnerLeermodus,
    // Niveau-selectie instellingen
    selectieOpNiveauVrije,
    setSelectieOpNiveauVrije,
    ongedefinieerdGedragVrije,
    setOngedefinieerdGedragVrije,
    selectieOpNiveauLeitner,
    setSelectieOpNiveauLeitner,
    ongedefinieerdGedragLeitner,
    setOngedefinieerdGedragLeitner,
    selectieOpNiveauHighscore,
    setSelectieOpNiveauHighscore,
    ongedefinieerdGedragHighscore,
    setOngedefinieerdGedragHighscore,
    selectieOpNiveauMultiplayer,
    setSelectieOpNiveauMultiplayer,
    ongedefinieerdGedragMultiplayer,
    setOngedefinieerdGedragMultiplayer,
    // isBox0IntervalVerkort, // Niet meer gebruikt
    // setIsBox0IntervalVerkort, // Niet meer gebruikt
    // isRolTijdVerkort, // Niet meer gebruikt
    // setIsRolTijdVerkort, // Niet meer gebruikt
  } = useSettings();

  // Tab state
  const [activeTab, setActiveTab] = useState('algemeen');

  // Automatisch naar het juiste tabblad gaan op basis van de huidige modus
  useEffect(() => {
    if (isOpen && currentGameMode) {
      setActiveTab(currentGameMode);
    }
  }, [isOpen, currentGameMode]);

  // Automatisch leerfeedback uitschakelen wanneer kale modus wordt ingeschakeld
  useEffect(() => {
    if (isKaleModusActiefVrijeLeermodus && isLeerFeedbackActief) {
      setIsLeerFeedbackActief(false);
    }
  }, [isKaleModusActiefVrijeLeermodus, isLeerFeedbackActief, setIsLeerFeedbackActief]);

  const [isBonusBeheerOpen, setIsBonusBeheerOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isSjabloonUitlegOpen, setIsSjabloonUitlegOpen] = useState(false);
  const [isLeeranalyseOpen, setIsLeeranalyseOpen] = useState(false);
  const [isCertificaatModalOpen, setIsCertificaatModalOpen] = useState(false);
  const [isSerieuzeModusWaarschuwingOpen, setIsSerieuzeModusWaarschuwingOpen] = useState(false);
  const [isSerieuzeModusUitschakelenOpen, setIsSerieuzeModusUitschakelenOpen] = useState(false);

  const handleOpenLeitnerBeheer = useCallback(() => {
    onOpenCategorieBeheer();
    onClose(); // Sluit de instellingen modal
  }, [onOpenCategorieBeheer, onClose]);

  useEffect(() => {
    // Als spinvergrendeling wordt uitgeschakeld, schakel dan ook de joker-spins uit.
    if (!isSpinVergrendelingActief) {
      setIsJokerSpinActief(false);
    }
  }, [isSpinVergrendelingActief, setIsJokerSpinActief]);

  // Helper functie om modus naam te bepalen (niet meer gebruikt)
  // const getModusNaam = () => {
  //   if (gameMode === 'multi') return 'Multiplayer Modus';
  //   if (!isSerieuzeLeerModusActief) return 'Highscore Modus';
  //   if (leermodusType === 'leitner') return 'Leitner Leermodus';
  //   return 'Vrije Leermodus';
  // };

  if (!isOpen) {
    return null;
  }

  const handleClearHighscoresAndRecords = () => {
    if (confirm('Weet je zeker dat je alle highscores en persoonlijke records wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      localStorage.removeItem('fruitautomaat_highScores');
      localStorage.removeItem('fruitautomaat_personalBests');
      window.location.reload();
    }
  };

  const handleClearBonusOpdrachten = () => {
    if (confirm('Weet je zeker dat je de lokaal opgeslagen bonusopdrachten wilt verwijderen? Je keert terug naar de standaard bonusopdrachten.')) {
      localStorage.removeItem('bonusOpdrachten');
      setBonusOpdrachten(basisBonusOpdrachten);
    }
  };

  const handleClearLeeranalyseData = () => {
    if (confirm('Weet je zeker dat je alle leeranalyse gegevens en statistieken wilt verwijderen? Dit verwijdert alle opgeslagen leeractiviteiten, sessies en statistieken van de serieuze leer-modus. Dit kan niet ongedaan worden gemaakt.')) {
      // Verwijder alle leerdata keys uit localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('fruitautomaat_leerdata_') || 
            key.startsWith('fruitautomaat_sessies_') || 
            key.startsWith('fruitautomaat_preferences_') || 
            key.startsWith('fruitautomaat_achievements_')) {
          localStorage.removeItem(key);
        }
      });
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Leeranalyse gegevens zijn verwijderd.', type: 'succes', timeoutMs: 6000 } }));
    }
  };

  const handleClearLeitnerData = () => {
    if (confirm('Weet je zeker dat je alle Leitner-systeem gegevens wilt verwijderen? Dit verwijdert alle opgeslagen opdracht boxen en herhalingsdata. Dit kan niet ongedaan worden gemaakt.')) {
      // Verwijder alle Leitner data keys uit localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('fruitautomaat_leitner_')) {
          localStorage.removeItem(key);
        }
      });
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Leitner-systeem gegevens zijn verwijderd.', type: 'succes', timeoutMs: 6000 } }));
    }
  };

  const handleClearAllData = () => {
    if (confirm('Weet je zeker dat je ALLE gegevens wilt verwijderen? Dit kan niet ongedaan gemaakt worden.')) {
      // Verwijder alle localStorage items die beginnen met fruitautomaat_
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fruitautomaat_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Verwijder categorie selecties
      localStorage.removeItem('geselecteerdeCategorieen_normaal');
      localStorage.removeItem('geselecteerdeCategorieen_leitner');
      localStorage.removeItem('geselecteerdeCategorieen_multiplayer');
      localStorage.removeItem('geselecteerdeCategorieen_highscore');
      localStorage.removeItem('multiplayer_categorie_selecties');
      localStorage.removeItem('vrije_leermodus_categorie_selecties');
      localStorage.removeItem('leitner_categorie_selecties');
      
      // Verwijder filters
      localStorage.removeItem('opdrachtFilters');
      
      // Verwijder UI state
      localStorage.removeItem('filterDashboardExpanded');
      localStorage.removeItem('orientatie_melding_getoond');
      
      // Verwijder bonusopdrachten
      localStorage.removeItem('bonusOpdrachten');
      
      // Verwijder eigen opdrachten
      localStorage.removeItem('fruitautomaat_user_opdrachten');
      
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Alle gegevens zijn verwijderd. De pagina wordt herladen...', type: 'succes', timeoutMs: 6000 } }));
      window.location.reload();
    }
  };

  const handleHerstelStandaardInstellingen = () => {
    if (confirm('Weet je zeker dat je alle instellingen wilt herstellen naar de standaardwaarden? Dit kan niet ongedaan gemaakt worden.')) {
      // Herstel alle instellingen naar standaardwaarden
      setIsGeluidActief(true);
      setIsTimerActief(true);
      setIsEerlijkeSelectieActief(true);
      setIsJokerSpinActief(true);
      setIsBonusOpdrachtenActief(true);
      setIsSpinVergrendelingActief(true);
      setIsAutomatischScorebordActief(true);
      setForceerMobieleWeergave(false);
      setMaxRondes(4);
      setBonusKans('standaard');
      
      // Per-modus instellingen herstellen
      setIsSpinVergrendelingActiefHighscore(true);
      setIsJokerSpinActiefHighscore(false);
      setIsSpinVergrendelingActiefMultiplayer(true);
      setIsJokerSpinActiefMultiplayer(true);
      setIsSpinVergrendelingActiefVrijeLeermodus(true);
      setIsSpinVergrendelingActiefLeitnerLeermodus(true);
      
      // Kale modus instellingen herstellen
      setIsKaleModusActiefVrijeLeermodus(false);
      setIsKaleModusActiefLeitnerLeermodus(false);
      
      // Leermodus instellingen herstellen
      setIsSerieuzeLeerModusActief(false);
      setIsLeerFeedbackActief(true);
      setLeermodusType('leitner');
      setMaxNewLeitnerQuestionsPerDay(10);
      setIsMaxNewQuestionsLimitActief(true);
      setNegeerBox0Wachttijd(true);
      
      // Dev instellingen herstellen (niet meer beschikbaar)
      // setIsBox0IntervalVerkort(false);
      // setIsRolTijdVerkort(false);
      
      // Bonus instellingen herstellen
      setIsLokaleBonusOpslagActief(false);
      
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Alle instellingen zijn hersteld naar standaard.', type: 'succes', timeoutMs: 6000 } }));
    }
  };

  // Functies voor serieuze modus toggles (niet meer gebruikt)
  // const handleSerieuzeModusToggle = (checked: boolean) => {
  //   if (checked) {
  //     if (isSpelGestart && gameMode === 'multi') {
  //       setIsSerieuzeModusWaarschuwingOpen(true);
  //     } else {
  //       setIsSerieuzeLeerModusActief(true);
  //       if (gameMode === 'multi') {
  //         setGameMode('single');
  //       }
  //     }
  //   } else {
  //     if (isSpelGestart && isSerieuzeLeerModusActief) {
  //       setIsSerieuzeModusUitschakelenOpen(true);
  //     } else {
  //       setIsSerieuzeLeerModusActief(false);
  //     }
  //   }
  // };

  // const handleLeitnerModusToggle = (checked: boolean) => {
  //   setLeermodusType(checked ? 'leitner' : 'normaal');
  // };
  
  const handleSerieuzeModusBevestiging = () => {
    setIsSerieuzeLeerModusActief(true);
    setGameMode('single');
    onSpelReset();
    setIsSerieuzeModusWaarschuwingOpen(false);
  };

  const handleSerieuzeModusUitschakelen = () => {
    // Alleen spel state resetten, leerdata behouden
    onSpelReset();
    setIsSerieuzeLeerModusActief(false);
    setIsLeerFeedbackActief(false);
    setIsSerieuzeModusUitschakelenOpen(false);
  };

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

  return (
    <div className="instellingen-overlay" onClick={onClose}>
      <div className="instellingen-content" onClick={(e) => e.stopPropagation()}>
        <div className="instellingen-header">
          <h2>Instellingen</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        
        {/* Tab Navigation */}
        <div className="instellingen-tabs">
          <button 
            className={`tab-button ${activeTab === 'algemeen' ? 'active' : ''}`}
            onClick={() => setActiveTab('algemeen')}
          >
            🔧 Algemeen
          </button>
          <button 
            className={`tab-button ${activeTab === 'highscore' ? 'active' : ''}`}
            onClick={() => setActiveTab('highscore')}
          >
            🏆 Highscore
          </button>
          <button 
            className={`tab-button ${activeTab === 'multiplayer' ? 'active' : ''}`}
            onClick={() => setActiveTab('multiplayer')}
          >
            👥 Multiplayer
          </button>
          <button 
            className={`tab-button ${activeTab === 'vrijeleermodus' ? 'active' : ''}`}
            onClick={() => setActiveTab('vrijeleermodus')}
          >
            📚 Vrije Leermodus
          </button>
          <button 
            className={`tab-button ${activeTab === 'leitnerleermodus' ? 'active' : ''}`}
            onClick={() => setActiveTab('leitnerleermodus')}
          >
            📚 Leitner Leermodus
          </button>
        </div>

        <div className="instellingen-body">
          {/* Tab Content - conditioneel per tab */}
          <div className="tab-content">
            {/* --- Tab: Algemeen --- */}
            {activeTab === 'algemeen' && (
              <>
                <div className="settings-group">
                  <h4>Algemeen</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={isGeluidActief}
                      onChange={() => setIsGeluidActief(!isGeluidActief)}
                    />
                    Geluidseffecten
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={forceerMobieleWeergave}
                      onChange={() => setForceerMobieleWeergave(!forceerMobieleWeergave)}
                    />
                    Forceer mobiele weergave
                  </label>
                  <p className="setting-description">
                    Forceert de mobiele layout op laptop/desktop: verbergt scorebord en instellingen achter de beker en lichten de fruitautomaat meer uit. In mobiele weergave gebeurt dit al automatisch.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isAutomatischScorebordActief}
                      onChange={() => setIsAutomatischScorebordActief(!isAutomatischScorebordActief)}
                    />
                    Toon scorebord automatisch in mobiele weergave
                  </label>
                  <p className="setting-description">
                    Toont het scorebord automatisch na het geven van een score voor de duur van 2 seconden. In normale weergave blijft het scorebord altijd zichtbaar.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isTimerActief}
                      onChange={(e) => setIsTimerActief(e.target.checked)}
                    />
                    Timer voor opdrachten gebruiken
                  </label>
                  <p className="setting-description">
                    Toont een timer tijdens het beantwoorden van opdrachten. De timer helpt bij het oefenen van vaardigheden en het automatiseren van kennis. 
                    <strong>Tip:</strong> Schakel de timer uit als je nog bezig bent met het leren van nieuwe stof - dan kan de druk afleiden van het begrijpen van de materie.
                  </p>
                  
                  {/* Herstel Standaard Instellingen verplaatst naar onderaan Algemeen-tab */}
                </div>

                {/* --- Groep: Opdrachtenbeheer --- */}
                <div className="settings-group">
                  <h4>Opdrachtenbeheer</h4>
                  
                  {/* Handmatig sectie */}
                  <div style={{ marginBottom: '25px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#4ea3ff', fontSize: '1rem' }}>📝 Handmatig opdrachten maken</h5>
                    <p className="setting-description" style={{ marginLeft: 0, marginTop: '0px', marginBottom: '15px' }}>
                      Download het Excel-sjabloon, vul je opdrachten in en upload het bestand via "Kies bestand". 
                      Kies vervolgens of je wilt aanvullen of overschrijven.
                      <strong>Bekijk eerst de "Instructie Excel‑sjabloon" hieronder om het bestand correct in te vullen.</strong>
                    </p>
                    
                    <div className="opdracht-knoppen-container">
                      <button 
                        onClick={() => {
                          const data = [
                            {
                              Hoofdcategorie: 'Anatomie',
                              Categorie: 'Schouder',
                              Type: 'Feitenkennis',
                              Tekenen: 'Nee',
                              Opdracht: 'Noem 3 spieren die betrokken zijn bij abductie van de schouder.',
                              Antwoordsleutel: 'm. deltoideus (pars acromialis), m. supraspinatus, m. trapezius (stabiliserend) — bron: boek/college',
                              Tijdslimiet: 60,
                              "Extra_Punten (max 2)": 0,
                              Niveau: 1,
                              Casus: ''
                            },
                            {
                              Hoofdcategorie: 'Revalidatie',
                              Categorie: 'Knie',
                              Type: 'Toepassing',
                              Tekenen: 'Nee',
                              Opdracht: 'Stel een progressieplan op voor een patiënt die herstelt van een knieoperatie.',
                              Antwoordsleutel: 'Criteria‑gebaseerde progressie; monitor pijn/zwelling; bron: richtlijn revalidatie.',
                              Tijdslimiet: 90,
                              "Extra_Punten (max 2)": 2,
                              Niveau: 2,
                              Casus: 'Patiënt 45 jaar, 6 weken post‑VKB; doel: traplopen zonder pijn.'
                            }
                          ];
                          const worksheet = XLSX.utils.json_to_sheet(data);
                          const workbook = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(workbook, worksheet, 'Opdrachten');
                          XLSX.writeFile(workbook, 'opdrachten_sjabloon.xlsx');
                        }}
                        className="instellingen-knop download-template-knop"
                      >
                        📥 Download Excel Sjabloon
                      </button>
                      {/* Instructie-knop direct onder de downloadknop */}
                      <div>
                        <button 
                          className="instellingen-knop"
                          onClick={() => setIsSjabloonUitlegOpen(true)}
                          title="Uitleg over kolommen, filters en links in Excel"
                          style={{ 
                            marginTop: 8, 
                            width: '100%', 
                            maxWidth: '350px',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          ℹ️ Instructie Excel‑sjabloon
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI sectie */}
                  <div style={{ marginBottom: '25px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#4ea3ff', fontSize: '1rem' }}>🤖 Opdrachten genereren met AI</h5>
                    <p className="setting-description" style={{ marginLeft: 0, marginTop: '0px', marginBottom: '15px' }}>
                      Klik op de knop hieronder voor een instructie en prompt die je kunt kopiëren en gebruiken in je favoriete AI-tool. 
                      Dit is een snelle manier om veel opdrachten te maken.
                    </p>
                    
                    <button 
                      className="instellingen-knop ai-generator-knop"
                      onClick={() => setIsAiGeneratorOpen(true)}
                    >
                      🚀 Genereer Nieuwe Opdrachten met AI
                    </button>
                  </div>

                  {/* Upload sectie */}
                  <div style={{ marginBottom: '25px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#4ea3ff', fontSize: '1rem' }}>📤 Opdrachten toevoegen</h5>
                    <p className="setting-description" style={{ marginLeft: 0, marginTop: '0px', marginBottom: '15px' }}>
                      Klik op "Kies een bestand" en selecteer je handmatig gemaakte Excel-bestand of het bestand dat je met AI hebt gegenereerd. 
                      Kies vervolgens of je wilt aanvullen of alle bestaande opdrachten wilt overschrijven.
                    </p>
                    
                    {children}
                  </div>

                  {/* Categorieën selectie sectie */}
                  <div style={{ marginBottom: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#4ea3ff', fontSize: '1rem' }}>🎯 Categorieën selectie</h5>
                    <p className="setting-description" style={{ marginLeft: 0, marginTop: '0px', marginBottom: '15px' }}>
                      <strong>Belangrijk:</strong> Na het uploaden van opdrachten kun je via de categorieën selectie (in het hoofdmenu) bepalen welke opdrachten je wilt gebruiken tijdens het spelen. 
                      Dit geldt voor alle spellen en leermodi. Je kunt hier filteren op hoofdcategorie, subcategorie, opdrachttype en andere criteria.
                    </p>
                  </div>
                </div>

                {/* --- Groep: Data Beheer --- */}
                <div className="settings-group">
                  <h4>Data Beheer</h4>
                  <p className="setting-description" style={{ marginLeft: 0, marginTop: '-5px', marginBottom: '15px' }}>
                    Hier kun je verschillende soorten lokaal opgeslagen gegevens verwijderen.
                  </p>
                  
                  <div className="data-beheer-knoppen">
                    <button 
                      onClick={() => {
                        if (confirm('Weet je zeker dat je alle zelf toegevoegde opdrachten wilt verwijderen? Je kunt ze later weer uploaden via het Excel bestand als je dat nog hebt.')) {
                          onVerwijderGebruikerOpdrachten();
                          window.dispatchEvent(new CustomEvent('app:notify', { detail: { message: 'Alle eigen opdrachten zijn verwijderd.', type: 'succes', timeoutMs: 6000 } }));
                        }
                      }}
                      className="data-beheer-knop opdrachten-knop"
                    >
                      📝 Verwijder Eigen Opdrachten
                    </button>

                    <button 
                      onClick={handleClearHighscoresAndRecords}
                      className="data-beheer-knop single-player-knop"
                    >
                      🎯 Verwijder Highscores & Records
                    </button>
                    
                    <button 
                      onClick={handleClearBonusOpdrachten}
                      className="data-beheer-knop bonus-knop"
                    >
                      🎭 Verwijder Bonusopdrachten
                    </button>
                    
                    <button 
                      onClick={handleClearLeeranalyseData}
                      className="data-beheer-knop leeranalyse-knop"
                    >
                      📊 Verwijder Leeranalyse & Statistieken
                    </button>
                    
                    <button 
                      onClick={handleClearLeitnerData}
                      className="data-beheer-knop leitner-knop"
                    >
                      📚 Verwijder Leitner-systeem Data
                    </button>
                    
                    <button 
                      onClick={handleClearAllData}
                      className="data-beheer-knop alles-knop"
                    >
                      🗑️ Verwijder Alle Gegevens
                    </button>
                  </div>
                  
                  <p className="setting-description" style={{ fontSize: '0.9rem', color: '#888', marginTop: '10px' }}>
                    <strong>Verwijder Alle Gegevens</strong> verwijdert: alle leerdata, highscores, bonusopdrachten, eigen opdrachten, categorie selecties, filters, instellingen en UI voorkeuren. Dit is een complete reset van alle opgeslagen data.
                  </p>
                </div>

                {/* --- Groep: Herstel Standaard Instellingen (onderaan) --- */}
                <div className="settings-group">
                  <h4>🔄 Herstel Standaard Instellingen</h4>
                  <button 
                    onClick={handleHerstelStandaardInstellingen}
                    className="herstel-standaard-knop"
                    title="Herstel alle instellingen naar de standaardwaarden"
                  >
                    Herstel alle instellingen
                  </button>
                  <p className="setting-description">
                    Herstelt alle instellingen naar de standaardwaarden. Dit heeft geen invloed op je opgeslagen data (scores, leerdata, etc.).
                  </p>
                </div>
              </>
            )}

            {/* --- Tab: Highscore Modus --- */}
            {activeTab === 'highscore' && (
              <>
                <div className="settings-group">
                  <h4>Extra focus-stand</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={isFocusStandActiefHighscore}
                      onChange={() => setIsFocusStandActiefHighscore(!isFocusStandActiefHighscore)}
                    />
                    Focus op leren (geen fruitrol, geen bonusmechanieken, geen highscore)
                  </label>
                  <p className="setting-description">
                    Verbergt fruitanimaties en geluiden, schakelt bonussen/jokers/verdubbelaar uit en slaat geen highscores op. Gericht oefenen zonder afleiding.
                  </p>
                </div>
                <div className="settings-group">
                  <h4>Selectie op basis van niveau</h4>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="nivSelectHighscore"
                        checked={selectieOpNiveauHighscore === 'random'}
                        onChange={() => setSelectieOpNiveauHighscore('random')}
                      />
                      Ad random (1, 2, 3 door elkaar)
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="nivSelectHighscore"
                        checked={selectieOpNiveauHighscore === 'ascending'}
                        onChange={() => setSelectieOpNiveauHighscore('ascending')}
                      />
                      Eerst 1 → dan 2 → dan 3
                    </label>
                  </div>
                  <label style={{ marginTop: 8 }}>
                    Gedrag voor ongedefinieerd niveau:
                    <select
                      value={ongedefinieerdGedragHighscore}
                      onChange={(e) => setOngedefinieerdGedragHighscore(e.target.value as any)}
                      style={{ marginLeft: 8 }}
                    >
                      <option value="mix">Random tussendoor</option>
                      <option value="last">Altijd aan het eind</option>
                    </select>
                  </label>
                </div>
                <div className="settings-group">
                  <h4>Spelverloop</h4>
                  <label>
                  <input
                    type="checkbox"
                    checked={isSpinVergrendelingActiefHighscore}
                    onChange={() => setIsSpinVergrendelingActiefHighscore(!isSpinVergrendelingActiefHighscore)}
                  />
                  Blokkeer spin tot na antwoord
                  </label>
                  <p className="setting-description">
                    Je kunt tijdens een beurt niet opnieuw de spin draaien. Je moet de opdracht afronden. Pas als er een score is gegeven kan een nieuwe spin gestart worden.
                  </p>
                  <label>
                  <input
                    type="checkbox"
                    checked={isJokerSpinActiefHighscore}
                    onChange={(e) => setIsJokerSpinActiefHighscore(e.target.checked)}
                    disabled={!isSpinVergrendelingActiefHighscore}
                  />
                  Jokers leveren extra spins op
                  </label>
                  <p className="setting-description">
                    Bij een geblokkeerde spin kunnen spelers jokers sparen en inzetten voor extra spins. De beurt blijft bij dezelfde speler, maar geeft een nieuwe opdracht en punten. Deze optie vereist dat de spin geblokkeerd is na een antwoord.
                  </p>
                </div>
              </>
            )}

            {/* --- Tab: Multiplayer Modus --- */}
            {activeTab === 'multiplayer' && (
              <>
                {/* --- Focus-stand bovenaan --- */}
                <div className="settings-group">
                  <h4>Extra focus-stand</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={isFocusStandActiefMultiplayer}
                      onChange={() => setIsFocusStandActiefMultiplayer(!isFocusStandActiefMultiplayer)}
                    />
                    Focus op leren (geen fruitrol, geen bonusmechanieken, geen punten)
                  </label>
                  <p className="setting-description">
                    Verbergt fruitanimaties en geluiden, schakelt bonussen/jokers/verdubbelaar uit en telt geen punten. Alleen beurten en opdrachten.
                  </p>
                </div>
                <div className="settings-group">
                  <h4>Selectie op basis van niveau</h4>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="nivSelectMulti"
                        checked={selectieOpNiveauMultiplayer === 'random'}
                        onChange={() => setSelectieOpNiveauMultiplayer('random')}
                      />
                      Ad random (1, 2, 3 door elkaar)
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="nivSelectMulti"
                        checked={selectieOpNiveauMultiplayer === 'ascending'}
                        onChange={() => setSelectieOpNiveauMultiplayer('ascending')}
                      />
                      Eerst 1 → dan 2 → dan 3
                    </label>
                  </div>
                  <label style={{ marginTop: 8 }}>
                    Gedrag voor ongedefinieerd niveau:
                    <select
                      value={ongedefinieerdGedragMultiplayer}
                      onChange={(e) => setOngedefinieerdGedragMultiplayer(e.target.value as any)}
                      style={{ marginLeft: 8 }}
                    >
                      <option value="mix">Random tussendoor</option>
                      <option value="last">Altijd aan het eind</option>
                    </select>
                  </label>
                </div>
                {/* --- Groep: Spelverloop --- */}
                <div className="settings-group">
                  <h4>Spelverloop</h4>
                  <label>
                    Aantal rondes (alleen multiplayer):
                    <input
                      type="number"
                      value={maxRondes}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (value >= 1 && value <= 30) {
                          setMaxRondes(value);
                        } else if (e.target.value === '' || value < 1) {
                          setMaxRondes(1);
                        } else if (value > 30) {
                          setMaxRondes(30);
                        }
                      }}
                      min="1"
                      max="30"
                      style={{ marginLeft: 'auto', width: '80px' }}
                      title="Stel het aantal rondes in (1-30). Het spel stopt automatisch na dit aantal rondes."
                    />
                  </label>
                  <p className="setting-description">
                    Het spel stopt automatisch na het ingestelde aantal rondes. Standaard: 4 rondes.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isEerlijkeSelectieActief}
                      onChange={(e) => setIsEerlijkeSelectieActief(e.target.checked)}
                    />
                    Spelers gegarandeerd een beurt geven
                  </label>
                  <p className="setting-description">
                    Zorgt ervoor dat spelers in een wachtrij komen en iedereen aan de beurt komt voordat de cyclus herstart. Als uitgeschakeld gebeurt de selectie volledig willekeurig.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isSpinVergrendelingActiefMultiplayer}
                      onChange={() => setIsSpinVergrendelingActiefMultiplayer(!isSpinVergrendelingActiefMultiplayer)}
                    />
                    Blokkeer spin tot na antwoord
                  </label>
                  <p className="setting-description">
                    Je kunt tijdens een beurt niet opnieuw de spin draaien. Je moet de opdracht afronden. Pas als er een score is gegeven kan een nieuwe spin gestart worden.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isJokerSpinActiefMultiplayer}
                      onChange={(e) => setIsJokerSpinActiefMultiplayer(e.target.checked)}
                      disabled={!isSpinVergrendelingActiefMultiplayer}
                    />
                    Jokers leveren extra spins op
                  </label>
                  <p className="setting-description">
                    Bij een geblokkeerde spin kunnen spelers jokers sparen en inzetten voor extra spins. De beurt blijft bij dezelfde speler, maar geeft een nieuwe opdracht en punten. Deze optie vereist dat de spin geblokkeerd is na een antwoord.
                  </p>
                </div>

                {/* --- Groep: Bonusopdrachten --- */}
                <div className="settings-group">
                  <h4>Bonusopdrachten</h4>
                  <p className="setting-description" style={{ marginLeft: 0, marginTop: '-5px', marginBottom: '15px' }}>
                    Wanneer een speler drie vraagtekens (❓❓❓) draait, kan er een bonusopdracht gestart worden om extra punten te verdienen. 
                    Als dit is uitgeschakeld, ontvangt de speler willekeurig 1 tot 10 bonuspunten.
                    <br /><br />
                    <strong>Let op:</strong> Bonusopdrachten zijn alleen beschikbaar bij 3 of meer spelers.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isBonusOpdrachtenActief}
                      onChange={(e) => setIsBonusOpdrachtenActief(e.target.checked)}
                    />
                    Bonusopdrachten gebruiken
                  </label>

                  {/* Conditionally render the rest only when active */}
                  {isBonusOpdrachtenActief && (
                    <>
                      <div style={{ marginTop: '15px' }}>
                        <p style={{ marginBottom: '10px' }}>Kans op een bonusronde verhogen:</p>
                        <p className="setting-description" style={{ marginLeft: 0, marginTop: '-5px', marginBottom: '10px' }}>
                          Wil je meer fun? Verhoog dan de kans op drie vraagtekens (❓❓❓) in het spel.
                        </p>
                        <div className="kansen-container">
                          <label>
                            <input
                              type="radio"
                              name="bonusKans"
                              value="standaard"
                              checked={bonusKans === 'standaard'}
                              onChange={() => setBonusKans('standaard')}
                            />
                            Normaal
                          </label>
                          <label>
                            <input
                              type="radio"
                              name="bonusKans"
                              value="verhoogd"
                              checked={bonusKans === 'verhoogd'}
                              onChange={() => setBonusKans('verhoogd')}
                            />
                            Verhoogd (ca. 10% kans)
                          </label>
                          <label>
                            <input
                              type="radio"
                              name="bonusKans"
                              value="fors_verhoogd"
                              checked={bonusKans === 'fors_verhoogd'}
                              onChange={() => setBonusKans('fors_verhoogd')}
                            />
                            Sterk verhoogd (ca. 25% kans)
                          </label>
                        </div>
                      </div>

                      <p className="setting-description" style={{ marginLeft: 0, marginTop: '10px', marginBottom: '5px' }}>
                        Hier kun je bonusopdrachten toevoegen en verwijderen voor extra variatie in het spel.
                      </p>
                      
                      {/* Algemene informatie en knoppen buiten accordeon */}
                      <div className="settings-group">
                        <h4>Bonusopdrachten Beheer</h4>
                        <BonusOpdrachtBeheer 
                          opdrachten={bonusOpdrachten} 
                          setOpdrachten={setBonusOpdrachten}
                          isLokaleOpslagActief={isLokaleBonusOpslagActief}
                          basisBonusOpdrachten={basisBonusOpdrachten}
                          onLokaleOpslagChange={setIsLokaleBonusOpslagActief}
                        />
                      </div>
                      
                      {/* Alleen de lijst met opdrachten in accordeon */}
                      {bonusOpdrachten.length > 0 && (
                        <>
                          <button 
                            className="harmonica-knop" 
                            onClick={() => setIsBonusBeheerOpen(!isBonusBeheerOpen)}
                            title="Bekijk en beheer alle huidige bonusopdrachten"
                          >
                            Bekijk alle bonusopdrachten ({bonusOpdrachten.length})
                            <span className={`pijl ${isBonusBeheerOpen ? 'open' : ''}`}>▶</span>
                          </button>
                          <div className={`harmonica-content ${isBonusBeheerOpen ? 'open' : ''}`}>
                            <div className="lijst-sectie">
                              <h5>Huidige Bonusopdrachten ({bonusOpdrachten.length})</h5>
                              <ul className="bonus-opdrachten-lijst">
                                {bonusOpdrachten.map((opdracht, index) => (
                                  <li key={index} className="bonus-opdracht-item">
                                    <span className="opdracht-tekst">"{opdracht.opdracht}" ({opdracht.punten.join(', ')} pnt)</span>
                                    <button onClick={() => {
                                      const nieuweLijst = bonusOpdrachten.filter((_, i) => i !== index);
                                      setBonusOpdrachten(nieuweLijst);
                                    }} className="verwijder-knop">
                                      &times;
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* --- Tab: Vrije Leermodus --- */}
            {activeTab === 'vrijeleermodus' && (
              <>
                {/* --- Focus-stand bovenaan --- */}
                <div className="settings-group">
                  <h4>Extra focus-stand</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={isKaleModusActiefVrijeLeermodus}
                      onChange={(e) => setIsKaleModusActiefVrijeLeermodus(e.target.checked)}
                    />
                    Focus op leren (geen fruitrol en geen tips)
                  </label>
                  <p className="setting-description">
                    Verbergt fruitanimaties en geluiden en toont direct de opdracht. Leerstrategietips worden niet getoond, voor maximale focus.
                  </p>
                </div>
                <div className="settings-group">
                  <h4>Selectie op basis van niveau</h4>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="nivSelectVrij"
                        checked={selectieOpNiveauVrije === 'random'}
                        onChange={() => setSelectieOpNiveauVrije('random')}
                      />
                      Ad random (1, 2, 3 door elkaar)
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="nivSelectVrij"
                        checked={selectieOpNiveauVrije === 'ascending'}
                        onChange={() => setSelectieOpNiveauVrije('ascending')}
                      />
                      Eerst 1 → dan 2 → dan 3
                    </label>
                  </div>
                  <label style={{ marginTop: 8 }}>
                    Gedrag voor ongedefinieerd niveau:
                    <select
                      value={ongedefinieerdGedragVrije}
                      onChange={(e) => setOngedefinieerdGedragVrije(e.target.value as any)}
                      style={{ marginLeft: 8 }}
                    >
                      <option value="mix">Random tussendoor</option>
                      <option value="last">Altijd aan het eind</option>
                    </select>
                  </label>
                </div>

                {/* --- Groep: Spelverloop voor Vrije Leermodus --- */}
                <div className="settings-group">
                  <h4>Spelverloop</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={isSpinVergrendelingActiefVrijeLeermodus}
                      onChange={() => setIsSpinVergrendelingActiefVrijeLeermodus(!isSpinVergrendelingActiefVrijeLeermodus)}
                    />
                    Blokkeer spin tot na antwoord
                  </label>
                  <p className="setting-description">
                    Je kunt tijdens een beurt niet opnieuw de spin draaien. Je moet de opdracht afronden. Pas als er een score is gegeven kan een nieuwe spin gestart worden.
                  </p>
                </div>

                <div className="settings-group">
                  <h4>Vrije Leermodus</h4>
                  <p className="setting-description">
                    In deze modus worden geen punten gegeven. Minder afleiding, meer focus op leren. Leren op basis van herhalingen met opslaan van data voor leeranalyses en certificaat generatie. Perfect voor zelfstudie, het ontwikkelen van studievaardigheden en gebruik in je portfolio. Leerzame feedback en tips worden standaard getoond.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isLeerstrategietipsActiefVrijeLeermodus}
                      onChange={(e) => setIsLeerstrategietipsActiefVrijeLeermodus(e.target.checked)}
                      disabled={isKaleModusActiefVrijeLeermodus}
                    />
                    Leerstrategietips tonen
                    {isKaleModusActiefVrijeLeermodus && (
                      <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: '8px' }}>
                        (uitgeschakeld in Extra focus-stand)
                      </span>
                    )}
                  </label>
                  <p className="setting-description">
                    Toont korte, motiverende tips over effectieve leerstrategieën (zoals ophalen uit je geheugen, focus/pin, spaced repetition) tijdens het spelen in de <strong>Vrije Leermodus</strong>. Standaard aan.
                  </p>
                </div>

                {/* Leeranalyse en certificaat knoppen */}
                <div className="settings-group">
                  <h4>Leeranalyse & Certificaat</h4>
                  <div className="leer-modus-knoppen">
                    <button 
                      className="leer-analyse-knop" 
                      onClick={() => setIsLeeranalyseOpen(true)}
                    >
                      📊 Leeranalyse
                    </button>
                    <button 
                      className="certificaat-knop" 
                      onClick={() => setIsCertificaatModalOpen(true)}
                    >
                      🏆 Certificaat genereren
                    </button>
                  </div>
                  <p className="setting-description">
                    <em>Genereer een professioneel certificaat met je leerprestaties voor je portfolio.</em>
                  </p>
                </div>

                {/* Data Beheer Sectie */}
                <div className="settings-group">
                  <h4>Data Beheer</h4>
                  <p className="setting-description">
                    In Vrije Leermodus worden je leerprestaties opgeslagen in het geheugen van je browser. Deze data wordt gebruikt voor leeranalyses en certificaat generatie.
                  </p>
                  <button 
                    className="data-beheer-knop" 
                    onClick={() => {
                      setActiveTab('algemeen');
                    }}
                  >
                    🗂️ Data Beheer Openen
                  </button>
                  <p className="setting-description" style={{ fontSize: '0.9rem', color: '#888', marginTop: '5px' }}>
                    <em>Ga naar het "Algemeen" tabblad om je leeranalyse gegevens te beheren of te verwijderen.</em>
                  </p>
                </div>
              </>
            )}

            {/* --- Tab: Leitner Leermodus --- */}
            {activeTab === 'leitnerleermodus' && (
              <>
                {/* --- Focus-stand bovenaan --- */}
                <div className="settings-group">
                  <h4>Extra focus-stand</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={isKaleModusActiefLeitnerLeermodus}
                      onChange={(e) => setIsKaleModusActiefLeitnerLeermodus(e.target.checked)}
                    />
                    Focus op leren (geen fruitrol en geen tips)
                  </label>
                  <p className="setting-description">
                    Verbergt fruitanimaties en geluiden en toont direct de opdracht. Leerstrategietips worden niet getoond, voor maximale focus.
                  </p>
                </div>
                <div className="settings-group">
                  <h4>Selectie op basis van niveau</h4>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="nivSelectLeitner"
                        checked={selectieOpNiveauLeitner === 'random'}
                        onChange={() => setSelectieOpNiveauLeitner('random')}
                      />
                      Ad random (1, 2, 3 door elkaar) — Alleen voor nieuwe kaarten
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="nivSelectLeitner"
                        checked={selectieOpNiveauLeitner === 'ascending'}
                        onChange={() => setSelectieOpNiveauLeitner('ascending')}
                      />
                      Eerst 1 → dan 2 → dan 3 — Alleen voor nieuwe kaarten
                    </label>
                  </div>
                  <label style={{ marginTop: 8 }}>
                    Gedrag voor ongedefinieerd niveau:
                    <select
                      value={ongedefinieerdGedragLeitner}
                      onChange={(e) => setOngedefinieerdGedragLeitner(e.target.value as any)}
                      style={{ marginLeft: 8 }}
                    >
                      <option value="mix">Random tussendoor</option>
                      <option value="last">Altijd aan het eind</option>
                    </select>
                  </label>
                </div>

                {/* --- Groep: Spelverloop voor Leitner Leermodus --- */}
                <div className="settings-group">
                  <h4>Spelverloop</h4>
                  <label>
                    <input
                      type="checkbox"
                      checked={isSpinVergrendelingActiefLeitnerLeermodus}
                      onChange={() => setIsSpinVergrendelingActiefLeitnerLeermodus(!isSpinVergrendelingActiefLeitnerLeermodus)}
                    />
                    Blokkeer spin tot na antwoord
                  </label>
                  <p className="setting-description">
                    Je kunt tijdens een beurt niet opnieuw de spin draaien. Je moet de opdracht afronden. Pas als er een score is gegeven kan een nieuwe spin gestart worden.
                  </p>
                </div>

                <div className="settings-group">
                  <h4>Leitner Leermodus</h4>
                  <p className="setting-description">
                    Gebruik de Leitner Leer Modus voor effectieve herhaling van opdrachten. Nieuwe opdrachten starten in Box 0 (10 minuten). Opdrachten die je "Niet Goed" beoordeelt worden vaker herhaald, terwijl opdrachten die je "Heel Goed" beoordeelt minder vaak voorkomen. "Redelijk" opdrachten blijven in dezelfde box. Dit systeem is gebaseerd op wetenschappelijk bewezen spaced repetition technieken.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isLeerstrategietipsActiefLeitnerLeermodus}
                      onChange={(e) => setIsLeerstrategietipsActiefLeitnerLeermodus(e.target.checked)}
                      disabled={isKaleModusActiefLeitnerLeermodus}
                    />
                    Leerstrategietips tonen
                    {isKaleModusActiefLeitnerLeermodus && (
                      <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: '8px' }}>
                        (uitgeschakeld in Extra focus-stand)
                      </span>
                    )}
                  </label>
                  <p className="setting-description">
                    Toont korte, motiverende tips over effectieve leerstrategieën tijdens het oefenen met Leitner. Standaard aan.
                  </p>
                  
                  {leermodusType === 'leitner' && (
                    <>
                      <label>
                        <input
                          type="checkbox"
                          checked={isMaxNewQuestionsLimitActief}
                          onChange={(e) => setIsMaxNewQuestionsLimitActief(e.target.checked)}
                          style={{ marginRight: '8px' }}
                        />
                        Limiet nieuwe vragen per dag
                      </label>
                      <p className="setting-description">
                        Schakel deze optie uit om onbeperkt nieuwe vragen per dag toe te voegen aan het Leitner-systeem.
                      </p>
                      
                      {isMaxNewQuestionsLimitActief && (
                        <>
                          <label>
                            Max. nieuwe vragen per dag:
                            <input
                              type="number"
                              value={maxNewLeitnerQuestionsPerDay}
                              onChange={(e) => setMaxNewLeitnerQuestionsPerDay(Number(e.target.value))}
                              min="1"
                              style={{ marginLeft: '10px', width: '60px' }}
                            />
                          </label>
                          <p className="setting-description">
                            Stel een limiet in voor het aantal nieuwe vragen dat per dag aan het Leitner-systeem wordt toegevoegd om een te hoge leerlast te voorkomen.
                          </p>
                        </>
                      )}
                      
                      <label style={{ marginTop: '15px' }}>
                        <input
                          type="checkbox"
                          checked={negeerBox0Wachttijd}
                          onChange={(e) => setNegeerBox0Wachttijd(e.target.checked)}
                        />
                        Negeer Box 0 wachttijd als er geen andere opdrachten zijn
                      </label>
                      <p className="setting-description">
                        <strong>Normaal:</strong> Nieuwe vragen komen in Box 0 en je moet 10 minuten wachten voordat je ze opnieuw kunt oefenen.
                        <br /><br />
                        <strong>Met deze optie:</strong> Als je aan je dagelijkse limiet nieuwe vragen zit of er zijn geen andere opdrachten beschikbaar, kun je de vragen in Box 0 direct herhalen zonder de 10 minuten wachttijd.
                        <br /><br />
                        <strong>Voordeel:</strong> Je kunt altijd blijven oefenen, zelfs als je geen nieuwe vragen meer kunt krijgen.
                      </p>
                      
                      <button
                        className="instellingen-knop"
                        onClick={handleOpenLeitnerBeheer}
                        style={{ marginTop: '10px' }}
                      >
                        Beheer Leitner Categorieën
                      </button>
                    </>
                  )}
                </div>

                {/* Leeranalyse en certificaat knoppen */}
                <div className="settings-group">
                  <h4>Leeranalyse & Certificaat</h4>
                  <div className="leer-modus-knoppen">
                    <button 
                      className="leer-analyse-knop" 
                      onClick={() => setIsLeeranalyseOpen(true)}
                    >
                      📊 Leeranalyse
                    </button>
                    <button 
                      className="certificaat-knop" 
                      onClick={() => setIsCertificaatModalOpen(true)}
                    >
                      🏆 Certificaat genereren
                    </button>
                  </div>
                  <p className="setting-description">
                    <em>Genereer een professioneel certificaat met je leerprestaties voor je portfolio.</em>
                  </p>
                </div>

                {/* Data Beheer Sectie */}
                <div className="settings-group">
                  <h4>Data Beheer</h4>
                  <p className="setting-description">
                    In Leitner Leermodus worden je leerprestaties en box-progressie opgeslagen in het geheugen van je browser. Deze data wordt gebruikt voor het Leitner-systeem, leeranalyses en certificaat generatie.
                  </p>
                  <button 
                    className="data-beheer-knop" 
                    onClick={() => {
                      setActiveTab('algemeen');
                    }}
                  >
                    🗂️ Data Beheer Openen
                  </button>
                  <p className="setting-description" style={{ fontSize: '0.9rem', color: '#888', marginTop: '5px' }}>
                    <em>Ga naar het "Algemeen" tabblad om je leeranalyse gegevens te beheren of te verwijderen.</em>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Suspense fallback={null}>
        <AiOpgaveGeneratorLazy 
          isOpen={isAiGeneratorOpen}
          onClose={() => setIsAiGeneratorOpen(false)}
          hoofdcategorieen={hoofdcategorieen}
          subcategorieenPerHoofdcategorie={subcategorieenPerHoofdcategorie}
        />
      </Suspense>
      
      <Suspense fallback={null}>
        <LeeranalyseLazy 
          isOpen={isLeeranalyseOpen}
          onClose={() => setIsLeeranalyseOpen(false)}
        />
      </Suspense>
      
      <Suspense fallback={null}>
        <CertificaatModalLazy
          isOpen={isCertificaatModalOpen}
          onClose={() => setIsCertificaatModalOpen(false)}
          onGenerate={handleCertificaatGenereren}
        />
      </Suspense>

      {/* Instructie Excel-sjabloon (gestileerd) */}
      <SimpleModal isOpen={isSjabloonUitlegOpen} onClose={() => setIsSjabloonUitlegOpen(false)} title={<span style={{ color: '#61dafb' }}>Instructie – Excel sjabloon</span>}>
        <div className="col" style={{ gap: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid #444', borderRadius: 8, overflow: 'hidden' as any }}>
              <thead>
                <tr style={{ backgroundColor: '#1f1f1f' }}>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #444', color: '#61dafb', fontWeight: 600 }}>Kolom</th>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #444', color: '#61dafb', fontWeight: 600 }}>Verplicht?</th>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #444', color: '#61dafb', fontWeight: 600 }}>Waarde / Voorbeeld</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#2a2a2a' }}>
                <tr>
                  <td style={{ padding: 12 }}><code>Hoofdcategorie</code></td>
                  <td style={{ padding: 12 }}>Aanrader</td>
                  <td style={{ padding: 12 }}>Anatomie, Fysiologie, … (groepeert subcategorieën)</td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}><code>Categorie</code></td>
                  <td style={{ padding: 12 }}>Aanrader</td>
                  <td style={{ padding: 12 }}>Schouder, Knie, …</td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}><code>Opdracht</code></td>
                  <td style={{ padding: 12 }}><strong>Ja</strong></td>
                  <td style={{ padding: 12 }}>“Noem 3 spieren …”</td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}><code>Antwoordsleutel</code></td>
                  <td style={{ padding: 12 }}>Nee</td>
                  <td style={{ padding: 12 }}>Tekst en/of URL’s. Voorbeeld: “https://…/plaatje.png” of “https://youtube.com/watch?v=…”.</td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}><code>Tijdslimiet (sec)</code></td>
                  <td style={{ padding: 12 }}>Nee</td>
                  <td style={{ padding: 12 }}>Geheel getal ≥ 0. 0 = geen timer.</td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}><code>Extra_Punten (max 2)</code></td>
                  <td style={{ padding: 12 }}>Nee</td>
                  <td style={{ padding: 12 }}>0, 1 of 2.</td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}><code>Niveau</code></td>
                  <td style={{ padding: 12 }}>Nee</td>
                  <td style={{ padding: 12 }}>
                    Toegestane waarden: <strong>1</strong> (<em>Beginner</em>), <strong>2</strong> (<em>Gevorderd</em>) of <strong>3</strong> (<em>Expert</em>). Laat leeg als het niveau niet van toepassing is of onbekend is. Leeg wordt behandeld als
                    <em> ongedefinieerd</em> (verschijnt als <code>∅</code> in de filters en telt mee onder <em>Ongedefinieerd</em> in de niveau‑telling).
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}><code>Type</code></td>
                  <td style={{ padding: 12 }}>Nee</td>
                  <td style={{ padding: 12 }}>Vaste set: Feitenkennis, Begripsuitleg, Toepassing, Klinisch redeneren, Vaardigheid – Onderzoek, Vaardigheid – Behandeling, Communicatie met patiënt, Onbekend.</td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}><code>Tekenen</code></td>
                  <td style={{ padding: 12 }}>Nee</td>
                  <td style={{ padding: 12 }}>Ja/Nee — ongeacht type; gebruik Ja wanneer de opdracht tekenen/schetsen vraagt.</td>
                </tr>
                <tr>
                  <td style={{ padding: 12 }}><code>Casus</code></td>
                  <td style={{ padding: 12 }}>Voorwaardelijk</td>
                  <td style={{ padding: 12 }}>Verplicht als <code>Type</code> “Klinisch redeneren” is; bij “Toepassing” mag de casus in de opdrachttekst zitten en is <em>optioneel</em>.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4 style={{ color: '#61dafb', marginBottom: 8 }}>Links in de antwoordsleutel</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
              <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><span>🔗</span><span>Je kunt één of meerdere URL’s in de cel zetten. De app herkent automatisch media en toont deze onder de antwoordsleutel.</span></li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><span>🖼️</span><span><strong>Afbeeldingen (embed)</strong>: bestandseindes <code>.png</code>, <code>.jpg</code>/<code>.jpeg</code>, <code>.gif</code>, <code>.webp</code>, <code>.svg</code>.</span></li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><span>🎬</span><span><strong>Video (YouTube, embed)</strong>: plak de YouTube‑link. Optionele starttijd: <code>?t=363</code>, <code>?t=6m3s</code> of <code>?start=363</code>.</span></li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><span>📄</span><span><strong>Overige links</strong> (website, PDF/document, enz.): blijven normale klikbare links en worden niet ingebed.</span></li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><span>🧩</span><span>Tekst + URL mogen samen in één cel; de app haalt de link(s) eruit en laat jouw tekst intact.</span></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#61dafb', marginBottom: 8 }}>Filters in de app</h4>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><span>🎯</span><span><strong>Bron</strong>: vast – ‘systeem’ en ‘gebruiker’.</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><span>🏷️</span><span><strong>Type</strong>: vaste lijst hierboven. Onbekende waarden → “Onbekend”.</span></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><span>📊</span><span><strong>Niveau</strong>: kies uit <strong>1</strong>, <strong>2</strong>, <strong>3</strong> of <strong>∅</strong> (ongedefinieerd). Als de kolom <code>Niveau</code> leeg is in Excel, wordt deze als <em>ongedefinieerd</em> geteld en kun je deze via <code>∅</code> filteren.</span></div>
            </div>
          </div>
        </div>
      </SimpleModal>
      {/* Serieuze Modus Waarschuwing Modal */}
      {isSerieuzeModusWaarschuwingOpen && (
        <div className="serieuze-modus-modal-overlay" onClick={() => setIsSerieuzeModusWaarschuwingOpen(false)}>
          <div className="serieuze-modus-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="serieuze-modus-modal-header">
              <h3>⚠️ Spel Reset Vereist</h3>
              <button 
                onClick={() => setIsSerieuzeModusWaarschuwingOpen(false)}
                className="serieuze-modus-modal-close"
              >
                &times;
              </button>
            </div>
            <div className="serieuze-modus-modal-body">
              <p>
                <strong>Serieuze leer-modus kan niet worden geactiveerd tijdens een actief spel.</strong>
              </p>
              <p>
                Om serieuze leer-modus te activeren, moet het huidige spel worden gereset. 
                Dit betekent dat alle voortgang, scores worden gewist en de speler naam moet opnieuw worden ingevoerd.
              </p>
              <p>
                <em>Wil je doorgaan en het spel resetten?</em>
              </p>
            </div>
            <div className="serieuze-modus-modal-footer">
              <button 
                onClick={() => setIsSerieuzeModusWaarschuwingOpen(false)}
                className="serieuze-modus-modal-button secondary"
              >
                Annuleren
              </button>
              <button 
                onClick={handleSerieuzeModusBevestiging}
                className="serieuze-modus-modal-button primary"
              >
                Ja, Reset Spel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Serieuze Modus Uitschakelen Modal */}
      {isSerieuzeModusUitschakelenOpen && (
        <div className="serieuze-modus-modal-overlay" onClick={() => setIsSerieuzeModusUitschakelenOpen(false)}>
          <div className="serieuze-modus-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="serieuze-modus-modal-header">
              <h3>⚠️ Overschakelen naar Vrije Leermodus</h3>
              <button 
                onClick={() => setIsSerieuzeModusUitschakelenOpen(false)}
                className="serieuze-modus-modal-close"
              >
                &times;
              </button>
            </div>
            <div className="serieuze-modus-modal-body">
              <p>
                <strong>Weet je zeker dat je serieuze leer-modus wilt uitschakelen?</strong>
              </p>
              <p>
                Dit zal het huidige spel resetten en overschakelen naar vrije leermodus:
              </p>
              <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                <li>Aantal beurten wordt gereset naar 0</li>
                <li>Huidige sessie wordt beëindigd</li>
                <li>Spel staat klaar voor nieuwe ronde</li>
                <li>Leerdata en statistieken blijven bewaard</li>
              </ul>
              <p>
                <em>Je kunt altijd terug naar serieuze leer-modus schakelen.</em>
              </p>
            </div>
            <div className="serieuze-modus-modal-footer">
              <button 
                onClick={() => setIsSerieuzeModusUitschakelenOpen(false)}
                className="serieuze-modus-modal-button secondary"
              >
                Annuleren
              </button>
              <button 
                onClick={handleSerieuzeModusUitschakelen}
                className="serieuze-modus-modal-button primary"
              >
                Ja, Overschakelen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}); 