// src/canvas/drawBars.js

const BAND_KEYS = ["sub", "bass", "mid", "presence", "air"];
const BAND_COLORS = {
  sub: "138, 0, 255",
  bass: "180, 0, 255",
  mid: "255, 61, 154",
  presence: "180, 255, 61",
  air: "61, 255, 240",
};

// 2 bars per band = 10 total
const BAND_SEGMENTS = [
  { key: "sub", from: 0, to: 0.2 },
  { key: "bass", from: 0.2, to: 0.4 },
  { key: "mid", from: 0.4, to: 0.6 },
  { key: "presence", from: 0.6, to: 0.8 },
  { key: "air", from: 0.8, to: 1.0 },
];

// ── Random circles ──────────────────────────────────────────────────────────
let circles = [];
let lastCircleSpawn = 0;

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}

function spawnCircle(W, H, bands) {
  const keys = BAND_KEYS.filter((k) => (bands[k] ?? 0) > 0.1);
  if (keys.length === 0) return null;

  const key = keys[Math.floor(Math.random() * keys.length)];
  const energy = bands[key] ?? 0;

  return {
    x: randBetween(W * 0.1, W * 0.9),
    y: randBetween(H * 0.1, H * 0.9),
    r: randBetween(15, 45) * (0.5 + energy * 0.8),
    key,
    life: 1.0,
    decay: randBetween(0.008, 0.015),
  };
}

function drawCircle(ctx, c) {
  if (c.life < 0.01) return;

  const rgb = BAND_COLORS[c.key];
  const alpha = c.life * (0.15 + 0.2 * (1 - c.life));

  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
  ctx.fill();

  // Optional subtle outline
  ctx.strokeStyle = `rgba(${rgb}, ${alpha * 0.6})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  c.life -= c.decay;
}

export function drawBars(ctx, W, H, bands, playing, time) {
  if (!playing) {
    circles = circles.map((c) => ({ ...c, life: c.life * 0.9 }));
  } else {
    // Spawn new circles periodically
    const now = time * 1000;
    if (now - lastCircleSpawn > 400) {
      const newCircle = spawnCircle(W, H, bands);
      if (newCircle) {
        circles.push(newCircle);
        lastCircleSpawn = now;
      }
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const barsPerBand = 2;
  const totalBars = BAND_SEGMENTS.length * barsPerBand;
  const barW = W / totalBars;
  const gap = barW * 0.18; // thin gap between bars
  const maxH = H * 0.4;

  BAND_SEGMENTS.forEach(({ key }, segIdx) => {
    const energy = playing ? (bands[key] ?? 0) : 0;
    if (energy < 0.01) return;

    const rgb = BAND_COLORS[key];
    const alpha = 0.06 + energy * 0.1; // slightly more visible

    for (let b = 0; b < barsPerBand; b++) {
      const barIdx = segIdx * barsPerBand + b;
      const x = barIdx * barW;
      const bH = maxH * energy;
      const y = H - bH;

      // slight height variation between the two bars of a pair
      const heightMod = b === 0 ? 1.0 : 0.88;
      const finalH = bH * heightMod;
      const finalY = H - finalH;

      const grad = ctx.createLinearGradient(x, finalY, x, H);
      grad.addColorStop(0, `rgba(${rgb}, 0)`);
      grad.addColorStop(0.2, `rgba(${rgb}, ${alpha * 0.5})`);
      grad.addColorStop(1, `rgba(${rgb}, ${alpha})`);

      ctx.fillStyle = grad;
      ctx.fillRect(x + gap / 2, finalY, barW - gap, finalH);
    }
  });

  // Draw circles
  circles.forEach((c) => drawCircle(ctx, c));
  circles = circles.filter((c) => c.life > 0.01).slice(-15);

  ctx.restore();
}
