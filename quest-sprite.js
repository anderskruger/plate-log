/* ---------- Quest sprites: a little pixel hero acting out each quest ----------
   One side-view rig (64 × 64 units, floor at y = 58, the hero faces right). A pose gives the torso angle (t), a head
   tilt (hd) and, per limb, either two angles (a) or a target for the hand/foot (to, or toJ + off: a point relative to
   another joint). Angles: 0 points down, 90 right (forward), 180 up. Each exercise moves back and forth between its
   two poses a and b. Drawn at 32 × 32 pixels with a dark outline, then scaled up by CSS. */

const QSprite = (() => {
  const FLOOR = 58, VIEW = { x: 4, y: 6, size: 56 }, RES = 32;
  const LEN = { torso: 15, neck: 6, up: 9, fore: 8, thigh: 11, shin: 11, foot: 3.5, fingers: 2.6 };
  const PAL = {
    skin: '#eab48a', skinF: '#b97f5a', tunic: '#3f8a3c', tunicF: '#2a5e29', pants: '#7a5232', pantsF: '#4f3520',
    boot: '#3a2914', bootF: '#2a1d0f', hair: '#6b3b16', belt: '#f6c744', iron: '#aab3bd', ironF: '#646d78',
    wood: '#8a5a2b', woodD: '#5e3b1a', stone: '#646a78', stoneD: '#474c58', sun: '#f6c744', sunD: '#e09a22',
    outline: '#1c130b', ground: '#3b2f24', groundTop: '#5a4632',
  };

  const dir = a => [Math.sin(a * Math.PI / 180), Math.cos(a * Math.PI / 180)];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const mul = (p, k) => [p[0] * k, p[1] * k];
  const len = p => Math.hypot(p[0], p[1]);
  const angleOf = v => Math.atan2(v[0], v[1]) * 180 / Math.PI;
  function lerp(a, b, s) {
    if (b == null) return a;
    if (typeof a === 'number') return a + (b - a) * s;
    if (Array.isArray(a)) return a.map((x, i) => lerp(x, b[i], s));
    if (a && typeof a === 'object') { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], s); return o; }
    return a;
  }

  const STAND = { t: 180, hd: 0, legs: { n: { a: [4, -1] }, f: { a: [-5, 1] } } };
  const FEET = { n: { to: [33, 56.6], bend: -1 }, f: { to: [29, 56.6], bend: -1 } };
  const SEAT = { hip: [24, 45.2], legs: { n: { to: [36, 56.6], bend: -1 }, f: { to: [34, 56.6], bend: -1 } } };

  const EX = {
    pushups: { ms: 1700,
      a: { pin: { j: 'An', at: [9, 55.2] }, t: 113, hd: 12, legs: { n: { a: [-67, -67] }, f: { a: [-67, -67] } },
           arms: { n: { to: [44, 57], bend: 1 }, f: { to: [42, 57], bend: 1 } } },
      b: { pin: { j: 'An', at: [9, 55.2] }, t: 99, hd: 14, legs: { n: { a: [-81, -81] }, f: { a: [-81, -81] } },
           arms: { n: { to: [44, 57], bend: 1 }, f: { to: [42, 57], bend: 1 } } } },
    situps: { ms: 2400,
      a: { hip: [34, 54.6], t: -90, hd: 0, legs: { n: { to: [51, 56.4], bend: -1 }, f: { to: [49, 56.4], bend: -1 } },
           arms: { n: { a: [118, 100] }, f: { a: [112, 96] } } },
      b: { hip: [34, 54.6], t: -152, hd: -22, legs: { n: { to: [51, 56.4], bend: -1 }, f: { to: [49, 56.4], bend: -1 } },
           arms: { n: { a: [112, 98] }, f: { a: [106, 94] } } } },
    squats: { ms: 2200,
      a: { hip: [30, 35], t: 180, hd: 0, legs: FEET, arms: { n: { a: [5, 8] }, f: { a: [-5, -3] } } },
      b: { hip: [23, 45.5], t: 155, hd: 20, legs: FEET, arms: { n: { a: [88, 90] }, f: { a: [84, 86] } } } },
    plank: { ms: 3200,
      a: { pin: { j: 'An', at: [9, 55.2] }, t: 101, hd: 10, legs: { n: { a: [-79, -79] }, f: { a: [-79, -79] } },
           arms: { n: { a: [0, 90] }, f: { a: [0, 88] } } },
      b: { pin: { j: 'An', at: [9, 55.2] }, t: 102.5, hd: 5, legs: { n: { a: [-77.5, -77.5] }, f: { a: [-77.5, -77.5] } },
           arms: { n: { a: [0, 90] }, f: { a: [0, 88] } } } },
    wallsit: { ms: 2600, props: ['wall'],
      a: { hip: [22, 44.2], t: 180, hd: 0, legs: { n: { to: [33.5, 56.6], bend: -1 }, f: { to: [31.5, 56.6], bend: -1 } },
           arms: { n: { a: [40, 95] }, f: { a: [35, 90] } } },
      b: { hip: [22, 44.7], t: 180, hd: -5, legs: { n: { to: [33.5, 56.6], bend: -1 }, f: { to: [31.5, 56.6], bend: -1 } },
           arms: { n: { a: [45, 95] }, f: { a: [40, 90] } } } },
    bridges: { ms: 2200,
      a: { pin: { j: 'S', at: [15.5, 54.6] }, t: -90, hd: 0, legs: { n: { to: [43, 56.6], bend: -1 }, f: { to: [41, 56.6], bend: -1 } },
           arms: { n: { a: [88, 90] }, f: { a: [86, 88] } } },
      b: { pin: { j: 'S', at: [15.5, 54.6] }, t: -60, hd: -30, legs: { n: { to: [43, 56.6], bend: -1 }, f: { to: [41, 56.6], bend: -1 } },
           arms: { n: { a: [88, 90] }, f: { a: [86, 88] } } } },
    curls: { ms: 2000, db: { side: 'n' },
      a: { hip: [30, 34.8], ...STAND, arms: { n: { a: [6, 10] }, f: { a: [-6, -4] } } },
      b: { hip: [30, 34.8], ...STAND, t: 182, hd: -4, arms: { n: { a: [14, 168] }, f: { a: [-6, -4] } } } },
    goblet: { ms: 2400, db: { side: 'n', rot: 90 },
      a: { hip: [30, 35], t: 180, hd: 0, legs: FEET, arms: { n: { a: [25, 160], rel: true }, f: { a: [20, 158], rel: true } } },
      b: { hip: [23, 45.5], t: 160, hd: 14, legs: FEET, arms: { n: { a: [25, 160], rel: true }, f: { a: [20, 158], rel: true } } } },
    rows: { ms: 2000, db: { side: 'n' }, props: ['desk'],
      a: { hip: [22, 36.5], t: 105, hd: 8, legs: { n: { to: [27, 56.6], bend: -1 }, f: { to: [16, 56.6], bend: -1 } },
           arms: { n: { a: [0, 0] }, f: { to: [45, 40.3], bend: 1 } } },
      b: { hip: [22, 36.5], t: 105, hd: 8, legs: { n: { to: [27, 56.6], bend: -1 }, f: { to: [16, 56.6], bend: -1 } },
           arms: { n: { a: [-125, 5] }, f: { to: [45, 40.3], bend: 1 } } } },
    press: { ms: 2000, db: { side: 'n' }, view: { x: 2, y: 1, size: 60 },
      a: { hip: [30, 36], t: 180, hd: 0, legs: FEET, arms: { n: { a: [15, 170] }, f: { a: [-25, 30] } } },
      b: { hip: [30, 36], t: 180, hd: 4, legs: FEET, arms: { n: { a: [176, 180] }, f: { a: [-25, 30] } } } },
    rdl: { ms: 2400, db: { side: 'n' },
      a: { hip: [30, 35], t: 180, hd: 0, legs: FEET, arms: { n: { a: [2, 2] }, f: { a: [0, 0] } } },
      b: { hip: [25, 37.5], t: 108, hd: 12, legs: FEET, arms: { n: { a: [2, 2] }, f: { a: [0, 0] } } } },
    neck: { ms: 4000, props: ['chair'],
      a: { ...SEAT, t: 180, hd: 0, arms: { n: { toJ: 'H', off: [-1.5, -4.5], bend: -1 }, f: { a: [-8, -4] } } },
      b: { ...SEAT, t: 180, hd: -28, arms: { n: { toJ: 'H', off: [-1.5, -4.5], bend: -1 }, f: { a: [-8, -4] } } } },
    wrists: { ms: 3600, props: ['chair'],
      a: { ...SEAT, t: 180, hd: -4, fingers: 172, arms: { n: { a: [84, 88] }, f: { toJ: 'Gn', off: [0, 0], bend: -1 } } },
      b: { ...SEAT, t: 180, hd: -8, fingers: 8, arms: { n: { a: [84, 88] }, f: { toJ: 'Gn', off: [0, 0], bend: -1 } } } },
    chest: { ms: 3800, props: ['door'],
      a: { hip: [27, 35], t: 180, hd: 0, legs: { n: { to: [33, 56.6], bend: -1 }, f: { to: [23, 56.6], bend: -1 } },
           arms: { n: { to: [19.6, 15], bend: -1 }, f: { to: [19.2, 15.5], bend: -1 } } },
      b: { hip: [30, 35.6], t: 172, hd: 8, legs: { n: { to: [33, 56.6], bend: -1 }, f: { to: [23, 56.6], bend: -1 } },
           arms: { n: { to: [19.6, 15], bend: -1 }, f: { to: [19.2, 15.5], bend: -1 } } } },
    hips: { ms: 4200,
      a: { hip: [29, 46.5], t: 180, hd: 0, legs: { n: { to: [42, 56.6], bend: -1 }, f: { to: [12, 56.5], bend: -1 } },
           arms: { n: { a: [28, 62] }, f: { a: [16, 52] } } },
      b: { hip: [31.5, 49], t: 188, hd: -6, legs: { n: { to: [42, 56.6], bend: -1 }, f: { to: [12, 56.5], bend: -1 } },
           arms: { n: { a: [172, 178] }, f: { a: [167, 175] } } } },
    twist: { ms: 4200, props: ['chair'],
      a: { ...SEAT, t: 180, hd: 0, turn: 0, arms: { n: { to: [34.5, 43.8], bend: -1 }, f: { to: [33, 44.3], bend: -1 } } },
      b: { ...SEAT, t: 178, hd: 0, turn: 1, arms: { n: { to: [19.5, 37], bend: -1 }, f: { to: [34, 44], bend: -1 } } } },
    catcow: { ms: 3600,
      a: { hip: [22, 46], t: 113.6, hd: 30, arch: -5, legs: { n: { a: [0, -90] }, f: { a: [2, -88] } },
           arms: { n: { a: [0, 0] }, f: { a: [2, 2] } } },
      b: { hip: [22, 46], t: 113.6, hd: -35, arch: 6.5, legs: { n: { a: [0, -90] }, f: { a: [2, -88] } },
           arms: { n: { a: [0, 0] }, f: { a: [2, 2] } } } },
    walk: { ms: 900,
      a: { hip: [30, 35.2], t: 178, hd: 0, legs: { n: { a: [24, 4] }, f: { a: [-22, -36] } }, arms: { n: { a: [-24, -12] }, f: { a: [22, 38] } } },
      b: { hip: [30, 35.2], t: 178, hd: 0, legs: { n: { a: [-22, -36] }, f: { a: [24, 4] } }, arms: { n: { a: [22, 38] }, f: { a: [-24, -12] } } } },
    eyes: { ms: 4000, props: ['sun'],
      a: { hip: [26, 34.8], ...STAND, arms: { n: { toJ: 'H', off: [3.6, -3.2], bend: 1 }, f: { a: [-4, -2] } } },
      b: { hip: [26, 34.8], ...STAND, hd: 8, arms: { n: { toJ: 'H', off: [3.6, -3.2], bend: 1 }, f: { a: [-4, -2] } } } },
    // ---- office mode: standing, seated and walking ----
    hipstand: { ms: 4200,
      a: { hip: [28, 38], t: 180, hd: 0, legs: { n: { to: [38.5, 56.6], bend: -1 }, f: { to: [14.5, 56.6], bend: -1 } },
           arms: { n: { toJ: 'P', off: [2.5, -1.5], bend: 1 }, f: { toJ: 'P', off: [1.5, -1], bend: 1 } } },
      b: { hip: [30.5, 40], t: 186, hd: -4, legs: { n: { to: [38.5, 56.6], bend: -1 }, f: { to: [14.5, 56.6], bend: -1 } },
           arms: { n: { toJ: 'P', off: [2.5, -1.5], bend: 1 }, f: { toJ: 'P', off: [1.5, -1], bend: 1 } } } },
    catcowseat: { ms: 3600, props: ['chair'],
      a: { ...SEAT, t: 176, hd: 22, arch: -4, arms: { n: { toJ: 'Kn', off: [0, -1.5], bend: -1 }, f: { toJ: 'Kf', off: [0, -1.5], bend: -1 } } },
      b: { ...SEAT, t: 172, hd: -30, arch: 5, arms: { n: { toJ: 'Kn', off: [0, -1.5], bend: -1 }, f: { toJ: 'Kf', off: [0, -1.5], bend: -1 } } } },
    shoulders: { ms: 1600, props: ['chair'],
      a: { ...SEAT, t: 180, hd: 0, shrug: [0, 1], arms: { n: { a: [6, 40] }, f: { a: [2, 36] } } },
      b: { ...SEAT, t: 180, hd: 0, shrug: [2.4, -1.6], arms: { n: { a: [2, 36] }, f: { a: [-2, 32] } } } },
    chintuck: { ms: 2600, props: ['chair'],
      a: { ...SEAT, t: 180, hd: 0, chin: 1, arms: { n: { toJ: 'Kn', off: [-2, -1.5], bend: -1 }, f: { toJ: 'Kf', off: [-2, -1.5], bend: -1 } } },
      b: { ...SEAT, t: 180, hd: 6, chin: -2.2, arms: { n: { toJ: 'Kn', off: [-2, -1.5], bend: -1 }, f: { toJ: 'Kf', off: [-2, -1.5], bend: -1 } } } },
    quad: { ms: 4000, props: ['chairF'],
      a: { hip: [30, 34.8], t: 180, hd: 0, legs: { n: { a: [-2, -150] }, f: { a: [-1, 0] } },
           arms: { n: { toJ: 'An', off: [0, 0], bend: 1 }, f: { to: [41, 29.6], bend: 1 } } },
      b: { hip: [30, 34.8], t: 182, hd: -3, legs: { n: { a: [-12, -172] }, f: { a: [-1, 0] } },
           arms: { n: { toJ: 'An', off: [0, 0], bend: 1 }, f: { to: [41, 29.6], bend: 1 } } } },
    hamstring: { ms: 4000,
      a: { hip: [27, 36], t: 180, hd: 0, legs: { n: { to: [40, 56.4], bend: -1 }, f: { to: [25, 56.6], bend: -1 } },
           arms: { n: { toJ: 'Kf', off: [0.5, -2.5], bend: -1 }, f: { toJ: 'Kf', off: [-0.5, -2], bend: -1 } } },
      b: { hip: [25, 38.5], t: 128, hd: 14, legs: { n: { to: [40, 56.4], bend: -1 }, f: { to: [25, 56.6], bend: -1 } },
           arms: { n: { toJ: 'Kf', off: [1.5, -1.5], bend: -1 }, f: { toJ: 'Kf', off: [0.5, -1], bend: -1 } } } },
    figure4: { ms: 4200, props: ['chair'],
      a: { hip: [24, 45.2], t: 180, hd: 0, legs: { n: { toJ: 'Kf', off: [0.5, -2.6], bend: -1 }, f: { to: [36, 56.6], bend: -1 } },
           arms: { n: { toJ: 'Kn', off: [0, -1.5], bend: -1 }, f: { toJ: 'An', off: [0, -1], bend: -1 } } },
      b: { hip: [24, 45.2], t: 158, hd: 14, legs: { n: { toJ: 'Kf', off: [0.5, -2.6], bend: -1 }, f: { to: [36, 56.6], bend: -1 } },
           arms: { n: { toJ: 'Kn', off: [0, -1.5], bend: -1 }, f: { toJ: 'An', off: [0, -1], bend: -1 } } } },
    upperback: { ms: 3600,
      a: { hip: [30, 34.8], ...STAND, arms: { n: { a: [86, 90] }, f: { a: [84, 88] } } },
      b: { hip: [28.5, 35.3], ...STAND, hd: -26, arch: 4.5, arms: { n: { a: [98, 96] }, f: { a: [96, 94] } } } },
    sidereach: { ms: 4000, view: { x: 2, y: 1, size: 60 },
      a: { hip: [30, 34.8], ...STAND, arms: { n: { a: [176, 180] }, f: { a: [174, 178] } } },
      b: { hip: [30.5, 34.8], ...STAND, t: 168, hd: -6, arch: -2, arms: { n: { a: [160, 166] }, f: { a: [158, 164] } } } },
    prayer: { ms: 3600,
      a: { hip: [30, 34.8], ...STAND, fingers: 180, arms: { n: { toJ: 'S', off: [6.5, 3], bend: -1 }, f: { toJ: 'S', off: [6.2, 3.3], bend: -1 } } },
      b: { hip: [30, 34.8], ...STAND, hd: -4, fingers: 178, arms: { n: { toJ: 'S', off: [6.5, 9.5], bend: -1 }, f: { toJ: 'S', off: [6.2, 9.8], bend: -1 } } } },
    calves: { ms: 1600, props: ['chairF'],
      a: { hip: [30, 34.8], t: 180, hd: 0, fa: 0, legs: { n: { a: [2, 0] }, f: { a: [-2, 0] } },
           arms: { n: { to: [41.5, 29.6], bend: 1 }, f: { to: [41, 29.8], bend: 1 } } },
      b: { hip: [30, 32.3], t: 180, hd: 0, fa: -48, legs: { n: { a: [2, 0] }, f: { a: [-2, 0] } },
           arms: { n: { to: [41.5, 29.6], bend: 1 }, f: { to: [41, 29.8], bend: 1 } } } },
    stairs: { ms: 1500, props: ['stairs'],
      a: { hip: [30, 36], t: 176, hd: 0, legs: { n: { to: [38.5, 51.9], bend: -1 }, f: { to: [27, 56.6], bend: -1 } },
           arms: { n: { a: [-20, -10] }, f: { a: [18, 34] } } },
      b: { hip: [36, 31], t: 174, hd: 0, legs: { n: { to: [39, 51.9], bend: -1 }, f: { to: [44, 46.4], bend: -1 } },
           arms: { n: { a: [20, 36] }, f: { a: [-18, -8] } } } },
    deskpush: { ms: 1800, props: ['desk'],
      a: { pin: { j: 'An', at: [9, 55] }, t: 140, hd: 8, legs: { n: { a: [-40, -40] }, f: { a: [-40, -40] } },
           arms: { n: { to: [42, 40.2], bend: 1 }, f: { to: [41, 40.2], bend: 1 } } },
      b: { pin: { j: 'An', at: [9, 55] }, t: 128, hd: 10, legs: { n: { a: [-52, -52] }, f: { a: [-52, -52] } },
           arms: { n: { to: [42, 40.2], bend: 1 }, f: { to: [41, 40.2], bend: 1 } } } },
    cheer: { ms: 700,
      a: { hip: [30, 37], t: 180, hd: 0, legs: { n: { to: [33, 56.6], bend: -1 }, f: { to: [28, 56.6], bend: -1 } },
           arms: { n: { a: [125, 140] }, f: { a: [-125, -140] } } },
      b: { hip: [30, 35], t: 180, hd: 6, legs: { n: { to: [32, 55], bend: -1 }, f: { to: [28, 55], bend: -1 } },
           arms: { n: { a: [138, 150] }, f: { a: [-138, -150] } } } },
  };

  function limb(J, root, spec, l1, l2, tilt = 0) {
    if (spec.a) { const j1 = add(root, mul(dir(spec.a[0] + tilt), l1)); return [j1, add(j1, mul(dir(spec.a[1] + tilt), l2))]; }
    const to = spec.toJ ? add(J[spec.toJ], spec.off) : spec.to;
    const v = sub(to, root), d0 = Math.max(len(v), 0.001), u = mul(v, 1 / d0);
    const d = Math.min(Math.max(d0, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    return [add(add(root, mul(u, a)), mul([-u[1] * (spec.bend || 1), u[0] * (spec.bend || 1)], h)), add(root, mul(u, d))];
  }

  function solve(p) {
    const J = { P: [0, 0] };
    // shrug: [up, forward] nudge of the shoulders; chin: head pushed forward (+) or tucked back (-)
    const up = dir(p.t), fwd = [-up[1], up[0]], hu = dir(p.t + p.hd), hf = [-hu[1], hu[0]], sh = p.shrug || [0, 0];
    J.S = add(add(J.P, mul(up, LEN.torso + sh[0])), mul(fwd, sh[1]));
    J.H = add(add(J.S, mul(hu, LEN.neck)), mul(hf, p.chin || 0));
    for (const s of ['n', 'f']) if (p.legs[s].a) [J['K' + s], J['A' + s]] = limb(J, J.P, p.legs[s], LEN.thigh, LEN.shin);
    // place the body by the hip, or so that a pinned joint lands on its spot
    const d = p.pin ? sub(p.pin.at, J[p.pin.j]) : sub(p.hip, J.P);
    for (const k in J) J[k] = add(J[k], d);
    // far leg first, so a near foot can rest on the far knee (figure-four); fa tilts the foot (negative: on tiptoe)
    for (const s of ['f', 'n']) {
      if (!p.legs[s].a) [J['K' + s], J['A' + s]] = limb(J, J.P, p.legs[s], LEN.thigh, LEN.shin);
      J['T' + s] = add(J['A' + s], mul(dir(angleOf(sub(J['A' + s], J['K' + s])) + 90 + (p.fa || 0)), LEN.foot));
    }
    for (const s of ['n', 'f']) {
      const arm = p.arms[s];
      [J['E' + s], J['W' + s]] = limb(J, J.S, arm, LEN.up, LEN.fore, arm.rel ? p.t - 180 : 0);
      if (s === 'n') J.Gn = p.fingers != null ? add(J.Wn, mul(dir(p.fingers), LEN.fingers)) : J.Wn;
    }
    return J;
  }

  function draw(ctx, id, s = 0) {
    const ex = EX[id] || EX.walk, p = lerp(ex.a, ex.b, s), J = solve(p);
    const view = ex.view || VIEW, R = RES, k = R / view.size;
    const X = x => (x - view.x) * k, Y = y => (y - view.y) * k, floorRow = Math.round(Y(FLOOR));
    const props = new Array(R * R).fill(null), fig = new Array(R * R).fill(null);
    let buf = fig;
    const put = (i, j, c) => { if (i >= 0 && j >= 0 && i < R && j < floorRow) buf[j * R + i] = c; };
    const disc = (pt, r, c) => {
      const x = X(pt[0]), y = Y(pt[1]), rr = Math.max(r * k, 0.62);
      let hit = false;
      for (let j = Math.floor(y - rr); j <= Math.ceil(y + rr); j++)
        for (let i = Math.floor(x - rr); i <= Math.ceil(x + rr); i++)
          if ((i + 0.5 - x) ** 2 + (j + 0.5 - y) ** 2 <= rr * rr) { put(i, j, c); hit = true; }
      if (!hit) put(Math.floor(x), Math.floor(y), c);
    };
    const seg = (a, b, r, c) => { const n = Math.ceil(len(sub(b, a)) * k * 3) + 1; for (let t = 0; t <= n; t++) disc(lerp(a, b, t / n), r, c); };
    const rect = (x0, y0, x1, y1, c) => {
      for (let j = Math.floor(Y(y0)); j < Math.ceil(Y(y1)); j++) for (let i = Math.floor(X(x0)); i < Math.ceil(X(x1)); i++) {
        const cx = (i + 0.5) / k + view.x, cy = (j + 0.5) / k + view.y;
        if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) put(i, j, c);
      }
    };
    const C = PAL;

    // props, with their own outline so the hero stays readable in front of them
    buf = props;
    for (const pr of ex.props || []) {
      if (pr === 'chair') {
        rect(16.5, 30, 19, 49.6, C.wood); rect(17, 47.6, 33, 49.6, C.wood);
        rect(17.5, 49.6, 19, 58, C.woodD); rect(30.5, 49.6, 32, 58, C.woodD);
      } else if (pr === 'wall') {
        rect(0, 0, 18.5, 58, C.stone);
        for (let y = 4, row = 0; y < 58; y += 7, row++) {
          rect(0, y, 18.5, y + 1, C.stoneD);
          for (let x = row % 2 ? 3 : 9; x < 18; x += 12) rect(x, y, x + 1, y + 7, C.stoneD);
        }
      } else if (pr === 'chairF') {
        rect(40, 30, 42.5, 49.6, C.wood); rect(42, 47.6, 58, 49.6, C.wood);
        rect(41, 49.6, 42.5, 58, C.woodD); rect(55.5, 49.6, 57, 58, C.woodD);
      } else if (pr === 'stairs') {
        for (let i = 0; i < 4; i++) { const x = 36 + i * 6, y = 52.5 - i * 5.5; rect(x, y, 64, y + 1.2, C.stone); rect(x, y + 1.2, 64, 58, C.stoneD); }
      } else if (pr === 'desk') {
        rect(40, 40.6, 62, 43, C.wood); rect(41.5, 43, 43.2, 58, C.woodD); rect(57, 43, 58.7, 58, C.woodD);
      } else if (pr === 'door') {
        rect(0, 2, 18.4, 5.6, C.wood); rect(15, 5.6, 18.4, 58, C.wood); rect(17.4, 5.6, 18.4, 58, C.woodD);
      } else if (pr === 'sun') {
        disc([52, 15], 3.8, C.sun); disc([53, 16], 2.2, C.sunD);
      }
    }

    buf = fig;
    const legDraw = s => {
      const F = s === 'f' ? 'F' : '';
      seg(J.P, J['K' + s], 1.8, C['pants' + F]);
      seg(J['K' + s], J['A' + s], 1.6, C['pants' + F]);
      seg(lerp(J['K' + s], J['A' + s], 0.7), J['A' + s], 1.7, C['boot' + F]);
      seg(J['A' + s], J['T' + s], 1.3, C['boot' + F]);
    };
    const dumbbell = (s, rot = 0) => {
      const W = J['W' + s], fd0 = mul(sub(W, J['E' + s]), 1 / Math.max(len(sub(W, J['E' + s])), 0.001));
      const fd = rot ? dir(angleOf(fd0) + rot) : fd0, h = [-fd[1], fd[0]];
      seg(add(W, mul(h, -3.2)), add(W, mul(h, 3.2)), 0.7, C.ironF);
      for (const e of [-2.8, 2.8]) { const c = add(W, mul(h, e)); seg(add(c, mul(fd, -2.4)), add(c, mul(fd, 2.4)), 1.1, C.iron); }
    };
    const armDraw = s => {
      const F = s === 'f' ? 'F' : '';
      seg(J.S, J['E' + s], 1.6, C['tunic' + F]);
      seg(J['E' + s], J['W' + s], 1.35, C['skin' + F]);
      disc(J['W' + s], 1.5, C['skin' + F]);
      if (s === 'n' && p.fingers != null) seg(J.Wn, J.Gn, 0.9, C.skin);
      if (ex.db && ex.db.side === s) dumbbell(s, ex.db.rot);
    };
    const headDraw = () => {
      const up = dir(p.t + p.hd), face = (p.turn || 0) >= 0.5 ? -1 : 1, fwd = [-up[1] * face, up[0] * face], r = 4.4, H = J.H;
      seg(J.S, H, 1.3, C.skin);
      const x = X(H[0]), y = Y(H[1]), rr = r * k;
      for (let j = Math.floor(y - rr); j <= Math.ceil(y + rr); j++)
        for (let i = Math.floor(x - rr); i <= Math.ceil(x + rr); i++) {
          const rx = (i + 0.5 - x) / k, ry = (j + 0.5 - y) / k;
          if (rx * rx + ry * ry > r * r) continue;
          const u = rx * up[0] + ry * up[1], f = rx * fwd[0] + ry * fwd[1];
          put(i, j, (u > 0.4 && f < r * 0.45) || u > r * 0.6 ? C.hair : C.skin);
        }
      if (face > 0) { const e = add(add(H, mul(fwd, r * 0.5)), mul(up, -r * 0.05)); put(Math.floor(X(e[0])), Math.floor(Y(e[1])), C.outline); }
    };
    const torsoDraw = () => {
      // arch bends the back: positive rounds it away from the belly (cat), negative lets it sag (cow)
      const up = dir(p.t), fwd = [-up[1], up[0]], mid = add(lerp(J.P, J.S, 0.5), mul(fwd, -(p.arch || 0)));
      seg(J.P, mid, 2.7, C.tunic); seg(mid, J.S, 2.7, C.tunic);
      const bc = lerp(J.P, mid, 0.28), bd = dir(angleOf(sub(mid, J.P)) + 90);
      seg(add(bc, mul(bd, -2.4)), add(bc, mul(bd, 2.4)), 0.55, C.belt);
    };
    legDraw('f'); armDraw('f'); torsoDraw(); legDraw('n'); headDraw(); armDraw('n');

    const outline = b => {
      const filled = b.slice();
      for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
        if (filled[j * R + i]) continue;
        const nb = (a, c) => a >= 0 && c >= 0 && a < R && c < R && filled[c * R + a];
        if (nb(i - 1, j) || nb(i + 1, j) || nb(i, j - 1) || nb(i, j + 1)) b[j * R + i] = C.outline;
      }
    };
    outline(props); outline(fig);

    ctx.clearRect(0, 0, R, R);
    ctx.fillStyle = C.ground; ctx.fillRect(0, floorRow, R, R - floorRow);
    ctx.fillStyle = C.groundTop; ctx.fillRect(0, floorRow, R, 1);
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      const c = fig[j * R + i] || props[j * R + i];
      if (c) { ctx.fillStyle = c; ctx.fillRect(i, j, 1, 1); }
    }
  }

  // where in its back-and-forth an exercise is at time `now` (ms), stepped like sprite frames
  const phase = (id, now) => { const ms = (EX[id] || EX.walk).ms, p = (now % ms) / ms; return Math.round((0.5 - 0.5 * Math.cos(2 * Math.PI * p)) * 6) / 6; };

  return { RES, draw, phase, has: id => !!EX[id] };
})();
