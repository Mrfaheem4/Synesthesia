import { useRef, useState } from "react";

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

export function useAudioEngine() {
  const actxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataRef = useRef(null);
  const sourceRef = useRef(null);
  const smoothRef = useRef({ sub: 0, bass: 0, mid: 0, presence: 0, air: 0 });
  const rafRef = useRef(null);
  const bandsRef = useRef({ sub: 0, bass: 0, mid: 0, presence: 0, air: 0 });
  const pauseOffsetRef = useRef(0);
  const startTimeRef = useRef(0);

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
    bandsRef.current = { ...smoothRef.current };
    setBands({ ...next });
  }

  async function handleFile(file) {
    if (actxRef.current) {
      actxRef.current.close();
      cancelAnimationFrame(rafRef.current);
    }
    pauseOffsetRef.current = 0;
    startTimeRef.current = 0;

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
      name: file.name.replace(/\.[^/.]+$/, ""), // strip extension
      duration: buf.duration,
      sr: buf.sampleRate,
      buf,
    });
    setReady(true);
  }

  function play() {
    if (!trackInfo) return;
    if (sourceRef.current) {
      try {
        sourceRef.current.onended = null; // ← detach before stop
        sourceRef.current.stop();
      } catch (e) {}
    }

    const src = actxRef.current.createBufferSource();
    src.buffer = trackInfo.buf;
    src.connect(analyserRef.current);
    src.start(0, pauseOffsetRef.current); // ← resume from saved offset
    startTimeRef.current = actxRef.current.currentTime - pauseOffsetRef.current;

    src.onended = () => {
      // only reset offset if track finished naturally (not manually stopped)
      if (pauseOffsetRef.current >= trackInfo.duration - 0.1) {
        pauseOffsetRef.current = 0;
      }
      setPlaying(false);
    };

    sourceRef.current = src;
    setPlaying(true);
    tick();
  }

  function pause() {
    if (!actxRef.current || !sourceRef.current) return;
    // save exactly where we are
    pauseOffsetRef.current = actxRef.current.currentTime - startTimeRef.current;
    try {
      sourceRef.current.onended = null; // ← detach so onended doesn't fire
      sourceRef.current.stop();
    } catch (e) {}
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }

  function stop() {
    if (sourceRef.current) {
      try {
        sourceRef.current.onended = null;
        sourceRef.current.stop();
      } catch (e) {}
    }
    cancelAnimationFrame(rafRef.current);
    pauseOffsetRef.current = 0; // ← only stop() resets to beginning
    setPlaying(false);
  }

  // progress 0-1 for scrub bar
  function getProgress() {
    if (!trackInfo || !actxRef.current) return 0;
    const elapsed = playing
      ? actxRef.current.currentTime - startTimeRef.current
      : pauseOffsetRef.current;
    return Math.min(1, elapsed / trackInfo.duration);
  }

  return {
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
    startTimeRef,
    pauseOffsetRef,
    actxRef,
  };
}
