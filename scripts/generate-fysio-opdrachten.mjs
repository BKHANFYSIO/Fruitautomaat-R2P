// Genereer fysiotherapie-opdrachten en voeg ze toe aan public/opdrachten.xlsx
// Gebruik: node scripts/generate-fysio-opdrachten.mjs [--count 200] [--overwrite]

import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

const __dirname = path.resolve();
const PROJECT_ROOT = __dirname;
const TARGET = path.join(PROJECT_ROOT, 'public', 'opdrachten.xlsx');

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.findIndex(a => a === `--${name}`);
  if (idx !== -1) return args[idx + 1];
  const eq = args.find(a => a.startsWith(`--${name}=`));
  if (eq) return eq.split('=')[1];
  return fallback;
};
const COUNT = Number(getArg('count', '200')) || 200;
const OVERWRITE = args.includes('--overwrite');

// Helpers
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const uniquePush = (set, key) => { if (!set.has(key)) { set.add(key); return true; } return false; };

// Domeinlijsten (fysiotherapie)
const spierenEnkel = ['m. tibialis anterior', 'm. peroneus longus', 'm. peroneus brevis', 'm. triceps surae', 'm. tibialis posterior'];
const spierenKnie = ['m. quadriceps femoris', 'm. hamstrings', 'm. gastrocnemius', 'm. popliteus', 'm. sartorius'];
const spierenHeup = ['m. gluteus medius', 'm. gluteus maximus', 'm. iliopsoas', 'adductoren', 'm. tensor fasciae latae'];
const ligamentenEnkel = ['lig. talofibulare anterius', 'lig. calcaneofibulare', 'lig. deltoideum'];
const ligamentenKnie = ['voorste kruisband (VKB)', 'achterste kruisband (AKB)', 'mediale collaterale band (MCL)', 'laterale collaterale band (LCL)'];

const energieSystemen = ['ATP-CP', 'anaeroob glycolytisch', 'aeroob oxidatief'];
const trainingsPrikkels = ['kracht', 'uithoudingsvermogen', 'snelheid', 'mobiliteit', 'coördinatie'];
const weefselfasen = ['inflammatiefase (0-5 dagen)', 'proliferatiefase (5-21 dagen)', 'remodelleringsfase (vanaf 3 weken)'];
const belastingPrincipe = ['wet van Selye (GAS)', 'supercompensatie', 'load management', 'acuut/chronisch-belastingsratio'];

// Categorie-structuur
const CATS = [
  { hoofd: 'Anatomie', subs: ['Onderste Extremiteit', 'Enkel', 'Knie', 'Heup'] },
  { hoofd: 'Fysiologie', subs: ['Inspanning', 'Energie systemen'] },
  { hoofd: 'Trainingsleer', subs: ['Kracht', 'Uithoudingsvermogen', 'Mobiliteit'] },
  { hoofd: 'Revalidatie', subs: ['Bindweefselherstel', 'Belasting & Belastbaarheid'] },
  { hoofd: 'Casus', subs: ['Enkelletsel', 'Knieletsel'] },
];

const opdrachtTypes = ['Kennistoets', 'Toepassing', 'Casus'];

// Template-generatoren
function maakOpdracht(hoofdcategorie, categorie) {
  const type = pick(opdrachtTypes);
  const tijdslimiet = randInt(30, 90);
  const extra = randInt(0, 2);

  let op = '';
  let ans = '';

  if (hoofdcategorie === 'Anatomie') {
    if (categorie === 'Enkel') {
      op = 'Noem 3 stabiliserende structuren van de enkel.';
      ans = `${ligamentenEnkel.slice(0,3).join(', ')}, kapsel, musculatuur peronei.`;
    } else if (categorie === 'Knie') {
      op = 'Welke structuren stabiliseren de knie in het frontale vlak?';
      ans = 'MCL, LCL, kapsel, spieren (o.a. m. quadriceps, hamstrings).';
    } else if (categorie === 'Heup') {
      op = 'Welke spier is primair verantwoordelijk voor heupabductie in stand?';
      ans = 'm. gluteus medius (en minimus).';
    } else {
      op = 'Benoem twee spieren die plantaire flexie in enkelgewricht verzorgen.';
      ans = 'm. triceps surae (gastrocnemius en soleus), m. tibialis posterior.';
    }
  } else if (hoofdcategorie === 'Fysiologie') {
    op = `Welk energiesysteem domineert bij ${randInt(10,30)} seconden maximale inspanning?`;
    ans = 'Anaeroob glycolytisch (na ~10s ATP-CP raakt op).';
  } else if (hoofdcategorie === 'Trainingsleer') {
    op = `Noem 3 variabelen om ${pick(trainingsPrikkels)} te doseren.`;
    ans = 'Intensiteit, volume, frequentie, pauze, tempo, range of motion.';
  } else if (hoofdcategorie === 'Revalidatie') {
    if (categorie.toLowerCase().includes('bindweefsel')) {
      op = 'Beschrijf in welke volgorde de fasen van bindweefselherstel verlopen.';
      ans = weefselfasen.join(' → ') + '.';
    } else {
      op = 'Leg uit wat supercompensatie betekent in relatie tot belastbaarheid.';
      ans = 'Herstel boven uitgangsniveau na adequate prikkel en herstel; basis voor progressie.';
    }
  } else if (hoofdcategorie === 'Casus') {
    if (categorie.toLowerCase().includes('enkel')) {
      op = 'Casus: laterale enkelbandlaesie bij sporter. Noem 3 rode vlaggen/uitsluitcriteria.';
      ans = 'Ottawa-ankle rules (malleolus pijn + onvermogen te belasten), neurovasculair compromis, luxatie/instabiliteit.';
    } else {
      op = 'Casus: acuut knieletsel met zwelling na pivot. Welke structuur is waarschijnlijk aangedaan en welke test gebruik je?';
      ans = 'VKB-letsel; Lachman-test/voorste schuifladetest.';
    }
  }

  return {
    Hoofdcategorie: hoofdcategorie,
    Categorie: categorie,
    Opdracht: op,
    Antwoordsleutel: ans,
    'Tijdslimiet (sec)': tijdslimiet,
    'Extra_Punten (max 2)': extra,
    OpdrachtType: type,
  };
}

function genereerRows(count) {
  const rows = [];
  const keyset = new Set();
  let guard = 0;
  while (rows.length < count && guard < count * 10) {
    guard++;
    const c = pick(CATS);
    const sub = pick(c.subs);
    const row = maakOpdracht(c.hoofd, sub);
    const key = `${row.Hoofdcategorie}|${row.Categorie}|${row.Opdracht}`;
    if (uniquePush(keyset, key)) rows.push(row);
  }
  return rows;
}

function loadExisting() {
  if (!fs.existsSync(TARGET)) return [];
  const wb = XLSX.readFile(TARGET);
  const sheet = wb.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: '' });
  return data;
}

function saveAll(rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Opdrachten');
  XLSX.writeFile(wb, TARGET);
}

// Main
const bestaande = OVERWRITE ? [] : loadExisting();
const nieuwe = genereerRows(COUNT);
const gecombineerd = [...bestaande, ...nieuwe];
saveAll(gecombineerd);

console.log(`Opdrachtenbestand bijgewerkt: ${TARGET}`);
console.log(`Bestaande: ${bestaande.length}, Nieuw toegevoegd: ${nieuwe.length}, Totaal: ${gecombineerd.length}`);


