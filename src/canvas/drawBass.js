// src/canvas/drawBass.js

export function drawBass(ctx, W, H, bass) {
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * (0.12 + bass * 0.1);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  // outer bloom — very subtle, barely there
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2);
  bloom.addColorStop(0, `hsla(285, 100%, 65%, ${0.04 + bass * 0.1})`);
  bloom.addColorStop(0.4, `hsla(300, 90%,  55%, ${0.02 + bass * 0.06})`);
  bloom.addColorStop(1, `hsla(310, 80%,  40%, 0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = bloom;
  ctx.fill();

  // mid glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
  glow.addColorStop(0, `hsla(290, 100%, 80%, ${0.12 + bass * 0.25})`);
  glow.addColorStop(0.5, `hsla(300, 95%,  60%, ${0.08 + bass * 0.15})`);
  glow.addColorStop(1, `hsla(310, 85%,  45%, 0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // core — offset highlight for sphere feel
  const core = ctx.createRadialGradient(
    cx - R * 0.2,
    cy - R * 0.2,
    0,
    cx,
    cy,
    R,
  );
  core.addColorStop(0, `hsla(270, 60%, 98%, ${0.5 + bass * 0.35})`);
  core.addColorStop(0.4, `hsla(280, 95%, 72%, ${0.35 + bass * 0.3})`);
  core.addColorStop(0.8, `hsla(295, 90%, 55%, ${0.2 + bass * 0.2})`);
  core.addColorStop(1, `hsla(305, 85%, 45%, 0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();

  // sharp boundary ring — main edge
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(280, 100%, 60%, ${0.15 + bass * 0.55})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // inner definition ring
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(270, 90%, 90%, ${0.08 + bass * 0.25})`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  ctx.restore();
}
