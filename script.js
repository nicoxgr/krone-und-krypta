/* ============================================================
   KRONE & KRYPTA
   Reigns-Grundmechanik als Eingabe-Interface —
   Kern: Dungeon-Erkundung + taktisches, rundenbasiertes Kampfsystem.
   Struktur: CONFIG → Content → Utils → State → Rendering →
             Story → Dungeon → Kampf → Loot → Game Over → Input → Init
   ============================================================ */
(() => {
'use strict';

/* ============================================================
   CONFIG — alle Balancing-Zahlen zentral
   ============================================================ */
const CONFIG = {
  swipeX: 0.35,            // Schwellwert horizontal (Anteil Kartenbreite)
  swipeY: 0.35,            // Schwellwert vertikal (Anteil Kartenhöhe)
  flyMs: 380,              // Dauer Fly-Out
  dealMs: 340,             // Dauer Deal-In
  enemyDelayMs: 520,       // Pause vor Gegnerzug
  tickDelayMs: 360,        // Pause vor Status-Ticks

  resStart: { army: 50, faith: 50, treasury: 50, hp: 100 },
  hpMax: 100,
  warnLow: 15,
  warnHigh: 85,

  storyUpkeep: 1,          // Hofhaltung: Schatzkammer-Drain pro Tag
  driftHigh: 70,           // ab hier verstärken sich Extreme selbst …
  driftLow: 30,            // … bzw. fallen weiter ab
  driftAmount: 1,

  torchStart: 12,
  darkDmg: 5,
  sneakCost: 2,
  sneakCostElite: 3,
  mimicChance: 0.2,
  trapFailChance: 0.4,
  trapDmg: 12,
  altarHpCost: 10,
  altarTorches: 3,
  campfireHeal: 30,
  sharpenBonus: 2,
  antechamberHeal: 15,

  baseBlock: 4,
  perfectCounter: 0.3,     // Konter bei perfektem Block (Anteil Ø-Waffenschaden)
  critMult: 2,
  comboStep: 0.15,
  comboMax: 3,
  focusMax: 5,
  golemHeatMax: 5,

  bossReturnRes: 15,       // Ressourcen-Belohnung nach Boss-Sieg …
  bossReturnCap: 90,       // … gekappt, damit der Triumph nicht bei 100 tötet
  bossReturnHeal: 25,

  inventorySize: 6,
  rarityValue: { common: 10, rare: 25, epic: 55, legendary: 110 },
  sellMul: 0.5,
  merchantMul: 1.6,
  potionValue: 15,
  torchValue: 8,

  dropChanceNormal: 0.45,
  lootRarity: {
    normal:   { common: 70, rare: 25, epic: 5, legendary: 0 },
    chest:    { common: 55, rare: 34, epic: 10, legendary: 1 },
    elite:    { common: 25, rare: 50, epic: 22, legendary: 3 },
    boss:     { common: 0, rare: 25, epic: 55, legendary: 20 },
    merchant: { common: 40, rare: 40, epic: 18, legendary: 2 },
  },
  lootCategory: { weapon: 45, armor: 32, trinket: 23 },
};

/* ============================================================
   CONTENT — Items
   ============================================================ */
const WEAPONS = [
  { id: 'rostschwert', name: 'Rostiges Schwert', emoji: '🗡️', rarity: 'common', min: 5, max: 8, crit: 0.10,
    special: { name: 'Entschlossener Hieb', cost: 3, type: 'mult', mult: 1.5, desc: '150 % Schaden' } },
  { id: 'gassendolch', name: 'Gassendolch', emoji: '🔪', rarity: 'common', min: 4, max: 6, crit: 0.25,
    special: { name: 'Giftklinge', cost: 3, type: 'poison', v: 5, turns: 3, desc: 'Angriff + 5 Gift (3 Runden)' } },
  { id: 'kriegshammer', name: 'Kriegshammer', emoji: '🔨', rarity: 'rare', min: 8, max: 13, crit: 0.10,
    special: { name: 'Schildbrecher', cost: 3, type: 'shieldbreak', mult: 1.3, desc: 'Zerstört Block + 130 % Schaden' } },
  { id: 'ordensklinge', name: 'Ordensklinge', emoji: '⚔️', rarity: 'rare', min: 7, max: 11, crit: 0.15,
    special: { name: 'Gesegneter Hieb', cost: 3, type: 'lifesteal', mult: 1.0, leech: 0.5, desc: 'Angriff heilt 50 % des Schadens' } },
  { id: 'neonzepter', name: 'Neon-Zepter', emoji: '🪄', rarity: 'epic', min: 6, max: 10, crit: 0.15,
    special: { name: 'Arkanblitz', cost: 3, type: 'pierce', mult: 1.2, heal: 6, desc: 'Ignoriert Block, +6 ❤️' } },
  { id: 'giessereiklinge', name: 'Klinge der Gießerei', emoji: '🛠️', rarity: 'epic', min: 10, max: 15, crit: 0.15,
    special: { name: 'Wirbelschlag', cost: 4, type: 'mult', mult: 2.0, desc: '200 % Schaden' } },
  { id: 'phantomdolch', name: 'Phantomdolch', emoji: '🌘', rarity: 'epic', min: 6, max: 9, crit: 0.35,
    special: { name: 'Schattenstich', cost: 3, type: 'crit', mult: 1.1, desc: 'Garantierter Volltreffer' } },
  { id: 'chromzahn', name: 'Chromzahn', emoji: '⚡', rarity: 'legendary', min: 12, max: 18, crit: 0.20,
    special: { name: 'Neonsturm', cost: 4, type: 'burn', mult: 2.2, v: 5, turns: 3, desc: '220 % Schaden + Brennen' } },
];

const ARMORS = [
  { id: 'weste', name: 'Wattierte Weste', emoji: '🦺', rarity: 'common', block: 3 },
  { id: 'kette', name: 'Kettenhemd', emoji: '⛓️', rarity: 'common', block: 5 },
  { id: 'dornen', name: 'Dornenpanzer', emoji: '🌵', rarity: 'rare', block: 5, thorns: 2 },
  { id: 'platte', name: 'Gießerei-Platte', emoji: '🛡️', rarity: 'epic', block: 8 },
  { id: 'chromschuppe', name: 'Chromschuppen-Harnisch', emoji: '🐚', rarity: 'legendary', block: 10, thorns: 3 },
];

const TRINKETS = [
  { id: 'falkenauge', name: 'Falkenauge', emoji: '🦅', rarity: 'rare', desc: '+10 % Crit-Chance', crit: 0.10 },
  { id: 'fokuskristall', name: 'Fokuskristall', emoji: '🔷', rarity: 'rare', desc: 'Start jedes Kampfes mit 2 ⚡ Fokus' },
  { id: 'herzstein', name: 'Herzstein', emoji: '🫀', rarity: 'epic', desc: '+5 ❤️ nach jedem Kampf' },
  { id: 'ewigefackel', name: 'Ewige Fackel', emoji: '🏮', rarity: 'epic', desc: 'Jeder 2. Raumwechsel kostet keine Fackel' },
];

const POTIONS = [
  { id: 'heiltrank', name: 'Heiltrank', emoji: '🧪', desc: '+30 ❤️' },
  { id: 'feuerbombe', name: 'Feuerbombe', emoji: '💣', desc: '12 Schaden + Brennen (ignoriert Block)' },
  { id: 'staerketrank', name: 'Stärketrank', emoji: '💪', desc: '+50 % Schaden für 3 Runden' },
  { id: 'reinigung', name: 'Reinigungsessenz', emoji: '🕊️', desc: 'Entfernt alle negativen Effekte' },
];
const potionById = (id) => POTIONS.find(p => p.id === id);

/* ============================================================
   CONTENT — Gegner, Affixe, Bosse
   ============================================================ */
const A = (v) => ({ t: 'attack', v });
const B = (v) => ({ t: 'block', v });
const C = () => ({ t: 'charge' });
const P = (v) => ({ t: 'poison', v });
const H = (v) => ({ t: 'heal', v });

const ENEMIES = {
  moderling:     { id: 'moderling', name: 'Moderling', emoji: '🧟', hp: 26, pattern: [A(6), A(6), H(6)], gold: [6, 12] },
  skelett:       { id: 'skelett', name: 'Skelettkrieger', emoji: '☠️', hp: 30, pattern: [A(7), B(7), A(8)], gold: [8, 14] },
  gruftspinne:   { id: 'gruftspinne', name: 'Gruftspinne', emoji: '🕷️', hp: 22, pattern: [P(3), A(5), A(6)], gold: [7, 13] },
  rostwaechter:  { id: 'rostwaechter', name: 'Rostwächter', emoji: '🤖', hp: 40, pattern: [B(9), A(9), C(), A(9)], gold: [12, 20] },
  alchemist:     { id: 'alchemist', name: 'Schwelender Alchemist', emoji: '⚗️', hp: 34, pattern: [P(4), A(8), A(9)], quirk: 'chargeLow', gold: [12, 20] },
  schrottgolem:  { id: 'schrottgolem', name: 'Schrottgolem', emoji: '🔩', hp: 48, pattern: [A(10), A(9), B(10)], gold: [14, 24] },
  neonviper:     { id: 'neonviper', name: 'Neonviper', emoji: '🐍', hp: 44, pattern: [P(5), A(11), C(), A(11)], gold: [18, 28] },
  arkanwaechter: { id: 'arkanwaechter', name: 'Arkanwächter', emoji: '🧿', hp: 52, pattern: [C(), A(11), B(12)], quirk: 'healLow', gold: [20, 32] },
  drachling:     { id: 'drachling', name: 'Drachling', emoji: '🐉', hp: 56, pattern: [A(12), C(), A(12)], gold: [22, 34] },
  mimic:         { id: 'mimic', name: 'Mimik', emoji: '🧰', hp: 34, pattern: [A(9), A(10), A(9)], gold: [25, 40] },
};

const AFFIXES = [
  { id: 'staehlern', name: 'Stählern', desc: '+50 % HP', hpMul: 1.5 },
  { id: 'vampirisch', name: 'Vampirisch', desc: 'Heilt um 50 % des verursachten Schadens', leech: 0.5 },
  { id: 'wuetend', name: 'Wütend', desc: '+30 % Schaden', dmgMul: 1.3 },
];

const BOSSES = {
  skelettkoenig: {
    id: 'skelettkoenig', name: 'Der Skelettkönig', emoji: '💀', hp: 90, boss: true, gold: [60, 90],
    p1: [A(10), A(10), B(10), { t: 'bonestorm', v: 16 }],
    p2: [A(13), C(), A(12), { t: 'bonestorm', v: 20 }],
  },
  schmelzgolem: {
    id: 'schmelzgolem', name: 'Schmelzofen-Golem', emoji: '🌋', hp: 130, boss: true, gold: [90, 130],
    p1: [A(12), B(12), A(14)],
    p2: [A(16), C(), A(14)],
  },
  chromdrache: {
    id: 'chromdrache', name: 'Der Chromdrache', emoji: '🐲', hp: 170, boss: true, gold: [140, 190],
    p1: [A(14), { t: 'chargebreath' }, { t: 'chargebreath' }, { t: 'breath', v: 28 }],
    p2: [A(18), { t: 'chargebreath' }, { t: 'breath', v: 32 }],
  },
};

/* ============================================================
   CONTENT — Dungeons
   ============================================================ */
const DUNGEONS = [
  {
    id: 'katakomben', name: 'Katakomben der Vergessenen', emoji: '🕯️', theme: 'theme-katakomben',
    levels: 5, enemies: ['moderling', 'skelett', 'gruftspinne'], boss: 'skelettkoenig',
    intro: 'Moderluft und Knochenstaub schlagen dir entgegen. Irgendwo unten klappern Gebeine im Takt eines toten Herzens.',
    events: [
      { emoji: '👻', title: 'Geist eines Königs', text: 'Ein bleicher Schemen mit zerbrochener Krone verstellt den Gang. „Höre meine Geschichte — oder nimm, was mir blieb."',
        left: { label: 'Lauschen (+10 ❤️)', fx: { hp: 10 } }, right: { label: 'Grab plündern (+18 🪙)', fx: { gold: 18 } } },
      { emoji: '⚱️', title: 'Urnenkammer', text: 'Hunderte Urnen, eine davon glimmt. In der Asche: Glut, die nie erlosch.',
        left: { label: 'Ruhen lassen (+4 ❤️)', fx: { hp: 4 } }, right: { label: 'Glut entnehmen (+2 🔥)', fx: { torch: 2 } } },
    ],
  },
  {
    id: 'giesserei', name: 'Die Rostgießerei', emoji: '⚙️', theme: 'theme-giesserei',
    levels: 7, enemies: ['rostwaechter', 'alchemist', 'schrottgolem'], boss: 'schmelzgolem',
    intro: 'Kolben stampfen, obwohl hier seit hundert Jahren niemand mehr arbeitet. Öl tropft wie schwarzes Blut von den Decken.',
    events: [
      { emoji: '🔧', title: 'Wartungseinheit', text: 'Ein kleiner Golem piept hilflos — sein Kern flackert. Reparieren oder ausschlachten?',
        left: { label: 'Ausschlachten (+20 🪙)', fx: { gold: 20 } }, right: { label: 'Reparieren (+8 ❤️)', fx: { hp: 8 } } },
      { emoji: '🛢️', title: 'Leuchtöl-Fass', text: 'Ein Fass voll Leuchtöl. Deine Fackeln könnten davon lange zehren — oder du verkaufst es später.',
        left: { label: 'Öl abfüllen (+3 🔥)', fx: { torch: 3 } }, right: { label: 'Verkaufswert sichern (+14 🪙)', fx: { gold: 14 } } },
    ],
  },
  {
    id: 'neonhort', name: 'Der Neon-Hort', emoji: '💠', theme: 'theme-neonhort',
    levels: 9, enemies: ['neonviper', 'arkanwaechter', 'drachling'], boss: 'chromdrache',
    intro: 'Kristalle summen in Farben, für die es keine Namen gibt. Tief unten atmet etwas Großes — im Takt der Lichter.',
    events: [
      { emoji: '🔮', title: 'Singender Kristall', text: 'Ein Kristall vibriert bei deiner Berührung. Sein Lied verspricht Kraft — oder Reichtum.',
        left: { label: 'Lied trinken (+12 ❤️)', fx: { hp: 12 } }, right: { label: 'Splitter brechen (+26 🪙)', fx: { gold: 26 } } },
      { emoji: '🌌', title: 'Riss im Raum', text: 'Ein flimmernder Riss zeigt die Schatzkammer des Drachen — zum Greifen nah und doch nicht ganz.',
        left: { label: 'Zurücktreten (+2 🔥)', fx: { torch: 2 } }, right: { label: 'Hineingreifen (+22 🪙)', fx: { gold: 22 } } },
    ],
  },
];
const dungeonById = (id) => DUNGEONS.find(d => d.id === id);

const ROOM_META = {
  fight:    { ico: '⚔️', label: 'Kampf' },
  elite:    { ico: '💀', label: 'Elite' },
  treasure: { ico: '💰', label: 'Schatz' },
  altar:    { ico: '🕯️', label: 'Altar' },
  merchant: { ico: '🧙', label: 'Händler' },
  campfire: { ico: '⛺', label: 'Lager' },
  trap:     { ico: '🕸️', label: 'Falle' },
  event:    { ico: '📜', label: 'Flüstern' },
};
const ROOM_WEIGHTS = { fight: 30, elite: 10, treasure: 14, altar: 9, merchant: 10, campfire: 10, trap: 10, event: 7 };

/* ============================================================
   CONTENT — Story-Deck (Reigns-Rahmen)
   fx-Schlüssel: army, faith, treasury, hp (Ressourcen 0–100) · gold (Beutel)
   ============================================================ */
const STORY_DECK = [
  { id: 'mutter', emoji: '👵', who: 'Die alte Königin', text: 'Deine Mutter mustert dich vom Krankenbett aus. „Merke dir eines, Kind: Ein Reich stirbt an seinen Extremen — an zu viel genauso wie an zu wenig."',
    left: { label: 'Ihre Hand halten', fx: { hp: 4 } }, right: { label: '„Ich werde es beherzigen."', fx: { faith: 4 } } },
  { id: 'sold', emoji: '💂', who: 'Hauptmann Aldric', text: 'Die Grenztruppen murren, mein Regent. Ein Sold-Bonus würde die Stimmung heben — und mein Ansehen bei den Männern.',
    left: { label: 'Sie dienen der Krone!', fx: { army: -8, faith: 4 } }, right: { label: 'Zahlt den Bonus', fx: { army: 10, treasury: -10 } } },
  { id: 'kathedrale', emoji: '👩‍🦳', who: 'Hohepriesterin Lyra', text: 'Der Orden verlangt eine Kathedrale aus Neonglas — ein Leuchtfeuer des Glaubens, sichtbar bis zu den Grenzbergen.',
    left: { label: 'Zu teuer', fx: { faith: -10, treasury: 5 } }, right: { label: 'Baut sie', fx: { faith: 12, treasury: -12 }, set: ['kathedrale_gebaut'], follow: [['kathedrale2', 3, 5]] } },
  { id: 'steuern', emoji: '🎩', who: 'Schatzmeister Voss', text: '„Ich könnte die Bücher … kreativ führen. Niemand würde es merken. Fast niemand."',
    left: { label: 'Bleib ehrlich', fx: { treasury: -6, faith: 6 } }, right: { label: 'Tu, was nötig ist', fx: { treasury: 12, faith: -8 }, set: ['voss_krumm'], follow: [['pruefer', 3, 6]] } },
  { id: 'fest', emoji: '🤡', who: 'Hofnarr Pip', text: '„Ein Fest, Majestät! Wer tanzt, vergisst den Hunger — und wer lacht, vergisst die Steuern!"',
    left: { label: 'Keine Narreteien', fx: { faith: -5, treasury: 3 } }, right: { label: 'Lasst tanzen!', fx: { treasury: -8, faith: 8 }, follow: [['pip_theater', 2, 5]] } },
  { id: 'ernte', emoji: '👩‍🌾', who: 'Bäuerin Marla', text: 'Der Frost hat die halbe Ernte geholt. Ohne Korn aus den königlichen Speichern hungern drei Dörfer.',
    left: { label: 'Abweisen', fx: { faith: -8, treasury: 4 }, follow: [['landflucht', 3, 6]] }, right: { label: 'Speicher öffnen', fx: { treasury: -8, faith: 8 }, follow: [['erntedank', 4, 8]] } },
  { id: 'tribut', emoji: '🤵', who: 'Gesandter von Vharan', text: '„Mein Fürst fordert Tribut. Zahlt — oder seine Banner stehen zur Schneeschmelze vor euren Toren."',
    left: { label: 'Niemals!', fx: { army: -8, faith: 6 }, set: ['vharan_zorn'], follow: [['scharmuetzel', 2, 4]] }, right: { label: 'Zahlen', fx: { treasury: -10, army: 4 }, follow: [['vharan_mehr', 5, 9]] } },
  { id: 'schmiede', emoji: '🔨', who: 'Waffenschmiedin Kara', text: 'Der Stahl reicht nur für eines: neue Klingen für die Garde — oder Pflugscharen für das Volk.',
    left: { label: 'Pflugscharen', fx: { faith: 7, army: -6 } }, right: { label: 'Klingen', fx: { army: 9, treasury: -8 } } },
  { id: 'elixier', emoji: '🧪', who: 'Alchemist Fenn', text: '„Ein Elixier der Vitalität, Majestät. Frisch destilliert. Für Euch nur zwanzig Goldstücke — aus dem privaten Beutel, versteht sich."',
    left: { label: 'Ablehnen', fx: {} }, right: { label: 'Kaufen (−20 🪙)', fx: { gold: -20, hp: 15 } },
    canRight: (s) => s.player.gold >= 20 || 'Zu wenig Gold im Beutel.' },
  { id: 'spionin', emoji: '🕵️‍♀️', who: 'Spionin Nyx', text: '„Der Hauptmann trifft sich nachts mit Fremden, mein Regent. Soll ich … genauer hinsehen?"',
    left: { label: 'Ich vertraue ihm', fx: { army: 5, faith: -5 } }, right: { label: 'Untersuchen', fx: { army: -7, faith: 6 }, set: ['nyx_ermittelt'], follow: [['spionin2', 2, 4]] } },
  { id: 'sterne', emoji: '🔮', who: 'Sternendeuterin Ora', text: '„Die Sterne stehen schlecht, Majestät. Ein Schutzritual würde das Unheil abwenden — gegen eine kleine Spende."',
    left: { label: 'Aberglaube!', fx: { faith: -7, treasury: 3 } }, right: { label: 'Das Ritual zahlen', fx: { treasury: -6, faith: 7 } } },
  { id: 'taverne', emoji: '🍻', who: 'Wirt Bromm', text: '„Das ganze Viertel feiert Euren Namenstag, Majestät! Kommt herab — oder besteuert wenigstens das Bier."',
    left: { label: 'Mitfeiern', fx: { hp: 8, treasury: -4 } }, right: { label: 'Biersteuer!', fx: { treasury: 8, faith: -7 } } },
  { id: 'mauer', emoji: '👷', who: 'Baumeister Gorm', text: 'Die Stadtmauer bröckelt an drei Stellen. Noch hält sie — aber „noch" ist kein Wort, das Mauern gerne hören.',
    left: { label: 'Vertagen', fx: { army: -7, treasury: 3 } }, right: { label: 'Sanieren', fx: { treasury: -10, army: 9 } } },
  { id: 'banditen', emoji: '🗺️', who: 'Kriegsrätin Sella', text: 'Banditen würgen die Handelsstraße ab. Ein Kopfgeld wäre billig — die Garde loszuschicken wäre gründlich.',
    left: { label: 'Kopfgeld aussetzen', fx: { treasury: -7, army: 5 } }, right: { label: 'Garde schicken', fx: { army: -5, treasury: 7 } } },
  { id: 'moench', emoji: '🧎', who: 'Bettelmönch Ilo', text: '„Eine Münze für die Armen, Majestät. Der Himmel führt Buch — genauer als Euer Schatzmeister."',
    left: { label: 'Fortschicken', fx: { faith: -6, treasury: 3 } }, right: { label: 'Almosen geben', fx: { treasury: -5, faith: 7 } } },
  { id: 'golems', emoji: '⚙️', who: 'Erfinderin Vex', text: '„Dampfgolems für die Armee! Unermüdlich, furchtlos, gehorsam. Sie brauchen nur … ein beträchtliches Budget."',
    left: { label: 'Zu riskant', fx: { army: -4, faith: 4 } }, right: { label: 'Bauen lassen', fx: { treasury: -12, army: 12 }, set: ['golems_gebaut'], follow: [['golem_amok', 3, 6]] } },
  { id: 'seuche', emoji: '🤒', who: 'Stadtmedicus Halm', text: 'Ein Fieber kriecht durch die Gassen. Wir können die Viertel abriegeln — oder teure Heiler aus dem Süden rufen.',
    left: { label: 'Abriegeln', fx: { faith: -8, treasury: 4 } }, right: { label: 'Heiler rufen', fx: { treasury: -9, faith: 7, hp: 4 } } },
  { id: 'turnier', emoji: '🏇', who: 'Herold Jasper', text: 'Die Ritterschaft erwartet das Frühlingsturnier. Absagen spart Gold — und kostet Ehre.',
    left: { label: 'Absagen', fx: { army: -6, treasury: 5 } }, right: { label: 'Ausrichten', fx: { treasury: -9, army: 9 } } },
  { id: 'eintreiber', emoji: '🧾', who: 'Steuereintreiber Kroll', text: '„Die Dörfer im Osten sind säumig, Majestät. Ein härterer Griff würde die Kassen füllen. Ein deutlich härterer."',
    left: { label: 'Milde walten lassen', fx: { treasury: -6, faith: 5 } }, right: { label: 'Eintreiben', fx: { treasury: 11, faith: -9 } } },
  { id: 'nachtmahr', emoji: '🌙', who: 'Nachtmahr', text: 'Du träumst von Chrom und Feuer: ein Drache, zusammengerollt um einen Berg aus Gold, öffnet ein Auge — und sieht dich.',
    left: { label: 'Ausschlafen', fx: { hp: 6 } }, right: { label: 'Wachen verdoppeln', fx: { army: 6, hp: -6 } } },
  { id: 'reliquie', emoji: '📿', who: 'Reliquienhändler Zed', text: '„Der Fingerknochen des heiligen Ottmar! Garantiert echt. Zu neunzig Prozent. Für die Krone: ein Freundschaftspreis."',
    left: { label: 'Hinauswerfen', fx: { faith: 3 } }, right: { label: 'Für den Orden kaufen', fx: { treasury: -6, faith: 8 } } },
  { id: 'prediger', emoji: '🗣️', who: 'Wanderprediger Ansgar', text: 'Auf dem Marktplatz predigt ein Fremder: „Die Krone ist hohl! Nur der Orden ist ewig!" Die Menge lauscht.',
    left: { label: 'Reden lassen', fx: { faith: 6, army: -5 }, set: ['ansgar_frei'], follow: [['sekte', 3, 6]] }, right: { label: 'Verhaften', fx: { army: 6, faith: -8 }, follow: [['maertyrer', 2, 4]] } },
  { id: 'triumph', emoji: '🎉', who: 'Das Reich', cond: (s) => s.cleared.neonhort,
    text: 'Drei Abgründe hast du geleert, drei Ungeheuer erschlagen. Auf den Straßen singen sie vom Drachentöter auf dem Thron.',
    left: { label: 'Bescheiden bleiben', fx: { faith: 8 } }, right: { label: 'Den Triumph feiern', fx: { treasury: -5, army: 8, faith: 5 } } },

  /* ---- Folgekarten (chainOnly: erscheinen nur über follow-Einplanung) ---- */

  /* Strang: Die Verschwörung um Hauptmann Aldric */
  { id: 'spionin2', emoji: '🕵️‍♀️', who: 'Spionin Nyx', chainOnly: true, once: true,
    text: 'Nyx legt Papiere auf den Thron. „Beweise. Der Hauptmann trifft Agenten aus Vharan — seit Monaten. Was befehlt Ihr?"',
    left: { label: 'Beweise verbrennen', fx: { army: 6, faith: -6 }, set: ['aldric_geschont'] },
    right: { label: 'Ihn konfrontieren', fx: {}, follow: [['aldric_konfront', 1, 2]] } },
  { id: 'aldric_konfront', emoji: '💂', who: 'Hauptmann Aldric', chainOnly: true, once: true,
    text: '„Ihr wisst es also." Aldric legt sein Schwert vor dir ab. „Ich wollte einen Krieg verhindern, den wir nicht gewinnen können. Richtet über mich."',
    left: { label: 'Verbannung!', fx: { army: -12, faith: 6 }, set: ['aldric_weg'], follow: [['sella_garde', 2, 4]] },
    right: { label: 'Beweise deine Treue', fx: { army: 10, treasury: -6 }, set: ['aldric_loyal'], follow: [['aldric_treue', 3, 6]] } },
  { id: 'aldric_treue', emoji: '💂', who: 'Hauptmann Aldric', chainOnly: true, once: true,
    text: 'Aldric kniet nieder und übergibt dir das Banner seiner Familie — dreihundert Jahre alt. „Mein Leben gehört der Krone. Diesmal wirklich."',
    left: { label: 'Das Banner ehren', fx: { army: 9, faith: 4 } },
    right: { label: 'Es verkaufen', fx: { treasury: 9, army: -5 } } },
  { id: 'sella_garde', emoji: '🗺️', who: 'Kriegsrätin Sella', chainOnly: true, once: true,
    text: 'Sella übernimmt die verwaiste Garde. „Die Männer murren wegen Aldric. Ich kann sie mit Härte führen — oder mit Sold."',
    left: { label: 'Mit Härte', fx: { army: 7, faith: -6 } },
    right: { label: 'Mit Sold', fx: { army: 8, treasury: -9 } } },

  /* Strang: Die Neonglas-Kathedrale */
  { id: 'kathedrale2', emoji: '👩‍🦳', who: 'Hohepriesterin Lyra', chainOnly: true, once: true,
    text: 'Die Neonglas-Kathedrale ist vollendet — sie summt leise im Abendlicht. Lyra fragt: „Wie feiern wir die Einweihung, Majestät?"',
    left: { label: 'In stiller Andacht', fx: { faith: 6 }, follow: [['neonwunder', 4, 7]] },
    right: { label: 'Mit großem Pomp', fx: { faith: 10, treasury: -8 }, follow: [['neonwunder', 4, 7]] } },
  { id: 'neonwunder', emoji: '✨', who: 'Das singende Glas', chainOnly: true, once: true,
    text: 'Bei Sonnenaufgang beginnt das Neonglas zu singen. Pilger strömen zu Tausenden in die Stadt — sie nennen es ein Wunder.',
    left: { label: 'Pilgerzoll erheben', fx: { treasury: 11, faith: -7 } },
    right: { label: 'Freier Zugang für alle', fx: { faith: 10, treasury: -5 } } },

  /* Strang: Voss und der Rechnungsprüfer */
  { id: 'pruefer', emoji: '🧐', who: 'Königlicher Rechnungsprüfer', chainOnly: true, once: true,
    text: '„Interessante Bücher, Majestät. Sehr … kreativ. Es wäre bedauerlich, wenn der Hohe Rat davon erführe."',
    left: { label: 'Voss opfern', fx: { faith: 8, treasury: -7 }, set: ['voss_weg'] },
    right: { label: 'Ihn bestechen', fx: { treasury: -12 }, follow: [['pruefer2', 4, 8]] } },
  { id: 'pruefer2', emoji: '🧐', who: 'Königlicher Rechnungsprüfer', chainOnly: true, once: true,
    text: 'Der Prüfer ist zurück, sein Lächeln breiter als zuvor. „Die Preise für mein Schweigen sind gestiegen. Die Zeiten, Ihr versteht."',
    left: { label: 'Zähneknirschend zahlen', fx: { treasury: -14 } },
    right: { label: 'Verhaften lassen', fx: { army: 5, faith: -8 } } },

  /* Strang: Pips Theater */
  { id: 'pip_theater', emoji: '🤡', who: 'Hofnarr Pip', chainOnly: true, once: true,
    text: '„Majestät! Das Fest war grandios — aber flüchtig. Ein Theater! Ein Haus des ewigen Gelächters! Kostet nur ein klitzekleines Vermögen."',
    left: { label: 'Keine Zeit für Träume', fx: { faith: -5 } },
    right: { label: 'Bau dein Theater', fx: { treasury: -10, faith: 8 }, follow: [['premiere', 3, 6]] } },
  { id: 'premiere', emoji: '🎭', who: 'Die Premiere', chainOnly: true, once: true,
    text: 'Pips erstes Stück verspottet — den Orden. Das Volk johlt vor Lachen, Lyra sitzt versteinert in der ersten Reihe.',
    left: { label: 'Das Stück verbieten', fx: { faith: 7, treasury: -4 } },
    right: { label: 'Lauthals mitlachen', fx: { faith: -9, hp: 6 } } },

  /* Strang: Vex und der Amok-Golem */
  { id: 'golem_amok', emoji: '🦾', who: 'Alarm im Hafenviertel', chainOnly: true, once: true,
    text: 'Ein Dampfgolem läuft Amok! Vex schreit über den Lärm: „Ein Kalibrierungsfehler! Haltet ihn auf — aber zerstört ihn nicht!"',
    left: { label: 'Die Garde opfert sich', fx: { army: -10, faith: 4 }, follow: [['vex_reue', 2, 4]] },
    right: { label: 'Selbst eingreifen', fx: { hp: -14, army: 8 }, follow: [['vex_reue', 2, 4]] } },
  { id: 'vex_reue', emoji: '⚙️', who: 'Erfinderin Vex', chainOnly: true, once: true,
    text: 'Vex steht vor dir, ölverschmiert und kleinlaut. „Ich kann sie sicherer machen. Oder wir schmelzen alles ein. Eure Entscheidung."',
    left: { label: 'Alles einschmelzen', fx: { army: -8, treasury: 7 } },
    right: { label: 'Weiterforschen', fx: { army: 10, treasury: -8 } } },

  /* Strang: Der Konflikt mit Vharan */
  { id: 'scharmuetzel', emoji: '🏴', who: 'Bote von der Grenze', chainOnly: true, once: true,
    text: 'Vharans Reiter brennen Grenzdörfer nieder. Die Bauern fliehen in die Städte, die Garde erwartet deine Befehle.',
    left: { label: 'Truppen entsenden', fx: { army: -8, treasury: -6 }, follow: [['vharan_sieg', 4, 7]] },
    right: { label: 'Diplomaten schicken', fx: { treasury: -10, faith: 4 } } },
  { id: 'vharan_sieg', emoji: '🎺', who: 'Bote von der Grenze', chainOnly: true, once: true,
    text: 'Sieg! Deine Garde hat Vharans Reiter über den Fluss getrieben. In den Grenzdörfern rufen sie deinen Namen.',
    left: { label: 'Die Garde belohnen', fx: { army: 11, treasury: -7 } },
    right: { label: 'Frieden anbieten', fx: { faith: 8, army: 4 } } },
  { id: 'vharan_mehr', emoji: '🤵', who: 'Gesandter von Vharan', chainOnly: true, once: true,
    text: '„Mein Fürst dankt für den Tribut — und verdoppelt seine Forderung. Gehorsam macht Appetit, Majestät."',
    left: { label: 'Jetzt reicht es!', fx: { army: 4, faith: 4 }, set: ['vharan_zorn'], follow: [['scharmuetzel', 2, 4]] },
    right: { label: 'Erneut zahlen', fx: { treasury: -14, army: -4 } } },

  /* Strang: Ansgars Bewegung */
  { id: 'sekte', emoji: '🕯️', who: 'Ansgars Anhänger', chainOnly: true, once: true,
    text: 'Ansgars Anhänger tragen jetzt Roben und singen vor den Toren. Aus dem Prediger ist eine Bewegung geworden.',
    left: { label: 'Die Bewegung verbieten', fx: { faith: -9, army: 5 } },
    right: { label: 'In den Orden eingliedern', fx: { faith: 12, treasury: -5 } } },
  { id: 'maertyrer', emoji: '⛓️', who: 'Stimmen aus dem Volk', chainOnly: true, once: true,
    text: 'Im Kerker schweigt Ansgar — und wird dadurch nur lauter. Auf den Märkten nennt man ihn bereits einen Märtyrer.',
    left: { label: 'Freilassen', fx: { faith: 7, army: -6 } },
    right: { label: 'Im Kerker lassen', fx: { faith: -9, army: 6 } } },

  /* Strang: Marlas Dörfer */
  { id: 'erntedank', emoji: '🍞', who: 'Bäuerin Marla', chainOnly: true, once: true,
    text: 'Marla bringt den ersten Laib der neuen Ernte — noch warm. Drei Dörfer haben deinen Namen in die Felder gepflügt.',
    left: { label: 'Bescheiden danken', fx: { faith: 8 } },
    right: { label: 'Ein Erntefest stiften', fx: { faith: 10, treasury: -6 } } },
  { id: 'landflucht', emoji: '🏚️', who: 'Verlassene Dörfer', chainOnly: true, once: true,
    text: 'Die Dörfer, denen du das Korn verweigert hast, stehen leer. Die Felder liegen brach, die Steuern bleiben aus.',
    left: { label: 'Neue Siedler anwerben', fx: { treasury: -9, faith: 4 } },
    right: { label: 'Land der Krone einverleiben', fx: { treasury: 6, faith: -8 } } },

  /* Strang: Ilvas Expedition */
  { id: 'ilva2', emoji: '🗺️', who: 'Kartografin Ilva', chainOnly: true, once: true,
    text: 'Ilva kehrt zurück — mit Karten, Erzproben und Geschichten von Höhlen, die im Dunkeln singen.',
    left: { label: 'Das Erz schürfen', fx: { treasury: 12, faith: -5 } },
    right: { label: 'Die Täler schonen', fx: { faith: 8 } } },

  /* ---- Eskalationskarten (erscheinen nur bei gefährlichen Werten) ---- */
  { id: 'edge_armee_hoch', emoji: '⚔️', who: 'Generalin Kessra', w: 3, cond: (s) => s.res.army >= 75,
    text: 'Kessra breitet Karten auf dem Thron aus. „Die Armee ist stark wie nie. Gebt den Befehl, und ich schenke Euch Vharan bis zum Winter."',
    left: { label: 'Es gibt keinen Krieg', fx: { army: -10, faith: 5 } },
    right: { label: 'Zieht ins Feld!', fx: { army: 9, treasury: -11 } } },
  { id: 'edge_armee_tief', emoji: '🏃', who: 'Hauptmann der Nachtwache', w: 3, cond: (s) => s.res.army <= 25,
    text: 'Heute Nacht sind wieder zwölf Mann desertiert. Die Kasernen leeren sich — und die Straßen werden unsicher.',
    left: { label: 'Deserteure jagen', fx: { army: 8, faith: -7 } },
    right: { label: 'Laufen lassen', fx: { army: -7, treasury: 4 } } },
  { id: 'edge_orden_hoch', emoji: '⛪', who: 'Hohepriesterin Lyra', w: 3, cond: (s) => s.res.faith >= 75,
    text: '„Der Orden trägt dieses Reich, Majestät. Es ist Zeit, dass er auch mitregiert: ein Sitz im Thronrat. Als Zeichen des Vertrauens."',
    left: { label: 'Der Thron bleibt weltlich', fx: { faith: -10, army: 5 } },
    right: { label: 'Gewährt', fx: { faith: 9, treasury: -6 } } },
  { id: 'edge_orden_tief', emoji: '🔥', who: 'Flüsternde Gassen', w: 3, cond: (s) => s.res.faith <= 25,
    text: 'In den Tavernen erzählt man sich, die Krone habe die Götter verhöhnt — und die Götter würden bald zurückschlagen.',
    left: { label: 'Öffentliche Buße', fx: { faith: 9, treasury: -7 } },
    right: { label: 'Gerüchte verbieten', fx: { faith: -6, army: 5 } } },
  { id: 'edge_schatz_hoch', emoji: '🗝️', who: 'Gilde der Schattenhand', w: 3, cond: (s) => s.res.treasury >= 75,
    text: 'Ein Brief ohne Absender: „Eure Schatzkammer ist beeindruckend. Wir hätten sie gerne. Man kann sich einigen — oder auch nicht."',
    left: { label: 'Wachen verdoppeln', fx: { treasury: -8, army: 6 } },
    right: { label: 'Ignorieren', fx: { treasury: -12, hp: -4 } } },
  { id: 'edge_schatz_tief', emoji: '🪙', who: 'Söldnerführer Dregg', w: 3, cond: (s) => s.res.treasury <= 25,
    text: '„Sold, Majestät. Meine Klingen kämpfen für Gold, nicht für Ehre. Heute noch — oder wir suchen uns einen zahlungskräftigeren Thron."',
    left: { label: 'Vertrösten', fx: { army: -9, faith: -4 } },
    right: { label: 'Kronjuwelen verpfänden', fx: { treasury: 10, faith: -7 } } },
  { id: 'edge_hp_tief', emoji: '🩺', who: 'Stadtmedicus Halm', w: 3, cond: (s) => s.res.hp <= 30,
    text: 'Halm misst deinen Puls und runzelt die Stirn. „Majestät, Euer Körper ist ein belagertes Schloss. Ruhe — oder Ihr regiert bald vom Grab aus."',
    left: { label: 'Durchregieren', fx: { hp: -6, army: 4 } },
    right: { label: 'Eine Woche Kur', fx: { hp: 15, treasury: -8, army: -4 } } },

  /* ---- Weitere Charaktere & Alltag am Hof ---- */
  { id: 'kessra', emoji: '⚔️', who: 'Generalin Kessra', text: '„Die Truppen rosten ein, Majestät. Ein großes Manöver würde sie schärfen — und den Nachbarn zeigen, dass wir wach sind."',
    left: { label: 'Zu teuer', fx: { army: -6, treasury: 4 } }, right: { label: 'Abhalten lassen', fx: { army: 8, treasury: -7 } } },
  { id: 'ilva', emoji: '🗺️', who: 'Kartografin Ilva', text: '„Hinter den Grenzbergen liegen unkartierte Täler. Finanziert meine Expedition — was ich finde, gehört der Krone."',
    left: { label: 'Träumerei', fx: { faith: -4, treasury: 3 } }, right: { label: 'Finanzieren', fx: { treasury: -9, faith: 6 }, follow: [['ilva2', 5, 9]] } },
  { id: 'brauer', emoji: '🍺', who: 'Braumeister Humbold', text: '„Gebt mir das Bier-Monopol der Hauptstadt, und die Krone trinkt mit — fünf Prozent an jedem Fass."',
    left: { label: 'Freier Markt', fx: { faith: 5, treasury: -4 } }, right: { label: 'Monopol gewähren', fx: { treasury: 9, faith: -6 } } },
  { id: 'nachtwache', emoji: '🌃', who: 'Die Nachtwache', text: 'Die Wachen schwören, auf der Stadtmauer gehe nachts ein Schemen um — er trage eine Krone und weine.',
    left: { label: 'Unsinn — Doppelschichten!', fx: { army: 5, faith: -5 } }, right: { label: 'Einen Priester schicken', fx: { faith: 6, treasury: -4 } } },
  { id: 'astronom', emoji: '🔭', who: 'Astronom Fedik', text: '„Die Sternendeuterin ist eine Scharlatanin! Gebt mir ihr Observatorium, und ich gebe Euch echte Wissenschaft."',
    left: { label: 'Ora vertrauen', fx: { faith: 6, treasury: -3 } }, right: { label: 'Fedik übernimmt', fx: { faith: -7, treasury: 6 } } },
  { id: 'waise', emoji: '🧒', who: 'Ein Kind am Tor', text: 'Ein Waisenkind hat sich an allen Wachen vorbei bis vor den Thron geschlichen. Es will nur eines: einmal die Krone berühren.',
    left: { label: 'Wache!', fx: { faith: -6, army: 3 } }, right: { label: 'Es gewähren', fx: { faith: 7, hp: 4 } } },
  { id: 'arena', emoji: '🏟️', who: 'Gladiatorenmeister Rukk', text: '„Eine Arena, Majestät! Brot und Spiele! Das Volk vergisst jede Steuer, wenn Blut auf Sand tropft."',
    left: { label: 'Barbarei!', fx: { faith: 6, army: -4 } }, right: { label: 'Bauen lassen', fx: { army: 7, faith: -8, treasury: -5 } } },
  { id: 'fischersfrau', emoji: '🎣', who: 'Fischersfrau Edda', text: '„Im Nebel vorm Kap — ein Schatten, groß wie drei Schiffe. Die Fischer weigern sich auszulaufen, und die Stadt braucht Fisch."',
    left: { label: 'Fanggründe verlegen', fx: { treasury: -6, faith: 4 } }, right: { label: 'Die Garde aufs Meer!', fx: { army: -7, treasury: 7 } } },
  { id: 'mutter2', emoji: '👵', who: 'Die alte Königin', cond: (s) => s.day >= 10,
    text: 'Deine Mutter betrachtet dein müdes Gesicht. „Du regierst wie dein Vater — zu viel Kopf, zu wenig Schlaf. Das Reich braucht dich lebendig."',
    left: { label: 'Die Arbeit wartet', fx: { hp: -4, treasury: 4 } }, right: { label: 'Einen Tag ruhen', fx: { hp: 8, army: -3 } } },
  { id: 'diebin', emoji: '🦝', who: 'Gefasste Diebin', text: 'Die Wachen bringen eine Diebin vor den Thron — sie stahl Brot für ihre Geschwister. Das Gesetz verlangt die Hand, das Volk schaut zu.',
    left: { label: 'Das Gesetz ist das Gesetz', fx: { army: 5, faith: -8 } }, right: { label: 'Begnadigen', fx: { faith: 8, army: -5 } } },
  { id: 'giftprobe', emoji: '🍷', who: 'Mundschenk Talin', text: 'Talin zögert beim Vorkosten des Weins — eine Sekunde zu lang. Dann trinkt er. Nichts passiert. Diesmal.',
    left: { label: 'Alle Küchen durchsuchen', fx: { army: 4, treasury: -6 } }, right: { label: 'Talin belohnen', fx: { treasury: -4, faith: 5, hp: 3 } } },

  /* Portale — Übergang in den Dungeon-Modus */
  { id: 'portal_katakomben', emoji: '🌀', who: 'Riss im Fundament', portal: 'katakomben', w: 4,
    cond: (s) => !s.cleared.katakomben && s.day >= 3,
    text: 'Ein Riss klafft in der Kellermauer der Burg. Dahinter: Stufen, Moderluft, Knochenstaub — die Katakomben der Vergessenen. Etwas dort unten klopft im Takt deines Herzschlags.',
    left: { label: 'Zumauern lassen', fx: { army: -5, faith: -3 } }, right: { label: 'Hinabsteigen', enter: 'katakomben' } },
  { id: 'portal_giesserei', emoji: '🌀', who: 'Lärm aus der Tiefe', portal: 'giesserei', w: 4,
    cond: (s) => s.cleared.katakomben && !s.cleared.giesserei,
    text: 'Seit dem Fall des Skelettkönigs stampfen in der stillgelegten Rostgießerei wieder die Maschinen. Niemand hat sie angeworfen. Niemand Lebendiges.',
    left: { label: 'Tore verketten', fx: { army: -6, treasury: -3 } }, right: { label: 'Die Gießerei betreten', enter: 'giesserei' } },
  { id: 'portal_neonhort', emoji: '🌀', who: 'Der flackernde Himmel', portal: 'neonhort', w: 4,
    cond: (s) => s.cleared.giesserei && !s.cleared.neonhort,
    text: 'Über dem alten Bergwerk flackert der Nachthimmel in unmöglichen Farben. Die Sternendeuterin flüstert nur ein Wort: „Chromdrache." Der Neon-Hort ruft.',
    left: { label: 'Das Tal räumen lassen', fx: { faith: -7, treasury: -4 } }, right: { label: 'Dem Ruf folgen', enter: 'neonhort' } },
];

/* ============================================================
   CONTENT — Todesarten
   ============================================================ */
const DEATHS = {
  army_low:      { skull: '🏴', title: 'Überrannt', r: 'Ohne Schwerter stand dein Reich nackt da. Plünderer nahmen die Städte, und niemand hob auch nur eine Mistgabel für dich.' },
  army_high:     { skull: '⚔️', title: 'Militärputsch', r: 'Die Generäle brauchten keinen König mehr — sie hatten ja die Armee. Man fand deine Krone auf einer Lanzenspitze.' },
  faith_low:     { skull: '🔥', title: 'Als Ketzer verbrannt', r: 'Der Orden erklärte dich zum Gottlosen. Das Volk trug Fackeln zur Burg — und diesmal nicht, um den Weg zu leuchten.' },
  faith_high:    { skull: '⛪', title: 'Geopfert', r: 'Zu mächtig wurde der Orden — sie krönten einen Gott, nicht dich. Für das größte aller Rituale brauchte es nur noch eines: königliches Blut.' },
  treasury_low:  { skull: '🕳️', title: 'Bankrott', r: 'Leere Kassen, leere Treue. Deine eigene Garde verkaufte die Burgtore — von innen geöffnet, versteht sich.' },
  treasury_high: { skull: '🪙', title: 'Im Gold ertrunken', r: 'Dein Schatz weckte Gier in jedem Herzen. Der Wein des Schatzmeisters schmeckte an jenem Abend seltsam bitter.' },
  hp_story:      { skull: '🥀', title: 'Entkräftet', r: 'Die Bürde der Krone zehrte dich auf. Eines Morgens blieb der Thron einfach leer.' },
  hp_combat:     { skull: '💀', title: 'Erschlagen', r: '' },
  darkness:      { skull: '🌑', title: 'Von der Dunkelheit verschlungen', r: 'Die letzte Fackel verlosch. Was dann kam, hatte keine Augen — es brauchte keine.' },
};

/* ============================================================
   UTILS
   ============================================================ */
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rndInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
/** Pacing-Pause; in versteckten Tabs sofort, damit gedrosselte Timer keine Runde aufhängen. */
const wait = (ms) => document.hidden ? Promise.resolve() : new Promise(res => setTimeout(res, ms));

function pickWeighted(map) {
  const entries = Object.entries(map).filter(([, w]) => w > 0);
  let sum = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * sum;
  for (const [key, w] of entries) { roll -= w; if (roll <= 0) return key; }
  return entries[entries.length - 1][0];
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ============================================================
   STATE
   ============================================================ */
let state = null;
let inputLocked = false;

function initState() {
  state = {
    mode: 'STORY',
    day: 1,
    res: { ...CONFIG.resStart },
    player: {
      gold: 30,
      weapon: WEAPONS[0],
      armor: ARMORS[0],
      trinket: null,
      potions: [POTIONS[0], null, null],
      inventory: [],   // nicht angelegte Ausrüstung: {cat, def}, max CONFIG.inventorySize
    },
    cleared: {},
    flags: {},           // gesetzte Story-Flags (Dialogpfad-Freischaltungen)
    pending: [],         // eingeplante Folgekarten: {id, day}
    seen: {},            // bereits gespielte once-Karten
    lastStoryId: null,
    chronicle: [],
    dungeon: null,
    combat: null,
    reward: null,
    stats: { slain: 0, goldEarned: 0, dungeons: 0 },
    currentCard: null,
  };
}

/* ============================================================
   DOM-REFERENZEN
   ============================================================ */
const el = {};
function bindDom() {
  ['game', 'swipe-card', 'card-emoji', 'card-title', 'card-doors', 'door-left', 'door-right',
    'ov-left', 'ov-right', 'ov-up', 'ov-down', 'situation-text', 'card-caption', 'pips-row', 'toast',
    'gold-val', 'equip-list', 'inv-list', 'potion-list', 'stats-box', 'player-statuses', 'player-status-wrap',
    'panel-story', 'panel-dungeon', 'panel-combat', 'day-val', 'chronicle', 'dungeon-status',
    'dungeon-name', 'depth-val', 'depth-fill', 'torch-val', 'runbuff-list', 'retreat-btn',
    'intent-main', 'intent-desc', 'enemy-portrait', 'enemy-name', 'enemy-tag', 'enemy-hp-fill',
    'enemy-hp-ghost', 'enemy-hp-text', 'enemy-chips', 'combat-log', 'hint-bar',
    'overlay-gameover', 'go-skull', 'go-title', 'go-reason', 'go-stats', 'restart-btn', 'fx-layer']
    .forEach(id => { el[id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = $(id); });
}

/* ============================================================
   FX — Floating Numbers, Shake, Toast
   ============================================================ */
function floatNum(targetEl, text, cls = 'dmg') {
  if (!targetEl) return;
  const r = targetEl.getBoundingClientRect();
  const n = document.createElement('div');
  n.className = `float-num ${cls}`;
  n.textContent = text;
  n.style.left = `${r.left + r.width / 2 + rndInt(-14, 14)}px`;
  n.style.top = `${r.top + r.height / 2}px`;
  el.fxLayer.appendChild(n);
  n.addEventListener('animationend', () => n.remove());
}
function shake(hard = false) {
  const cls = hard ? 'shake-hard' : 'shake';
  el.game.classList.remove('shake', 'shake-hard');
  void el.game.offsetWidth;
  el.game.classList.add(cls);
  setTimeout(() => el.game.classList.remove(cls), 480);
}
function playerHitFx() {
  el.game.classList.remove('player-hit');
  void el.game.offsetWidth;
  el.game.classList.add('player-hit');
  setTimeout(() => el.game.classList.remove('player-hit'), 480);
}
let toastTimer = null;
function toast(msg, ms = 2100) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), ms);
}

/* ============================================================
   RENDERING
   ============================================================ */
const RES_KEYS = ['army', 'faith', 'treasury', 'hp'];

function renderResources() {
  for (const k of RES_KEYS) {
    const v = Math.round(state.res[k]);
    $(`val-${k}`).textContent = `${v}%`;
    $(`fill-${k}`).style.width = `${v}%`;
    $(`ghost-${k}`).style.width = `${v}%`;
    const box = $(`res-${k}`);
    const inDungeon = state.mode !== 'STORY' && state.mode !== 'GAME_OVER';
    box.classList.toggle('frozen', inDungeon && k !== 'hp');
    const warn = k === 'hp' ? v <= CONFIG.warnLow : (v <= CONFIG.warnLow || v >= CONFIG.warnHigh);
    box.classList.toggle('warn', warn && !(inDungeon && k !== 'hp'));
  }
}

function rarityCls(r) { return `rarity-${r}`; }

function calcStats() {
  const p = state.player;
  const run = state.dungeon ? state.dungeon.run : { dmg: 0, block: 0, crit: 0 };
  return {
    min: p.weapon.min + run.dmg,
    max: p.weapon.max + run.dmg,
    block: CONFIG.baseBlock + p.armor.block + run.block,
    crit: p.weapon.crit + (p.trinket && p.trinket.crit ? p.trinket.crit : 0) + run.crit,
  };
}

function renderLeft() {
  const p = state.player;
  el.goldVal.textContent = p.gold;

  const w = p.weapon, a = p.armor, t = p.trinket;
  el.equipList.innerHTML = `
    <div class="slot"><span class="slot-ico">${w.emoji}</span><div class="slot-body">
      <div class="slot-name ${rarityCls(w.rarity)}">${w.name}</div>
      <div class="slot-sub">${w.min}–${w.max} Schaden · Crit ${Math.round(w.crit * 100)} % · ✨ ${w.special.name} (${w.special.cost}⚡)</div>
    </div></div>
    <div class="slot"><span class="slot-ico">${a.emoji}</span><div class="slot-body">
      <div class="slot-name ${rarityCls(a.rarity)}">${a.name}</div>
      <div class="slot-sub">+${a.block} Block${a.thorns ? ` · 🌵 ${a.thorns} Dornen` : ''}</div>
    </div></div>
    ${t ? `<div class="slot"><span class="slot-ico">${t.emoji}</span><div class="slot-body">
      <div class="slot-name ${rarityCls(t.rarity)}">${t.name}</div>
      <div class="slot-sub">${t.desc}</div>
    </div></div>`
      : `<div class="slot empty"><span class="slot-ico">💍</span><div class="slot-body"><div class="slot-name">Kein Trinket</div></div></div>`}
  `;

  $('inv-count').textContent = `(${p.inventory.length}/${CONFIG.inventorySize})`;
  const inCombat = state.mode === 'COMBAT';
  el.invList.innerHTML = p.inventory.length
    ? p.inventory.map((it, i) => `
      <div class="inv-row">
        <span class="inv-ico">${it.def.emoji}</span>
        <span class="inv-name ${rarityCls(it.def.rarity)}" title="${gearDetail(it)}">${it.def.name}</span>
        <button class="inv-btn" data-act="equip" data-idx="${i}" ${inCombat ? 'disabled' : ''} title="${inCombat ? 'Nicht im Kampf' : 'Ausrüsten (Getauschtes wandert ins Inventar)'}">⇄</button>
        <button class="inv-btn" data-act="sell" data-idx="${i}" title="Verkaufen (+${itemValue(it)} 🪙)">🪙</button>
      </div>`).join('')
    : '<div class="inv-empty">Leer — Beute mit ▶ einstecken.</div>';

  el.potionList.innerHTML = `<div class="chip-row">${p.potions.map(pt =>
    pt ? `<span class="chip">${pt.emoji} ${pt.name}</span>` : `<span class="chip neutral">◌ leer</span>`).join('')}</div>`;

  const s = calcStats();
  el.statsBox.innerHTML =
    `⚔️ Schaden: <b>${s.min}–${s.max}</b><br>` +
    `🛡️ Block: <b>${s.block}</b><br>` +
    `🎯 Crit-Chance: <b>${Math.round(s.crit * 100)} %</b>`;

  const st = state.combat ? state.combat.pStatuses : [];
  el.playerStatusWrap.style.display = st.length ? '' : 'none';
  el.playerStatuses.innerHTML = `<div class="chip-row">${st.map(statusChip).join('')}</div>`;
}

const STATUS_META = {
  poison:   { ico: '☠️', name: 'Gift', bad: true },
  burn:     { ico: '🔥', name: 'Brennen', bad: true },
  stun:     { ico: '💫', name: 'Betäubt', bad: true },
  weak:     { ico: '🌫️', name: 'Schwäche', bad: true },
  regen:    { ico: '🌿', name: 'Regeneration', bad: false },
  strength: { ico: '💪', name: 'Stärke', bad: false },
};
function statusChip(s) {
  const m = STATUS_META[s.id];
  return `<span class="chip ${m.bad ? 'debuff' : 'buff'}" title="${m.name}">${m.ico}${s.v ? ' ' + s.v : ''} · ${s.t}⏳</span>`;
}

function renderStoryPanel() {
  el.dayVal.textContent = state.day;
  el.chronicle.innerHTML = state.chronicle.slice(-8).reverse()
    .map(c => `<div class="chron-entry"><b>Tag ${c.day}</b> — ${c.text}</div>`).join('')
    || '<div class="chron-entry">Deine Herrschaft beginnt …</div>';
  el.dungeonStatus.innerHTML = DUNGEONS.map(d => {
    const cleared = state.cleared[d.id];
    const locked = (d.id === 'giesserei' && !state.cleared.katakomben) || (d.id === 'neonhort' && !state.cleared.giesserei);
    const st = cleared ? '<span class="st done">bezwungen</span>'
      : locked ? '<span class="st locked">verschlossen</span>'
        : '<span class="st open">offen</span>';
    return `<div class="dstat">${d.emoji} ${d.name} ${st}</div>`;
  }).join('');
}

function renderDungeonPanel() {
  const d = state.dungeon;
  if (!d) return;
  el.dungeonName.textContent = `${d.def.emoji} ${d.def.name}`;
  el.depthVal.textContent = `${Math.max(1, d.level)}/${d.def.levels}`;
  el.depthFill.style.width = `${(Math.max(1, d.level) / d.def.levels) * 100}%`;
  el.torchVal.textContent = d.torches;
  el.torchVal.parentElement.classList.toggle('dark', d.torches <= 0);
  const buffs = [];
  if (d.run.dmg) buffs.push(`<span class="chip buff">⚔️ +${d.run.dmg} Schaden (Run)</span>`);
  if (d.run.block) buffs.push(`<span class="chip buff">🛡️ +${d.run.block} Block (Run)</span>`);
  if (d.run.crit) buffs.push(`<span class="chip buff">🎯 +${Math.round(d.run.crit * 100)} % Crit (Run)</span>`);
  el.runbuffList.innerHTML = buffs.length ? `<div class="chip-row">${buffs.join('')}</div>` : '';
  const noReturn = d.level >= d.def.levels - 1;
  el.retreatBtn.disabled = state.mode !== 'DUNGEON' || noReturn;
  el.retreatBtn.textContent = noReturn ? '🚪 Kein Zurück mehr' : '🏳️ Rückzug zur Burg';
}

const INTENT_TEXT = {
  attack:      (i) => [`⚔️ ${i.v}`, 'Angriff — Blocken verringert den Schaden.'],
  block:       (i) => [`🛡️ ${i.v}`, 'Der Schild ist bereits oben — Angriffe werden abgeblockt!'],
  charge:      () => ['⚡ ×2', 'Lädt auf: Der nächste Schlag trifft doppelt so hart!'],
  poison:      (i) => [`☠️ ${i.v}`, 'Giftangriff — umgeht deinen Block!'],
  heal:        (i) => [`✨ +${i.v}`, 'Heilt sich — jetzt zuschlagen!'],
  bonestorm:   (i) => [`🌪️ ${i.v}`, 'KNOCHENSTURM — blocken, sonst Schaden + Schwäche!'],
  eruption:    (i) => [`🌋 ${i.v}`, 'ERUPTION — nur Blocken halbiert den Ausbruch!'],
  chargebreath:() => ['🔆 …', 'Der Neon-Atem lädt sich auf …'],
  breath:      (i) => [`🔥 ${i.v}`, 'NEON-ATEM — ungeblockt fängst du Feuer!'],
};
function intentLine(i) {
  const [main, desc] = INTENT_TEXT[i.t](i);
  return { main, desc };
}

function renderCombatPanel() {
  const c = state.combat;
  if (!c) return;
  const en = c.enemy;
  const { main, desc } = intentLine(c.intent);
  el.intentMain.textContent = main;
  el.intentDesc.textContent = desc;
  el.enemyPortrait.textContent = en.def.emoji;
  el.enemyPortrait.classList.toggle('phase2', !!en.phase2);
  el.enemyName.textContent = en.def.name;
  el.enemyTag.textContent = c.affix ? `${c.affix.name} — ${c.affix.desc}` : (en.def.boss ? (en.phase2 ? '⚠️ PHASE 2' : 'Boss') : '');
  const pct = clamp((en.hp / en.maxHp) * 100, 0, 100);
  el.enemyHpFill.style.width = `${pct}%`;
  el.enemyHpGhost.style.width = `${pct}%`;
  el.enemyHpText.textContent = `${Math.max(0, Math.ceil(en.hp))} / ${en.maxHp} HP`;
  const chips = [];
  if (en.block > 0) chips.push(`<span class="chip buff">🛡️ ${en.block} Block</span>`);
  if (en.charged) chips.push(`<span class="chip debuff">⚡ aufgeladen</span>`);
  if (en.def.id === 'schmelzgolem') chips.push(`<span class="chip ${en.heat >= 4 ? 'debuff' : 'neutral'}">🌡️ Hitze ${en.heat}/${CONFIG.golemHeatMax}</span>`);
  chips.push(...en.statuses.map(statusChip));
  el.enemyChips.innerHTML = chips.join('');
}

function log(html) {
  const c = state.combat;
  if (!c) return;
  c.log.push(`<div class="log-line">${html}</div>`);
  if (c.log.length > 60) c.log.shift();
  el.combatLog.innerHTML = c.log.join('');
  el.combatLog.scrollTop = el.combatLog.scrollHeight;
}
function logRound(n) {
  const c = state.combat;
  c.log.push(`<div class="log-line log-round">— Runde ${n} —</div>`);
  el.combatLog.innerHTML = c.log.join('');
  el.combatLog.scrollTop = el.combatLog.scrollHeight;
}

function renderPips() {
  if (state.mode !== 'COMBAT' || !state.combat) { el.pipsRow.innerHTML = ''; return; }
  const c = state.combat;
  const cost = state.player.weapon.special.cost;
  let focus = '';
  for (let i = 0; i < CONFIG.focusMax; i++) focus += `<span class="pip ${i < c.focus ? 'on' : ''}">⚡</span>`;
  let combo = '';
  for (let i = 0; i < CONFIG.comboMax; i++) combo += `<span class="pip ${i < Math.min(c.combo, CONFIG.comboMax) ? 'combo-on' : ''}">🔥</span>`;
  el.pipsRow.innerHTML =
    `<span class="pip-group"><span class="pip-label">Fokus (${c.focus}/${cost}⚡ für ✨)</span>${focus}</span>` +
    `<span class="pip-group"><span class="pip-label">Combo</span>${combo}</span>`;
}

function renderContext() {
  const m = state.mode;
  el.game.className = el.game.className.replace(/mode-\w+/g, '').trim();
  el.game.classList.add(`mode-${m.toLowerCase()}`);
  DUNGEONS.forEach(d => el.game.classList.remove(d.theme));
  if (state.dungeon) el.game.classList.add(state.dungeon.def.theme);

  el.panelStory.hidden = m !== 'STORY';
  el.panelDungeon.hidden = !(m === 'DUNGEON' || m === 'REWARD');
  el.panelCombat.hidden = m !== 'COMBAT';

  if (m === 'STORY') renderStoryPanel();
  if (m === 'DUNGEON' || m === 'REWARD') renderDungeonPanel();
  if (m === 'COMBAT') renderCombatPanel();
  renderResources();
  renderPips();
}

function renderHint() {
  const card = state.currentCard;
  if (!card) { el.hintBar.innerHTML = ''; return; }
  const L = card.labels;
  let h = `◀ <b>${L.left}</b> · <b>${L.right}</b> ▶`;
  if (state.mode === 'COMBAT') h += ` · ▲ <b>${L.up}</b> · ▼ <b>${L.down}</b>`;
  el.hintBar.innerHTML = h + ' · ⌨️ Pfeiltasten';
}

/* ============================================================
   KARTEN-RENDERING & DEAL
   ============================================================ */
function dealCard(card) {
  state.currentCard = card;
  const c = el.swipeCard;

  c.style.transition = 'none';
  c.style.transform = 'translate(0,0)';
  c.style.opacity = '1';
  c.classList.remove('flying', 'dragging');
  void c.offsetWidth;
  c.style.transition = '';
  c.classList.add('deal-in');
  setTimeout(() => c.classList.remove('deal-in'), CONFIG.dealMs + 40);

  el.cardEmoji.textContent = card.emoji;
  el.cardTitle.textContent = card.title || '';
  el.situationText.textContent = card.text || '';
  el.cardCaption.textContent = card.caption || '';

  if (card.doors) {
    el.cardDoors.hidden = false;
    el.doorLeft.querySelector('.door-ico').textContent = card.doors.left.ico;
    el.doorLeft.querySelector('.door-label').textContent = card.doors.left.label;
    el.doorRight.querySelector('.door-ico').textContent = card.doors.right.ico;
    el.doorRight.querySelector('.door-label').textContent = card.doors.right.label;
  } else {
    el.cardDoors.hidden = true;
  }

  el.ovLeft.textContent = `◀ ${card.labels.left}`;
  el.ovRight.textContent = `${card.labels.right} ▶`;
  el.ovUp.textContent = card.labels.up ? `▲ ${card.labels.up}` : '';
  el.ovDown.textContent = card.labels.down ? `▼ ${card.labels.down}` : '';
  [el.ovLeft, el.ovRight, el.ovUp, el.ovDown].forEach(o => o.style.opacity = 0);

  renderHint();
  renderPips();
  inputLocked = false;
}

/* ============================================================
   TUTORIAL — drei Karten vor der ersten Story-Karte, jederzeit überspringbar
   ============================================================ */
const TUTORIAL_STEPS = [
  { emoji: '🎓', title: 'Kammerherr Odo',
    text: 'Willkommen auf dem Thron, Majestät. Ziehe die Karte nach links oder rechts (Maus oder Pfeiltasten) — jede Entscheidung bewegt die vier Balken oben. Und merke: Eine Reichs-Ressource tötet dich bei 0 UND bei 100.' },
  { emoji: '🌀', title: 'Kammerherr Odo',
    text: 'Bald öffnen sich Portale in die Dungeons. Dort frieren die Reichs-Ressourcen ein — nur deine ❤️ Lebenspunkte zählen. Fackeln 🔥 sind dein Licht: Ohne sie frisst die Dunkelheit deine HP. Beute bleibt dauerhaft dein.' },
  { emoji: '⚔️', title: 'Kammerherr Odo',
    text: 'Im Kampf verrät der Gegner seinen nächsten Zug — lies die Ankündigung! ◀ Blocken (perfekter Block kontert), ▶ Angreifen (Combo!), ▲ Waffen-Fähigkeit (kostet ⚡ Fokus), ▼ Trank. Kündigt er 🛡️ an, prallen Angriffe ab.' },
];

function makeTutorialCard(step) {
  const t = TUTORIAL_STEPS[step];
  const last = step === TUTORIAL_STEPS.length - 1;
  return {
    kind: 'tutorial',
    emoji: t.emoji,
    title: t.title,
    text: t.text,
    caption: `Einführung ${step + 1}/${TUTORIAL_STEPS.length}`,
    labels: { left: 'Überspringen', right: last ? 'Verstanden — los!' : 'Weiter', up: '', down: '' },
    onResolve(dir) {
      if (dir === 'right' && !last) dealCard(makeTutorialCard(step + 1));
      else dealCard(makeStoryCard(drawStoryDef('mutter')));
    },
  };
}

/* ============================================================
   STORY-SYSTEM
   ============================================================ */
const storyDefById = (id) => STORY_DECK.find(c => c.id === id);

/** Zufalls-Pool: ohne Ketten-Karten, ohne gespielte once-Karten, ohne bereits eingeplante Karten. */
function storyPool() {
  const pendingIds = new Set(state.pending.map(p => p.id));
  return STORY_DECK.filter(c =>
    !c.chainOnly &&
    c.id !== state.lastStoryId &&
    !(c.once && state.seen[c.id]) &&
    !pendingIds.has(c.id) &&
    (!c.cond || c.cond(state)));
}

function drawStoryDef(forceId = null) {
  if (forceId) return storyDefById(forceId);
  // Fällige Folgekarten haben Vorrang vor dem Zufalls-Deck
  while (state.pending.length) {
    const dueIdx = state.pending.findIndex(p => state.day >= p.day);
    if (dueIdx < 0) break;
    const [p] = state.pending.splice(dueIdx, 1);
    const def = storyDefById(p.id);
    if (def && !(def.once && state.seen[def.id])) return def;
  }
  const pool = storyPool();
  const weights = {};
  pool.forEach((c, i) => { weights[i] = c.w || 1; });
  return pool[Number(pickWeighted(weights))];
}

/** Tägliche Dynamik: Hofhaltung kostet, Extreme verstärken sich selbst (Todesspirale). */
function dailyDriftFx() {
  const fx = { treasury: -CONFIG.storyUpkeep };
  for (const k of ['army', 'faith', 'treasury']) {
    const v = state.res[k];
    let d = fx[k] || 0;
    if (v >= CONFIG.driftHigh) d += CONFIG.driftAmount;
    else if (v <= CONFIG.driftLow) d -= CONFIG.driftAmount;
    if (d) fx[k] = d; else delete fx[k];
  }
  return fx;
}

function makeStoryCard(def) {
  state.lastStoryId = def.id;
  return {
    kind: 'story',
    emoji: def.emoji,
    title: def.who,
    text: def.text,
    caption: `Tag ${state.day} deiner Herrschaft`,
    labels: { left: def.left.label, right: def.right.label, up: '', down: '' },
    preview: {
      left: Object.keys(def.left.fx || {}).filter(k => RES_KEYS.includes(k)),
      right: def.right.fx ? Object.keys(def.right.fx).filter(k => RES_KEYS.includes(k)) : [],
    },
    canSwipe(dir) {
      if (dir === 'right' && def.canRight) return def.canRight(state);
      return true;
    },
    onResolve(dir) {
      const side = dir === 'left' ? def.left : def.right;
      state.day++;
      state.chronicle.push({ day: state.day - 1, text: `${def.who}: <b>${side.label}</b>` });
      if (def.once) state.seen[def.id] = true;
      if (side.set) side.set.forEach(f => { state.flags[f] = true; });
      if (side.follow) side.follow.forEach(([fid, min, max]) =>
        state.pending.push({ id: fid, day: state.day + rndInt(min, max) }));
      if (side.enter) { enterDungeon(side.enter); return; }
      let death = applyStoryFx(side.fx || {});
      if (!death) death = applyStoryFx(dailyDriftFx());
      renderContext();
      if (death) { gameOver(death); return; }
      dealCard(makeStoryCard(drawStoryDef()));
    },
  };
}

/** Wendet Story-Effekte an; Reichs-Ressourcen töten bei 0 UND 100. */
function applyStoryFx(fx) {
  let death = null;
  for (const [k, v] of Object.entries(fx)) {
    if (k === 'gold') { state.player.gold = Math.max(0, state.player.gold + v); continue; }
    if (!RES_KEYS.includes(k)) continue;
    const raw = state.res[k] + v;
    state.res[k] = clamp(raw, 0, 100);
    if (k === 'hp') { if (raw <= 0) death = death || DEATHS.hp_story; }
    else if (raw <= 0) death = death || DEATHS[`${k}_low`];
    else if (raw >= 100) death = death || DEATHS[`${k}_high`];
  }
  renderResources();
  renderLeft();
  return death;
}

/* ============================================================
   DUNGEON-SYSTEM
   ============================================================ */
function enterDungeon(id) {
  const def = dungeonById(id);
  state.dungeon = {
    def, level: 0, torches: CONFIG.torchStart, steps: 0,
    run: { dmg: 0, block: 0, crit: 0 },
  };
  state.mode = 'DUNGEON';
  state.chronicle.push({ day: state.day, text: `Expedition in ${def.name} begonnen.` });
  renderContext();
  renderLeft();
  toast(`${def.emoji} ${def.name} — Ebenen: ${def.levels}`);
  dungeonContinue(def.intro);
}

/** Verbraucht eine Fackel (Ewige Fackel: jeder 2. Wechsel frei). Bei 0: Dunkelheits-Schaden. */
function consumeTorch() {
  const d = state.dungeon;
  d.steps++;
  const free = state.player.trinket && state.player.trinket.id === 'ewigefackel' && d.steps % 2 === 0;
  if (d.torches > 0) {
    if (!free) d.torches--;
  } else {
    state.res.hp = clamp(state.res.hp - CONFIG.darkDmg, 0, 100);
    floatNum($('res-hp'), `−${CONFIG.darkDmg}`, 'dmg');
    shake();
    toast(`🌑 Die Dunkelheit nagt an dir (−${CONFIG.darkDmg} ❤️)`);
    if (state.res.hp <= 0) { gameOver(DEATHS.darkness); return false; }
  }
  renderDungeonPanel();
  renderResources();
  return true;
}

/** Setzt die Expedition nach jedem abgeschlossenen Raum fort. */
function dungeonContinue(introText = null) {
  const d = state.dungeon;
  if (!d) return;
  state.mode = 'DUNGEON';
  renderContext();
  const next = d.level + 1;
  if (next >= d.def.levels) {
    d.level = d.def.levels;
    if (!consumeTorch()) return;
    dealCard(makeBossCard());
  } else if (next === d.def.levels - 1) {
    d.level = next;
    if (!consumeTorch()) return;
    dealCard(makeAntechamberCard());
  } else {
    dealCard(makeCrossroadCard(next, introText));
  }
}

function rollDoor() {
  return { type: pickWeighted(ROOM_WEIGHTS), hidden: Math.random() < 0.35 };
}

function makeCrossroadCard(targetLevel, introText = null) {
  const d = state.dungeon;
  let left = rollDoor(), right = rollDoor();
  if (left.type === right.type) right = rollDoor();
  const doorInfo = (door) => door.hidden
    ? { ico: '❓', label: 'Unbekannt' }
    : { ico: ROOM_META[door.type].ico, label: ROOM_META[door.type].label };
  return {
    kind: 'crossroad',
    emoji: '⛩️',
    title: `Weggabelung`,
    text: introText || 'Zwei Durchgänge liegen vor dir. Deine Fackel reicht nicht weit genug, um beide zu deuten.',
    caption: `${d.def.name} — vor Ebene ${targetLevel}`,
    doors: { left: doorInfo(left), right: doorInfo(right) },
    labels: {
      left: `Linke Tür: ${doorInfo(left).label}`,
      right: `Rechte Tür: ${doorInfo(right).label}`,
      up: '', down: '',
    },
    onResolve(dir) {
      const door = dir === 'left' ? left : right;
      d.level = targetLevel;
      if (!consumeTorch()) return;
      dealCard(makeRoomCard(door.type));
    },
  };
}

function makeEnemyInstance(defOrId, { affix = null } = {}) {
  const def = typeof defOrId === 'string' ? (ENEMIES[defOrId] || BOSSES[defOrId]) : defOrId;
  let maxHp = def.hp;
  if (affix && affix.hpMul) maxHp = Math.round(maxHp * affix.hpMul);
  return {
    def, hp: maxHp, maxHp, block: 0, charged: false, statuses: [],
    pi: 0, phase2: false, heat: 0, healCd: 0, quirkUsed: false,
  };
}

function makeRoomCard(type) {
  const d = state.dungeon;
  const meta = ROOM_META[type];
  const caption = `${d.def.name} — Ebene ${d.level}/${d.def.levels}`;

  switch (type) {
    case 'fight': case 'elite': {
      const elite = type === 'elite';
      const affix = elite ? pick(AFFIXES) : null;
      const enemyDef = ENEMIES[pick(d.def.enemies)];
      const cost = elite ? CONFIG.sneakCostElite : CONFIG.sneakCost;
      return {
        kind: 'room', emoji: enemyDef.emoji,
        title: elite ? `${affix.name}er ${enemyDef.name}` : enemyDef.name,
        text: elite
          ? `Ein ${enemyDef.name} — aber falsch, größer, zorniger. ${affix.name}: ${affix.desc}. Der Umweg wäre lang und dunkel.`
          : `Ein ${enemyDef.name} versperrt dir den Weg. Du könntest dich im Schatten vorbeistehlen — wenn das Licht reicht.`,
        caption,
        labels: { left: `Vorbeischleichen (−${cost} 🔥)`, right: 'Angreifen!', up: '', down: '' },
        onResolve(dir) {
          if (dir === 'left' && d.torches >= cost) {
            d.torches -= cost;
            renderDungeonPanel();
            toast(`🤫 Vorbeigeschlichen (−${cost} 🔥)`);
            dungeonContinue();
          } else {
            if (dir === 'left') toast('🌑 Zu dunkel zum Schleichen — er hat dich gewittert!');
            startCombat(makeEnemyInstance(enemyDef, { affix }), { elite, affix, after: dungeonContinue });
          }
        },
      };
    }
    case 'treasure': return {
      kind: 'room', emoji: '🧰', title: 'Verstaubte Truhe',
      text: 'Eine Truhe, halb im Schutt versunken. Das Schloss ist längst Rost — aber Truhen in der Tiefe haben manchmal Zähne.',
      caption,
      labels: { left: 'Stehen lassen', right: 'Öffnen', up: '', down: '' },
      onResolve(dir) {
        if (dir === 'left') { toast('Du lässt die Truhe unberührt.'); dungeonContinue(); return; }
        if (Math.random() < CONFIG.mimicChance) {
          toast('😱 Die Truhe hat Zähne — eine MIMIK!');
          startCombat(makeEnemyInstance(ENEMIES.mimic), { elite: true, after: dungeonContinue });
        } else {
          const gold = rndInt(12, 28);
          state.player.gold += gold;
          state.stats.goldEarned += gold;
          floatNum(el.swipeCard, `+${gold} 🪙`, 'heal');
          renderLeft();
          startReward([rollGearLoot('chest')], dungeonContinue, `In der Truhe: ${gold} Gold — und etwas Glänzendes.`);
        }
      },
    };
    case 'altar': return {
      kind: 'room', emoji: '🕯️', title: 'Vergessener Altar',
      text: 'Ein Altar aus schwarzem Stein. Die Inschrift verspricht Kraft für Blut — oder Licht für ein stilles Gebet.',
      caption,
      labels: { left: `Beten (+${CONFIG.altarTorches} 🔥)`, right: `${CONFIG.altarHpCost} ❤️ opfern (Segen)`, up: '', down: '' },
      canSwipe(dir) {
        if (dir === 'right' && state.res.hp <= CONFIG.altarHpCost) return 'Zu geschwächt für ein Blutopfer.';
        return true;
      },
      onResolve(dir) {
        if (dir === 'left') {
          d.torches += CONFIG.altarTorches;
          toast(`🙏 Dein Gebet wird erhört: +${CONFIG.altarTorches} 🔥`);
        } else {
          state.res.hp = clamp(state.res.hp - CONFIG.altarHpCost, 0, 100);
          floatNum($('res-hp'), `−${CONFIG.altarHpCost}`, 'dmg');
          const buff = pick(['dmg', 'block', 'crit']);
          if (buff === 'dmg') { d.run.dmg += 3; toast('🩸 Segen des Zorns: +3 Schaden für diesen Run'); }
          if (buff === 'block') { d.run.block += 3; toast('🩸 Segen des Steins: +3 Block für diesen Run'); }
          if (buff === 'crit') { d.run.crit += 0.10; toast('🩸 Segen des Auges: +10 % Crit für diesen Run'); }
        }
        renderDungeonPanel(); renderResources(); renderLeft();
        dungeonContinue();
      },
    };
    case 'merchant': {
      d.offers = makeMerchantOffers();
      return makeMerchantCard(0);
    }
    case 'campfire': return {
      kind: 'room', emoji: '⛺', title: 'Verlassenes Lager',
      text: 'Glut, die noch warm ist, und ein Wetzstein daneben. Wer auch immer hier rastete — er hatte es eilig.',
      caption,
      labels: { left: `Rasten (+${CONFIG.campfireHeal} ❤️)`, right: `Waffe schärfen (+${CONFIG.sharpenBonus} Schaden)`, up: '', down: '' },
      onResolve(dir) {
        if (dir === 'left') {
          const before = state.res.hp;
          state.res.hp = clamp(state.res.hp + CONFIG.campfireHeal, 0, 100);
          floatNum($('res-hp'), `+${Math.round(state.res.hp - before)}`, 'heal');
          toast('⛺ Du rastest am Feuer.');
        } else {
          d.run.dmg += CONFIG.sharpenBonus;
          toast(`🔪 Klinge geschärft: +${CONFIG.sharpenBonus} Schaden für diesen Run`);
        }
        renderResources(); renderLeft(); renderDungeonPanel();
        dungeonContinue();
      },
    };
    case 'trap': return {
      kind: 'room', emoji: '🕸️', title: 'Alte Fallgrube',
      text: 'Der Boden vor dir ist eingebrochen — rostige Spitzen glitzern unten. Ein schmaler Sims führt außen herum, aber er kostet Zeit und Licht.',
      caption,
      labels: { left: 'Vorsichtig umgehen (−1 🔥)', right: 'Riskant hinüberspringen', up: '', down: '' },
      onResolve(dir) {
        if (dir === 'left') {
          if (!consumeTorch()) return;
          toast('🐾 Sicher umgangen — eine Fackel weniger.');
          dungeonContinue();
        } else if (Math.random() < CONFIG.trapFailChance) {
          state.res.hp = clamp(state.res.hp - CONFIG.trapDmg, 0, 100);
          floatNum($('res-hp'), `−${CONFIG.trapDmg}`, 'dmg');
          shake(true); playerHitFx();
          toast(`🩸 Abgerutscht! −${CONFIG.trapDmg} ❤️`);
          renderResources();
          if (state.res.hp <= 0) { gameOver(DEATHS.hp_story); return; }
          dungeonContinue();
        } else {
          toast('🤸 Sauber gelandet!');
          dungeonContinue();
        }
      },
    };
    case 'event': {
      const ev = pick(d.def.events);
      return {
        kind: 'room', emoji: ev.emoji, title: ev.title, text: ev.text, caption,
        labels: { left: ev.left.label, right: ev.right.label, up: '', down: '' },
        onResolve(dir) {
          const fx = (dir === 'left' ? ev.left : ev.right).fx;
          if (fx.hp) {
            const before = state.res.hp;
            state.res.hp = clamp(state.res.hp + fx.hp, 0, 100);
            floatNum($('res-hp'), `${fx.hp > 0 ? '+' : ''}${Math.round(state.res.hp - before)}`, fx.hp > 0 ? 'heal' : 'dmg');
          }
          if (fx.gold) { state.player.gold += fx.gold; state.stats.goldEarned += Math.max(0, fx.gold); }
          if (fx.torch) d.torches += fx.torch;
          renderResources(); renderLeft(); renderDungeonPanel();
          dungeonContinue();
        },
      };
    }
  }
}

function makeMerchantOffers() {
  const offers = [];
  for (let i = 0; i < 3; i++) {
    const roll = pickWeighted({ potion: 40, gear: 40, torch: 20 });
    if (roll === 'potion') {
      const p = pick(POTIONS);
      offers.push({ type: 'potion', item: p, price: Math.round(CONFIG.potionValue * CONFIG.merchantMul) });
    } else if (roll === 'torch') {
      offers.push({ type: 'torch', n: 4, price: Math.round(CONFIG.torchValue * 2) });
    } else {
      const g = rollGearLoot('merchant');
      offers.push({ type: 'gear', item: g, price: Math.round(CONFIG.rarityValue[g.def.rarity] * CONFIG.merchantMul) });
    }
  }
  return offers;
}

function makeMerchantCard(idx) {
  const d = state.dungeon;
  const o = d.offers[idx];
  const name = o.type === 'torch' ? `Fackelbündel (+${o.n} 🔥)` : o.item.name;
  const emoji = o.type === 'torch' ? '🔥' : (o.type === 'gear' ? o.item.def.emoji : o.item.emoji);
  const detail = o.type === 'gear' ? gearDetail(o.item) : (o.type === 'potion' ? o.item.desc : 'Licht für die Tiefe');
  return {
    kind: 'room', emoji: '🧙', title: `Angebot ${idx + 1}/3: ${name}`,
    text: `Ein vermummter Händler breitet seine Waren aus. „${name} — ${detail}. Für dich: ${o.price} Gold."`,
    caption: `${d.def.name} — Ebene ${d.level}/${d.def.levels} · 🪙 ${state.player.gold} Gold`,
    labels: { left: 'Weitergehen', right: `Kaufen (−${o.price} 🪙)`, up: '', down: '' },
    canSwipe(dir) {
      if (dir !== 'right') return true;
      if (state.player.gold < o.price) return 'Zu wenig Gold.';
      if (o.type === 'potion' && !state.player.potions.includes(null)) return 'Beutel voll.';
      if (o.type === 'gear' && state.player.inventory.length >= CONFIG.inventorySize) return 'Inventar voll.';
      return true;
    },
    onResolve(dir) {
      if (dir === 'right') {
        state.player.gold -= o.price;
        if (o.type === 'torch') { d.torches += o.n; toast(`🔥 +${o.n} Fackeln`); }
        else if (o.type === 'potion') { takePotion(o.item); toast(`🧪 ${o.item.name} eingesteckt`); }
        else { takeToInventory(o.item); toast(`🎒 ${o.item.def.name} im Inventar`); }
        renderLeft(); renderDungeonPanel();
      }
      if (idx < 2) dealCard(makeMerchantCard(idx + 1));
      else { toast('🧙 „Gute Geschäfte, Regent."'); dungeonContinue(); }
    },
  };
}

function makeAntechamberCard() {
  const d = state.dungeon;
  const boss = BOSSES[d.def.boss];
  return {
    kind: 'room', emoji: '🚪', title: 'Die Vorkammer',
    text: `Hinter dem Tor wummert etwas Gewaltiges: ${boss.name} wartet. Dies ist der letzte Ort zum Atemholen — dahinter gibt es kein Zurück.`,
    caption: `${d.def.name} — Ebene ${d.level}/${d.def.levels} · Point of no Return`,
    labels: { left: `Rasten (+${CONFIG.antechamberHeal} ❤️)`, right: 'Klinge wetzen (+2 Schaden)', up: '', down: '' },
    onResolve(dir) {
      if (dir === 'left') {
        const before = state.res.hp;
        state.res.hp = clamp(state.res.hp + CONFIG.antechamberHeal, 0, 100);
        floatNum($('res-hp'), `+${Math.round(state.res.hp - before)}`, 'heal');
        toast('😮‍💨 Ein letzter ruhiger Atemzug.');
      } else {
        d.run.dmg += 2;
        toast('⚔️ +2 Schaden für diesen Run');
      }
      renderResources(); renderLeft(); renderDungeonPanel();
      dungeonContinue();
    },
  };
}

function makeBossCard() {
  const d = state.dungeon;
  const boss = BOSSES[d.def.boss];
  return {
    kind: 'room', emoji: boss.emoji, title: boss.name,
    text: `Das Tor birst. ${boss.name} erhebt sich vor dir — Herr über ${d.def.name}. Es gibt nur einen Weg zurück ans Tageslicht: durch ihn hindurch.`,
    caption: `${d.def.name} — Ebene ${d.def.levels}/${d.def.levels} · BOSS`,
    labels: { left: 'Angriff!', right: 'Angriff!', up: '', down: '' },
    onResolve() {
      startCombat(makeEnemyInstance(boss), { boss: true, after: dungeonVictory });
    },
  };
}

function retreat() {
  const d = state.dungeon;
  if (!d || state.mode !== 'DUNGEON' || inputLocked) return;
  if (d.level >= d.def.levels - 1) return;
  state.chronicle.push({ day: state.day, text: `Rückzug zur Burg — ${d.def.name} wartet weiter.` });
  state.dungeon = null;
  state.combat = null;
  state.mode = 'STORY';
  renderContext(); renderLeft();
  toast('🏳️ Du kehrst zur Burg zurück. Die Beute bleibt dein.');
  dealCard(makeStoryCard(drawStoryDef()));
}

function dungeonVictory() {
  const d = state.dungeon;
  const name = d.def.name;
  state.cleared[d.def.id] = true;
  state.stats.dungeons++;
  state.chronicle.push({ day: state.day, text: `<b>${BOSSES[d.def.boss].name} bezwungen!</b> ${name} ist befreit.` });
  // Triumph-Bonus, bewusst bei 90 gekappt — ein Sieg soll nie den 100er-Tod auslösen
  for (const k of ['army', 'faith', 'treasury']) {
    if (state.res[k] < CONFIG.bossReturnCap) {
      state.res[k] = Math.min(CONFIG.bossReturnCap, state.res[k] + CONFIG.bossReturnRes);
    }
  }
  state.res.hp = clamp(state.res.hp + CONFIG.bossReturnHeal, 0, 100);
  state.dungeon = null;
  state.mode = 'STORY';
  renderContext(); renderLeft();
  toast(`🏆 ${name} bezwungen! Das Reich jubelt.`, 3200);
  dealCard(makeStoryCard(drawStoryDef()));
}

/* ============================================================
   KAMPF-SYSTEM
   ============================================================ */
function startCombat(enemy, { elite = false, boss = false, affix = null, after = null } = {}) {
  const p = state.player;
  state.combat = {
    enemy, elite, boss, affix,
    after: after || dungeonContinue,
    round: 1,
    focus: (p.trinket && p.trinket.id === 'fokuskristall') ? 2 : 0,
    combo: 0,
    pStatuses: [],
    playerBlocked: false, playerBlockVal: 0,
    intent: null,
    log: [],
  };
  state.mode = 'COMBAT';
  announceIntent();
  renderContext(); renderLeft();
  log(`⚔️ <span class="info">${enemy.def.name}</span> stellt sich dir entgegen${affix ? ` (<span class="crit">${affix.name}</span>)` : ''}!`);
  shake();
  dealCard(makeCombatCard());
}

function makeCombatCard() {
  const c = state.combat;
  const en = c.enemy;
  const s = calcStats();
  const w = state.player.weapon;
  const pot = state.player.potions.find(Boolean);
  const { main } = intentLine(c.intent);
  return {
    kind: 'combat',
    emoji: en.def.emoji,
    title: `Runde ${c.round}`,
    text: `${en.def.name} kündigt an: ${main}. Was tust du?`,
    caption: `${en.def.name}${c.affix ? ` · ${c.affix.name}` : ''}${en.phase2 ? ' · PHASE 2' : ''}`,
    labels: {
      left: `Blocken (${s.block}🛡️)`,
      right: `Angreifen (${s.min}–${s.max})`,
      up: `${w.special.name} (${w.special.cost}⚡)`,
      down: pot ? `${pot.emoji} ${pot.name}` : 'Beutel leer',
    },
    canSwipe(dir) {
      if (dir === 'up' && c.focus < w.special.cost) return `Nicht genug Fokus (${c.focus}/${w.special.cost} ⚡).`;
      if (dir === 'down' && !pot) return 'Dein Beutel ist leer.';
      return true;
    },
    onResolve(dir) { return combatAction(dir); },
  };
}

const hasStatus = (list, id) => list.some(s => s.id === id);
function addStatus(list, id, v, t) {
  const ex = list.find(s => s.id === id);
  if (ex) { ex.v = (ex.v || 0) + (v || 0); ex.t = Math.max(ex.t, t); }
  else list.push({ id, v, t });
}
function removeStatus(list, id) {
  const i = list.findIndex(s => s.id === id);
  if (i >= 0) list.splice(i, 1);
}

function comboMult() {
  return 1 + CONFIG.comboStep * Math.min(state.combat.combo, CONFIG.comboMax);
}
function gainFocus(n) {
  state.combat.focus = clamp(state.combat.focus + n, 0, CONFIG.focusMax);
}

/** Spielerschlag inkl. Combo, Stärke/Schwäche, Crit und Gegner-Block. */
function playerStrike(mult, { ignoreBlock = false, forceCrit = false } = {}) {
  const c = state.combat, en = c.enemy, s = calcStats();
  let dmg = rndInt(s.min, s.max) * mult * comboMult();
  if (hasStatus(c.pStatuses, 'strength')) dmg *= 1.5;
  if (hasStatus(c.pStatuses, 'weak')) dmg *= 0.7;
  const crit = forceCrit || Math.random() < s.crit;
  if (crit) dmg *= CONFIG.critMult;
  dmg = Math.max(1, Math.round(dmg));
  let absorbed = 0;
  if (!ignoreBlock && en.block > 0) {
    absorbed = Math.min(en.block, dmg);
    en.block -= absorbed;
    dmg -= absorbed;
  }
  en.hp = Math.max(0, en.hp - dmg);
  el.enemyPortrait.classList.remove('hit'); void el.enemyPortrait.offsetWidth;
  el.enemyPortrait.classList.add('hit');
  floatNum(el.enemyPortrait, `−${dmg}`, crit ? 'crit' : 'dmg');
  log(`Du triffst für <span class="${crit ? 'crit' : 'dmg'}">${dmg}${crit ? ' ⚡KRITISCH' : ''}</span>${absorbed ? ` <span class="info">(${absorbed} geblockt)</span>` : ''}${c.combo > 0 ? ` <span class="info">[Combo ×${comboMult().toFixed(2)}]</span>` : ''}.`);
  return { dmg, crit };
}

function healPlayer(n, label = '') {
  const before = state.res.hp;
  state.res.hp = clamp(state.res.hp + n, 0, 100);
  const healed = Math.round(state.res.hp - before);
  if (healed > 0) {
    floatNum($('res-hp'), `+${healed}`, 'heal');
    log(`<span class="heal">+${healed} ❤️</span>${label ? ' ' + label : ''}`);
  }
}

function doSpecial() {
  const c = state.combat, en = c.enemy;
  const sp = state.player.weapon.special;
  log(`✨ <span class="info">${sp.name}!</span>`);
  switch (sp.type) {
    case 'mult': playerStrike(sp.mult); break;
    case 'poison': {
      playerStrike(0.6);
      addStatus(en.statuses, 'poison', sp.v, sp.turns);
      log(`☠️ ${en.def.name} ist vergiftet (${sp.v}/Runde).`);
      break;
    }
    case 'shieldbreak': {
      if (en.block > 0) { log(`🔨 Block des Gegners (${en.block}) zerschmettert!`); en.block = 0; }
      playerStrike(sp.mult, { ignoreBlock: true });
      break;
    }
    case 'lifesteal': {
      const { dmg } = playerStrike(sp.mult);
      healPlayer(Math.round(dmg * sp.leech), '(Gesegneter Hieb)');
      break;
    }
    case 'pierce': {
      playerStrike(sp.mult, { ignoreBlock: true });
      healPlayer(sp.heal, '(Arkanblitz)');
      break;
    }
    case 'crit': playerStrike(sp.mult, { forceCrit: true }); break;
    case 'burn': {
      playerStrike(sp.mult);
      addStatus(en.statuses, 'burn', sp.v, sp.turns);
      log(`🔥 ${en.def.name} brennt (${sp.v}/Runde).`);
      break;
    }
  }
}

function usePotion() {
  const p = state.player;
  const idx = p.potions.findIndex(Boolean);
  const pot = p.potions[idx];
  p.potions[idx] = null;
  const c = state.combat, en = c.enemy;
  log(`🧪 Du nutzt <span class="info">${pot.name}</span>.`);
  switch (pot.id) {
    case 'heiltrank': healPlayer(30, '(Heiltrank)'); break;
    case 'feuerbombe': {
      const dmg = 12;
      en.hp = Math.max(0, en.hp - dmg);
      addStatus(en.statuses, 'burn', 4, 3);
      floatNum(el.enemyPortrait, `−${dmg}`, 'dmg');
      log(`💣 Feuerbombe: <span class="dmg">${dmg}</span> Schaden, ${en.def.name} brennt.`);
      break;
    }
    case 'staerketrank': addStatus(c.pStatuses, 'strength', 0, 3); log('💪 +50 % Schaden für 3 Runden.'); break;
    case 'reinigung': {
      ['poison', 'burn', 'weak', 'stun'].forEach(id => removeStatus(c.pStatuses, id));
      log('🕊️ Alle negativen Effekte entfernt.');
      break;
    }
  }
  renderLeft();
}

/** Gegner-KI: Quirks → Boss-Logik (Phase 2, Hitze) → Pattern-Rotation. */
function nextIntent(en) {
  const def = en.def;
  if (en.healCd > 0) en.healCd--;
  if (def.quirk === 'chargeLow' && !en.quirkUsed && en.hp <= en.maxHp * 0.5) { en.quirkUsed = true; return { t: 'charge' }; }
  if (def.quirk === 'healLow' && en.hp <= en.maxHp * 0.4 && en.healCd <= 0) { en.healCd = 3; return { t: 'heal', v: 10 }; }
  if (def.boss) {
    if (!en.phase2 && en.hp <= en.maxHp / 2) {
      en.phase2 = true; en.pi = 0;
      shake(true);
      log(`⚠️ <span class="crit">${def.name} tritt in PHASE 2!</span>`);
      toast(`⚠️ ${def.name} — PHASE 2!`);
    }
    if (def.id === 'schmelzgolem' && en.heat >= CONFIG.golemHeatMax) {
      en.heat = 0;
      return { t: 'eruption', v: en.phase2 ? 30 : 26 };
    }
    const pat = en.phase2 ? def.p2 : def.p1;
    return pat[en.pi++ % pat.length];
  }
  return def.pattern[en.pi++ % def.pattern.length];
}

/** Kündigt den nächsten Intent an. Ein angekündigter Schild geht SOFORT hoch
    und blockt bereits die Spieler-Angriffe derselben Runde. */
function announceIntent() {
  const c = state.combat, en = c.enemy;
  c.intent = nextIntent(en);
  en.block = c.intent.t === 'block' ? c.intent.v : 0;
}

/** Führt den ANGEKÜNDIGTEN Intent des Gegners aus. */
async function enemyTurn() {
  const c = state.combat, en = c.enemy, it = c.intent;
  if (hasStatus(en.statuses, 'stun')) {
    removeStatus(en.statuses, 'stun');
    en.block = 0; // der Schild fällt mit der verlorenen Aktion
    log(`💫 ${en.def.name} ist betäubt und setzt aus!`);
    return;
  }

  const attackLike = ['attack', 'bonestorm', 'eruption', 'breath'].includes(it.t);
  if (attackLike) {
    let dmg = it.v;
    if (c.affix && c.affix.dmgMul) dmg = Math.round(dmg * c.affix.dmgMul);
    if (en.charged) { dmg *= 2; en.charged = false; log(`⚡ Der aufgeladene Schlag entlädt sich!`); }
    if (hasStatus(en.statuses, 'weak')) dmg = Math.round(dmg * 0.7);

    let taken;
    let perfect = false;
    if (it.t === 'eruption') {
      taken = c.playerBlocked ? Math.ceil(dmg / 2) : dmg;
      log(c.playerBlocked ? `🌋 Eruption — dein Schild halbiert die Glut!` : `🌋 Eruption trifft dich mit voller Wucht!`);
    } else if (c.playerBlocked) {
      taken = Math.max(0, dmg - c.playerBlockVal);
      perfect = taken === 0;
    } else {
      taken = dmg;
    }

    if (taken > 0) {
      state.res.hp = clamp(state.res.hp - taken, 0, 100);
      c.combo = 0; // erlittener Treffer bricht die Combo
      floatNum($('res-hp'), `−${taken}`, 'dmg');
      playerHitFx();
      shake(en.def.boss);
      log(`${en.def.name} trifft dich für <span class="dmg">${taken}</span>${c.playerBlocked ? ` <span class="info">(${Math.min(c.playerBlockVal, dmg)} geblockt)</span>` : ''}.`);
    } else {
      floatNum(el.swipeCard, 'GEBLOCKT', 'block');
      log(`🛡️ Du blockst den Angriff (${dmg}) vollständig!`);
    }

    if (perfect) {
      const s = calcStats();
      const counter = Math.max(1, Math.round(((s.min + s.max) / 2) * CONFIG.perfectCounter));
      en.hp = Math.max(0, en.hp - counter);
      floatNum(el.enemyPortrait, `−${counter}`, 'block');
      log(`✨ <span class="info">Perfekter Block!</span> Konter für <span class="dmg">${counter}</span>.`);
    }
    if (it.t === 'bonestorm' && !c.playerBlocked) {
      // Blocken verhindert die Schwäche; t:3, weil der Status noch in derselben Runde tickt
      addStatus(c.pStatuses, 'weak', 0, 3);
      log(`🌫️ Der Knochensturm schwächt dich (−30 % Schaden, 2 Runden).`);
    }
    if (it.t === 'breath' && !c.playerBlocked) {
      addStatus(c.pStatuses, 'burn', 5, 3);
      log(`🔥 Der Neon-Atem setzt dich in Brand!`);
    }
    if (state.player.armor.thorns) {
      const th = state.player.armor.thorns;
      en.hp = Math.max(0, en.hp - th);
      floatNum(el.enemyPortrait, `−${th}`, 'block');
      log(`🌵 Dornen: ${en.def.name} erleidet <span class="dmg">${th}</span>.`);
    }
    if (c.affix && c.affix.leech && taken > 0) {
      const heal = Math.round(taken * c.affix.leech);
      en.hp = Math.min(en.maxHp, en.hp + heal);
      floatNum(el.enemyPortrait, `+${heal}`, 'heal');
      log(`🧛 ${en.def.name} saugt <span class="heal">${heal} HP</span>.`);
    }
  } else if (it.t === 'block') {
    // Schild ging bereits bei der Ankündigung hoch — hier hält er ihn nur weiter
    log(`🛡️ ${en.def.name} hält den Schild hoch${en.block > 0 ? ` (${en.block} Block übrig)` : ' — doch er ist zerborsten!'}.`);
  } else if (it.t === 'charge') {
    en.charged = true;
    log(`⚡ ${en.def.name} lädt einen mächtigen Schlag auf!`);
  } else if (it.t === 'poison') {
    addStatus(c.pStatuses, 'poison', it.v, 3);
    log(`☠️ ${en.def.name} vergiftet dich (${it.v}/Runde, umgeht Block).`);
    playerHitFx();
  } else if (it.t === 'heal') {
    en.hp = Math.min(en.maxHp, en.hp + it.v);
    floatNum(el.enemyPortrait, `+${it.v}`, 'heal');
    log(`✨ ${en.def.name} heilt sich um <span class="heal">${it.v}</span>.`);
  } else if (it.t === 'chargebreath') {
    log(`🔆 ${en.def.name} sammelt Neon-Energie … der Atem naht!`);
  }

  if (en.def.id === 'schmelzgolem' && it.t !== 'eruption') {
    en.heat = Math.min(CONFIG.golemHeatMax, en.heat + 1);
    log(`🌡️ Hitze steigt: ${en.heat}/${CONFIG.golemHeatMax}.`);
  }
}

/** Statuseffekte beider Seiten ticken am Rundenende. */
function tickStatuses() {
  const c = state.combat, en = c.enemy;
  const tickList = (list, who, isPlayer) => {
    for (const s of list) {
      if (s.id === 'poison' || s.id === 'burn') {
        const ico = STATUS_META[s.id].ico;
        if (isPlayer) {
          state.res.hp = clamp(state.res.hp - s.v, 0, 100);
          floatNum($('res-hp'), `−${s.v}`, 'dmg');
        } else {
          en.hp = Math.max(0, en.hp - s.v);
          floatNum(el.enemyPortrait, `−${s.v}`, 'dmg');
        }
        log(`${ico} ${who} ${isPlayer ? 'erleidest' : 'erleidet'} <span class="dmg">${s.v}</span> (${STATUS_META[s.id].name}).`);
      }
      if (s.id === 'regen') {
        if (isPlayer) healPlayer(s.v, '(Regeneration)');
        else { en.hp = Math.min(en.maxHp, en.hp + s.v); log(`🌿 ${who} regeneriert ${s.v}.`); }
      }
      s.t--;
    }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].t <= 0) list.splice(i, 1);
  };
  tickList(c.pStatuses, 'Du', true);
  tickList(en.statuses, en.def.name, false);
}

/** Zentrale Rundenauflösung: Spieler → Gegner-Intent → Ticks → neuer Intent. */
async function combatAction(dir) {
  const c = state.combat, en = c.enemy, w = state.player.weapon;
  c.playerBlocked = false;
  c.playerBlockVal = 0;
  logRound(c.round);

  if (hasStatus(c.pStatuses, 'stun')) {
    removeStatus(c.pStatuses, 'stun');
    log('💫 Du bist betäubt und verlierst deine Aktion!');
  } else if (dir === 'left') {
    c.playerBlocked = true;
    c.playerBlockVal = calcStats().block;
    c.combo = 0;
    gainFocus(1);
    floatNum(el.swipeCard, `🛡️ ${c.playerBlockVal}`, 'block');
    log(`🛡️ Du gehst in Deckung (Block ${c.playerBlockVal}).`);
  } else if (dir === 'right') {
    playerStrike(1);
    c.combo++;
    gainFocus(1);
  } else if (dir === 'up') {
    c.focus -= w.special.cost;
    doSpecial();
    c.combo++;
  } else if (dir === 'down') {
    usePotion();
    c.combo = 0;
    gainFocus(1);
  }

  renderCombatPanel(); renderLeft(); renderPips(); renderResources();
  if (en.hp <= 0) { await victory(); return; }

  await wait(CONFIG.enemyDelayMs);
  await enemyTurn();
  renderCombatPanel(); renderResources(); renderLeft();
  if (state.res.hp <= 0) { combatDeath(); return; }
  if (en.hp <= 0) { await victory(); return; }

  await wait(CONFIG.tickDelayMs);
  tickStatuses();
  renderCombatPanel(); renderResources(); renderLeft();
  if (state.res.hp <= 0) { combatDeath(); return; }
  if (en.hp <= 0) { await victory(); return; }

  c.round++;
  announceIntent();
  renderCombatPanel(); renderPips();
  dealCard(makeCombatCard());
}

function combatDeath() {
  const en = state.combat.enemy;
  const d = { ...DEATHS.hp_combat };
  d.r = `${en.def.name} streckt dich nieder. ${state.dungeon ? 'Die Tiefe behält, was ihr gehört.' : ''} Deine Geschichte endet hier, im Dunkel.`;
  gameOver(d);
}

async function victory() {
  const c = state.combat, en = c.enemy, p = state.player;
  state.stats.slain++;
  const [gMin, gMax] = en.def.gold;
  let gold = rndInt(gMin, gMax);
  if (c.elite) gold = Math.round(gold * 1.6);
  p.gold += gold;
  state.stats.goldEarned += gold;
  log(`🏆 <span class="crit">${en.def.name} besiegt!</span> +${gold} 🪙`);
  floatNum(el.enemyPortrait, '💀', 'crit');
  if (p.trinket && p.trinket.id === 'herzstein') healPlayer(5, '(Herzstein)');
  toast(`🏆 ${en.def.name} besiegt! +${gold} 🪙`);
  renderLeft();
  await wait(650);

  const items = rollCombatLoot(c);
  const after = c.after;
  state.combat = null;
  if (items.length) startReward(items, after);
  else after();
}

/* ============================================================
   LOOT & REWARD
   ============================================================ */
function rollGearLoot(context) {
  const rarity = pickWeighted(CONFIG.lootRarity[context]);
  const cat = pickWeighted(CONFIG.lootCategory);
  const pools = { weapon: WEAPONS, armor: ARMORS, trinket: TRINKETS };
  const order = ['common', 'rare', 'epic', 'legendary'];
  let pool = pools[cat].filter(i => i.rarity === rarity);
  let step = order.indexOf(rarity);
  while (!pool.length && step > 0) { step--; pool = pools[cat].filter(i => i.rarity === order[step]); }
  while (!pool.length && step < order.length - 1) { step++; pool = pools[cat].filter(i => i.rarity === order[step]); }
  return { cat, def: pick(pool) };
}

function rollCombatLoot(c) {
  const items = [];
  if (c.boss) {
    items.push(rollGearLoot('boss'), rollGearLoot('boss'));
  } else if (c.elite) {
    items.push(rollGearLoot('elite'));
    if (Math.random() < 0.5) items.push({ cat: 'potion', def: pick(POTIONS) });
  } else if (Math.random() < CONFIG.dropChanceNormal) {
    const roll = pickWeighted({ potion: 45, torch: 30, gear: 25 });
    if (roll === 'potion') items.push({ cat: 'potion', def: pick(POTIONS) });
    else if (roll === 'torch') items.push({ cat: 'torch', n: 3 });
    else items.push(rollGearLoot('normal'));
  }
  return items;
}

function gearDetail(g) {
  if (g.cat === 'weapon') return `${g.def.min}–${g.def.max} Schaden · Crit ${Math.round(g.def.crit * 100)} % · ✨ ${g.def.special.name}: ${g.def.special.desc}`;
  if (g.cat === 'armor') return `+${g.def.block} Block${g.def.thorns ? ` · 🌵 ${g.def.thorns} Dornen` : ''}`;
  if (g.cat === 'trinket') return g.def.desc;
  return '';
}
function itemValue(item) {
  if (item.cat === 'torch') return CONFIG.torchValue;
  if (item.cat === 'potion') return CONFIG.potionValue;
  return CONFIG.rarityValue[item.def.rarity];
}

const slotKeyFor = (cat) => cat === 'weapon' ? 'weapon' : cat === 'armor' ? 'armor' : 'trinket';
const catOfDef = (def) => WEAPONS.includes(def) ? 'weapon' : ARMORS.includes(def) ? 'armor' : 'trinket';

/** Beute wandert ins Inventar — nichts wird mehr ungefragt überschrieben oder verkauft. */
function takeToInventory(item) {
  state.player.inventory.push(item);
}

/** Tauscht Inventar-Slot gegen den Ausrüstungs-Slot (Getauschtes bleibt im Inventar). */
function equipFromInventory(idx) {
  if (state.mode === 'COMBAT') { toast('Nicht mitten im Kampf!'); return; }
  const p = state.player;
  const item = p.inventory[idx];
  if (!item) return;
  const slotKey = slotKeyFor(item.cat);
  const old = p[slotKey];
  p[slotKey] = item.def;
  if (old) p.inventory[idx] = { cat: item.cat, def: old };
  else p.inventory.splice(idx, 1);
  toast(`✅ ${item.def.name} ausgerüstet`);
  renderLeft();
}

function sellFromInventory(idx) {
  const p = state.player;
  const item = p.inventory[idx];
  if (!item) return;
  const value = itemValue(item);
  p.gold += value;
  state.stats.goldEarned += value;
  p.inventory.splice(idx, 1);
  toast(`🪙 ${item.def.name} für ${value} Gold verkauft`);
  renderLeft();
}
function takePotion(potDef) {
  const idx = state.player.potions.indexOf(null);
  state.player.potions[idx] = potDef;
}

function startReward(items, after, introText = null) {
  state.reward = { queue: items, after };
  state.mode = 'REWARD';
  renderContext();
  dealCard(makeLootCard(items[0], introText));
}

function makeLootCard(item, introText = null) {
  const isTorch = item.cat === 'torch';
  const isPotion = item.cat === 'potion';
  const name = isTorch ? `Fackelbündel (+${item.n} 🔥)` : item.def.name;
  const emoji = isTorch ? '🔥' : (isPotion ? item.def.emoji : item.def.emoji);
  const rarity = isTorch || isPotion ? 'common' : item.def.rarity;
  const value = itemValue(item);
  const detail = isTorch ? 'Licht für die Tiefe' : (isPotion ? item.def.desc : gearDetail(item));
  const rarityName = { common: 'Gewöhnlich', rare: 'Selten', epic: 'Episch', legendary: 'LEGENDÄR' }[rarity];
  return {
    kind: 'loot',
    emoji,
    title: name,
    text: introText || `Beute: ${name} — ${detail}. ${isTorch || isPotion ? '' : `(${rarityName})`}`,
    caption: `Beute · Wert ${value} 🪙`,
    labels: { left: `Verkaufen (+${value} 🪙)`, right: isTorch ? 'Einstecken' : (isPotion ? 'In den Beutel' : 'Ins Inventar'), up: '', down: '' },
    canSwipe(dir) {
      if (dir !== 'right') return true;
      if (isPotion && !state.player.potions.includes(null)) return 'Beutel voll — links verkaufen.';
      if (!isPotion && !isTorch && state.player.inventory.length >= CONFIG.inventorySize) return 'Inventar voll — links verkaufen.';
      return true;
    },
    onResolve(dir) {
      const r = state.reward;
      if (dir === 'left') {
        state.player.gold += value;
        state.stats.goldEarned += value;
        toast(`🪙 +${value} Gold`);
      } else if (isTorch) {
        if (state.dungeon) state.dungeon.torches += item.n;
        toast(`🔥 +${item.n} Fackeln`);
      } else if (isPotion) {
        takePotion(item.def);
        toast(`🧪 ${item.def.name} eingesteckt`);
      } else {
        takeToInventory(item);
        toast(`🎒 ${item.def.name} im Inventar — links per ⇄ ausrüsten`);
      }
      renderLeft(); renderDungeonPanel();
      r.queue.shift();
      if (r.queue.length) dealCard(makeLootCard(r.queue[0]));
      else { const after = r.after; state.reward = null; after(); }
    },
  };
}

/* ============================================================
   GAME OVER & NEUSTART
   ============================================================ */
function gameOver(death) {
  state.mode = 'GAME_OVER';
  inputLocked = true;
  el.goSkull.textContent = death.skull || '💀';
  el.goTitle.textContent = death.title;
  el.goReason.textContent = death.r;
  el.goStats.innerHTML = `
    <div class="go-stat"><div class="n">${state.day}</div><div class="l">Tage regiert</div></div>
    <div class="go-stat"><div class="n">${state.stats.dungeons}</div><div class="l">Dungeons bezwungen</div></div>
    <div class="go-stat"><div class="n">${state.stats.slain}</div><div class="l">Gegner besiegt</div></div>
    <div class="go-stat"><div class="n">${state.stats.goldEarned}</div><div class="l">Gold erbeutet</div></div>`;
  el.overlayGameover.hidden = false;
  renderContext();
}

function restart() {
  initState();
  el.overlayGameover.hidden = true;
  el.combatLog.innerHTML = '';
  inputLocked = false;
  renderContext(); renderLeft();
  dealCard(makeTutorialCard(0));
}

/* ============================================================
   INPUT — Pointer-Physik (Drag, Spring-Back, Fly-Out, 4 Richtungen)
   ============================================================ */
const drag = { active: false, sx: 0, sy: 0, dx: 0, dy: 0, raf: 0 };

function setupInput() {
  const card = el.swipeCard;

  card.addEventListener('pointerdown', (e) => {
    if (inputLocked || state.mode === 'GAME_OVER') return;
    drag.active = true;
    drag.sx = e.clientX; drag.sy = e.clientY;
    drag.dx = 0; drag.dy = 0;
    card.classList.add('dragging');
    card.setPointerCapture(e.pointerId);
  });

  card.addEventListener('pointermove', (e) => {
    if (!drag.active) return;
    drag.dx = e.clientX - drag.sx;
    drag.dy = e.clientY - drag.sy;
    if (!drag.raf) drag.raf = requestAnimationFrame(applyDrag);
  });

  card.addEventListener('pointerup', finishDrag);
  card.addEventListener('pointercancel', finishDrag);

  el.retreatBtn.addEventListener('click', retreat);
  el.restartBtn.addEventListener('click', restart);

  // Inventar: Ausrüsten/Verkaufen per Button (Event-Delegation)
  el.invList.addEventListener('click', (e) => {
    const btn = e.target.closest('.inv-btn');
    if (!btn || btn.disabled) return;
    const idx = Number(btn.dataset.idx);
    if (btn.dataset.act === 'equip') equipFromInventory(idx);
    else sellFromInventory(idx);
  });

  // Tastatur: Pfeiltasten = Swipes, Enter/Leertaste = Neustart im Game Over
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (map[e.key]) { e.preventDefault(); keySwipe(map[e.key]); }
    else if ((e.key === 'Enter' || e.key === ' ') && state.mode === 'GAME_OVER') restart();
  });
}

/** Löst eine Karte GENAU EINMAL auf — Schutz vor Doppel-Auswertung
    bei gemischter Maus-/Tastatur-Eingabe. */
function commitSwipe(card, dir) {
  if (card._resolved || inputLocked) return;
  card._resolved = true;
  inputLocked = true;
  clearPreview();
  flyOut(dir).then(() => card.onResolve(dir));
}

/** Löst einen Swipe per Tastatur aus — mit denselben Regeln wie per Maus. */
function keySwipe(dir) {
  if (inputLocked || drag.active || state.mode === 'GAME_OVER' || !state.currentCard) return;
  const combat = state.mode === 'COMBAT';
  if ((dir === 'up' || dir === 'down') && !combat) return;
  const card = state.currentCard;
  if (card.canSwipe) {
    const chk = card.canSwipe(dir);
    if (chk !== true) { toast(chk); return; }
  }
  const ov = { left: el.ovLeft, right: el.ovRight, up: el.ovUp, down: el.ovDown }[dir];
  ov.style.opacity = 1;
  drag.dx = dir === 'left' ? -80 : dir === 'right' ? 80 : 0;
  drag.dy = dir === 'up' ? -80 : dir === 'down' ? 80 : 0;
  commitSwipe(card, dir);
}

function applyDrag() {
  drag.raf = 0;
  if (!drag.active) return;
  const combat = state.mode === 'COMBAT';
  const dy = drag.dy * (combat ? 0.9 : 0.3);
  const rot = clamp(drag.dx * 0.05, -14, 14);
  el.swipeCard.style.transform = `translate(${drag.dx}px, ${dy}px) rotate(${rot}deg)`;
  updateOverlays();
}

function candidateDir() {
  const w = el.swipeCard.offsetWidth, h = el.swipeCard.offsetHeight;
  const combat = state.mode === 'COMBAT';
  if (combat && Math.abs(drag.dy) > Math.abs(drag.dx)) {
    return { dir: drag.dy < 0 ? 'up' : 'down', ratio: Math.abs(drag.dy) / (h * CONFIG.swipeY) };
  }
  return { dir: drag.dx < 0 ? 'left' : 'right', ratio: Math.abs(drag.dx) / (w * CONFIG.swipeX) };
}

function updateOverlays() {
  const { dir, ratio } = candidateDir();
  const o = clamp(ratio, 0, 1);
  el.ovLeft.style.opacity = dir === 'left' ? o : 0;
  el.ovRight.style.opacity = dir === 'right' ? o : 0;
  el.ovUp.style.opacity = dir === 'up' ? o : 0;
  el.ovDown.style.opacity = dir === 'down' ? o : 0;

  // Story-Vorschau: betroffene Ressourcen pulsieren
  const card = state.currentCard;
  RES_KEYS.forEach(k => $(`res-${k}`).classList.remove('preview'));
  if (card && card.preview && ratio > 0.3 && (dir === 'left' || dir === 'right')) {
    (card.preview[dir] || []).forEach(k => $(`res-${k}`).classList.add('preview'));
  }
}

function clearPreview() {
  RES_KEYS.forEach(k => $(`res-${k}`).classList.remove('preview'));
  [el.ovLeft, el.ovRight, el.ovUp, el.ovDown].forEach(o => o.style.opacity = 0);
}

function finishDrag(e) {
  if (!drag.active) return;
  drag.active = false;
  if (drag.raf) { cancelAnimationFrame(drag.raf); drag.raf = 0; }
  if (inputLocked) { springBack(); return; } // Auflösung läuft bereits (z. B. per Tastatur)

  const { dir, ratio } = candidateDir();
  const passed = ratio >= 1;
  const combat = state.mode === 'COMBAT';
  const validDir = passed && (combat || dir === 'left' || dir === 'right');

  if (!validDir) { springBack(); return; }

  const card = state.currentCard;
  if (card.canSwipe) {
    const chk = card.canSwipe(dir);
    if (chk !== true) { toast(chk); springBack(); return; }
  }

  commitSwipe(card, dir);
}

function springBack() {
  el.swipeCard.classList.remove('dragging');
  el.swipeCard.style.transform = 'translate(0,0)';
  clearPreview();
}

function flyOut(dir) {
  const card = el.swipeCard;
  card.classList.remove('dragging');
  card.classList.add('flying');
  const W = window.innerWidth, H = window.innerHeight;
  let tx = drag.dx, ty = drag.dy, rot = 0;
  if (dir === 'left') { tx = -W * 0.75; ty = drag.dy * 1.4; rot = -26; }
  if (dir === 'right') { tx = W * 0.75; ty = drag.dy * 1.4; rot = 26; }
  if (dir === 'up') { ty = -H * 0.9; tx = drag.dx * 1.4; rot = drag.dx * 0.02; }
  if (dir === 'down') { ty = H * 0.9; tx = drag.dx * 1.4; rot = drag.dx * 0.02; }
  card.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
  return wait(CONFIG.flyMs);
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  bindDom();
  setupInput();
  initState();
  renderContext();
  renderLeft();
  dealCard(makeTutorialCard(0));
}

document.addEventListener('DOMContentLoaded', init);

/* Dev-Hook (nur zum Testen/Debuggen, kein Spiel-Code) */
window.__kk = {
  get state() { return state; },
  enterDungeon,
  fight: (id, opts = {}) => startCombat(makeEnemyInstance(id, opts), opts),
  gold: (n) => { state.player.gold += n; renderLeft(); },
  hp: (n) => { state.res.hp = clamp(n, 0, 100); renderResources(); },
  die: (key) => gameOver(DEATHS[key]),
  win: () => { if (state.combat) { state.combat.enemy.hp = 0; victory(); } },
  next: () => dungeonContinue(),
  res: (k, v) => { state.res[k] = clamp(v, 0, 100); renderResources(); },
  day: (n) => { state.day = n; renderContext(); },
  draw: (id) => dealCard(makeStoryCard(drawStoryDef(id))),
  pool: () => storyPool().map(c => c.id),
  equip: (id) => {
    const item = WEAPONS.find(w => w.id === id) || ARMORS.find(a => a.id === id) || TRINKETS.find(t => t.id === id);
    if (item) { state.player[WEAPONS.includes(item) ? 'weapon' : ARMORS.includes(item) ? 'armor' : 'trinket'] = item; renderLeft(); }
  },
};

})();
