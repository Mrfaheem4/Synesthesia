// src/canvas/SingleCanvas.jsx
import { useRef, useEffect } from "react";
import { drawBass } from "./drawBass";
import { drawSub } from "./drawSub";
import { drawBars } from "./drawBars";
import { drawMid } from "./drawMid";

export default function SingleCanvas({ bandsRef, analyserRef, playing }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({
    bass: 0,
    sub: 0,
    time: 0,
    mid: 0,
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

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const s = stateRef.current;
      const bands = bandsRef.current;
      const W = window.innerWidth;
      const H = window.innerHeight;

      s.time += 0.016;

      // smooth both bands — snappy attack, slow release
      const rawBass = playing ? (bands.bass ?? 0) : 0;
      const rawSub = playing ? (bands.sub ?? 0) : 0;
      s.bass += (rawBass - s.bass) * (rawBass > s.bass ? 0.35 : 0.06);
      s.sub += (rawSub - s.sub) * (rawSub > s.sub ? 0.25 : 0.04);
      const rawMid = playing ? (bands.mid ?? 0) : 0;
      s.mid += (rawMid - s.mid) * (rawMid > s.mid ? 0.22 : 0.05);

      // clear
      ctx.clearRect(0, 0, W, H);

      // draw back to front
      drawSub(ctx, W, H, s.sub);
      drawBars(ctx, W, H, bandsRef.current, playing, s.time);
      drawMid(ctx, W, H, analyserRef, s.mid, s.time, playing);
      drawBass(ctx, W, H, s.bass);
    }

    tick();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [playing, bandsRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
