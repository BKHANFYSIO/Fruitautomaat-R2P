import React, { PropsWithChildren } from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameEngine } from '../useGameEngine';
import { SettingsProvider } from '../../context/SettingsContext';

const wrapper = ({ children }: PropsWithChildren) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('checkSpelEinde (multiplayer)', () => {
  it('retourneert true wanneer aantal beurten de limiet bereikt', () => {
    const { result } = renderHook(() => useGameEngine(), { wrapper });
    // zet 2 spelers zodat max rondes * 2 beurten nodig is
    act(() => {
      result.current.setSpelers([
        { naam: 'A', score: 0, extraSpins: 0, beurten: 0 },
        { naam: 'B', score: 0, extraSpins: 0, beurten: 0 },
      ]);
      result.current.setAantalBeurtenGespeeld(8);
    });
    const isEinde = result.current.checkSpelEinde(4, 'multi');
    expect(isEinde).toBe(true);
  });
});


