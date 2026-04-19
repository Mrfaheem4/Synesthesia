import { useRef, useEffect } from "react";

export default function BassOrb({ bassBeat = 0, playing = false }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({
    core: 0,
    rim: 0,
    outer: 0,
    glow: 0,
    ripples: [],
    lastBeat: 0,
    time: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let dpr = window.devicePixelRatio || 1;

    function resize() {
      const parent = canvas.parentElement;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function tick(now) {
      rafRef.current = requestAnimationFrame(tick);
      const s = stateRef.current;
      const beat = stateRef.current.bassBeat ?? 0;
      s.time += 0.016;

      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.16; // smaller base radius for a centered background orb
      const expandMix = Math.max(
        0,
        Math.min(1, (s.core - R * 0.66) / (R * 0.72)),
      );

      // ── lag physics ──────────────────────────────────────────────────────
      const targetCore = R * (0.66 + beat * 0.72);
      s.core += (targetCore - s.core) * (beat > s.core / R ? 0.7 : 0.2);
      s.rim += (s.core * 1.18 - s.rim) * 0.14;
      s.outer += (s.core * 1.42 - s.outer) * 0.1;
      s.glow += (0.1 + beat * 0.8 - s.glow) * 0.28;

      // ── ripple on hard kick ───────────────────────────────────────────────
      if (beat > 0.38 && now - s.lastBeat > 110) {
        s.lastBeat = now;
        s.ripples.push({ r: s.core * 0.95, alpha: 0.9, width: 1.5 });
      }
      s.ripples = s.ripples
        .map((rp) => ({ ...rp, r: rp.r + 4.4, alpha: rp.alpha * 0.82 }))
        .filter((rp) => rp.alpha > 0.015);

      // ── clear ─────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      if (!playing && beat < 0.01) return;

      // ── deep ambient fog ──────────────────────────────────────────────────
      const fog = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.8);
      fog.addColorStop(
        0,
        `rgba(${120 + expandMix * 50}, ${20 + expandMix * 25}, ${45 + expandMix * 10}, ${s.glow * 0.2})`,
      );
      fog.addColorStop(
        0.5,
        `rgba(${55 + expandMix * 35}, ${8 + expandMix * 12}, ${24 + expandMix * 10}, ${s.glow * 0.12})`,
      );
      fog.addColorStop(1, `rgba(0, 0, 0, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = fog;
      ctx.fill();

      // ── ripples ───────────────────────────────────────────────────────────
      s.ripples.forEach((rp) => {
        ctx.beginPath();
        ctx.arc(cx, cy, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 120, 50, ${rp.alpha * 0.5})`;
        ctx.lineWidth = rp.width;
        ctx.stroke();
      });

      // ── outer ring — most lag ─────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, s.outer, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(65, 18, 95, ${Math.min(0.36, s.glow * 0.5)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // ── rim ring — medium lag ─────────────────────────────────────────────
      // subtle shimmer using time
      const shimmer = 0.5 + Math.sin(s.time * 2.8) * 0.12;
      ctx.beginPath();
      ctx.arc(cx, cy, s.rim, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${170 + expandMix * 20}, ${70 + expandMix * 18}, ${20 + expandMix * 8}, ${Math.min(0.72, s.glow * shimmer * 1.35)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ── glow aura ─────────────────────────────────────────────────────────
      const aura = ctx.createRadialGradient(
        cx,
        cy,
        s.core * 0.1,
        cx,
        cy,
        s.core * 2.1,
      );
      aura.addColorStop(
        0,
        `rgba(${255}, ${92 + expandMix * 38}, ${28 + expandMix * 18}, ${s.glow * 0.5})`,
      );
      aura.addColorStop(
        0.45,
        `rgba(${140 + expandMix * 35}, ${22 + expandMix * 16}, ${60 + expandMix * 12}, ${s.glow * 0.3})`,
      );
      aura.addColorStop(
        0.8,
        `rgba(${42 + expandMix * 18}, ${6 + expandMix * 8}, ${22 + expandMix * 10}, ${s.glow * 0.12})`,
      );
      aura.addColorStop(1, `rgba(0,   0,  0,   0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, s.core * 2.1, 0, Math.PI * 2);
      ctx.fillStyle = aura;
      ctx.fill();

      // ── core orb ──────────────────────────────────────────────────────────
      // off-center highlight for 3d feel without being 3d
      const hx = cx - s.core * 0.22;
      const hy = cy - s.core * 0.22;
      const core = ctx.createRadialGradient(hx, hy, 0, cx, cy, s.core);
      core.addColorStop(
        0,
        `rgba(${255}, ${198 - expandMix * 20}, ${132 - expandMix * 18}, ${0.95 + beat * 0.05})`,
      );
      core.addColorStop(
        0.12,
        `rgba(${255}, ${108 + expandMix * 24}, ${34 - expandMix * 4}, 0.98)`,
      );
      core.addColorStop(
        0.42,
        `rgba(${175 - expandMix * 10}, ${34 + expandMix * 10}, ${58 + expandMix * 18}, 0.93)`,
      );
      core.addColorStop(
        0.78,
        `rgba(${44 + expandMix * 10}, ${7 + expandMix * 4}, ${24 + expandMix * 8}, 0.78)`,
      );
      core.addColorStop(1, `rgba( 20,   2,  12, 0.0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, s.core, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();

      // ── sharp edge ring — no lag, snappiest element ───────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, s.core, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${255}, ${145 + expandMix * 15}, ${58 + expandMix * 8}, ${0.18 + beat * 0.5})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // ── specular dot ──────────────────────────────────────────────────────
      const sx = cx - s.core * 0.28;
      const sy = cy - s.core * 0.28;
      const spec = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.core * 0.22);
      spec.addColorStop(0, `rgba(255, 240, 210, ${0.58 + beat * 0.22})`);
      spec.addColorStop(1, `rgba(255, 200, 140, 0)`);
      ctx.beginPath();
      ctx.arc(sx, sy, s.core * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();
    }

    tick(performance.now());
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // pass reactive values via ref — no useEffect re-runs
  useEffect(() => {
    stateRef.current.bassBeat = bassBeat;
  }, [bassBeat]);
  useEffect(() => {
    stateRef.current.playing = playing;
  }, [playing]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
