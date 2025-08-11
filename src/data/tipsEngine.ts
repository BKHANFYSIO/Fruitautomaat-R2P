export type LeermodusType = 'normaal' | 'leitner';

export interface TipSelectieContext {
  leermodusType: LeermodusType;
  sessionId?: string;
  spinsSoFar?: number;
  selectedCategoriesCount?: number;
}

export interface LeerFeedback {
  type: 'motivatie' | 'effectief_leren' | 'studievaardigheden' | 'metacognitie' | 'praktische_tips';
  bericht: string;
  combinatie: string;
}

// Enkele, centrale bron met alle huidige tips per fruitcombinatie
export const LEER_FEEDBACK_DATABASE: LeerFeedback[] = [
  // Twee Kersen - Motivatie
  {
    type: 'motivatie',
    combinatie: 'twee_kersen',
    bericht: 'Kleine stappen leiden tot grote resultaten. Blijf consistent!'
  },
  {
    type: 'motivatie',
    combinatie: 'twee_kersen',
    bericht: 'Elke vraag die je beantwoordt versterkt je kennis. Ga zo door!'
  },
  {
    type: 'motivatie',
    combinatie: 'twee_kersen',
    bericht: 'Je bouwt een solide fundament voor je toekomstige carrière.'
  },

  // Drie Kersen - Motivatie
  {
    type: 'motivatie',
    combinatie: 'drie_kersen',
    bericht: 'Uitstekend! Consistentie is de sleutel tot succesvol leren.'
  },
  {
    type: 'motivatie',
    combinatie: 'drie_kersen',
    bericht: 'Je toont doorzettingsvermogen. Dat is een essentiële vaardigheid!'
  },
  {
    type: 'motivatie',
    combinatie: 'drie_kersen',
    bericht: 'Kennis opbouwen kost tijd, maar je bent op de goede weg!'
  },

  // Drie Citroenen - Effectief Leren
  {
    type: 'effectief_leren',
    combinatie: 'drie_citroenen',
    bericht: 'Actief leren is 3x effectiever dan passief lezen. Je doet het goed!'
  },
  {
    type: 'effectief_leren',
    combinatie: 'drie_citroenen',
    bericht: 'Door vragen te beantwoorden activeer je je geheugen. Dit is retrieval practice!'
  },
  {
    type: 'effectief_leren',
    combinatie: 'drie_citroenen',
    bericht: 'Je gebruikt effectieve leerstrategieën. Dit versterkt je lange termijn geheugen.'
  },

  // Drie Meloenen - Studievaardigheden
  {
    type: 'studievaardigheden',
    combinatie: 'drie_meloenen',
    bericht: 'Elaboratie (uitleggen) verdiept je begrip. Probeer concepten in je eigen woorden uit te leggen.'
  },
  {
    type: 'studievaardigheden',
    combinatie: 'drie_meloenen',
    bericht: 'Verbind nieuwe kennis met wat je al weet. Dit versterkt je netwerk van begrip.'
  },
  {
    type: 'studievaardigheden',
    combinatie: 'drie_meloenen',
    bericht: 'Complexe onderwerpen vereisen herhaling. Blijf oefenen!'
  },

  // Drie Lucky 7s - Effectief Leren
  {
    type: 'effectief_leren',
    combinatie: 'drie_lucky_7s',
    bericht: 'Retrieval practice is cruciaal voor duurzaam leren. Je doet het juiste!'
  },
  {
    type: 'effectief_leren',
    combinatie: 'drie_lucky_7s',
    bericht: 'Door kennis op te halen versterk je je geheugen. Dit is wetenschappelijk bewezen effectief.'
  },
  {
    type: 'effectief_leren',
    combinatie: 'drie_lucky_7s',
    bericht: 'Spaced repetition werkt! Regelmatige herhaling is de sleutel tot langdurige retentie.'
  },

  // Drie Bellen - Studievaardigheden
  {
    type: 'studievaardigheden',
    combinatie: 'drie_bellen',
    bericht: 'Wissel tussen verschillende onderwerpen voor betere retentie. Variatie is belangrijk!'
  },
  {
    type: 'studievaardigheden',
    combinatie: 'drie_bellen',
    bericht: 'Plan je studiemomenten strategisch. Korte, regelmatige sessies zijn effectiever.'
  },
  {
    type: 'studievaardigheden',
    combinatie: 'drie_bellen',
    bericht: 'Gebruik verschillende leerstrategieën. Dit maakt je een flexibele leerder.'
  },

  // Twee Jokers - Metacognitie
  {
    type: 'metacognitie',
    combinatie: 'twee_jokers',
    bericht: 'Reflecteer op je leerproces. Wat ging goed? Wat kun je verbeteren?'
  },
  {
    type: 'metacognitie',
    combinatie: 'twee_jokers',
    bericht: 'Bewust leren is effectiever. Sta stil bij wat je leert en waarom.'
  },
  {
    type: 'metacognitie',
    combinatie: 'twee_jokers',
    bericht: 'Evalueer je studiestrategieën. Wat werkt voor jou?'
  },

  // Drie Jokers - Metacognitie
  {
    type: 'metacognitie',
    combinatie: 'drie_jokers',
    bericht: 'Plan je volgende studiemoment in. Consistentie is belangrijker dan intensiteit.'
  },
  {
    type: 'metacognitie',
    combinatie: 'drie_jokers',
    bericht: 'Stel jezelf doelen. Wat wil je bereiken met je studie?'
  },
  {
    type: 'metacognitie',
    combinatie: 'drie_jokers',
    bericht: 'Bouw aan je metacognitieve vaardigheden. Dit maakt je een betere leerder.'
  },

  // Gemengde combinaties - Praktische Tips
  {
    type: 'praktische_tips',
    combinatie: 'gemengd',
    bericht: 'Neem regelmatig pauzes. Je brein heeft tijd nodig om informatie te verwerken.'
  },
  {
    type: 'praktische_tips',
    combinatie: 'gemengd',
    bericht: 'Slaap voldoende. Tijdens je slaap consolideert je brein nieuwe kennis.'
  },
  {
    type: 'praktische_tips',
    combinatie: 'gemengd',
    bericht: 'Beweeg regelmatig. Fysieke activiteit verbetert je cognitieve functies.'
  }
];

export const getTipForCombination = (combinatie: string): string => {
  const beschikbareFeedback = LEER_FEEDBACK_DATABASE.filter(f => f.combinatie === combinatie);
  if (beschikbareFeedback.length === 0) return 'Blijf leren en groeien!';
  const randomIndex = Math.floor(Math.random() * beschikbareFeedback.length);
  return beschikbareFeedback[randomIndex].bericht;
};

// --- Uitbreiding: Hybride tips met simpele voorwaarden en modus ---
export type TipBron = 'combinatie' | 'modus' | 'analyse' | 'algemeen';

export interface TipMeta {
  id: string;
  bron: TipBron;
  tekst: string;
  modes: Array<'beide' | 'normaal' | 'leitner'>; // 'normaal' staat voor Vrije Leermodus
  combinaties?: string[]; // alleen voor bron: 'combinatie'
  minSpins?: number; // eenvoudige voorwaarde
  minCategories?: number; // eenvoudige voorwaarde
}

const MODE_TIPS: TipMeta[] = [
  {
    id: 'mode_retrieval_practice',
    bron: 'modus',
    tekst: 'Ophalen uit je geheugen (retrieval practice) werkt: denk eerst zelf na, kijk pas daarna naar de antwoordsleutel.',
    modes: ['beide'],
    minSpins: 1
  },
  {
    id: 'mode_focus_pin',
    bron: 'modus',
    tekst: 'Gebruik de focus/pin wanneer je een lastig onderdeel wilt herhalen. Kort na “opzoeken” nogmaals ophalen = sterk leereffect.',
    modes: ['beide'],
    minSpins: 2
  },
  {
    id: 'mode_leitner_spaced',
    bron: 'modus',
    tekst: 'Leitner helpt je herhalen op het juiste moment. Hoe hoger je box, hoe minder vaak je hoeft te herhalen.',
    modes: ['leitner'],
    minSpins: 1
  },
];

const ANALYSE_TIPS: TipMeta[] = [
  {
    id: 'analyse_interleaving',
    bron: 'analyse',
    tekst: 'Je leert breder als je meerdere categorieën door elkaar oefent (interleaving).',
    modes: ['beide'],
    minCategories: 2,
    minSpins: 3
  },
];

const ALGEMENE_TIPS: TipMeta[] = [
  {
    id: 'algemeen_blijf_doen',
    bron: 'algemeen',
    tekst: 'Kleine stappen, vaak herhalen. Dat is de snelste weg naar blijvende kennis.',
    modes: ['beide']
  }
];

// Sessie-geheugen: onthoud de laatste N tips per sessie (geen strikte blokkade voor hele sessie)
const sessionRecentTips = new Map<string, string[]>();

// Persistente cooldown per tip (bijv. 7 dagen)
const LAST_SHOWN_STORAGE_KEY = 'fruitautomaat_tip_last_shown_v1';
type LastShownMap = { [tipId: string]: number }; // epoch ms

const loadLastShown = (): LastShownMap => {
  try {
    const raw = localStorage.getItem(LAST_SHOWN_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as LastShownMap;
  } catch {
    return {};
  }
};

const saveLastShown = (data: LastShownMap) => {
  try {
    localStorage.setItem(LAST_SHOWN_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // noop
  }
};

const isInCooldown = (tipId: string, nowMs: number, days = 7): boolean => {
  const store = loadLastShown();
  const last = store[tipId];
  if (!last) return false;
  const diffDays = (nowMs - last) / (1000 * 60 * 60 * 24);
  return diffDays < days;
};

const isEligibleBasic = (tip: TipMeta, ctx: TipSelectieContext): boolean => {
  // Modus-filter
  const modusOk = tip.modes.includes('beide') || tip.modes.includes(ctx.leermodusType);
  if (!modusOk) return false;
  // Voorwaarden
  if (typeof tip.minSpins === 'number' && (ctx.spinsSoFar || 0) < tip.minSpins) return false;
  if (typeof tip.minCategories === 'number' && (ctx.selectedCategoriesCount || 0) < tip.minCategories) return false;
  return true;
};

const markShown = (tipId: string, ctx: TipSelectieContext) => {
  // Update sessie recent (laatste 3)
  if (ctx.sessionId) {
    const arr = sessionRecentTips.get(ctx.sessionId) || [];
    arr.push(tipId);
    sessionRecentTips.set(ctx.sessionId, arr.slice(-3));
  }
  // Update persistente cooldown
  const store = loadLastShown();
  store[tipId] = Date.now();
  saveLastShown(store);
};

// Gewogen selectie uit buckets: combinatie / modus / analyse / algemeen
export const getHybridTip = (
  combinatie: string | undefined,
  ctx: TipSelectieContext
): string | null => {
  // Bouw buckets
  const comboTips: TipMeta[] = [];
  if (combinatie) {
    const set = LEER_FEEDBACK_DATABASE.filter(f => f.combinatie === combinatie);
    set.forEach((f, idx) => {
      comboTips.push({
        id: `combo_${combinatie}_${idx}`,
        bron: 'combinatie',
        tekst: f.bericht,
        modes: ['beide'],
        combinaties: [combinatie]
      });
    });
  }

  const modeTipsAll = MODE_TIPS.filter(t => isEligibleBasic(t, ctx));
  const analyseTipsAll = ANALYSE_TIPS.filter(t => isEligibleBasic(t, ctx));
  const algemeneTipsAll = ALGEMENE_TIPS.filter(t => isEligibleBasic(t, ctx));

  const now = Date.now();
  const recentSet = new Set<string>((ctx.sessionId && sessionRecentTips.get(ctx.sessionId)) || []);

  const applyConstraints = (items: TipMeta[], skipRecent: boolean, skipCooldown: boolean): TipMeta[] => {
    return items.filter(t => {
      if (!skipRecent && recentSet.has(t.id)) return false;
      if (!skipCooldown && isInCooldown(t.id, now, 7)) return false;
      return true;
    });
  };

  // 1) beide beperkingen actief
  let modeTips = applyConstraints(modeTipsAll, false, false);
  let analyseTips = applyConstraints(analyseTipsAll, false, false);
  let algemeneTips = applyConstraints(algemeneTipsAll, false, false);
  let comboTipsC = applyConstraints(comboTips, false, false);

  // 2) als niets over, laat sessie-recent los
  if (modeTips.length + analyseTips.length + algemeneTips.length + comboTipsC.length === 0) {
    modeTips = applyConstraints(modeTipsAll, true, false);
    analyseTips = applyConstraints(analyseTipsAll, true, false);
    algemeneTips = applyConstraints(algemeneTipsAll, true, false);
    comboTipsC = applyConstraints(comboTips, true, false);
  }
  // 3) als nog niets over, laat cooldown los (fallback)
  if (modeTips.length + analyseTips.length + algemeneTips.length + comboTipsC.length === 0) {
    modeTips = applyConstraints(modeTipsAll, true, true);
    analyseTips = applyConstraints(analyseTipsAll, true, true);
    algemeneTips = applyConstraints(algemeneTipsAll, true, true);
    comboTipsC = applyConstraints(comboTips, true, true);
  }

  // Gewichten (aanpasbaar): modus 0.5, combo 0.3, analyse 0.2, val terug op algemeen
  const buckets: Array<{ key: 'modus'|'combinatie'|'analyse'|'algemeen'; w: number; items: TipMeta[] }> = (
    [
      { key: 'modus' as const, w: 0.5, items: modeTips },
      { key: 'combinatie' as const, w: 0.3, items: comboTipsC },
      { key: 'analyse' as const, w: 0.2, items: analyseTips },
      { key: 'algemeen' as const, w: 0.1, items: algemeneTips },
    ]
  ).filter(b => b.items.length > 0);

  if (buckets.length === 0) return null;

  // Renormaliseer gewichten
  const wSum = buckets.reduce((acc, b) => acc + b.w, 0);
  let r = Math.random();
  let chosen = buckets[0];
  for (const b of buckets) {
    const p = b.w / wSum;
    if (r < p) { chosen = b; break; }
    r -= p;
  }

  const pick = chosen.items[Math.floor(Math.random() * chosen.items.length)];
  markShown(pick.id, ctx);
  return pick.tekst;
};



