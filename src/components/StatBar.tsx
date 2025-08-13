import React from 'react';
import './StatBar.css';

interface StatBarProps {
  label: string;
  value: string;
  percentage: number; // 0-100
  color?: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, percentage, color = '#4ade80' }) => {
  const gradient = `linear-gradient(90deg, ${color}33 ${percentage}%, transparent ${percentage}%)`;

  return (
    <div className="stat-bar-container" style={{ background: gradient }}>
      <span className="stat-bar-label">{label}</span>
      <span className="stat-bar-value">{value}</span>
    </div>
  );
};

export default StatBar;
















