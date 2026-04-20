import { useEffect, useRef, useState } from "react";

export default function PlayerPill({
  playing,
  onPlay,
  onPause,
  onBack,
  trackName,
  getProgress,
}) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const hideTimer = useRef(null);
  const rafRef = useRef(null);

  // auto-hide after 3s of no mouse movement
  useEffect(() => {
    function show() {
      setVisible(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 3000);
    }
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    // show on mount
    show();
    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      clearTimeout(hideTimer.current);
    };
  }, []);

  // always visible when paused
  useEffect(() => {
    if (!playing) {
      setVisible(true);
      clearTimeout(hideTimer.current);
    }
  }, [playing]);

  // progress bar update
  useEffect(() => {
    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      setProgress(getProgress());
    }
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [getProgress]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Cormorant+Garamond:ital,wght@1,300&display=swap');

        .pill {
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .pill.hidden {
          opacity: 0 !important;
          transform: translateX(-50%) translateY(12px) !important;
          pointer-events: none !important;
        }
        .pill-play {
          transition: background 0.2s, transform 0.15s, border-color 0.2s;
        }
        .pill-play:hover {
          background: rgba(180,0,255,0.22) !important;
          transform: scale(1.08);
        }
        .pill-back:hover {
          color: rgba(255,255,255,0.8) !important;
        }
        .progress-fill {
          transition: width 0.25s linear;
        }
      `}</style>

      <div
        className={`pill${visible ? "" : " hidden"}`}
        style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* track name */}
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: 12,
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.35)",
            marginBottom: 10,
            whiteSpace: "nowrap",
            maxWidth: 320,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {trackName}
        </div>

        {/* pill body */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "rgba(8,0,12,0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(180,0,255,0.25)",
            borderRadius: 999,
            padding: "10px 22px",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(180,0,255,0.08)",
          }}
        >
          {/* back button */}
          <button
            className="pill-back"
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              fontFamily: "'Syncopate', sans-serif",
              fontSize: 9,
              letterSpacing: "0.25em",
              padding: "4px 2px",
              transition: "color 0.2s",
            }}
          >
            ← BACK
          </button>

          {/* divider */}
          <div
            style={{
              width: 1,
              height: 20,
              background: "rgba(255,255,255,0.1)",
            }}
          />

          {/* play/pause */}
          <button
            className="pill-play"
            onClick={playing ? onPause : onPlay}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "1px solid rgba(180,0,255,0.4)",
              background: "rgba(180,0,255,0.1)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
        </div>

        {/* progress bar */}
        <div
          style={{
            width: 220,
            height: 2,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 99,
            marginTop: 10,
            overflow: "hidden",
          }}
        >
          <div
            className="progress-fill"
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background:
                "linear-gradient(90deg, rgba(180,0,255,0.8), rgba(255,61,154,0.9))",
              borderRadius: 99,
            }}
          />
        </div>
      </div>
    </>
  );
}
