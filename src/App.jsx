import { useRef, useState } from "react";
import BassOrb from "./Components/BassOrb";
import { useAudioEngine } from "./audioEngine";

export default function App() {
  const {
    analyserRef,
    bands,
    trackInfo,
    ready,
    playing,
    handleFile,
    play,
    pause,
  } = useAudioEngine();

  return (
    // ── full screen white canvas ──────────────────────────────────────────────
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#fff",
        overflow: "hidden",
        fontFamily: "monospace",
      }}
    >
      {/* ── background orb layer ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "min(42vw, 42vh)",
            height: "min(42vw, 42vh)",
          }}
        >
          <BassOrb bassBeat={bands.bass} playing={playing} />
        </div>
      </div>

      {/* ── layer 3: upload screen (shown before ready) ───────────────────── */}
      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <label
            style={{
              border: "1px dashed #999",
              borderRadius: 12,
              padding: "40px 72px",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, color: "#333", marginBottom: 6 }}>
              drop mp3 or click to upload
            </div>
            <div style={{ fontSize: 11, color: "#666" }}>mp3 · wav · ogg</div>
            <input
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) =>
                e.target.files[0] && handleFile(e.target.files[0])
              }
            />
          </label>
        </div>
      )}

      {/* ── layer 4: controls bottom center (z 10) ───────────────────────── */}
      {ready && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            zIndex: 10,
          }}
        >
          {/* track name */}
          <div style={{ fontSize: 11, color: "#333", letterSpacing: "0.08em" }}>
            {trackInfo.name}
          </div>

          {/* play / pause */}
          <button
            onClick={playing ? pause : play}
            style={{
              background: "rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.12)",
              color: "#000",
              width: 48,
              height: 48,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>

          {/* upload another */}
          <label
            style={{
              fontSize: 10,
              color: "#666",
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            change file
            <input
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) =>
                e.target.files[0] && handleFile(e.target.files[0])
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}
