import { useRef, useEffect } from "react";

const FFT_SIZE = 2048;
const MID_LO_HZ = 250;
const MID_HI_HZ = 4000;
const GHOST_COUNT = 5;

export default function MidWave({ analyserRef, playing }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({
    energy: 0,
    ghosts: [],
    time: 0,
    prevPoints: [],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function getMidBins() {
      const analyser = analyserRef.current;
      if (!analyser) return null;
      const sr = analyser.context.sampleRate;
      const binHz = sr / FFT_SIZE;
      const lo = Math.round(MID_LO_HZ / binHz);
      const hi = Math.min(
        Math.round(MID_HI_HZ / binHz),
        analyser.frequencyBinCount - 1,
      );
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      return data.slice(lo, hi);
    }

    function buildPoints(bins, W, H, energy) {
      if (!bins || bins.length === 0) return [];
      const points = [];
      const count = 300;
      // longer wave footprint
      const waveW = W * 0.82;
      const startX = (W - waveW) / 2;
      // shifted down — 58% from top instead of 50%
      const centerY = H * 0.72;
      // larger amplitude
      const maxAmp = H * 0.102 * (0.5 + energy * 1.0);
      const rawY = new Array(count);

      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const x = startX + t * waveW;
        const logT = Math.log(1 + t * 9) / Math.log(10);
        const rawIdx = logT * (bins.length - 1);
        const i0 = Math.floor(rawIdx);
        const i1 = Math.min(i0 + 1, bins.length - 1);
        const frac = rawIdx - i0;

        const bPrev = bins[Math.max(0, i0 - 1)] / 255;
        const b0 = bins[i0] / 255;
        const b1 = bins[i1] / 255;
        const bNext = bins[Math.min(bins.length - 1, i1 + 1)] / 255;
        const lerped = b0 * (1 - frac) + b1 * frac;
        const binVal = bPrev * 0.15 + lerped * 0.7 + bNext * 0.15;

        // gentle sin base + data deformation
        const baseY =
          Math.sin(t * Math.PI * 0.78 + stateRef.current.time * 0.45) *
          maxAmp *
          0.25;
        const dataY = (binVal - 0.5) * maxAmp * 1.06;

        // fade envelope — cos curve so ends taper to 0
        const envelope = Math.pow(Math.sin(t * Math.PI), 0.7);

        rawY[i] = centerY + (baseY + dataY) * envelope;
        points.push({ x, y: rawY[i] });
      }

      // spatial smoothing: two passes to round sharp crests/troughs
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 1; i < count - 1; i++) {
          rawY[i] = rawY[i - 1] * 0.22 + rawY[i] * 0.56 + rawY[i + 1] * 0.22;
        }
      }

      // temporal smoothing: blend with previous frame to reduce jitter
      const prev = stateRef.current.prevPoints;
      for (let i = 0; i < count; i++) {
        const prevY = prev[i]?.y ?? rawY[i];
        const y = prevY * 0.62 + rawY[i] * 0.38;
        points[i].y = y;
      }
      stateRef.current.prevPoints = points.map((p) => ({ x: p.x, y: p.y }));

      return points;
    }

    function drawWave(points, alpha, hueStart, hueEnd, lineWidth) {
      if (points.length < 4 || alpha < 0.005) return;

      const grad = ctx.createLinearGradient(
        points[0].x,
        0,
        points[points.length - 1].x,
        0,
      );
      grad.addColorStop(0, `hsla(${hueStart}, 85%, 70%, 0)`);
      grad.addColorStop(
        0.08,
        `hsla(${hueStart}, 85%, 70%, ${alpha.toFixed(3)})`,
      );
      grad.addColorStop(
        0.35,
        `hsla(${Math.round(hueStart + (hueEnd - hueStart) * 0.35)}, 80%, 78%, ${alpha.toFixed(3)})`,
      );
      grad.addColorStop(
        0.65,
        `hsla(${Math.round(hueStart + (hueEnd - hueStart) * 0.65)}, 80%, 78%, ${alpha.toFixed(3)})`,
      );
      grad.addColorStop(0.92, `hsla(${hueEnd}, 85%, 70%, ${alpha.toFixed(3)})`);
      grad.addColorStop(1, `hsla(${hueEnd}, 85%, 70%, 0)`);

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        const cp1x = p1.x + (p2.x - p0.x) / 7;
        const cp1y = p1.y + (p2.y - p0.y) / 7;
        const cp2x = p2.x - (p3.x - p1.x) / 7;
        const cp2y = p2.y - (p3.y - p1.y) / 7;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = `hsla(${Math.round((hueStart + hueEnd) / 2)}, 80%, 75%, ${alpha * 0.6})`;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function tick(now) {
      rafRef.current = requestAnimationFrame(tick);
      const s = stateRef.current;
      const W = window.innerWidth;
      const H = window.innerHeight;

      s.time += 0.016;

      const bins = playing ? getMidBins() : null;

      let rawEnergy = 0;
      if (bins) {
        rawEnergy = bins.reduce((a, b) => a + b, 0) / (bins.length * 255);
      }
      s.energy += (rawEnergy - s.energy) * (rawEnergy > s.energy ? 0.22 : 0.05);

      ctx.clearRect(0, 0, W, H);

      // fade out gracefully when stopped
      if (!playing) {
        // fade out ghosts
        s.ghosts = s.ghosts
          .map((g) => ({ ...g, alpha: g.alpha * 0.88 }))
          .filter((g) => g.alpha > 0.005);
        s.ghosts.forEach((g, i) => {
          drawWave(g.points, g.alpha, 195 + i * 6, 290, 0.9);
        });

        // build idle points manually — no bin data, pure sin
        const count = 300;
        const waveW = W * 0.82;
        const startX = (W - waveW) / 2;
        const centerY = H * 0.72;
        const maxAmp = H * 0.012; // very small amplitude — barely moving

        const idlePts = [];
        for (let i = 0; i < count; i++) {
          const t = i / (count - 1);
          const x = startX + t * waveW;
          const envelope = Math.pow(Math.sin(t * Math.PI), 0.7);
          // two overlapping slow sins so it doesn't look mechanical
          const y =
            centerY +
            Math.sin(t * Math.PI * 0.78 + s.time * 0.28) * maxAmp * envelope +
            Math.sin(t * Math.PI * 1.45 + s.time * 0.16) *
              maxAmp *
              0.4 *
              envelope;
          idlePts.push({ x, y });
        }

        const idleAlpha = 0.18;
        drawWave(idlePts, idleAlpha, 195, 290, 1.4);
        return;
      }
      const currentPoints = buildPoints(bins, W, H, s.energy);

      // push new ghost every 4 frames
      if (Math.round(s.time * 60) % 4 === 0 && currentPoints.length > 0) {
        s.ghosts.unshift({
          points: currentPoints,
          alpha: Math.min(0.5, 0.15 + s.energy * 0.65),
        });
        if (s.ghosts.length > GHOST_COUNT) s.ghosts.pop();
      }

      // decay
      s.ghosts = s.ghosts.map((g, i) => ({
        ...g,
        alpha: g.alpha * (0.8 - i * 0.02),
      }));

      // draw ghosts — oldest first, most faded
      [...s.ghosts].reverse().forEach((g, i) => {
        drawWave(g.points, g.alpha * 0.4, 175 + i * 12, 290 + i * 8, 0.8);
      });

      // live wave — two passes for depth
      const liveAlpha = Math.min(0.88, 0.25 + s.energy * 1.3);
      drawWave(currentPoints, liveAlpha, 185, 310, 2.2); // main
      drawWave(currentPoints, liveAlpha * 0.5, 200, 280, 1.1); // bright core
    }

    tick(performance.now());
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [playing]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
}
