export type LeermodusType = 'normaal' | 'leitner';
import { TIPS_CONFIG } from './tipsConfig';

export interface TipSelectieContext {
  leermodusType: LeermodusType;
  sessionId?: string;
  spinsSoFar?: number;
  selectedCategoriesCount?: number;
  // Analyse snapshot (optioneel). Als niet aanwezig, gelden analyse-voorwaarden niet.
  streakDays?: number;
  hoofdCategorieCount?: number;
  subCategorieCount?: number;
  uniqueOpdrachtenCount?: number;
  sessiesCount?: number;
  speeltijdMinToday?: number;
  scoreTrendWeek?: 'stijging' | 'daling';
  leitnerOverdueCount?: number;
  leitnerPromotionsTotal?: number;
  leitnerBox7Count?: number;
  // Per-hoofdcategorie snapshots (optioneel)
  coveragePercentPerHoofdcategorie?: { [hoofdcategorie: string]: number };
  masteryPercentPerHoofdcategorie?: { [hoofdcategorie: string]: number };
  avgBoxPerHoofdcategorie?: { [hoofdcategorie: string]: number };
  // Tijdlijn dekking
  totalDaysWithData?: number; // aantal dagen data beschikbaar
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
  // Analyse-gekoppelde voorwaarden
  streakIn?: number[]; // toon bij specifieke streak mijlpalen
  minHoofdcat?: number;
  minSubcat?: number;
  minUniekeOpdrachten?: number;
  minSessies?: number;
  minSpeeltijdMin?: number; // speeltijd in minuten
  scoreVerbetering?: 'stijging' | 'daling';
  leitnerOverdueMin?: number;
  leitnerPromotiesMin?: number;
  leitnerBox7Min?: number;
  // CTA naar leeranalyse modal
  cta?: { label: string; event: 'openLeeranalyse'; targetTab?: 'overzicht'|'categorieen'|'achievements'|'leitner'|'tijdlijn' };
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
  // Streak milestones
  { id: 'analyse_streak_2', bron: 'analyse', tekst: 'Dagelijks leren werkt. Mooi: 2 dagen achtereen! Maak je streak nog langer.', modes: ['beide'], streakIn: [2], cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  { id: 'analyse_streak_4', bron: 'analyse', tekst: 'Knap: 4 dagen op rij! Blijf het kort en regelmatig doen.', modes: ['beide'], streakIn: [4], cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  { id: 'analyse_streak_10', bron: 'analyse', tekst: 'Top: 10 dagen streak! Dit is precies wat langetermijnleren sterk maakt.', modes: ['beide'], streakIn: [10], cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  { id: 'analyse_streak_20', bron: 'analyse', tekst: 'Fantastisch: 20 dagen streak! Je bouwt echt duurzame kennis op.', modes: ['beide'], streakIn: [20], cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  // Categorieën breedte
  { id: 'analyse_hoofdcats_3', bron: 'analyse', tekst: 'Je oefent meerdere hoofdcategorieën. Variatie helpt om kennis flexibeler op te slaan.', modes: ['beide'], minHoofdcat: 3, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  { id: 'analyse_hoofdcats_6', bron: 'analyse', tekst: 'Breed aan het leren! Je pakt nu veel hoofdcategorieën mee.', modes: ['beide'], minHoofdcat: 6, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  // Unieke opdrachten
  { id: 'analyse_uniek_50', bron: 'analyse', tekst: 'Al 50+ unieke opdrachten gedaan. Mooie basis aan het bouwen.', modes: ['beide'], minUniekeOpdrachten: 50, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  { id: 'analyse_uniek_100', bron: 'analyse', tekst: '100+ unieke opdrachten! Dat is een brede fundering.', modes: ['beide'], minUniekeOpdrachten: 100, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  // Sessies
  { id: 'analyse_sessies_3', bron: 'analyse', tekst: 'Regelmaat wint: 3+ sessies. Korte momenten, vaak herhalen werkt.', modes: ['beide'], minSessies: 3, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  { id: 'analyse_sessies_5', bron: 'analyse', tekst: 'Mooi ritme: 5+ sessies. Hou dit vol voor duurzame kennis.', modes: ['beide'], minSessies: 5, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  // Speeltijd
  { id: 'analyse_speeltijd_30m', bron: 'analyse', tekst: 'Vandaag veel geoefend (30m+). Neem ook pauzes: dat helpt onthouden.', modes: ['beide'], minSpeeltijdMin: 30, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'overzicht' } },
  // Leitner specifiek
  { id: 'analyse_overdue', bron: 'analyse', tekst: 'Je hebt herhalingen die klaarstaan. Even inhalen geeft een boost.', modes: ['leitner'], leitnerOverdueMin: 1, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'leitner' } },
  { id: 'analyse_promoties', bron: 'analyse', tekst: 'Net promoties in Leitner? Plan je volgende herhaling en bouw verder.', modes: ['leitner'], leitnerPromotiesMin: 5, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'leitner' } },
  { id: 'analyse_box7', bron: 'analyse', tekst: 'Box 7 bereikt: langetermijngeheugen groeit. Blijf af en toe ophalen.', modes: ['leitner'], leitnerBox7Min: 1, cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'leitner' } },
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
  // Analyse-voorwaarden (alleen valideren als metric aanwezig is in ctx; anders niet tonen)
  if (tip.streakIn) {
    if (typeof ctx.streakDays !== 'number' || !tip.streakIn.includes(ctx.streakDays)) return false;
  }
  if (typeof tip.minHoofdcat === 'number') {
    if (typeof ctx.hoofdCategorieCount !== 'number' || ctx.hoofdCategorieCount < tip.minHoofdcat) return false;
  }
  if (typeof tip.minSubcat === 'number') {
    if (typeof ctx.subCategorieCount !== 'number' || ctx.subCategorieCount < tip.minSubcat) return false;
  }
  if (typeof tip.minUniekeOpdrachten === 'number') {
    if (typeof ctx.uniqueOpdrachtenCount !== 'number' || ctx.uniqueOpdrachtenCount < tip.minUniekeOpdrachten) return false;
  }
  if (typeof tip.minSessies === 'number') {
    if (typeof ctx.sessiesCount !== 'number' || ctx.sessiesCount < tip.minSessies) return false;
  }
  if (typeof tip.minSpeeltijdMin === 'number') {
    if (typeof ctx.speeltijdMinToday !== 'number' || ctx.speeltijdMinToday < tip.minSpeeltijdMin) return false;
  }
  if (typeof tip.scoreVerbetering === 'string') {
    if (ctx.scoreTrendWeek !== tip.scoreVerbetering) return false;
  }
  if (typeof tip.leitnerOverdueMin === 'number') {
    if (typeof ctx.leitnerOverdueCount !== 'number' || ctx.leitnerOverdueCount < tip.leitnerOverdueMin) return false;
  }
  if (typeof tip.leitnerPromotiesMin === 'number') {
    if (typeof ctx.leitnerPromotionsTotal !== 'number' || ctx.leitnerPromotionsTotal < tip.leitnerPromotiesMin) return false;
  }
  if (typeof tip.leitnerBox7Min === 'number') {
    if (typeof ctx.leitnerBox7Count !== 'number' || ctx.leitnerBox7Count < tip.leitnerBox7Min) return false;
  }
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
export const getHybridTipRich = (
  combinatie: string | undefined,
  ctx: TipSelectieContext
): { tekst: string; cta?: TipMeta['cta'] } | null => {
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
  let analyseTipsAll = ANALYSE_TIPS.filter(t => isEligibleBasic(t, ctx));
  const algemeneTipsAll = ALGEMENE_TIPS.filter(t => isEligibleBasic(t, ctx));

  const now = Date.now();
  const recentSet = new Set<string>((ctx.sessionId && sessionRecentTips.get(ctx.sessionId)) || []);

  const applyConstraints = (items: TipMeta[], skipRecent: boolean, skipCooldown: boolean): TipMeta[] => {
    return items.filter(t => {
      if (!skipRecent && recentSet.has(t.id)) return false;
      if (!skipCooldown && isInCooldown(t.id, now)) return false;
      return true;
    });
  };

  // Dynamische analyse-tips op basis van snapshots
  const dynamicAnalyseTips: TipMeta[] = [];
  // Dekking: 20/40/60/80%
  if (ctx.coveragePercentPerHoofdcategorie) {
    const thresholds = TIPS_CONFIG.thresholds.coveragePercents;
    Object.entries(ctx.coveragePercentPerHoofdcategorie).forEach(([hc, pct]) => {
      thresholds.forEach(th => {
        if (Math.round(pct) >= th) {
          dynamicAnalyseTips.push({
            id: `analyse_cov_${hc}_${th}`,
            bron: 'analyse',
            tekst: `Je dekt nu ${Math.round(pct)}% van "${hc}". Mooi bezig, bekijk je spreiding.`,
            modes: ['beide'],
            cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'categorieen' },
          });
        }
      });
    });
  }
  // Beheersing: >0% (eerste), 20%, 50%
  if (ctx.masteryPercentPerHoofdcategorie) {
    const thresholds = TIPS_CONFIG.thresholds.masteryPercents;
    Object.entries(ctx.masteryPercentPerHoofdcategorie).forEach(([hc, pct]) => {
      thresholds.forEach(th => {
        if (pct >= th) {
          const label = th < 1 ? 'eerste beheersing' : `${Math.round(th)}% beheersing`;
          dynamicAnalyseTips.push({
            id: `analyse_mastery_${hc}_${Math.round(th)}`,
            bron: 'analyse',
            tekst: `${label} in "${hc}"! Hou dit ritme vol.`,
            modes: ['beide'],
            cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'categorieen' },
          });
        }
      });
    });
  }
  // Gemiddelde box: 2,4,6
  if (ctx.avgBoxPerHoofdcategorie) {
    const thresholds = TIPS_CONFIG.thresholds.avgBoxValues;
    Object.entries(ctx.avgBoxPerHoofdcategorie).forEach(([hc, avg]) => {
      thresholds.forEach(th => {
        if (Math.floor(avg) >= th) {
          dynamicAnalyseTips.push({
            id: `analyse_avgbox_${hc}_${th}`,
            bron: 'analyse',
            tekst: `Gemiddelde Leitner‑box in "${hc}" is ${Math.round(avg)}. Je hoeft minder vaak te herhalen.`,
            modes: ['leitner'],
            cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'leitner' },
          });
        }
      });
    });
  }
  // Tijdslijn: >=7, >=30, >=90 dagen
  if (typeof ctx.totalDaysWithData === 'number') {
    const d = ctx.totalDaysWithData;
    const { week, month, quarter } = TIPS_CONFIG.thresholds.timelineDays;
    if (d >= quarter) {
      dynamicAnalyseTips.push({ id: 'analyse_timeline_90', bron: 'analyse', tekst: 'Je kunt 3‑maandsgrafieken bekijken in de leeranalyse.', modes: ['beide'], cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'tijdlijn' } });
    } else if (d >= month) {
      dynamicAnalyseTips.push({ id: 'analyse_timeline_30', bron: 'analyse', tekst: 'Je kunt maandgrafieken bekijken in de leeranalyse.', modes: ['beide'], cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'tijdlijn' } });
    } else if (d >= week) {
      dynamicAnalyseTips.push({ id: 'analyse_timeline_7', bron: 'analyse', tekst: 'Je hebt 7+ dagen data: bekijk de grafieken van de afgelopen week.', modes: ['beide'], cta: { label: 'Bekijk leeranalyse', event: 'openLeeranalyse', targetTab: 'tijdlijn' } });
    }
  }
  // Voeg dynamische items toe
  analyseTipsAll = [...analyseTipsAll, ...dynamicAnalyseTips];

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

  // Gewichten configurabel via TIPS_CONFIG
  const buckets: Array<{ key: 'modus'|'combinatie'|'analyse'|'algemeen'; w: number; items: TipMeta[] }> = (
    [
      { key: 'modus' as const, w: (TIPS_CONFIG as any).weights?.modus ?? 0.5, items: modeTips },
      { key: 'combinatie' as const, w: (TIPS_CONFIG as any).weights?.combinatie ?? 0.3, items: comboTipsC },
      { key: 'analyse' as const, w: (TIPS_CONFIG as any).weights?.analyse ?? 0.2, items: analyseTips },
      { key: 'algemeen' as const, w: (TIPS_CONFIG as any).weights?.algemeen ?? 0.1, items: algemeneTips },
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
  return { tekst: pick.tekst, cta: pick.cta };
};

// Backwards compatible: tekst-only versie
export const getHybridTip = (combinatie: string | undefined, ctx: TipSelectieContext): string | null => {
  const res = getHybridTipRich(combinatie, ctx);
  return res?.tekst ?? null;
};



