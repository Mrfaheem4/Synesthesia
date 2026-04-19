import { useRef, useEffect } from "react";

export default function BassOrb({ bassBeat = 0, playing = false }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({
    core: 0,
    bassBeat: 0,
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

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const s = stateRef.current;
      const rawBeat = s.bassBeat ?? 0;

      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const cx = W / 2;
      const cy = H / 2;

      const baseRadius = Math.min(W, H) * 0.22;
      const targetRadius = baseRadius * (1 + rawBeat * 1.2);

      // ── CLEAN REACTIVE PHYSICS ────────────────────────────────────────
      // Snap to expansion, ease the contraction. No jitter.
      if (targetRadius > s.core) {
        s.core = targetRadius;
      } else {
        s.core += (targetRadius - s.core) * 0.15;
      }

      // ── DRAWING (SOLID 2D ONLY) ───────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      if (!playing && rawBeat < 0.01) return;

      // 1. Solid Orb
      ctx.beginPath();
      ctx.arc(cx, cy, s.core, 0, Math.PI * 2);
      ctx.fillStyle = "#2864DC"; // Solid blue
      ctx.fill();

      // 2. Sharp White Edge
      ctx.beginPath();
      ctx.arc(cx, cy, s.core, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + rawBeat * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    tick();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [playing]);

  useEffect(() => {
    stateRef.current.bassBeat = bassBeat;
  }, [bassBeat]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
