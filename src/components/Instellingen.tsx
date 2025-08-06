import React, { useState, useEffect, useCallback } from 'react';
import { BonusOpdrachtBeheer } from './BonusOpdrachtBeheer';
import { AiOpgaveGenerator } from './AiOpgaveGenerator';
import { Leeranalyse } from './Leeranalyse';
import { CertificaatModal } from './CertificaatModal';
import * as XLSX from 'xlsx';
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
    isLeerFeedbackActief,
    setIsLeerFeedbackActief,
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
    isSpinVergrendelingActiefMultiplayer,
    setIsSpinVergrendelingActiefMultiplayer,
    isJokerSpinActiefMultiplayer,
    setIsJokerSpinActiefMultiplayer,
    isSpinVergrendelingActiefVrijeLeermodus,
    setIsSpinVergrendelingActiefVrijeLeermodus,
    isSpinVergrendelingActiefLeitnerLeermodus,
    setIsSpinVergrendelingActiefLeitnerLeermodus,
    // isBox0IntervalVerkort, // Niet meer gebruikt
    // setIsBox0IntervalVerkort, // Niet meer gebruikt
    // isRolTijdVerkort, // Niet meer gebruikt
    // setIsRolTijdVerkort, // Niet meer gebruikt
  } = useSettings();

  // Tab state
  const [activeTab, setActiveTab] = useState('algemeen');

  const [isBonusBeheerOpen, setIsBonusBeheerOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
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
      alert('Leeranalyse gegevens zijn verwijderd.');
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
      alert('Leitner-systeem gegevens zijn verwijderd.');
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
      
      alert('Alle gegevens zijn verwijderd. De pagina wordt herladen om de wijzigingen toe te passen.');
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
      
      alert('Alle instellingen zijn hersteld naar de standaardwaarden.');
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
        alert('Geen leerdata beschikbaar. Start eerst een sessie in serieuze leer-modus.');
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
      alert('Er is een fout opgetreden bij het genereren van het certificaat. Probeer het opnieuw.');
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
                  
                  {/* Herstel Standaard Instellingen Knop */}
                  <div className="herstel-standaard-sectie">
                    <button 
                      onClick={handleHerstelStandaardInstellingen}
                      className="herstel-standaard-knop"
                      title="Herstel alle instellingen naar de standaardwaarden"
                    >
                      🔄 Herstel Standaard Instellingen
                    </button>
                    <p className="setting-description">
                      Herstelt alle instellingen naar de standaardwaarden. Dit heeft geen invloed op je opgeslagen data (scores, leerdata, etc.).
                    </p>
                  </div>
                </div>

                {/* --- Groep: Opdrachtenbeheer --- */}
                <div className="settings-group">
                  <h4>Opdrachtenbeheer</h4>
                  <p className="setting-description" style={{ marginLeft: 0, marginTop: '-5px', marginBottom: '15px' }}>
                    <strong>Handmatig:</strong> Download het Excel-sjabloon, vul je opdrachten in en upload het bestand via "Kies bestand". 
                    Kies vervolgens of je wilt aanvullen of overschrijven.
                  </p>
                  
                  <div className="opdracht-knoppen-container">
                    <button 
                      onClick={() => {
                        const data = [
                          { 
                            Hoofdcategorie: 'Voorbeeld Hoofdcategorie',
                            Categorie: 'Voorbeeld Categorie', 
                            Opdracht: 'Voorbeeld Opdracht', 
                            Antwoordsleutel: 'Voorbeeld Antwoord (kan ook een URL zijn)',
                            Tijdslimiet: 60,
                            "Extra_Punten (max 2)": 0,
                            OpdrachtType: 'Feitenkennis'
                          }
                        ];
                        const worksheet = XLSX.utils.json_to_sheet(data);
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, "Opdrachten");
                        XLSX.writeFile(workbook, "opdrachten_sjabloon.xlsx");
                      }}
                      className="instellingen-knop download-template-knop"
                    >
                      📥 Download Excel Sjabloon
                    </button>
                    
                    <p className="setting-description" style={{ marginLeft: 0, marginTop: '0px', marginBottom: '15px' }}>
                      <strong>Met AI:</strong> Klik op de knop hieronder voor een instructie en prompt die je kunt kopiëren en gebruiken in je favoriete AI-tool. 
                      Dit is een snelle manier om veel opdrachten te maken.
                    </p>
                    
                    <button 
                      className="instellingen-knop ai-generator-knop"
                      onClick={() => setIsAiGeneratorOpen(true)}
                    >
                      🚀 Genereer Nieuwe Opdrachten met AI
                    </button>
                  </div>
                  
                  <p className="setting-description" style={{ marginLeft: 0, marginTop: '0px', marginBottom: '15px' }}>
                    <strong>Opdrachten toevoegen:</strong> Klik op "Kies een bestand" en selecteer je handmatig gemaakte Excel-bestand of het bestand dat je met AI hebt gegenereerd. 
                    Kies vervolgens of je wilt aanvullen of alle bestaande opdrachten wilt overschrijven.
                  </p>
                  
                  {children}
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
                        if (confirm('Weet je zeker dat je alle zelf toegevoegde opdrachten wilt verwijderen? Dit kan niet ongedaan gemaakt worden.')) {
                          onVerwijderGebruikerOpdrachten();
                          alert('Alle eigen opdrachten zijn verwijderd.');
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
                      🎯 Verwijder Highscores & Records (alleen Highscore Modus)
                    </button>
                    
                    <button 
                      onClick={handleClearBonusOpdrachten}
                      className="data-beheer-knop bonus-knop"
                    >
                      🎭 Verwijder Bonusopdrachten (alleen multiplayer)
                    </button>
                    
                    <button 
                      onClick={handleClearLeeranalyseData}
                      className="data-beheer-knop leeranalyse-knop"
                    >
                      📊 Verwijder Leeranalyse & Statistieken (alleen Leer Modus)
                    </button>
                    
                    <button 
                      onClick={handleClearLeitnerData}
                      className="data-beheer-knop leitner-knop"
                    >
                      📚 Verwijder Leitner-systeem Data (alleen Leer Modus)
                    </button>
                    
                    <button 
                      onClick={handleClearAllData}
                      className="data-beheer-knop alles-knop"
                    >
                      🗑️ Verwijder Alle Gegevens
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* --- Tab: Highscore Modus --- */}
            {activeTab === 'highscore' && (
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
            )}

            {/* --- Tab: Multiplayer Modus --- */}
            {activeTab === 'multiplayer' && (
              <>
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
                      checked={isLeerFeedbackActief}
                      onChange={(e) => setIsLeerFeedbackActief(e.target.checked)}
                    />
                    Leerzame feedback en tips tonen
                  </label>
                  <p className="setting-description">
                    Toon leerzame feedback en tips over effectief leren bij spin combinaties. Standaard aan gezet in Leer Modus. Als uitgeschakeld krijg je alleen de Leer Modus zonder feedback.
                  </p>
                  <p className="setting-description" style={{ fontSize: '0.9rem', color: '#888', marginTop: '10px' }}>
                    <strong>Data beheer:</strong> Je kunt je leeranalyse gegevens verwijderen via de "Data Beheer" sectie onderaan deze pagina.
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
              </>
            )}

            {/* --- Tab: Leitner Leermodus --- */}
            {activeTab === 'leitnerleermodus' && (
              <>
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
                        Als er geen nieuwe opdrachten of reguliere herhalingen beschikbaar zijn, maakt deze optie de opdrachten in Box 0 direct herhaalbaar, zelfs als de wachttijd nog niet voorbij is.
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
              </>
            )}
          </div>
        </div>
      </div>
      
      <AiOpgaveGenerator 
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
      />
      
      <Leeranalyse 
        isOpen={isLeeranalyseOpen}
        onClose={() => setIsLeeranalyseOpen(false)}
      />
      
      <CertificaatModal
        isOpen={isCertificaatModalOpen}
        onClose={() => setIsCertificaatModalOpen(false)}
        onGenerate={handleCertificaatGenereren}
      />

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