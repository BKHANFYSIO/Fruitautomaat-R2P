import { useCallback, useState } from 'react';
import { NOTIFICATIE_DUUR_MS } from '../data/constants';

export type Notificatie = {
  zichtbaar: boolean;
  bericht: string;
  type: 'succes' | 'fout';
  cta?: { label: string; onClick: () => void };
};

export function useNotificatie() {
  const [notificatie, setNotificatie] = useState<Notificatie>({ zichtbaar: false, bericht: '', type: 'succes' });

  const showNotificatie = useCallback((bericht: string, type: Notificatie['type'] = 'succes', timeoutMs?: number, cta?: { label: string; onClick: () => void }) => {
    setNotificatie({ zichtbaar: true, bericht, type, cta });
    const duur = typeof timeoutMs === 'number' ? timeoutMs : NOTIFICATIE_DUUR_MS[type];
    if (duur > 0) {
      window.setTimeout(() => setNotificatie(prev => ({ ...prev, zichtbaar: false })), duur);
    }
  }, []);

  const hideNotificatie = useCallback(() => {
    setNotificatie(prev => ({ ...prev, zichtbaar: false }));
  }, []);

  return { notificatie, setNotificatie, showNotificatie, hideNotificatie };
}



