import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { TabProps } from './LeeranalyseTypes';
import { formatDate } from './LeeranalyseUtils';

interface AchievementsTabProps extends TabProps {
  algemeneAchievementData: any;
  leitnerAchievementData: any;
  aangepasteDoughnutConfig: any;
}

const AchievementsTab: React.FC<AchievementsTabProps> = ({
  achievements,
  leitnerData,
  achievementDefs,
  algemeneAchievementData,
  leitnerAchievementData,
  aangepasteDoughnutConfig
}) => {
  if (!achievements && !leitnerData) {
    return (
      <div className="geen-data">
        <p>Geen achievement data beschikbaar.</p>
      </div>
    );
  }

  return (
    <div className="achievements-tab">
      <div className="achievement-charts-container">
        {algemeneAchievementData && (
          <div className="chart-sectie">
            <h3>🏆 Algemene Achievements</h3>
            <div className="chart-container achievement-chart">
              <Doughnut data={algemeneAchievementData} options={aangepasteDoughnutConfig} />
            </div>
          </div>
        )}
        
        {leitnerAchievementData && (
          <div className="chart-sectie">
            <h3>📚 Leitner Achievements</h3>
            <div className="chart-container achievement-chart">
              <Doughnut data={leitnerAchievementData} options={aangepasteDoughnutConfig} />
            </div>
          </div>
        )}
      </div>

      <div className="achievements-columns">
        <div className="achievement-column">
          <h3>🏆 Algemene Prestaties</h3>
          <div className="achievements-lijst">
            {/* Groepeer achievements per categorie */}
            {['onboarding', 'progressie', 'kwaliteit', 'consistentie', 'exploratie', 'speciaal'].map(categorie => {
              const categorieDefs = achievementDefs.algemeen.filter((def: any) => def.categorie === categorie);
              if (categorieDefs.length === 0) return null;
              
              const categorieTitels = {
                onboarding: '🎉 Onboarding',
                progressie: '📈 Voortgang', 
                kwaliteit: '⭐ Kwaliteit',
                consistentie: '📅 Consistentie',
                exploratie: '🎨 Exploratie',
                speciaal: '🌟 Speciale Prestaties'
              };
              
              return (
                <div key={categorie} className={`achievement-categorie-groep ${categorie}`}>
                  <div className={`achievement-categorie-header ${categorie}`}>
                    {categorieTitels[categorie as keyof typeof categorieTitels]}
                  </div>
                  {categorieDefs.map((def: any) => {
                    const behaald = achievements?.find((a: any) => a.id === def.id);
                    return (
                      <div key={def.id} className={`achievement-card categorie-${def.categorie} ${behaald ? 'behaald' : 'niet-behaald'}`}>
                        <div className="achievement-icon">{behaald ? def.icon : '🔒'}</div>
                        <div className="achievement-info">
                          <h4>{def.naam}</h4>
                          <p>{def.beschrijving}</p>
                          {behaald && <small>Behaald op: {formatDate(new Date(behaald.behaaldOp))}</small>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div className="achievement-column">
          <h3>🗓️ Leitner-Mijlpalen</h3>
          <div className="achievements-lijst">
            {/* Groepeer Leitner achievements per categorie */}
            {['herhaling', 'promotie', 'consistentie'].map(categorie => {
              const categorieDefs = achievementDefs.leitner.filter((def: any) => def.categorie === categorie);
              if (categorieDefs.length === 0) return null;
              
              const categorieTitels = {
                herhaling: '🔄 Dagelijkse Herhalingen',
                promotie: '📈 Box Promoties',
                consistentie: '🔥 Streaks'
              };
              
              return (
                <div key={categorie} className={`achievement-categorie-groep ${categorie === 'consistentie' ? 'consistentie-leitner' : categorie}`}>
                  <div className={`achievement-categorie-header ${categorie === 'consistentie' ? 'consistentie-leitner' : categorie}`}>
                    {categorieTitels[categorie as keyof typeof categorieTitels]}
                  </div>
                  {categorieDefs.map((def: any) => {
                    const behaald = leitnerData?.achievements?.find((a: any) => a.id === def.id);
                    return (
                      <div key={def.id} className={`achievement-card categorie-${def.categorie === 'consistentie' ? 'consistentie-leitner' : def.categorie} ${behaald ? 'behaald' : 'niet-behaald'}`}>
                        <div className="achievement-icon">{behaald ? def.icon : '🔒'}</div>
                        <div className="achievement-info">
                          <h4>{def.naam} {def.level && `(${def.level})`}</h4>
                          <p>{def.beschrijving}</p>
                          {behaald && <small>Behaald op: {formatDate(new Date(behaald.behaaldOp))}</small>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsTab;
