import { useRef } from "react";
import { useAudioEngine } from "./audioEngine";
import SingleCanvas from "./canvas/SingleCanvas";

export default function App() {
  const {
    analyserRef,
    bandsRef,
    bands,
    trackInfo,
    ready,
    playing,
    handleFile,
    play,
    pause,
  } = useAudioEngine();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0d0010",
        fontFamily: "monospace",
      }}
    >
      <SingleCanvas
        bandsRef={bandsRef}
        analyserRef={analyserRef}
        playing={playing}
      />

      {/* upload */}
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
              border: "1px dashed #3d1060",
              borderRadius: 12,
              padding: "40px 72px",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, color: "#6b3d9a", marginBottom: 6 }}>
              drop mp3 or click to upload
            </div>
            <div style={{ fontSize: 11, color: "#3d1060" }}>
              mp3 · wav · ogg
            </div>
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

      {/* controls */}
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
          <div
            style={{ fontSize: 11, color: "#6b3d9a", letterSpacing: "0.08em" }}
          >
            {trackInfo.name}
          </div>
          <button
            onClick={playing ? pause : play}
            style={{
              background: "rgba(107, 0, 255, 0.15)",
              border: "1px solid rgba(107, 0, 255, 0.3)",
              color: "#c13dff",
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
          <label style={{ fontSize: 10, color: "#3d1060", cursor: "pointer" }}>
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
