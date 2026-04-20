import { useState } from "react";
import { useAudioEngine } from "./audioEngine";
import SingleCanvas from "./canvas/SingleCanvas";
import Landing from "./Landing";
import PlayerPill from "./PlayerPill";

export default function App() {
  const [phase, setPhase] = useState("landing");

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
    stop,
    getProgress,
  } = useAudioEngine();

  async function enterVisualizer(file) {
    await handleFile(file);
    setPhase("visualizer");
  }

  function goBack() {
    stop();
    setPhase("landing");
  }

  if (phase === "landing") {
    return <Landing onEnter={enterVisualizer} />;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080008",
        overflow: "hidden",
      }}
    >
      {/* font import */}
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Cormorant+Garamond:ital,wght@1,300&display=swap');
    `}</style>

      <div
        style={{
          position: "fixed",
          top: 28,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          pointerEvents: "none",
          fontFamily: "'Syncopate', sans-serif",
          fontSize: "clamp(11px, 1.2vw, 13px)",
          fontWeight: 700,
          letterSpacing: "0.4em",
          color: "rgba(255,255,255,0.15)",
          whiteSpace: "nowrap",
        }}
      >
        SYN<span style={{ color: "rgba(255,61,154,0.4)" }}>Æ</span>STHESIA
      </div>
      <SingleCanvas
        bandsRef={bandsRef}
        analyserRef={analyserRef}
        playing={playing}
      />

      {ready && (
        <PlayerPill
          playing={playing}
          onPlay={play}
          onPause={pause}
          onBack={goBack}
          trackName={trackInfo?.name}
          getProgress={getProgress}
        />
      )}
    </div>
  );
}
