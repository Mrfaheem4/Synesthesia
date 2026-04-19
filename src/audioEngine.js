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

  return {
    analyserRef,
    bands,
    trackInfo,
    ready,
    playing,
    handleFile,
    bandsRef,
    play,
    pause,
  };
}
