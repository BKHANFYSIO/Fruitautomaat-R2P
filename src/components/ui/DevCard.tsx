import React from 'react';

interface DevCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const DevCard: React.FC<DevCardProps> = ({ title, subtitle, actions, children }) => {
  return (
    <section className="devcard">
      <header className="devcard-header">
        <div>
          <h4 className="devcard-title">{title}</h4>
          {subtitle && <div className="devcard-subtitle">{subtitle}</div>}
        </div>
        {actions && <div className="devcard-actions">{actions}</div>}
      </header>
      <div className="devcard-body">
        {children}
      </div>
    </section>
  );
};


