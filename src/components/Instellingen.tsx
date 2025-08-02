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
  isSpelGestart,
  onSpelReset,
  // Categorie beheer
  onOpenCategorieBeheer,
}: InstellingenProps) => {
  // Settings context
  const {
    gameMode,
    setGameMode,
    maxRondes,
    setMaxRondes,
    isGeluidActief,
    setIsGeluidActief,
    isTimerActief,
    setIsTimerActief,
    isEerlijkeSelectieActief,
    setIsEerlijkeSelectieActief,
    isJokerSpinActief,
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
    isSerieuzeLeerModusActief,
    setIsSerieuzeLeerModusActief,
    isLeerFeedbackActief,
    setIsLeerFeedbackActief,
    leermodusType,
    setLeermodusType,
    isLokaleBonusOpslagActief,
    setIsLokaleBonusOpslagActief,
    maxNewLeitnerQuestionsPerDay,
    setMaxNewLeitnerQuestionsPerDay,
  } = useSettings();

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
    if (confirm('Weet je zeker dat je ALLE lokaal opgeslagen gegevens wilt verwijderen? Dit verwijdert scores, persoonlijke bests, bonusopdrachten, leeranalyse gegevens en Leitner-systeem data. Dit kan niet ongedaan worden gemaakt.')) {
      localStorage.removeItem('fruitautomaat_highScores');
      localStorage.removeItem('fruitautomaat_personalBests');
      localStorage.removeItem('bonusOpdrachten');
      
      // Verwijder ook alle leerdata en Leitner data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('fruitautomaat_leerdata_') || 
            key.startsWith('fruitautomaat_sessies_') || 
            key.startsWith('fruitautomaat_preferences_') || 
            key.startsWith('fruitautomaat_achievements_') ||
            key.startsWith('fruitautomaat_leitner_')) {
          localStorage.removeItem(key);
        }
      });
      
      setBonusOpdrachten(basisBonusOpdrachten);
      window.location.reload();
    }
  };

  const handleSerieuzeModusToggle = (checked: boolean) => {
    if (checked) {
      if (isSpelGestart && gameMode === 'multi') {
        setIsSerieuzeModusWaarschuwingOpen(true);
      } else {
        setIsSerieuzeLeerModusActief(true);
        if (gameMode === 'multi') {
          setGameMode('single');
        }
      }
    } else {
      if (isSpelGestart && isSerieuzeLeerModusActief) {
        setIsSerieuzeModusUitschakelenOpen(true);
      } else {
        setIsSerieuzeLeerModusActief(false);
      }
    }
  };

  const handleLeitnerModusToggle = (checked: boolean) => {
    setLeermodusType(checked ? 'leitner' : 'normaal');
  };
  
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
        <div className="instellingen-body">
          {/* --- Groep: Algemeen --- */}
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
          </div>

          {/* --- Groep: Spelverloop --- */}
          <div className="settings-group">
            <h4>Spelverloop</h4>
            {gameMode === 'multi' && (
              <label>
                Aantal rondes (alleen multiplayer):
                <input
                  type="number"
                  value={maxRondes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (value >= 1 && value <= 30) {
                      setMaxRondes(value);
                    } else if (e.target.value === '') {
                      setMaxRondes(1); // Of een andere fallback als je dat wilt
                    }
                  }}
                  min="1"
                  max="30"
                  style={{ marginLeft: 'auto', width: '80px' }}
                />
              </label>
            )}
            <label>
              <input
                type="checkbox"
                checked={isTimerActief}
                onChange={(e) => setIsTimerActief(e.target.checked)}
              />
              Timer voor opdrachten gebruiken
            </label>
            {gameMode === 'multi' && (
              <label>
                <input
                  type="checkbox"
                  checked={isEerlijkeSelectieActief}
                  onChange={(e) => setIsEerlijkeSelectieActief(e.target.checked)}
                />
                Spelers gegarandeerd een beurt geven
              </label>
            )}
            {gameMode === 'multi' && (
              <p className="setting-description">
                Zorgt ervoor dat spelers in een wachtrij komen en iedereen aan de beurt komt voordat de cyclus herstart. Als uitgeschakeld gebeurt de selectie volledig willekeurig.
              </p>
            )}
            <label>
              <input
                type="checkbox"
                checked={isSpinVergrendelingActief}
                onChange={() => setIsSpinVergrendelingActief(!isSpinVergrendelingActief)}
              />
              Blokkeer spin tot na antwoord
            </label>
            <p className="setting-description">
              Je kunt tijdens een beurt niet opnieuw de spin draaien. Je moet de opdracht afronden. Pas als er een score is gegeven kan een nieuwe spin gestart worden.
            </p>
            <label>
              <input
                type="checkbox"
                checked={isJokerSpinActief}
                onChange={(e) => setIsJokerSpinActief(e.target.checked)}
                disabled={!isSpinVergrendelingActief}
              />
              Jokers leveren extra spins op
            </label>
            <p className="setting-description">
              Bij een geblokkeerde spin kunnen spelers jokers sparen en inzetten voor extra spins. De beurt blijft bij dezelfde speler, maar geeft een nieuwe opdracht en punten. Deze optie vereist dat de spin geblokkeerd is na een antwoord.
            </p>
                          {isSerieuzeLeerModusActief && gameMode === 'single' && (
                <div className="serieuze-modus-notice">
                  <p className="setting-description">
                    <strong>Als de 'Leer Modus gebruiken' geactiveerd is:</strong> "Blokkeer spin tot na antwoord" staat standaard aan voor optimaal leereffect. 
                    Andere spelverloop instellingen zijn uitgevinkt voor optimale leerervaring. Je voorkeur wordt onthouden.
                  </p>
                </div>
              )}
          </div>

            {/* --- Groep: Leer Modus --- */}
            <div className="settings-group">
              <h4>Leer Modus</h4>
              <label>
                <input
                  type="checkbox"
                  checked={isSerieuzeLeerModusActief}
                  onChange={(e) => handleSerieuzeModusToggle(e.target.checked)}
                />
                Leer Modus gebruiken {gameMode === 'multi' && isSerieuzeLeerModusActief && <span style={{ color: '#666', fontSize: '0.9em' }}>(Switched naar single player)</span>}
              </label>
              <p className="setting-description">
                In deze modus worden geen punten gegeven. Minder afleiding, meer focus op leren. Leren op basis van herhalingen met opslaan van data voor leeranalyses en certificaat generatie. Perfect voor zelfstudie, het ontwikkelen van studievaardigheden en gebruik in je portfolio. Leerzame feedback en tips worden standaard getoond.
              </p>
              {isSerieuzeLeerModusActief && (
                <>
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
                  
                  <label>
                    <input
                      type="checkbox"
                      checked={leermodusType === 'leitner'}
                      onChange={(e) => handleLeitnerModusToggle(e.target.checked)}
                    />
                    Leitner Leer Modus gebruiken
                  </label>
                  <p className="setting-description">
                    Gebruik de Leitner Leer Modus voor effectieve herhaling van opdrachten. Nieuwe opdrachten starten in Box 0 (10 minuten). Opdrachten die je "Niet Goed" beoordeelt worden vaker herhaald, terwijl opdrachten die je "Heel Goed" beoordeelt minder vaak voorkomen. "Redelijk" opdrachten blijven in dezelfde box. Dit systeem is gebaseerd op wetenschappelijk bewezen spaced repetition technieken.
                  </p>
                  {leermodusType === 'leitner' && (
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
                      <button
                        className="instellingen-knop"
                        onClick={handleOpenLeitnerBeheer}
                        style={{ marginTop: '10px' }}
                      >
                        Beheer Leitner Categorieën
                      </button>
                    </>
                  )}
                </>
              )}
              
              {/* Leeranalyse en certificaat knoppen - altijd zichtbaar in single player */}
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
              <p className="setting-description" style={{ fontSize: '0.9rem', color: '#888', marginTop: '10px' }}>
                <strong>Data beheer:</strong> Je kunt je leeranalyse gegevens verwijderen via de "Data Beheer" sectie onderaan deze pagina.
              </p>
            </div>

            {/* --- Groep: Opdrachtenbeheer --- */}
          <div className="settings-group">
            <h4>Opdrachtenbeheer</h4>
            <p className="setting-description" style={{ marginLeft: 0, marginTop: '-5px', marginBottom: '15px' }}>
              Je kunt de standaard opdrachten gebruiken, maar ook zelf opdrachten toevoegen of overschrijven. 
              <br /><br />
              <strong>Handmatig:</strong> Download het Excel-sjabloon, vul je opdrachten in en upload het bestand via "Kies bestand". 
              Kies vervolgens of je wilt aanvullen of overschrijven.
            </p>
            
            <div className="opdracht-knoppen-container">
              <button 
                onClick={() => {
                  // Call the downloadTemplate function from the BestandsUploader props
                  const data = [
                    { 
                      Hoofdcategorie: 'Voorbeeld Hoofdcategorie',
                      Categorie: 'Voorbeeld Categorie', 
                      Opdracht: 'Voorbeeld Opdracht', 
                      Antwoordsleutel: 'Voorbeeld Antwoord (kan ook een URL zijn)',
                      Tijdslimiet: 60,
                      "Extra_Punten (max 2)": 0
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

          {/* --- Groep: Bonusopdrachten --- */}
          {gameMode === 'multi' && (
            <div className="settings-group">
              <h4>Bonusopdrachten (alleen voor multiplayer)</h4>
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
                  <button className="harmonica-knop" onClick={() => setIsBonusBeheerOpen(!isBonusBeheerOpen)}>
                    Beheer de bonusopdrachten
                    <span className={`pijl ${isBonusBeheerOpen ? 'open' : ''}`}>▶</span>
                  </button>
                  <div className={`harmonica-content ${isBonusBeheerOpen ? 'open' : ''}`}>
                    <BonusOpdrachtBeheer 
                      opdrachten={bonusOpdrachten} 
                      setOpdrachten={setBonusOpdrachten}
                      isLokaleOpslagActief={isLokaleBonusOpslagActief}
                      basisBonusOpdrachten={basisBonusOpdrachten}
                      onLokaleOpslagChange={setIsLokaleBonusOpslagActief}
                    />
                  </div>
                </>
              )}
            </div>
          )}

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