/* ---------- Rank emblems: one pixel-art insignia per hero rank, Scout (1) to High Warlord (14) ----------
   Original art, drawn with code at 24 × 24 pixels: each emblem is a stack of shapes in a metal or color, shaded with
   a light top-left edge and a dark bottom-right edge, outlined, then scaled up by CSS. Lower ranks are chevrons on a
   red badge, the middle ranks shields, the top ranks crossed swords, stars and a tusked helm. */

const QRanks = (() => {
  const RES = 24, OUTLINE = '#140b08';
  // [highlight, base, shadow]
  const M = {
    bronze: ['#e8a86c', '#b8733a', '#74411d'], silver: ['#f4f7fa', '#b4bcc6', '#646d78'], gold: ['#fff1a6', '#f0bd45', '#a1720c'],
    red: ['#c4493b', '#8e231d', '#55110d'], black: ['#51464a', '#2b2326', '#170f11'], stone: ['#b2ada4', '#817b72', '#4f4a43'],
    blood: ['#ff7a62', '#d4261c', '#7e0e09'], ivory: ['#fffbea', '#e6dcbc', '#a39674'],
  };

  // shapes are point tests in 0..24 space
  const disc = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const poly = pts => (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const union = (...s) => (x, y) => s.some(f => f(x, y));
  const minus = (a, b) => (x, y) => a(x, y) && !b(x, y);
  const turn = (f, deg, cx = 12, cy = 12) => {
    const c = Math.cos(-deg * Math.PI / 180), s = Math.sin(-deg * Math.PI / 180);
    return (x, y) => f(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c);
  };
  const move = (f, dx, dy) => (x, y) => f(x - dx, y - dy);
  const scale = (f, k, cx = 12, cy = 12) => (x, y) => f(cx + (x - cx) / k, cy + (y - cy) / k);

  const chevron = (cy, w = 6.5, t = 2.4) => poly([[12 - w, cy + w * 0.62], [12, cy], [12 + w, cy + w * 0.62], [12 + w, cy + w * 0.62 + t], [12, cy + t], [12 - w, cy + w * 0.62 + t]]);
  const chevrons = (n, top, gap = 4.2, w, t) => union(...Array.from({ length: n }, (_, i) => chevron(top + i * gap, w, t)));
  const star = (cx, cy, R, r = R * 0.45) => poly(Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 - 90) * Math.PI / 180, d = i % 2 ? r : R; return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
  }));
  const BADGE = disc(12, 12, 10.35);
  const ring = (r0, r1) => minus(disc(12, 12, r1), disc(12, 12, r0));
  const SHIELD = poly([[3.6, 2.6], [20.4, 2.6], [20.4, 11], [17.8, 16.6], [12, 21.6], [6.2, 16.6], [3.6, 11]]);
  const SHIELD_IN = poly([[5.8, 4.7], [18.2, 4.7], [18.2, 10.7], [16, 15.2], [12, 18.8], [8, 15.2], [5.8, 10.7]]);
  const sword = union(poly([[10.6, 5.6], [12, 3.4], [13.4, 5.6], [13.4, 14.6], [10.6, 14.6]]), rect(7.8, 14.6, 16.2, 16.6), rect(11, 16.6, 13, 19.2), disc(12, 20.2, 1.6));
  const SWORDS = [turn(sword, -42), turn(sword, 42)];
  const drop = union(disc(12, 13.6, 3.4), poly([[12, 6], [15.1, 12.2], [8.9, 12.2]]));
  const spear = union(poly([[10.2, 9], [12, 4], [13.8, 9], [12, 10.4]]), rect(11.3, 9.6, 12.7, 19.4), rect(9.4, 9.6, 14.6, 10.8));
  const helm = (cy = 11.6) => minus(union(minus(disc(12, cy, 5.6), (x, y) => y > cy), rect(6.4, cy, 17.6, cy + 5)),
    union(rect(7.8, cy + 0.6, 10.9, cy + 1.9), rect(13.1, cy + 0.6, 16.2, cy + 1.9), rect(11.4, cy + 2.6, 12.6, cy + 5.2)));
  const tusks = (cy = 11.6) => union(
    minus(minus(disc(7.2, cy + 3.4, 4), disc(8.9, cy + 1.8, 3.8)), (x, y) => y < cy + 3),
    minus(minus(disc(16.8, cy + 3.4, 4), disc(15.1, cy + 1.8, 3.8)), (x, y) => y < cy + 3));
  const crown = poly([[7, 6.4], [7, 2.4], [9.3, 4.2], [12, 1.2], [14.7, 4.2], [17, 2.4], [17, 6.4]]);

  // one entry per rank: layers of [shape, metal]; every layer after the first gets a dark rim against what's below
  const EMBLEMS = [
    [[BADGE, 'red'], [chevron(8.8), 'bronze']],
    [[BADGE, 'red'], [chevrons(2, 6.6), 'bronze']],
    [[BADGE, 'red'], [chevrons(3, 4.6), 'bronze']],
    [[BADGE, 'red'], [ring(8.5, 10.35), 'bronze'], [chevrons(3, 5, 4, 5.6, 2.2), 'silver']],
    [[BADGE, 'red'], [ring(8.5, 10.35), 'silver'], [chevrons(3, 3.8, 3.8, 5.4, 2.1), 'silver'], [rect(7.4, 16.4, 16.6, 18.2), 'silver']],
    [[SHIELD, 'stone'], [SHIELD_IN, 'red'], [chevron(6.6, 5, 2.2), 'silver'], [rect(8, 12.4, 16, 14), 'silver']],
    [[SHIELD, 'red'], [SHIELD_IN, 'black'], [drop, 'blood']],
    [[SHIELD, 'silver'], [SHIELD_IN, 'red'], [spear, 'silver']],
    [[SHIELD, 'gold'], [SHIELD_IN, 'red'], [scale(helm(10.6), 0.95), 'silver']],
    [[BADGE, 'black'], [ring(8.7, 10.35), 'gold'], [scale(SWORDS[0], 0.86), 'gold'], [scale(SWORDS[1], 0.86), 'gold']],
    [[BADGE, 'black'], [ring(8.7, 10.35), 'gold'], [move(scale(SWORDS[0], 0.7), 0, 2.4), 'gold'], [move(scale(SWORDS[1], 0.7), 0, 2.4), 'gold'], [star(12, 6.4, 3.8), 'silver']],
    [[BADGE, 'black'], [ring(8.7, 10.35), 'gold'], [move(scale(SWORDS[0], 0.7), 0, 2.6), 'gold'], [move(scale(SWORDS[1], 0.7), 0, 2.6), 'gold'], [star(8.4, 7.2, 3.3), 'silver'], [star(15.6, 7.2, 3.3), 'silver']],
    [[SHIELD, 'gold'], [SHIELD_IN, 'black'], [helm(9.6), 'gold'], [tusks(9.6), 'ivory']],
    [[star(12, 12, 11.8, 8.4), 'gold'], [scale(SHIELD, 0.86, 12, 13), 'gold'], [scale(SHIELD_IN, 0.86, 12, 13), 'red'], [move(scale(helm(10), 0.86), 0, 2.2), 'gold'], [move(scale(tusks(10), 0.86), 0, 2.2), 'ivory'], [crown, 'gold'], [disc(12, 5.2, 0.9), 'blood']],
  ];

  function draw(ctx, rank) {
    const layers = EMBLEMS[Math.max(1, Math.min(EMBLEMS.length, rank)) - 1], R = RES;
    const px = new Array(R * R).fill(null);
    layers.forEach(([shape, metal], li) => {
      const [hi, base, sh] = M[metal], at = (i, j) => shape(i + 0.5, j + 0.5);
      if (li) for (let j = 0; j < R; j++) for (let i = 0; i < R; i++)   // a dark rim where this layer sits on another
        if (!at(i, j) && px[j * R + i] && (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1))) px[j * R + i] = OUTLINE;
      for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
        if (!at(i, j)) continue;
        px[j * R + i] = !at(i, j - 1) || !at(i - 1, j) ? hi : !at(i, j + 1) || !at(i + 1, j) ? sh : base;
      }
    });
    const filled = px.slice();
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      if (filled[j * R + i]) continue;
      const nb = (a, b) => a >= 0 && b >= 0 && a < R && b < R && filled[b * R + a];
      if (nb(i - 1, j) || nb(i + 1, j) || nb(i, j - 1) || nb(i, j + 1)) px[j * R + i] = OUTLINE;
    }
    ctx.clearRect(0, 0, R, R);
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) { const c = px[j * R + i]; if (c) { ctx.fillStyle = c; ctx.fillRect(i, j, 1, 1); } }
  }

  return { RES, COUNT: EMBLEMS.length, draw };
})();
