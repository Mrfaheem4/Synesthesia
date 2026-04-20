import { useRef, useEffect, useState } from "react";
import { useAudioEngine } from "./audioEngine";
import FloatingLines from "./FloatingLines";

// ── main landing ─────────────────────────────────────────────────────────────
export default function Landing({ onEnter }) {
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // stagger reveal
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  function handleFile(file) {
    if (file && file.type.startsWith("audio/")) onEnter(file);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080008",
        fontFamily: "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* google font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Syncopate:wght@400;700&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 40px rgba(180,0,255,0.4), 0 0 80px rgba(255,0,180,0.2); }
          50%       { text-shadow: 0 0 60px rgba(180,0,255,0.7), 0 0 120px rgba(255,0,180,0.4); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(180,0,255,0.4); box-shadow: 0 0 20px rgba(180,0,255,0.1); }
          50%       { border-color: rgba(255,61,154,0.7); box-shadow: 0 0 40px rgba(255,61,154,0.25); }
        }
        .upload-zone {
          animation: pulse-border 3s ease-in-out infinite;
          transition: background 0.2s, transform 0.2s;
        }
        .upload-zone:hover {
          background: rgba(180,0,255,0.08) !important;
          transform: scale(1.02);
        }
        .upload-zone.drag {
          background: rgba(255,61,154,0.12) !important;
          border-color: rgba(255,61,154,0.9) !important;
          transform: scale(1.03);
        }
      `}</style>

      {/* floating lines bg */}
      <FloatingLines />

      {/* content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          gap: 0,
          padding: "40px 20px",
        }}
      >
        {/* æ symbol */}
        <div
          style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: "clamp(11px, 1.2vw, 14px)",
            letterSpacing: "0.45em",
            color: "rgba(255,61,154,0.7)",
            marginBottom: 24,
            opacity: loaded ? 1 : 0,
            animation: loaded ? "fadeUp 0.8s ease forwards" : "none",
            animationDelay: "0.1s",
          }}
        >
          EXPERIENCE MUSIC AS COLOUR
        </div>

        {/* main title */}
        <div
          style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: "clamp(52px, 10vw, 130px)",
            fontWeight: 700,
            lineHeight: 0.88,
            letterSpacing: "-0.02em",
            textAlign: "center",
            color: "#fff",
            animation: loaded
              ? "fadeUp 0.9s ease forwards, glow 4s ease-in-out 1s infinite"
              : "none",
            opacity: loaded ? 1 : 0,
            animationDelay: "0.25s",
          }}
        >
          SYN
          <span
            style={{
              color: "transparent",
              WebkitTextStroke: "2px rgba(255,61,154,0.9)",
            }}
          >
            Æ
          </span>
          STHESIA
        </div>

        {/* italic subtitle */}
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "clamp(16px, 2.2vw, 26px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.12em",
            marginTop: 20,
            marginBottom: 56,
            opacity: loaded ? 1 : 0,
            animation: loaded ? "fadeUp 1s ease forwards" : "none",
            animationDelay: "0.45s",
          }}
        >
          where sound becomes vision
        </div>

        {/* upload zone */}
        <label
          className={`upload-zone${dragging ? " drag" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            border: "1px solid rgba(180,0,255,0.4)",
            borderRadius: 2,
            padding: "36px 64px",
            cursor: "pointer",
            background: "rgba(8,0,8,0.6)",
            backdropFilter: "blur(12px)",
            opacity: loaded ? 1 : 0,
            animation: loaded ? "fadeUp 1s ease forwards" : "none",
            animationDelay: "0.65s",
          }}
        >
          {/* upload icon */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle
              cx="16"
              cy="16"
              r="15"
              stroke="rgba(255,61,154,0.5)"
              strokeWidth="1"
            />
            <path
              d="M16 22V12M16 12L11 17M16 12L21 17"
              stroke="rgba(255,61,154,0.9)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div
            style={{
              fontFamily: "'Syncopate', sans-serif",
              fontSize: 11,
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {dragging ? "DROP IT" : "UPLOAD MUSIC"}
          </div>

          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 13,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.08em",
            }}
          >
            mp3 · wav · ogg · flac
          </div>

          <input
            type="file"
            accept="audio/*"
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </label>

        {/* bottom credit */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: 11,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "0.15em",
          }}
        >
          every song is a different world
        </div>
      </div>
    </div>
  );
}
