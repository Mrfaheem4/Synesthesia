import { useRef, useState } from "react";
import BassOrb from "./Components/BassOrb";
import MidWave from "./Components/MidWave";

const FFT_SIZE = 2048;

const BANDS = {
  sub: [20, 80],
  bass: [80, 250],
  mid: [250, 4000],
  presence: [4000, 8000],
  air: [8000, 20000],
};

const ATTACK = { sub: 0.8, bass: 0.6, mid: 0.4, presence: 0.3, air: 0.15 };
const RELEASE = { sub: 0.95, bass: 0.85, mid: 0.6, presence: 0.4, air: 0.25 };

export default function App() {
  const actxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataRef = useRef(null);
  const sourceRef = useRef(null);
  const smoothRef = useRef({ sub: 0, bass: 0, mid: 0, presence: 0, air: 0 });
  const rafRef = useRef(null);
  const bandsRef = useRef({ sub: 0, bass: 0, mid: 0, presence: 0, air: 0 });

  const [bands, setBands] = useState({
    sub: 0,
    bass: 0,
    mid: 0,
    presence: 0,
    air: 0,
  });
  const [trackInfo, setTrackInfo] = useState(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  function hzToBin(hz) {
    return Math.round(hz / (actxRef.current.sampleRate / FFT_SIZE));
  }

  function extractBand(lo, hi) {
    const data = dataRef.current;
    const s = hzToBin(lo);
    const e = Math.min(hzToBin(hi), data.length - 1);
    let sum = 0;
    for (let i = s; i <= e; i++) sum += data[i];
    return sum / ((e - s + 1) * 255);
  }

  function tick() {
    rafRef.current = requestAnimationFrame(tick);
    analyserRef.current.getByteFrequencyData(dataRef.current);

    const next = {};
    for (const band of Object.keys(BANDS)) {
      const [lo, hi] = BANDS[band];
      const raw = extractBand(lo, hi);
      const prev = smoothRef.current[band];
      const a = raw > prev ? ATTACK[band] : RELEASE[band];
      smoothRef.current[band] = prev * a + raw * (1 - a);
      next[band] = smoothRef.current[band];
    }

    //  update bandsRef AFTER smoothing is computed
    bandsRef.current = { ...smoothRef.current };
    setBands({ ...next });
  }

  async function handleFile(file) {
    if (actxRef.current) {
      actxRef.current.close();
      cancelAnimationFrame(rafRef.current);
    }

    const actx = new AudioContext();
    const analyser = actx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0;
    analyser.connect(actx.destination);

    actxRef.current = actx;
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    const ab = await file.arrayBuffer();
    const buf = await actx.decodeAudioData(ab);

    setTrackInfo({
      name: file.name,
      duration: buf.duration.toFixed(1),
      sr: buf.sampleRate,
      buf,
    });
    setReady(true);
  }

  function play() {
    if (!trackInfo) return;
    if (sourceRef.current) sourceRef.current.stop();
    const src = actxRef.current.createBufferSource();
    src.buffer = trackInfo.buf;
    src.connect(analyserRef.current);
    src.start();
    src.onended = () => setPlaying(false);
    sourceRef.current = src;
    setPlaying(true);
    tick();
  }

  function pause() {
    if (sourceRef.current) sourceRef.current.stop();
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }

  return (
    // ── full screen black canvas ──────────────────────────────────────────────
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
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
      <MidWave analyserRef={analyserRef} playing={playing} />

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
              border: "1px dashed #333",
              borderRadius: 12,
              padding: "40px 72px",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>
              drop mp3 or click to upload
            </div>
            <div style={{ fontSize: 11, color: "#333" }}>mp3 · wav · ogg</div>
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
          <div style={{ fontSize: 11, color: "#444", letterSpacing: "0.08em" }}>
            {trackInfo.name}
          </div>

          {/* play / pause */}
          <button
            onClick={playing ? pause : play}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
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
              color: "#333",
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
