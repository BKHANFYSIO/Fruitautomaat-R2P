import React from 'react';

type Props = {
  zichtbaar: boolean;
  type: 'succes' | 'fout';
  bericht: string;
};

export const NotificatieBanner: React.FC<Props> = ({ zichtbaar, type, bericht }) => {
  return (
    <div className={`notificatie-popup ${zichtbaar ? 'zichtbaar' : ''} ${type}`}>
      {bericht}
    </div>
  );
};


