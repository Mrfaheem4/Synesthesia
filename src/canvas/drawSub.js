// src/canvas/drawSub.js

export function drawSub(ctx, W, H, sub) {
  const cx = W / 2;
  const cy = H / 2;

  ctx.save();

  // background itself pulses — center lightens on sub hit
  ctx.globalCompositeOperation = "source-over";
  const bgPulse = ctx.createRadialGradient(
    cx,
    cy,
    0,
    cx,
    cy,
    Math.max(W, H) * 0.75,
  );
  bgPulse.addColorStop(0, `hsla(270, 60%, ${4 + sub * 14}%, 1)`); // center breathes light
  bgPulse.addColorStop(0.4, `hsla(265, 50%, ${2 + sub * 6}%,  1)`);
  bgPulse.addColorStop(1, `hsla(260, 40%, 1%, 1)`); // edges stay dark
  ctx.fillStyle = bgPulse;
  ctx.fillRect(0, 0, W, H);

  // screen-blend purple wash on top — color arrives with the sub
  ctx.globalCompositeOperation = "screen";
  const wash = ctx.createRadialGradient(
    cx,
    cy,
    0,
    cx,
    cy,
    Math.max(W, H) * 0.6,
  );
  wash.addColorStop(0, `hsla(270, 100%, 18%, ${sub * 0.5})`);
  wash.addColorStop(0.5, `hsla(265, 90%,  10%, ${sub * 0.25})`);
  wash.addColorStop(1, `hsla(260, 80%,   5%, 0)`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}
