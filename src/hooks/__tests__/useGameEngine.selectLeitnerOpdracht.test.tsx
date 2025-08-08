import type { PropsWithChildren } from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameEngine } from '../useGameEngine';
import { SettingsProvider } from '../../context/SettingsContext';
import type { Opdracht } from '../../data/types';

const wrapper = ({ children }: PropsWithChildren) => (
  <SettingsProvider>{children}</SettingsProvider>
);

const voorbeeldOpdrachten: Opdracht[] = [
  { Categorie: 'Cat1', Hoofdcategorie: 'Hoofd1', Opdracht: 'V1', Antwoordsleutel: 'A', Tijdslimiet: 0, Extra_Punten: 0 },
  { Categorie: 'Cat2', Hoofdcategorie: 'Hoofd1', Opdracht: 'V2', Antwoordsleutel: 'A', Tijdslimiet: 0, Extra_Punten: 0 },
];

describe('selectLeitnerOpdracht', () => {
  it('geeft een opdracht terug in niet-serieuze modus', () => {
    const { result } = renderHook(() => useGameEngine(), { wrapper });
    const res = result.current.selectLeitnerOpdracht(voorbeeldOpdrachten, ['Hoofd1 - Cat1'], false, 'single', false);
    expect(res.opdracht).toBeTruthy();
  });
});


