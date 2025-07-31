import { useState, useEffect } from 'react';
import type { Achievement, LeitnerAchievement } from '../data/types';
import './AchievementNotificatie.css';

interface AchievementNotificatieProps {
  achievement: Achievement | LeitnerAchievement | null;
  onClose: () => void;
  onOpenLeeranalyse?: () => void;
}

export const AchievementNotificatie = ({ achievement, onClose, onOpenLeeranalyse }: AchievementNotificatieProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      // Auto-hide na 4 seconden
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wacht tot animatie klaar is
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  // Bepaal categorie en kleur
  const getCategorieInfo = (achievement: Achievement | LeitnerAchievement) => {
    // Check of het een Leitner achievement is door te kijken naar de 'level' property
    const isLeitnerAchievement = 'level' in achievement || 
      (achievement as LeitnerAchievement).categorie === 'herhaling' ||
      (achievement as LeitnerAchievement).categorie === 'promotie' ||
      (achievement as LeitnerAchievement).categorie === 'consistentie';
    
    if (isLeitnerAchievement) {
      // Leitner achievement
      const leitnerAchievement = achievement as LeitnerAchievement;
      const categorie = leitnerAchievement.categorie === 'consistentie' ? 'consistentie-leitner' : leitnerAchievement.categorie;
      const categorieTitels = {
        herhaling: '🔄 Herhaling',
        promotie: '📈 Promotie',
        'consistentie-leitner': '🔥 Streak'
      };
      return {
        titel: categorieTitels[categorie as keyof typeof categorieTitels],
        cssClass: `categorie-${categorie}`
      };
    } else {
      // Algemene achievement
      const algemeneAchievement = achievement as Achievement;
      const categorieTitels = {
        onboarding: '🎉 Onboarding',
        progressie: '📈 Voortgang',
        kwaliteit: '⭐ Kwaliteit',
        consistentie: '📅 Consistentie',
        exploratie: '🎨 Exploratie',
        speciaal: '🌟 Speciaal'
      };
      return {
        titel: categorieTitels[algemeneAchievement.categorie as keyof typeof categorieTitels],
        cssClass: `categorie-${algemeneAchievement.categorie}`
      };
    }
  };

  const categorieInfo = getCategorieInfo(achievement);

  const handleClick = () => {
    if (onOpenLeeranalyse) {
      onOpenLeeranalyse();
      setIsVisible(false);
      setTimeout(onClose, 300);
    }
  };

  return (
    <div className={`achievement-notificatie ${isVisible ? 'visible' : ''}`}>
      <div 
        className={`achievement-notificatie-content ${categorieInfo.cssClass} ${onOpenLeeranalyse ? 'clickable' : ''}`}
        onClick={handleClick}
      >
        <div className="achievement-icon-large">{achievement.icon}</div>
        <div className="achievement-info">
          <div className="achievement-categorie-badge">{categorieInfo.titel}</div>
          <h3>🏆 Achievement Unlocked!</h3>
          <h4>{achievement.naam}</h4>
          <p>{achievement.beschrijving}</p>
          {onOpenLeeranalyse && (
            <p className="click-hint">💡 Klik om alle achievements te bekijken</p>
          )}
        </div>
        <button className="close-button" onClick={(e) => {
          e.stopPropagation(); // Voorkom dat de click event bubbelt
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}>
          ×
        </button>
      </div>
    </div>
  );
}; 