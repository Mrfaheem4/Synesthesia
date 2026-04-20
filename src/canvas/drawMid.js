// src/canvas/drawMid.js

const MID_LO = 250;
const MID_HI = 4000;
const FFT_SIZE = 2048;

let spirals = [];
let arcs = [];
let blobs = [];
let lastSpawn = 0;

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}
function randSign() {
  return Math.random() > 0.5 ? 1 : -1;
}

function getThemeHue() {
  const r = Math.random();
  if (r < 0.33) return randBetween(280, 320);
  if (r < 0.66) return randBetween(0, 30);
  return randBetween(170, 200);
}

function getBlobColor() {
  const hue = getThemeHue();
  const brightness =
    Math.random() > 0.5 ? randBetween(40, 60) : randBetween(70, 90); // dark or light
  return { hue, brightness };
}

// ── SPIRAL (unchanged) ───────────────────────────────────────────────────────
function spawnSpiral(W, H, energy) {
  return {
    x: randBetween(W * 0.2, W * 0.8),
    y: randBetween(H * 0.2, H * 0.8),
    turns: randBetween(1, 2),
    maxR: randBetween(50, 100) * (0.7 + energy),
    dir: randSign(),
    rotation: Math.random() * Math.PI * 2,
    life: 1.0,
    decay: randBetween(0.0012, 0.0022),
    hue: getThemeHue(),
    born: 0,
  };
}

function drawSpiral(ctx, s, energy) {
  if (s.life < 0.01) return;
  s.born++;
  s.rotation += 0.001 * s.dir;
  const progress = Math.min(1, s.born / 150);
  const points = 120;

  ctx.beginPath();
  for (let i = 0; i <= points * progress; i++) {
    const t = i / points;
    const ang = s.dir * t * s.turns * Math.PI * 2 + s.rotation;
    const r = t * s.maxR;
    const x = s.x + Math.cos(ang) * r;
    const y = s.y + Math.sin(ang) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = (8 + s.life * 10) * (1 + energy * 0.5);
  ctx.shadowColor = `hsla(${s.hue}, 90%, 55%, 0.5)`;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = `hsla(${s.hue}, 90%, 55%, ${s.life * 0.6})`;
  ctx.stroke();
  ctx.shadowBlur = 0;
  s.life -= s.decay;
}

// ── ARC (unchanged) ──────────────────────────────────────────────────────────
function spawnArc(W, H, energy) {
  return {
    cx: randBetween(W * 0.1, W * 0.9),
    cy: randBetween(H * 0.1, H * 0.9),
    R: randBetween(100, 250) * (0.5 + energy),
    startAngle: Math.random() * Math.PI * 2,
    sweep: randBetween(1, 2.5) * randSign(),
    life: 1.0,
    decay: randBetween(0.0012, 0.0022),
    hue: getThemeHue(),
  };
}

function drawArc(ctx, a, energy) {
  if (a.life < 0.01) return;
  a.born++;
  a.startAngle += 0.0004;
  const progress = Math.min(1, a.born / 130);

  ctx.beginPath();
  ctx.arc(
    a.cx,
    a.cy,
    a.R,
    a.startAngle,
    a.startAngle + a.sweep * progress,
    a.sweep < 0,
  );
  ctx.lineCap = "round";
  ctx.shadowColor = `hsla(${a.hue}, 95%, 45%, 0.5)`;
  ctx.shadowBlur = 15;
  ctx.lineWidth = a.width * a.life * (1 + energy);
  ctx.strokeStyle = `hsla(${a.hue}, 95%, 45%, ${a.life * 0.8})`;
  ctx.stroke();
  ctx.shadowBlur = 0;
  a.life -= a.decay;
}

// ── IRREGULAR BLOB ───────────────────────────────────────────────────────────
function spawnBlob(W, H, energy) {
  const spokes = Math.floor(randBetween(6, 12));
  const baseR = randBetween(40, 120) * (0.5 + energy * 0.8);
  const type = Math.random() < 0.25 ? "spiky" : "smooth"; // 25% spiky
  const points = [];

  for (let i = 0; i < spokes; i++) {
    points.push({
      angle: (i / spokes) * Math.PI * 2,
      // spiky blobs have more extreme variation between spokes
      r:
        type === "spiky"
          ? baseR *
            (Math.random() < 0.5
              ? randBetween(0.2, 0.5)
              : randBetween(1.2, 2.0))
          : baseR * randBetween(0.4, 1.6),
    });
  }

  const color = getBlobColor();
  return {
    x: randBetween(W * 0.1, W * 0.9),
    y: randBetween(H * 0.1, H * 0.9),
    points,
    baseR,
    type,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: randBetween(0.001, 0.003) * randSign(),
    life: 1.0,
    decay: randBetween(0.0012, 0.0022),
    hue: color.hue,
    brightness: color.brightness,
    born: 0,
    targetR: points.map((p) =>
      type === "spiky"
        ? p.r * randBetween(0.7, 1.3) // spiky morph stays spiky
        : p.r * randBetween(0.6, 1.4),
    ),
    morphSpeed: randBetween(0.015, 0.03),
  };
}
function drawBlob(ctx, b, energy) {
  if (b.life < 0.01) return;
  b.born++;
  b.rotation += b.rotSpeed;

  b.points = b.points.map((p, i) => {
    const r = p.r + (b.targetR[i] - p.r) * b.morphSpeed;
    if (Math.abs(r - b.targetR[i]) < 2)
      b.targetR[i] =
        b.baseR *
        (b.type === "spiky"
          ? Math.random() < 0.5
            ? randBetween(0.2, 0.5)
            : randBetween(1.2, 2.0)
          : randBetween(0.4, 1.6));
    return { ...p, r };
  });

  const fadeIn = Math.min(1, b.born / 30);
  const alpha = b.life * fadeIn * (0.2 + energy * 0.3);

  const pts = b.points.map((p) => ({
    x: b.x + Math.cos(p.angle + b.rotation) * p.r,
    y: b.y + Math.sin(p.angle + b.rotation) * p.r,
  }));

  ctx.beginPath();

  if (b.type === "spiky") {
    // hard lines between points — creates star/spike silhouette
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
  } else {
    // smooth quadratic curves — organic blob
    const loop = [...pts, pts[0], pts[1]];
    ctx.moveTo((loop[0].x + loop[1].x) / 2, (loop[0].y + loop[1].y) / 2);
    for (let i = 1; i < loop.length - 1; i++) {
      const mx = (loop[i].x + loop[i + 1].x) / 2;
      const my = (loop[i].y + loop[i + 1].y) / 2;
      ctx.quadraticCurveTo(loop[i].x, loop[i].y, mx, my);
    }
    ctx.closePath();
  }

  const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.baseR * 1.3);
  grad.addColorStop(0, `hsla(${b.hue}, 85%, ${b.brightness}%, ${alpha * 0.9})`);
  grad.addColorStop(
    0.5,
    `hsla(${b.hue}, 80%, ${b.brightness - 10}%, ${alpha * 0.5})`,
  );
  grad.addColorStop(1, `hsla(${b.hue}, 75%, ${b.brightness - 20}%, 0)`);

  ctx.fillStyle = grad;
  ctx.shadowColor = `hsla(${b.hue}, 90%, ${b.brightness}%, ${alpha * 0.5})`;
  ctx.shadowBlur = b.type === "spiky" ? 22 : 18;
  ctx.fill();
  ctx.shadowBlur = 0;

  b.life -= b.decay;
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────
export function drawMid(ctx, W, H, analyserRef, energy, time, playing) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const glowGrad = ctx.createRadialGradient(
    W / 2,
    H / 2,
    0,
    W / 2,
    H / 2,
    Math.hypot(W, H) * 0.6,
  );
  glowGrad.addColorStop(0, `rgba(138, 0, 255, ${energy * 0.12})`);
  glowGrad.addColorStop(0.5, `rgba(180, 0, 255, ${energy * 0.06})`);
  glowGrad.addColorStop(1, `rgba(255, 61, 154, 0)`);
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, W, H);

  if (!playing) {
    spirals = spirals
      .map((s) => ({ ...s, life: s.life * 0.92 }))
      .filter((s) => s.life > 0.01);
    arcs = arcs
      .map((a) => ({ ...a, life: a.life * 0.92 }))
      .filter((a) => a.life > 0.01);
    blobs = blobs
      .map((b) => ({ ...b, life: b.life * 0.92 }))
      .filter((b) => b.life > 0.01);
    spirals.forEach((s) => drawSpiral(ctx, s, 0));
    arcs.forEach((a) => drawArc(ctx, a, 0));
    blobs.forEach((b) => drawBlob(ctx, b, 0));
    ctx.restore();
    return;
  }

  const now = time * 1000;
  const spawnGap = Math.max(200, 700 - energy * 550);

  if (energy > 0.1 && now - lastSpawn > spawnGap) {
    lastSpawn = now;
    spirals.push(spawnSpiral(W, H, energy));
    arcs.push(spawnArc(W, H, energy));
    blobs.push(spawnBlob(W, H, energy));
    if (energy > 0.35) {
      blobs.push(spawnBlob(W, H, energy));
      arcs.push(spawnArc(W, H, energy));
    }
    if (energy > 0.6) {
      spirals.push(spawnSpiral(W, H, energy));
      blobs.push(spawnBlob(W, H, energy));
    }
  }

  spirals.forEach((s) => drawSpiral(ctx, s, energy));
  arcs.forEach((a) => drawArc(ctx, a, energy));
  blobs.forEach((b) => drawBlob(ctx, b, energy));

  spirals = spirals.filter((s) => s.life > 0.01).slice(-8);
  arcs = arcs.filter((a) => a.life > 0.01).slice(-12);
  blobs = blobs.filter((b) => b.life > 0.01).slice(-14);

  ctx.restore();
}
