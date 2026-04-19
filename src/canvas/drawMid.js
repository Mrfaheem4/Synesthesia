// src/canvas/drawMid.js

const MID_LO = 250;
const MID_HI = 4000;
const FFT_SIZE = 2048;

function getMidEnergy(analyserRef) {
  const analyser = analyserRef?.current;
  if (!analyser) return 0;
  const sr = analyser.context.sampleRate;
  const binHz = sr / FFT_SIZE;
  const lo = Math.round(MID_LO / binHz);
  const hi = Math.min(
    Math.round(MID_HI / binHz),
    analyser.frequencyBinCount - 1,
  );
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  let sum = 0;
  for (let i = lo; i <= hi; i++) sum += data[i];
  return sum / ((hi - lo + 1) * 255);
}

// ── shape stores ────────────────────────────────────────────────────────────
let spirals = [];
let arcs = [];
let tendrils = [];
let lastSpawn = 0;

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}
function randSign() {
  return Math.random() > 0.5 ? 1 : -1;
}

function getThemeHue() {
  const r = Math.random();
  if (r < 0.33) return randBetween(280, 320); // Magenta / Purple
  if (r < 0.66) return randBetween(0, 30); // Hot Pink / Red
  return randBetween(170, 200); // Cyan / Teal
}

// ── SPIRAL (Thick Twirls) ───────────────────────────────────────────────────
function spawnSpiral(W, H, energy) {
  return {
    x: randBetween(W * 0.2, W * 0.8),
    y: randBetween(H * 0.2, H * 0.8),
    turns: randBetween(1.5, 3.0),
    maxR: randBetween(50, 100) * (0.7 + energy),
    dir: randSign(),
    rotation: Math.random() * Math.PI * 2,
    life: 1.0,
    decay: randBetween(0.002, 0.004),
    hue: getThemeHue(),
    born: 0,
  };
}

function drawSpiral(ctx, s, energy) {
  if (s.life < 0.01) return;
  s.born++;
  s.rotation += 0.002 * s.dir;

  const progress = Math.min(1, s.born / 150);
  const points = 120;

  ctx.beginPath();
  for (let i = 0; i <= points * progress; i++) {
    const t = i / points;
    const ang = s.dir * t * s.turns * Math.PI * 2 + s.rotation;
    const r = t * s.maxR;
    const x = s.x + Math.cos(ang) * r;
    const y = s.y + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = (8 + s.life * 10) * (1 + energy * 0.5);
  ctx.strokeStyle = `hsla(${s.hue}, 90%, 55%, ${s.life * 0.6})`;
  ctx.stroke();

  s.life -= s.decay;
}

// ── SWEEPING ARC (Now a Solid Stroke) ───────────────────────────────────────
function spawnArc(W, H, energy) {
  return {
    cx: randBetween(W * 0.1, W * 0.9),
    cy: randBetween(H * 0.1, H * 0.9),
    R: randBetween(100, 250) * (0.5 + energy),
    startAngle: Math.random() * Math.PI * 2,
    sweep: randBetween(1, 2.5) * randSign(),
    life: 1.0,
    decay: randBetween(0.003, 0.006),
    hue: getThemeHue(),
    born: 0,
    width: randBetween(10, 20),
  };
}

function drawArc(ctx, a, energy) {
  if (a.life < 0.01) return;
  a.born++;
  a.startAngle += 0.0008;

  const progress = Math.min(1, a.born / 130);

  ctx.beginPath();
  // Using arc() creates a single, perfectly smooth continuous line
  ctx.arc(
    a.cx,
    a.cy,
    a.R,
    a.startAngle,
    a.startAngle + a.sweep * progress,
    a.sweep < 0,
  );

  ctx.lineCap = "round";
  ctx.lineWidth = a.width * a.life * (1 + energy);
  ctx.strokeStyle = `hsla(${a.hue}, 95%, 45%, ${a.life * 0.8})`;
  ctx.stroke();
  ctx.shadowBlur = 0; // Reset for other drawings

  a.life -= a.decay;
}

// ── TENDRIL ──────────────────────────────────────────────────────────────────
function spawnTendril(W, H, energy) {
  const pts = [{ x: randBetween(0, W), y: randBetween(0, H) }];
  let ang = Math.random() * Math.PI * 2;
  for (let i = 0; i < 12; i++) {
    ang += randBetween(-0.5, 0.5);
    const last = pts[pts.length - 1];
    pts.push({
      x: last.x + Math.cos(ang) * 30,
      y: last.y + Math.sin(ang) * 30,
    });
  }
  return { points: pts, life: 1.0, decay: 0.004, hue: getThemeHue(), born: 0 };
}

function drawTendril(ctx, t, energy) {
  if (t.life < 0.01) return;
  t.born++;
  const progress = Math.min(1, t.born / 100);
  const limit = Math.floor(t.points.length * progress);

  ctx.beginPath();
  ctx.moveTo(t.points[0].x, t.points[0].y);

  // Use quadratic curves for smooth interpolation
  for (let i = 1; i < limit; i++) {
    if (i < limit - 1) {
      const mx = (t.points[i].x + t.points[i + 1].x) / 2;
      const my = (t.points[i].y + t.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(t.points[i].x, t.points[i].y, mx, my);
    } else {
      ctx.lineTo(t.points[i].x, t.points[i].y);
    }
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 6 + t.life * 6;
  ctx.strokeStyle = `hsla(${t.hue}, 90%, 48%, ${t.life * 0.7})`;
  ctx.stroke();

  t.life -= t.decay;
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────
export function drawMid(ctx, W, H, analyserRef, energy, time, playing) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  if (!playing) {
    [spirals, arcs, tendrils].forEach((list) =>
      list.forEach((item) => (item.life *= 0.9)),
    );
  } else {
    const now = time * 1000;
    if (energy > 0.15 && now - lastSpawn > 800) {
      lastSpawn = now;
      spirals.push(spawnSpiral(W, H, energy));
      arcs.push(spawnArc(W, H, energy));
      tendrils.push(spawnTendril(W, H, energy));
    }
  }

  spirals.forEach((s) => drawSpiral(ctx, s, energy));
  arcs.forEach((a) => drawArc(ctx, a, energy));
  tendrils.forEach((t) => drawTendril(ctx, t, energy));

  spirals = spirals.filter((s) => s.life > 0.01).slice(-5);
  arcs = arcs.filter((a) => a.life > 0.01).slice(-6);
  tendrils = tendrils.filter((t) => t.life > 0.01).slice(-8);

  ctx.restore();
}
