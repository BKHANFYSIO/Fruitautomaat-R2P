import { describe, it, expect, beforeEach } from 'vitest';
import { getLeerDataManager } from '../../data/leerDataManager';
import type { Opdracht } from '../../data/types';

const opdracht: Opdracht = {
  Categorie: 'Cat',
  Hoofdcategorie: 'Hoofd',
  Opdracht: 'Vraag X',
  Antwoordsleutel: 'Antwoord',
  Tijdslimiet: 0,
  Extra_Punten: 0,
};

beforeEach(() => {
  // schoon localStorage voor elke test om state-lekkage te voorkomen
  Object.keys(localStorage).forEach(k => localStorage.removeItem(k));
});

describe('recordOpdrachtVoltooid', () => {
  it('registreert modus in modusGeschiedenis als leermodusType is meegegeven', () => {
    const mgr = getLeerDataManager();
    // start zodat structuur bestaat
    mgr.recordOpdrachtStart(opdracht);
    const achievements = mgr.recordOpdrachtVoltooid(opdracht, 5, 'Heel Goed', undefined, undefined, 'leitner');
    expect(Array.isArray(achievements)).toBe(true);
    const data = mgr.loadLeerData();
    expect(data).toBeTruthy();
    const id = `${opdracht.Hoofdcategorie}_${opdracht.Categorie}_${opdracht.Opdracht.substring(0, 20)}`;
    const entry = data!.opdrachten[id];
    expect(entry.modusGeschiedenis && entry.modusGeschiedenis.length).toBeGreaterThan(0);
    expect(entry.modusGeschiedenis![entry.modusGeschiedenis!.length - 1].modus).toBe('leitner');
  });
});


