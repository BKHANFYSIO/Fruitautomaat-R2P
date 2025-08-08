import React, { PropsWithChildren } from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameEngine } from '../useGameEngine';
import { SettingsProvider } from '../../context/SettingsContext';

const wrapper = ({ children }: PropsWithChildren) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('analyseerSpin', () => {
  it('geeft bonus_opdracht bij 3 vraagtekens en >=3 spelers', () => {
    const { result } = renderHook(() => useGameEngine(), { wrapper });
    const analyse = result.current.analyseerSpin(
      ['❓', '❓', '❓'],
      [
        { naam: 'A', score: 0, extraSpins: 0, beurten: 0 },
        { naam: 'B', score: 0, extraSpins: 0, beurten: 0 },
        { naam: 'C', score: 0, extraSpins: 0, beurten: 0 },
      ],
      'multi',
      false,
      true
    );
    expect(analyse.actie).toBe('bonus_opdracht');
  });

  it('geeft kop_of_munt bij 3 bellen', () => {
    const { result } = renderHook(() => useGameEngine(), { wrapper });
    const analyse = result.current.analyseerSpin(
      ['🔔', '🔔', '🔔'],
      [{ naam: 'A', score: 0, extraSpins: 0, beurten: 0 }],
      'single',
      false,
      true
    );
    expect(analyse.actie).toBe('kop_of_munt');
  });
});


