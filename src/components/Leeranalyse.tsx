import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { LeerData, Achievement, LeitnerData, LeitnerAchievement } from '../data/types';
import { getLeerDataManager } from '../data/leerDataManager';

import OverzichtTab from './leeranalyse/OverzichtTab';
import CategorieenTab from './leeranalyse/CategorieenTab';
import TijdlijnTab from './leeranalyse/TijdlijnTab';
import AchievementsTab from './leeranalyse/AchievementsTab';
import LeitnerTab from './leeranalyse/LeitnerTab';
import './Leeranalyse.css';

interface LeeranalyseProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFocusSessie?: (categorie: string, leermodusType?: 'normaal' | 'leitner') => void;
  openToAchievements?: boolean;
}

export const Leeranalyse = React.memo(({ isOpen, onClose, onStartFocusSessie, openToAchievements = false }: LeeranalyseProps) => {
  const [leerData, setLeerData] = useState<LeerData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leitnerData, setLeitnerData] = useState<LeitnerData | null>(null);
  const [achievementDefs, setAchievementDefs] = useState<{ algemeen: Omit<Achievement, 'behaaldOp'>[], leitner: Omit<LeitnerAchievement, 'behaaldOp'>[] }>({ algemeen: [], leitner: [] });
  const [activeTab, setActiveTab] = useState<'overzicht' | 'categorieen' | 'achievements' | 'leitner' | 'tijdlijn'>(openToAchievements ? 'achievements' : 'overzicht');
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; content: string }>({ isOpen: false, title: '', content: '' });

  const leerDataManager = useMemo(() => getLeerDataManager(), [isOpen]);

  const { hoofdcategorieRanking, subcategorieRanking } = useMemo(() => {
    if (!isOpen) return { hoofdcategorieRanking: null, subcategorieRanking: null };
    return {
      hoofdcategorieRanking: leerDataManager.getCategorieRanking('hoofd'),
      subcategorieRanking: leerDataManager.getCategorieRanking('sub')
    };
  }, [isOpen, leerDataManager]);

  // Leitner statistieken




  const closeInfoModal = useCallback(() => {
    setInfoModal({ isOpen: false, title: '', content: '' });
  }, []);

  const exportData = useCallback(() => {
    if (!leerData) return;
    
    const leerDataManager = getLeerDataManager();
    const data = leerDataManager.exportData();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leerdata_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [leerData]);



  useEffect(() => {
    if (isOpen) {
      const leerDataManager = getLeerDataManager();
      const data = leerDataManager.loadLeerData();
      const achievementsData = leerDataManager.loadAchievements();
      const leitnerData = leerDataManager.loadLeitnerData();
      const defs = leerDataManager.getAchievementDefinitions();
      
      setLeerData(data);
      setAchievements(achievementsData);
      setLeitnerData(leitnerData);
      setAchievementDefs(defs);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="leeranalyse-overlay">
      <div className="leeranalyse-modal">
        <div className="leeranalyse-header">
          <h2>Leeranalyse</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="leeranalyse-tabs">
          <button 
            className={`tab-button ${activeTab === 'overzicht' ? 'active' : ''}`}
            onClick={() => setActiveTab('overzicht')}
          >
            Overzicht
          </button>
          <button 
            className={`tab-button ${activeTab === 'categorieen' ? 'active' : ''}`}
            onClick={() => setActiveTab('categorieen')}
          >
            Categorieën
          </button>
          <button 
            className={`tab-button ${activeTab === 'tijdlijn' ? 'active' : ''}`}
            onClick={() => setActiveTab('tijdlijn')}
          >
            Tijdlijn
          </button>
          <button 
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
          <button 
            className={`tab-button ${activeTab === 'leitner' ? 'active' : ''}`}
            onClick={() => setActiveTab('leitner')}
          >
            Leitner
          </button>
        </div>

        <div className="leeranalyse-content">
          {activeTab === 'overzicht' && (
            <OverzichtTab
              leerData={leerData}
              achievements={achievements}
              leitnerData={leitnerData}
              achievementDefs={achievementDefs}
              showInfoModal={(title: string, content: string) => {
                setInfoModal({ isOpen: true, title, content });
              }}
              formatTijd={(seconds: number) => {
                const uren = Math.floor(seconds / 3600);
                const min = Math.floor((seconds % 3600) / 60);
                return uren > 0 ? `${uren}u ${min}m` : `${min}m`;
              }}
              onStartFocusSessie={onStartFocusSessie}
            />
          )}

          {activeTab === 'categorieen' && (
            <CategorieenTab
              leerData={leerData}
              achievements={achievements}
              leitnerData={leitnerData}
              achievementDefs={achievementDefs}
              showInfoModal={(title: string, content: string) => {
                setInfoModal({ isOpen: true, title, content });
              }}
              hoofdcategorieRanking={hoofdcategorieRanking}
              subcategorieRanking={subcategorieRanking}
              onStartFocusSessie={onStartFocusSessie}
            />
          )}

          {activeTab === 'tijdlijn' && (
            <TijdlijnTab
              leerData={leerData}
            />
          )}

          {activeTab === 'achievements' && (
            <AchievementsTab
              leerData={leerData}
              achievements={achievements}
              leitnerData={leitnerData}
              achievementDefs={achievementDefs}
            />
          )}

          {activeTab === 'leitner' && (
            <LeitnerTab
              leerData={leerData}
              achievements={achievements}
              leitnerData={leitnerData}
              achievementDefs={achievementDefs}
            />
          )}
        </div>

        <div className="leeranalyse-footer">
          <button onClick={exportData} className="export-button">
            Exporteer JSON
          </button>
        </div>

        {infoModal.isOpen && (
          <div className="info-modal-overlay">
            <div className="info-modal">
              <div className="info-modal-header">
                <h3>{infoModal.title}</h3>
                <button onClick={closeInfoModal} className="close-button">×</button>
              </div>
              <div className="info-modal-content">
                <div dangerouslySetInnerHTML={{ __html: infoModal.content }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}); 