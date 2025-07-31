export interface LeerFeedback {
  type: 'motivatie' | 'effectief_leren' | 'studievaardigheden' | 'metacognitie' | 'praktische_tips';
  bericht: string;
  combinatie: string;
}

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

export const getLeerFeedback = (combinatie: string): string => {
  const beschikbareFeedback = LEER_FEEDBACK_DATABASE.filter(feedback => 
    feedback.combinatie === combinatie
  );
  
  if (beschikbareFeedback.length === 0) {
    return 'Blijf leren en groeien!';
  }
  
  const randomIndex = Math.floor(Math.random() * beschikbareFeedback.length);
  return beschikbareFeedback[randomIndex].bericht;
}; 