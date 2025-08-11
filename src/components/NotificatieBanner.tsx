import React from 'react';

type Props = {
  zichtbaar: boolean;
  type: 'succes' | 'fout';
  bericht: string;
  cta?: { label: string; onClick: () => void };
};

export const NotificatieBanner: React.FC<Props> = ({ zichtbaar, type, bericht, cta }) => {
  return (
    <div className={`notificatie-popup ${zichtbaar ? 'zichtbaar' : ''} ${type}`}>
      <span>{bericht}</span>
      {cta && (
        <button className="notificatie-cta" onClick={cta.onClick} style={{ marginLeft: 12 }}>
          {cta.label}
        </button>
      )}
    </div>
  );
};


