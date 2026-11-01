/* ---------- Quest mode: short exercise quests while you game ----------
   Loaded before Plate Log's main script and uses its state (S), render(), sound engine and lock-screen card.
   The quests for the next few hours are planned ahead with their arrival times, so the lock-screen card and its
   chime keep working while the phone is locked and this page isn't running. To change quests, tell Claude. */

// amount = base + step per level above 1, capped at max. kind: reps or seconds; each: per arm / per side.
const QUESTS = [
  { id: 'pushups', cat: 'body', name: 'Push-ups', quest: 'Raise the Rampart', kind: 'reps', base: 8, step: 1, max: 25, how: 'Body in one straight line. Knees down is fine.' },
  { id: 'situps', cat: 'body', name: 'Sit-ups', quest: 'Core of the Mountain', kind: 'reps', base: 12, step: 1, max: 30, how: 'Knees bent. Curl up with your stomach, not your neck.' },
  { id: 'squats', cat: 'body', name: 'Squats', quest: 'Stand Your Ground', kind: 'reps', base: 12, step: 2, max: 35, how: 'Sit back until your thighs are level, then stand tall.' },
  { id: 'plank', cat: 'body', name: 'Plank', quest: 'The Unbending', kind: 'time', base: 30, step: 5, max: 60, how: 'Forearms down, hips level with your shoulders.' },
  { id: 'wallsit', cat: 'body', name: 'Wall sit', quest: 'Hold the Wall', kind: 'time', base: 30, step: 5, max: 60, how: 'Back flat on the wall, knees at a right angle.' },
  { id: 'bridges', cat: 'body', name: 'Glute bridges', quest: 'Bridge the Chasm', kind: 'reps', base: 12, step: 2, max: 30, how: 'On your back, push through your heels, squeeze at the top.' },
  { id: 'curls', cat: 'db', name: 'Hammer curls', quest: 'Arms of the Smith', kind: 'reps', each: 'arm', base: 8, step: 1, max: 15, how: '10 kg dumbbell, thumb up. Elbow pinned, slow on the way down.' },
  { id: 'goblet', cat: 'db', name: 'Goblet squats', quest: 'Carry the Keg', kind: 'reps', base: 10, step: 1, max: 20, how: 'Hold the dumbbell at your chest, sit deep, stand tall.' },
  { id: 'rows', cat: 'db', name: 'One-arm rows', quest: 'Row to the Far Shore', kind: 'reps', each: 'arm', base: 10, step: 1, max: 15, how: 'Free hand on the desk, flat back, pull the dumbbell to your hip.' },
  { id: 'press', cat: 'db', name: 'One-arm press', quest: 'Lift the Banner', kind: 'reps', each: 'arm', base: 8, step: 1, max: 12, how: 'From your shoulder to a straight arm overhead, ribs down.' },
  { id: 'rdl', cat: 'db', name: 'Dumbbell deadlift', quest: 'Bow to the Dawn', kind: 'reps', base: 10, step: 1, max: 20, how: 'Dumbbell in both hands, soft knees, hinge at the hips, flat back.' },
  { id: 'neck', cat: 'stretch', name: 'Neck stretch', quest: 'Loosen the Helm', kind: 'time', each: 'side', base: 20, step: 0, max: 20, how: 'Ear toward your shoulder, other hand reaching down.' },
  { id: 'wrists', cat: 'stretch', name: 'Wrist stretch', quest: 'Rest the Mouse Hand', kind: 'time', each: 'side', base: 20, step: 0, max: 20, how: 'Arm straight, gently pull your fingers back, then down.' },
  { id: 'chest', cat: 'stretch', name: 'Chest opener', quest: 'Open the Gates', kind: 'time', base: 30, step: 5, max: 45, how: 'Forearms on a door frame, step through.' },
  { id: 'hips', cat: 'stretch', name: 'Hip flexor stretch', quest: 'Unbind the Saddle', kind: 'time', each: 'side', base: 20, step: 5, max: 30, how: 'Half-kneeling lunge, squeeze the back glute.' },
  { id: 'twist', cat: 'stretch', name: 'Seated twist', quest: 'Turn of the Tide', kind: 'time', each: 'side', base: 20, step: 0, max: 20, how: 'Sit tall, turn from the ribs, hold the chair.' },
  { id: 'catcow', cat: 'stretch', name: 'Cat-cow', quest: 'The Restless Back', kind: 'reps', base: 8, step: 1, max: 12, how: 'On hands and knees, round your back, then arch it.' },
  { id: 'walk', cat: 'break', name: 'Walk around', quest: 'Patrol the Keep', kind: 'time', base: 45, step: 5, max: 60, how: 'Stand up and walk. Refill your water.' },
  { id: 'eyes', cat: 'break', name: 'Look far away', quest: 'Watch the Horizon', kind: 'time', base: 20, step: 0, max: 20, how: 'Eyes off the screen, then roll your shoulders.' },
];
const Q_CAT_WEIGHT = { body: 4, db: 3, stretch: 3, break: 1 };
const Q_CAT_XP = { body: 30, db: 30, stretch: 20, break: 15 };
const Q_ELITE_CHANCE = 1 / 6;                    // an elite quest: half as much again, double XP
const Q_SWIFT_MS = 5 * 60000, Q_SWIFT_XP = 10;   // turned in within 5 minutes of arriving
const Q_AHEAD = 10;                              // quests planned ahead (the lock-screen card can chime for 10)
const Q_INTERVALS = [15, 30, 45, 60];

const qEx = id => QUESTS.find(e => e.id === id);
function qAmount(ex, level, elite) {
  const n = Math.min(ex.max, ex.base + ex.step * (level - 1));
  if (!elite) return n;
  const unit = ex.kind === 'time' ? 5 : 1;
  return Math.round(n * 1.5 / unit) * unit;
}
const qSecs = q => q.amount * (qEx(q.exId).each ? 2 : 1);
const qXpNeed = level => 100 + 25 * (level - 1);
const qRank = level => level < 5 ? 'Squire' : level < 10 ? 'Knight' : level < 20 ? 'Champion' : 'Legend';
function qHero() { return S.hero || (S.hero = { level: 1, xp: 0 }); }
function qTask(q) { const ex = qEx(q.exId); return `${ex.name} · ${q.amount}${ex.kind === 'time' ? ' s' : ''}${ex.each ? ' each ' + ex.each : ''}`; }
function qClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), p = n => String(n).padStart(2, '0');
  return (h ? h + ':' + p(Math.floor(s / 60) % 60) : Math.floor(s / 60)) + ':' + p(s % 60);
}

/* ---------- the session: planned quests arrive, wait in the log, get turned in ---------- */
let qTimer = null;          // the running countdown of a timed quest: { id, start, total, sided, ticked }
const qShown = new Set();   // quests already unrolled on screen

// The hero sprite on the quest scroll (quest-sprite.js) acts out the exercise, and cheers when the quest is turned in.
let qSpriteOn = false, qCheer = false;
function qSpriteRun() {
  if (qSpriteOn || typeof QSprite === 'undefined') return;
  qSpriteOn = true;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = -1;
  const frame = now => {
    const cv = document.getElementById('qm-sprite');
    if (!cv) { qSpriteOn = false; return; }
    if (last < 0 || now - last >= 80) {
      last = now;
      const id = qCheer ? 'cheer' : cv.dataset.ex;
      QSprite.draw(cv.getContext('2d'), id, still ? (qCheer ? 1 : 0.5) : QSprite.phase(id, now));
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function qPick(exclude = []) {
  const Q = S.quest;
  const recent = [...Q.done, ...Q.waiting, ...Q.plan].map(q => q.exId).slice(-4);
  let pool = QUESTS.filter(e => !recent.includes(e.id) && !exclude.includes(e.id) && e.cat !== Q.lastCat);
  if (!pool.length) pool = QUESTS.filter(e => !exclude.includes(e.id));
  const w = e => Q_CAT_WEIGHT[e.cat] / QUESTS.filter(x => x.cat === e.cat).length;
  let r = Math.random() * pool.reduce((s, e) => s + w(e), 0);
  for (const e of pool) { r -= w(e); if (r <= 0) return e; }
  return pool[pool.length - 1];
}
function qMake(at) {
  const ex = qPick();
  const elite = ex.cat !== 'break' && Math.random() < Q_ELITE_CHANCE;
  S.quest.lastCat = ex.cat;
  return { id: ++S.quest.seq, exId: ex.id, elite, amount: qAmount(ex, qHero().level, elite), at, swapped: false };
}
function qTopUp() {
  const Q = S.quest;
  while (Q.plan.length < Q_AHEAD) { Q.lastAt += Q.interval * 60000; Q.plan.push(qMake(Q.lastAt)); }
}
// at: when the session began (the WoW watcher on the PC sends when the game started); now by default
function qStart(at) {
  if (S.active) { toast('Finish your workout first'); return; }
  ensureAudio();
  const now = at || Date.now();
  S.quest = { start: now, interval: S.questInterval || 30, lastAt: now, seq: 0, plan: [], waiting: [], done: [], xp: 0, from: qHero().level, lastCat: null };
  qTopUp(); save();
  if (native) native.LocalNotifications.requestPermissions().catch(() => {});   // Android asks once, for the lock-screen card
  qPlay('start');
  view.screen = 'quests'; render(); scrollTo(0, 0);
}
// Moves quests whose time has come into the quest log. Chimes only for one that just arrived while you're looking.
function qArrive(quiet) {
  const Q = S.quest; if (!Q) return;
  const now = Date.now(), arrived = [];
  while (Q.plan.length && Q.plan[0].at <= now) arrived.push(Q.plan.shift());
  if (!arrived.length) return;
  Q.waiting.push(...arrived); qTopUp(); save();
  const last = arrived[arrived.length - 1];
  if (!quiet && now - last.at < 15000 && document.visibilityState === 'visible') { qPlay(last.elite ? 'elite' : 'quest'); qToast(last); }
  render();
}
// Records a turned-in quest (from the screen or the lock-screen card) and returns what it earned.
function qRecord(id, at) {
  const Q = S.quest;
  const list = Q.waiting.some(x => x.id === id) ? Q.waiting : Q.plan;
  const i = list.findIndex(x => x.id === id); if (i < 0) return null;
  const q = list.splice(i, 1)[0];
  const swift = at - q.at <= Q_SWIFT_MS;
  const gain = Q_CAT_XP[qEx(q.exId).cat] * (q.elite ? 2 : 1) + (swift ? Q_SWIFT_XP : 0);
  Q.done.push({ id: q.id, exId: q.exId, elite: q.elite, amount: q.amount, at, gain, swift });
  Q.xp += gain;
  qTopUp();
  return { q, gain, swift };
}
// Adds XP to the hero; returns the level before if it went up (and makes the planned quests a little harder).
function qAddXp(gain) {
  const h = qHero(), from = h.level;
  h.xp += gain;
  while (h.xp >= qXpNeed(h.level)) { h.xp -= qXpNeed(h.level); h.level++; }
  if (h.level === from) return null;
  if (S.quest) S.quest.plan.forEach(p => { p.amount = qAmount(qEx(p.exId), h.level, p.elite); });
  return from;
}
function qComplete(id) {
  const scroll = document.getElementById('qm-scroll');
  if (qTimer && qTimer.id === id) qTimer = null;
  const r = qRecord(id, Date.now()); if (!r) return;
  save();
  qPlay('complete'); qCheer = true;
  const row = document.getElementById('qm-obj-row'); if (row) row.classList.add('done');
  const cnt = document.getElementById('qm-obj-count'); if (cnt && qEx(r.q.exId).kind === 'reps') cnt.innerHTML = `${r.q.amount}<small>/${r.q.amount}</small>`;
  const box = (scroll || $('#app')).getBoundingClientRect();
  const x = box.left + box.width / 2, y = box.top + Math.min(box.height / 2, 200);
  qBanner(r.gain, r.swift, r.q.elite);
  qBurst(x, y, r.q.elite ? 140 : 90);
  setTimeout(() => {
    if (scroll) scroll.classList.add('turnin');
    qFlyXp(x, y, r.gain, () => {
      const from = qAddXp(r.gain);
      save(); qPaintHero(true); syncCard();
      if (from !== null) setTimeout(() => qLevelUp(from, qHero().level), 350);
    });
    setTimeout(render, 480);
  }, 380);
}
// Quests turned in with the lock-screen card's Done button, handed back when the page runs again.
function qTakeCardQuests(evs) {
  if (!S.quest) return;
  qArrive(true);
  let gain = 0, n = 0;
  evs.sort((a, b) => a.at - b.at).forEach(ev => { const r = qRecord(ev.data.id, ev.at); if (r) { gain += r.gain; n++; } });
  if (!n) return;
  const from = qAddXp(gain);
  save(); render();
  toast(`${n} quest${n === 1 ? '' : 's'} turned in from the lock screen · +${gain} XP`);
  if (from !== null) qLevelUp(from, qHero().level);
}
function qSwap(id) {
  const q = S.quest.waiting.find(x => x.id === id); if (!q || q.swapped) return;
  const ex = qPick([q.exId]);
  q.exId = ex.id; q.amount = qAmount(ex, qHero().level, q.elite); q.swapped = true;
  if (qTimer && qTimer.id === id) qTimer = null;
  qShown.delete(q.id); save(); render();
}
function qEnd() {
  const Q = S.quest, now = Date.now();
  const entry = { id: 'q' + Q.start, start: Q.start, end: now, interval: Q.interval, done: Q.done.length, missed: Q.waiting.length, xp: Q.xp, from: Q.from, to: qHero().level,
    quests: Q.done.map(d => ({ exId: d.exId, amount: d.amount, at: d.at, gain: d.gain, elite: d.elite })) };
  (S.questLog ||= []).push(entry);
  S.quest = null; qTimer = null; sheet = null;
  save();
  view.questSummary = entry; view.screen = 'quest-summary';
  render(); scrollTo(0, 0);
}
setInterval(() => { if (S.quest) { qArrive(false); qTick(); } }, 500);

/* ---------- links from the WoW watcher on the PC (tools/wow-watcher.ps1, via an ntfy notification) ----------
   platelog://quest/start?at=<ms>  WoW started: start quest mode from that moment
   platelog://quest/end?at=<ms>    WoW closed: end the session
   platelog://quest/test?at=<ms>   the setup's test notification */
function qOpenLink(url) {
  const m = /^platelog:\/\/quest\/(start|end|test)(?:\?at=(\d+))?/.exec(url || ''); if (!m) return;
  const at = +m[2] || Date.now();
  if (at <= (S.linkAt || 0)) return;   // the same link again (Android hands it over each time the app reopens from it)
  S.linkAt = at; save();
  if (m[1] === 'test') { toast('Your PC can start quest mode'); return; }
  if (Date.now() - at > 6 * 3600000) return;   // a notification left lying around
  if (m[1] === 'start') {
    if (S.quest) { view.screen = 'quests'; render(); toast('Quest mode is already running'); }
    else if (S.active) toast('Finish your workout first');
    else qStart(Math.min(at, Date.now()));
  } else if (S.quest && S.quest.start < at) qEnd();
}

/* ---------- lock-screen card (app-shell build 3+: steps that open later) ---------- */
function qCardOk() { return !!(card && card.info); }
function qCardState() {
  const Q = S.quest;
  const step = q => ({ id: 'quest-' + q.id, title: qEx(q.exId).quest + (q.elite ? ' · Elite' : ''), text: qTask(q), sound: 'questcomplete', data: { kind: 'quest', id: q.id }, at: q.at });
  return {
    steps: [...Q.waiting, ...Q.plan].map(step),
    since: Q.start, label: 'Quest mode', restLabel: 'Quest mode', restart: false,
    button: 'Done', waitTitle: 'Next quest', waitText: 'arrives at', doneTitle: 'Quest mode', doneText: '',
    alerts: Q.plan.slice(0, Q_AHEAD).map(q => ({ after: Math.round((q.at - Q.start) / 1000), label: 'New quest!',
      title: (q.elite ? 'Elite quest: ' : 'New quest: ') + qEx(q.exId).quest, channel: 'quest-new', channelName: 'New quest', sound: 'quest_new' })),
    volume: level(), silent: !S.sound,
  };
}
// The card plays the turn-in chime itself, so it gets a copy rendered to a WAV file.
async function qCacheCardSound() {
  if (!qCardOk()) return;
  try {
    const have = ((await card.listSounds()) || {}).sounds || [];
    if (have.includes('questcomplete/complete.wav')) return;
    const rate = 22050, oc = new OfflineAudioContext(1, rate * 2, rate);
    Q_SOUND.complete(oc, oc.destination, 0.01);
    const buf = await oc.startRendering();
    await card.cacheSound({ group: 'questcomplete', name: 'complete.wav', data: qWav(buf.getChannelData(0), rate) });
  } catch (e) {}
}
function qWav(samples, rate) {
  const b = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const str = (o, s) => [...s].forEach((ch, i) => b.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF'); b.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true); b.setUint32(24, rate, true);
  b.setUint32(28, rate * 2, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true); str(36, 'data'); b.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => b.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v * 1.6)) * 32767, true));
  const bytes = new Uint8Array(b.buffer); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/* ---------- sound: original chimes, through Plate Log's volume ---------- */
function qBell(c, out, t, freq, dur = 1.2, vol = 0.18) {
  [[1, 1], [2.01, 0.35], [3.02, 0.12], [4.2, 0.06]].forEach(([m, v]) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq * m;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur / m ** 0.3);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.1);
  });
}
function qThump(c, out, t, vol = 0.35) {
  const o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.35);
}
const qN = m => 440 * 2 ** ((m - 69) / 12);   // MIDI note → Hz
const Q_SOUND = {
  quest: (c, o, t) => { qBell(c, o, t, qN(79), 1.4, 0.16); qBell(c, o, t + 0.17, qN(86), 1.8, 0.16); qBell(c, o, t + 0.34, qN(91), 1.2, 0.07); },
  elite: (c, o, t) => { qThump(c, o, t, 0.3); [74, 79, 86].forEach((n, i) => qBell(c, o, t + i * 0.15, qN(n), i === 2 ? 2 : 1.4, 0.15)); qBell(c, o, t + 0.45, qN(91), 1.6, 0.08); },
  complete: (c, o, t) => { qThump(c, o, t); [72, 76, 79, 84].forEach((n, i) => qBell(c, o, t + 0.05 + i * 0.075, qN(n), 1.3, 0.15)); qBell(c, o, t + 0.38, qN(96), 1.6, 0.06); },
  coin: (c, o, t) => qBell(c, o, t, qN(100), 0.25, 0.035),
  level: (c, o, t) => {
    qThump(c, o, t, 0.4);
    [[60, 64, 67], [62, 66, 69], [67, 71, 74, 79]].forEach((ch, i) => ch.forEach(n => qBell(c, o, t + i * 0.28, qN(n), i === 2 ? 2.6 : 1.1, 0.11)));
    [91, 95, 98, 103].forEach((n, i) => qBell(c, o, t + 0.9 + i * 0.07, qN(n), 1, 0.04));
  },
  side: (c, o, t) => qBell(c, o, t, qN(81), 0.8, 0.14),
  tick: (c, o, t) => qBell(c, o, t, qN(93), 0.15, 0.05),
  start: (c, o, t) => { qBell(c, o, t, qN(67), 1, 0.12); qBell(c, o, t + 0.12, qN(74), 1.4, 0.12); },
};
const Q_BUZZ = { quest: [60, 80, 60], elite: [80, 60, 80, 60, 160], complete: [30, 40, 90], level: [60, 60, 60, 60, 200], side: [50] };
function qPlay(name) {
  if (!S.sound) return;
  ensureAudio(); if (!audio) return;
  const g = audio.createGain(); g.gain.value = level() / 0.6; g.connect(audio.destination);
  Q_SOUND[name](audio, g, audio.currentTime + 0.02);
  try { navigator.vibrate && Q_BUZZ[name] && navigator.vibrate(Q_BUZZ[name]); } catch (e) {}
}

/* ---------- celebration: sparks, a banner, XP orbs that fly into the XP bar ---------- */
const qReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let qParts = [], qFxOn = false, qFx = null;
function qBanner(gain, swift, elite) {
  const b = document.createElement('div'); b.className = 'qm-banner';
  b.innerHTML = `${elite ? '<div class="eyebrow">Elite</div>' : ''}<div class="qm-caps">Quest complete!</div><div class="qm-gain num">+${gain} XP${swift ? '<em>Swift!</em>' : ''}</div>`;
  document.body.appendChild(b); setTimeout(() => b.remove(), 1800);
}
function qBurst(x, y, n, spread = 1) {
  if (qReduced) return;
  const cols = ['#f6c744', '#ffe590', '#fff6d8', '#e0a91d'];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = (2 + Math.random() * 7) * spread;
    qParts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, life: 1, decay: 0.012 + Math.random() * 0.012, size: 2 + Math.random() * 4, col: cols[i % cols.length], spin: Math.random() * 6, star: i % 3 === 0 });
  }
  qParts.push({ ring: true, x, y, r: 10, life: 1 });
  qRunFx();
}
function qFlyXp(x, y, gain, done) {
  const bar = document.querySelector('.dock .qm-xp-track');
  if (!bar || qReduced) { done(); return; }
  const b = bar.getBoundingClientRect(), h = qHero();
  const n = Math.min(14, Math.round(gain / 4));
  let left = n;
  for (let i = 0; i < n; i++) {
    qParts.push({ orb: true, x: x + (Math.random() - 0.5) * 80, y: y + (Math.random() - 0.5) * 60, tx: b.left + b.width * Math.min(1, h.xp / qXpNeed(h.level)), ty: b.top + b.height / 2,
      t: -i * 0.06, life: 1, arrive: () => { qPlay('coin'); if (--left === 0) done(); } });
  }
  qRunFx();
}
function qRunFx() {
  if (!qFx) { qFx = document.createElement('canvas'); qFx.className = 'qm-fx'; document.body.appendChild(qFx); }
  if (!qFxOn) { qFxOn = true; requestAnimationFrame(qDrawFx); }
}
function qDrawFx() {
  const ctx = qFx.getContext('2d'), dpr = devicePixelRatio || 1;
  if (qFx.width !== Math.round(innerWidth * dpr)) { qFx.width = Math.round(innerWidth * dpr); qFx.height = Math.round(innerHeight * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
  qParts = qParts.filter(p => p.life > 0);
  for (const p of qParts) {
    if (p.ring) { p.r += 9; p.life -= 0.04; ctx.strokeStyle = `rgba(246,199,68,${p.life * 0.7})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke(); continue; }
    if (p.orb) {
      p.t += 0.022; if (p.t < 0) continue;
      const k = Math.min(1, p.t), e = k * k * (3 - 2 * k);
      const cx = (p.x + p.tx) / 2, cy = Math.min(p.y, p.ty) - 120;   // arc up, then down into the bar
      const ox = (1 - e) ** 2 * p.x + 2 * (1 - e) * e * cx + e * e * p.tx, oy = (1 - e) ** 2 * p.y + 2 * (1 - e) * e * cy + e * e * p.ty;
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 10); g.addColorStop(0, '#fff6d0'); g.addColorStop(0.4, '#f6c744'); g.addColorStop(1, 'rgba(246,199,68,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, 10, 0, 7); ctx.fill();
      if (k >= 1) { p.life = 0; p.arrive(); }
      continue;
    }
    p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.985; p.life -= p.decay; p.spin += 0.2;
    ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.col;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
    if (p.star) { const s = p.size * 1.6; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.3, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.3, 0); ctx.closePath(); ctx.fill(); }
    else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if (qParts.length) requestAnimationFrame(qDrawFx); else { qFxOn = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}
function qLevelUp(from, to) {
  qPlay('level');
  const chips = ['pushups', 'plank', 'curls'].map(id => { const e = qEx(id), u = e.kind === 'time' ? ' s' : ''; return `<span>${e.name}<b class="num">${qAmount(e, from)}${u} → ${qAmount(e, to)}${u}</b></span>`; });
  const el = document.createElement('div'); el.className = 'qm-levelup'; el.dataset.act = 'q-level-close';
  el.innerHTML = `<div class="qm-rays"></div><div class="qm-lvl-inner"><div class="qm-caps">Level up</div><div class="qm-big num">${to}</div>
    <div class="qm-lore" style="font-size:22px;color:var(--q-gold)">${qRank(to)}</div><div class="qm-harder">${chips.join('')}</div></div>`;
  document.body.appendChild(el);
  qBurst(innerWidth / 2, innerHeight * 0.42, 150, 1.4); setTimeout(() => qBurst(innerWidth / 2, innerHeight * 0.42, 90, 1.1), 500);
}
let qToastT = null;
function qToast(q) {
  let t = document.getElementById('qm-toast');
  if (!t) { t = document.createElement('div'); t.id = 'qm-toast'; t.className = 'qm-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = `${qMarker('!', 30)}<span class="qm-lore">${qEx(q.exId).quest}</span>${q.elite ? '<span class="qm-bonus qm-elite-tag">Elite</span>' : ''}`;
  t.classList.add('show'); clearTimeout(qToastT); qToastT = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ---------- screens ---------- */
// a gold "!" (quest available) or "?" (ready to turn in), with a dark outline like an MMO quest marker
function qMarker(ch, h = 48, cls = '') {
  const id = 'qg' + Math.random().toString(36).slice(2, 7);
  const glyph = ch === '!'
    ? '<path d="M15 4 h18 l-3 40 h-12 z"/><circle cx="24" cy="56" r="8"/>'
    : '<path d="M10 20 C10 4 38 4 38 20 C38 30 28 31 28 40 l0 4 h-10 v-5 C18 28 28 27 28 20 C28 15 20 15 20 21 z"/><circle cx="23" cy="56" r="7.5"/>';
  return `<svg class="qm-marker ${cls}" width="${h * 0.75}" height="${h}" viewBox="0 0 48 66" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a6"/><stop offset="0.45" stop-color="#f6c744"/><stop offset="1" stop-color="#c58a0e"/></linearGradient></defs>
    <g fill="url(#${id})" stroke="#2a1a03" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${glyph}</g></svg>`;
}
const Q_ICON = {
  hourglass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 21h12M7 3c0 5 10 6 10 9s-10 4-10 9M17 3c0 5-10 6-10 9s10 4 10 9"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5L20 6.5"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/></svg>',
  gem: '<svg class="qm-gem" viewBox="0 0 24 24"><path d="M12 2l8 7-8 13-8-13z" fill="#f6c744" stroke="#6b4a06" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 9h16M12 2l-3 7 3 13 3-13z" fill="none" stroke="#6b4a06" stroke-width="1.2"/></svg>',
  tab: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2.5h4l-.8 12h-2.4z"/><circle cx="12" cy="19" r="2.4"/></svg>',
};

function qHeroHtml() {
  const h = qHero(), need = qXpNeed(h.level);
  return `<div class="qm-hero">
    <div class="qm-portrait"><b class="num qm-hero-level">${h.level}</b></div>
    <div class="qm-xp"><div class="qm-xp-top"><b class="qm-hero-rank">${qRank(h.level)}</b><span class="num qm-hero-xp">${h.xp} / ${need} XP</span></div>
      <div class="qm-xp-track"><div class="qm-xp-fill" style="width:${h.xp / need * 100}%"></div></div></div></div>`;
}
function qPaintHero(glow) {
  const h = qHero(), need = qXpNeed(h.level);
  document.querySelectorAll('.qm-xp-fill').forEach(f => { f.style.width = h.xp / need * 100 + '%'; });
  document.querySelectorAll('.qm-hero-level').forEach(e => { e.textContent = h.level; });
  document.querySelectorAll('.qm-hero-rank').forEach(e => { e.textContent = qRank(h.level); });
  document.querySelectorAll('.qm-hero-xp').forEach(e => { e.textContent = `${h.xp} / ${need} XP`; });
  if (glow) document.querySelectorAll('.qm-xp-track').forEach(t => { t.classList.add('glow'); setTimeout(() => t.classList.remove('glow'), 700); });
}
function qDockHtml() { return qHeroHtml(); }

// on Plate Log's home screen while quest mode runs
function qResumeBanner() {
  if (!S.quest) return '';
  const n = S.quest.waiting.length;
  return `<button class="resume qm-resume" data-act="quests">${qMarker('!', 26)}
    <span class="grow"><b>Quest mode running</b><br><span class="meta">${n ? n + ' quest' + (n === 1 ? '' : 's') + ' waiting' : 'Started ' + fmtTime(S.quest.start)} · tap to return</span></span>
    <span class="chev">${ICON.chev}</span></button>`;
}

function screenQuests() {
  const Q = S.quest;
  if (!Q) return qBoard();
  const [first, ...rest] = Q.waiting;
  return `<div class="qm">
  <div class="qm-top">
    <button class="icon-btn" data-act="home" aria-label="Back to workouts">${ICON.back}</button>
    <button class="qm-end" data-act="q-end">End</button>
    <span class="grow"></span>
    <div class="qm-pill" title="Next quest"><span class="qm-hg" id="qm-hg"><span>${Q_ICON.hourglass}</span></span><b class="num" id="qm-next">${qClock((Q.plan[0] ? Q.plan[0].at : Date.now()) - Date.now())}</b></div>
    <button class="icon-btn" data-act="q-sound" aria-label="${S.sound ? 'Mute sounds' : 'Turn sounds on'}">${S.sound ? ICON.soundOn : ICON.soundOff}</button>
  </div>
  ${first ? qScroll(first) : `<div class="qm-idle"><div class="qm-ring" id="qm-ring"><div><span class="eyebrow">Next quest</span><b class="num" id="qm-idle-clock">${qClock(Q.plan[0].at - Date.now())}</b></div></div><p>Go play. It'll call you.</p></div>`}
  ${rest.length ? `<div class="qm-stack"><span class="qm-mini">${rest.slice(0, 3).map(() => '<span></span>').join('')}</span><span><b class="num">${rest.length}</b> more waiting</span></div>` : ''}
  <div class="qm-played meta num">Played <span id="qm-played">${qClock(Date.now() - Q.start)}</span> · ${Q.done.length} done · +${Q.xp} XP</div>
  </div>`;
}

function qScroll(q) {
  const ex = qEx(q.exId), now = Date.now();
  const t = qTimer && qTimer.id === q.id ? qTimer : null;
  const fresh = !qShown.has(q.id); qShown.add(q.id);
  const waited = Math.floor((now - q.at) / 60000), swift = now - q.at <= Q_SWIFT_MS;
  const xp = Q_CAT_XP[ex.cat] * (q.elite ? 2 : 1);
  qCheer = false; requestAnimationFrame(qSpriteRun);
  const count = ex.kind === 'reps' ? `0<small>/${q.amount}</small>` : qClock(t ? (t.total - (performance.now() - t.start) / 1000) * 1000 : qSecs(q) * 1000);
  return `<div class="qm-wrap">
    ${qMarker(t ? '?' : '!', 64, 'bob')}
    <article class="qm-scroll ${q.elite ? 'elite' : ''} ${fresh ? 'fresh' : ''}" id="qm-scroll">
      ${q.elite ? '<span class="qm-ribbon">Elite</span>' : ''}
      <h2 class="qm-title">${ex.quest}</h2>
      <div class="qm-pic"><canvas id="qm-sprite" width="32" height="32" data-ex="${ex.id}" role="img" aria-label="${ex.name}"></canvas></div>
      <div class="qm-objective">
        <div class="qm-obj-row" id="qm-obj-row">
          <span class="qm-box">${Q_ICON.check}</span>
          <span class="qm-obj-name">${ex.name}${ex.each ? ` <span class="qm-each">each ${ex.each}</span>` : ''}</span>
          <span class="qm-obj-count num" id="qm-obj-count">${count}</span>
        </div>
        ${t ? '<div class="qm-obj-bar"><div id="qm-obj-bar"></div></div>' : ''}
      </div>
      ${t && ex.each ? '<div class="qm-side" id="qm-side">First side</div>' : ''}
      <p class="qm-how">${ex.how}</p>
      <div class="qm-reward">${Q_ICON.gem}<span class="num">${xp} XP</span>${swift ? `<span class="qm-bonus" id="qm-swift">+${Q_SWIFT_XP} swift</span>` : waited ? `<span class="qm-bonus">waited ${fmtDur(waited * 60000)}</span>` : ''}</div>
      <div class="qm-actions">
        ${ex.kind === 'time'
          ? (t ? `<button class="qm-btn qm-seal" data-act="q-complete" data-q="${q.id}">Turn in early</button>` : `<button class="qm-btn qm-seal" data-act="q-begin" data-q="${q.id}">Begin</button>`)
          : `<button class="qm-btn qm-seal" data-act="q-complete" data-q="${q.id}">Complete</button>`}
        ${t ? `<button class="qm-round" data-act="q-stop" aria-label="Stop the timer">${Q_ICON.stop}</button>`
            : `<button class="qm-round" data-act="q-swap" data-q="${q.id}" aria-label="Swap for another exercise" ${q.swapped ? 'disabled' : ''}>${Q_ICON.swap}</button>`}
      </div>
    </article>
  </div>`;
}

function qBoard() {
  const last = (S.questLog || [])[(S.questLog || []).length - 1];
  const iv = S.questInterval || 30;
  return `<div class="qm">
  <div class="topbar"><div class="brand">Quests</div></div>
  <section class="qm-board">
    ${qMarker('!', 76, 'bob')}
    <h2 class="qm-caps">Quest Mode</h2>
    <p>A quest every ${iv} min while you play</p>
    <div class="qm-seg" role="group" aria-label="Quest interval">${Q_INTERVALS.map(m => `<button class="${iv === m ? 'on' : ''}" data-act="q-interval" data-m="${m}" aria-pressed="${iv === m}">${m} min</button>`).join('')}</div>
    ${qHeroHtml()}
    <button class="qm-btn qm-gold" data-act="q-start" ${S.active ? 'disabled' : ''}>${S.active ? 'Finish your workout first' : 'Start quest mode'}</button>
  </section>
  ${last ? `<p class="meta qm-last">Last session ${fmtDate(last.start)} · ${last.done} quest${last.done === 1 ? '' : 's'} · +${last.xp} XP</p>` : ''}
  </div>`;
}

function screenQuestSummary() {
  const e = view.questSummary;
  return `<div class="qm">
  <div class="qm-victory">${qMarker('?', 70, 'bob')}<h2 class="qm-caps">Victory</h2><span class="meta">${fmtDur(e.end - e.start)} played · saved to History</span></div>
  <div class="qm-tiles">
    <div class="qm-tile"><b class="num">${e.done}</b><span>Quests</span></div>
    <div class="qm-tile"><b class="num" style="color:var(--q-gold)">+${e.xp}</b><span>XP</span></div>
    <div class="qm-tile"><b class="num">${e.missed}</b><span>Left waiting</span></div>
  </div>
  ${e.to > e.from ? `<div class="qm-lvl-note">${qHeroHtml()}</div>` : ''}
  ${e.quests.length ? `<div class="qm-loot">${e.quests.map(q => `<div>${Q_ICON.gem}<span class="qm-lore">${qEx(q.exId).quest}</span>${q.elite ? '<span class="qm-bonus qm-elite-tag">Elite</span>' : ''}<span class="qm-xpv num">+${q.gain}</span></div>`).join('')}</div>` : ''}
  <div class="qm-row2"><button class="btn btn-ghost" data-act="quests">Done</button><button class="qm-btn qm-gold" data-act="history">History</button></div>
  </div>`;
}

function qSheetEnd() {
  const n = S.quest.waiting.length;
  return `
  <div class="sheet-head"><div><h2>End quest mode?</h2><div class="meta">${S.quest.done.length} done · +${S.quest.xp} XP${n ? ` · ${n} still waiting` : ''}</div></div></div>
  <button class="qm-btn qm-gold" data-act="q-end-yes">End session</button>
  <button class="btn btn-ghost btn-block" data-act="close-sheet">Keep playing</button>`;
}
function qSheetDetail() {
  const e = (S.questLog || []).find(x => x.id === sheet.id); if (!e) return '';
  return `
  <div class="sheet-head" style="justify-content:flex-start;align-items:center">${qMarker('!', 34)}<div><h2>Quest mode</h2><div class="meta">${fmtDate(e.start)} · ${fmtTime(e.start)}–${fmtTime(e.end)} · ${fmtDur(e.end - e.start)}</div></div></div>
  <div class="qm-tiles">
    <div class="qm-tile"><b class="num">${e.done}</b><span>Quests</span></div>
    <div class="qm-tile"><b class="num" style="color:var(--q-gold)">+${e.xp}</b><span>XP</span></div>
    <div class="qm-tile"><b class="num">${e.missed}</b><span>Left waiting</span></div>
  </div>
  <div>${e.quests.map(q => { const ex = qEx(q.exId); return `<div class="detail-ex"><b>${ex ? ex.quest : q.exId}${q.elite ? ' · Elite' : ''}</b><span class="sets num">${fmtTime(q.at)} · ${ex ? ex.name : ''} ${q.amount}${ex && ex.kind === 'time' ? ' s' : ''}${ex && ex.each ? ' each ' + ex.each : ''} · +${q.gain} XP</span></div>`; }).join('') || '<div class="empty">No quests turned in.</div>'}</div>`;
}

// keeps the clocks, the timed-quest countdown and the swift bonus up to date
function qTick() {
  const Q = S.quest; if (!Q || view.screen !== 'quests') return;
  const now = Date.now();
  const next = Q.plan[0] ? Q.plan[0].at : now, left = next - now;
  const p = (1 - left / (Q.interval * 60000)) * 100 + '%';
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('qm-next', qClock(left)); set('qm-idle-clock', qClock(left)); set('qm-played', qClock(now - Q.start));
  ['qm-hg', 'qm-ring'].forEach(id => { const el = document.getElementById(id); if (el) el.style.setProperty('--p', p); });
  const q = Q.waiting[0];
  if (q && !qTimer && now - q.at > Q_SWIFT_MS && document.getElementById('qm-swift')) render();   // the swift bonus ran out
  if (q && qTimer && qTimer.id === q.id) {
    const t = qTimer, ex = qEx(q.exId);
    const el = (performance.now() - t.start) / 1000, remain = t.total - el;
    set('qm-obj-count', qClock(remain * 1000));
    const bar = document.getElementById('qm-obj-bar'); if (bar) bar.style.width = Math.min(100, el / t.total * 100) + '%';
    if (ex.each && !t.sided && el >= t.total / 2) { t.sided = true; qPlay('side'); set('qm-side', 'Switch sides!'); }
    const sec = Math.ceil(remain);
    if (sec <= 3 && sec > 0 && t.ticked !== sec) { t.ticked = sec; qPlay('tick'); }
    if (remain <= 0) qComplete(q.id);
  }
}
setInterval(() => { if (qTimer) qTick(); }, 100);

// clicks on quest-mode controls; returns true when it handled one
function qHandle(act, t) {
  const id = +t.dataset.q;
  switch (act) {
    case 'quests': view.screen = 'quests'; render(); scrollTo(0, 0); return true;
    case 'q-start': qStart(); return true;
    case 'q-interval': S.questInterval = +t.dataset.m; save(); render(); return true;
    case 'q-sound': S.sound = !S.sound; save(); if (S.sound) { ensureAudio(); qPlay('tick'); } render(); return true;
    case 'q-complete': qComplete(id); return true;
    case 'q-begin': ensureAudio(); qTimer = { id, start: performance.now(), total: qSecs(S.quest.waiting.find(x => x.id === id)), sided: false, ticked: 0 }; render(); return true;
    case 'q-stop': qTimer = null; render(); return true;
    case 'q-swap': qSwap(id); return true;
    case 'q-end': sheet = { type: 'q-end' }; renderSheet(); return true;
    case 'q-end-yes': qEnd(); return true;
    case 'q-detail': sheet = { type: 'q-detail', id: t.dataset.id }; renderSheet(); return true;
    case 'q-level-close': t.remove(); return true;
  }
  return false;
}
