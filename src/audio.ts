// Musique et bruitages synthétisés en direct (Web Audio) : aucun fichier son à charger.
// Le navigateur exige un geste de l'utilisateur avant de jouer du son : unlock() est
// appelé au premier bouton pressé.

type Theme = 'title' | 'outdoor' | 'lab' | 'none';

let ac: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let sfxBus: GainNode;
let noiseBuf: AudioBuffer;
let theme: Theme = 'none';
let wanted: Theme = 'none';
let step = 0;
let nextTime = 0;
let timer: number | undefined;
let ambience: { stop: () => void } | null = null;

const PREF_KEY = 'vesper-sound';
let muted = (() => {
  try {
    return localStorage.getItem(PREF_KEY) === 'off';
  } catch {
    return false;
  }
})();

export const isMuted = () => muted;

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(PREF_KEY, m ? 'off' : 'on');
  } catch {
    /* rien */
  }
  if (ac) master.gain.setTargetAtTime(m ? 0 : 0.9, ac.currentTime, 0.05);
}

export function unlock() {
  if (!ac) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ac = new Ctor();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ac.destination);
    musicBus = ac.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(master);
    sfxBus = ac.createGain();
    sfxBus.gain.value = 0.8;
    sfxBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ac.state === 'suspended') void ac.resume();
  if (wanted !== theme) playTheme(wanted);
}

// ---------- briques de synthèse ----------
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function tone(
  bus: AudioNode, type: OscillatorType, freq: number, t: number, dur: number, vol: number,
  opts: { attack?: number; release?: number; glide?: number; detune?: number; filter?: number } = {},
) {
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (opts.glide) o.frequency.exponentialRampToValueAtTime(opts.glide, t + dur);
  if (opts.detune) o.detune.value = opts.detune;
  const a = opts.attack ?? 0.005;
  const r = opts.release ?? 0.05;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + Math.max(a, dur - r));
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  let out: AudioNode = g;
  if (opts.filter) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = opts.filter;
    g.connect(f);
    out = f;
  }
  o.connect(g);
  out.connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(bus: AudioNode, t: number, dur: number, vol: number, type: BiquadFilterType, freq: number, to?: number) {
  if (!ac) return;
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(bus);
  s.start(t, Math.random());
  s.stop(t + dur + 0.05);
}

// ---------- musique ----------
// Ville : progression mélancolique en la mineur, nappes lentes + arpège clairsemé.
const OUT_CHORDS = [
  [57, 60, 64], // la mineur
  [53, 57, 60], // fa
  [48, 52, 55], // do
  [52, 55, 59], // mi mineur
];
const STEP = 0.5; // secondes par pas (8 pas par accord)

function scheduleStep(t: number) {
  if (theme === 'outdoor' || theme === 'title') {
    const chord = OUT_CHORDS[Math.floor(step / 8) % OUT_CHORDS.length];
    if (step % 8 === 0) {
      for (const n of chord) {
        tone(musicBus, 'sawtooth', hz(n - 12), t, STEP * 8, 0.035, { attack: 1.2, release: 1.6, detune: -6, filter: 700 });
        tone(musicBus, 'triangle', hz(n), t, STEP * 8, 0.05, { attack: 1.4, release: 1.6, detune: 5 });
      }
      tone(musicBus, 'sine', hz(chord[0] - 24), t, STEP * 8, 0.12, { attack: 0.8, release: 1.2 });
    }
    // arpège : une note sur deux, parfois un silence pour respirer
    const pattern = [0, 2, 1, 2, 0, 1, 2, -1];
    const idx = pattern[step % 8];
    if (idx >= 0 && (theme === 'outdoor' || step % 2 === 0) && Math.random() > 0.25) {
      tone(musicBus, 'square', hz(chord[idx] + 12), t, 0.32, 0.018, { release: 0.25, filter: 2400 });
    }
    // mélodie rare
    if (step % 16 === 12 && Math.random() > 0.4) {
      const n = chord[Math.floor(Math.random() * 3)] + 24;
      tone(musicBus, 'triangle', hz(n), t, 1.4, 0.04, { attack: 0.05, release: 1.1 });
      tone(musicBus, 'triangle', hz(n), t + 0.35, 1.2, 0.016, { attack: 0.05, release: 1 }); // écho
    }
  } else if (theme === 'lab') {
    // Laboratoire : bourdon froid et bips de machines
    if (step % 16 === 0) {
      tone(musicBus, 'sine', 55, t, STEP * 16, 0.12, { attack: 2, release: 2 });
      tone(musicBus, 'sine', 82.4, t, STEP * 16, 0.05, { attack: 3, release: 2, detune: 7 });
      tone(musicBus, 'sawtooth', 110, t, STEP * 16, 0.012, { attack: 3, release: 2, filter: 300 });
    }
    if (step % 4 === 1 && Math.random() > 0.55) {
      const n = [76, 79, 83, 88][Math.floor(Math.random() * 4)];
      tone(musicBus, 'sine', hz(n), t, 0.12, 0.03, { release: 0.1 });
      tone(musicBus, 'sine', hz(n), t + 0.25, 0.1, 0.012, { release: 0.08 });
    }
  }
}

function tick() {
  if (!ac) return;
  while (nextTime < ac.currentTime + 0.6) {
    scheduleStep(nextTime);
    nextTime += STEP;
    step += 1;
  }
}

function startAmbience(kind: Theme) {
  ambience?.stop();
  ambience = null;
  if (!ac || kind === 'none') return;
  // vent (extérieur) ou ronronnement de ventilation (labo) : bruit filtré en continu
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const f = ac.createBiquadFilter();
  f.type = kind === 'lab' ? 'lowpass' : 'bandpass';
  f.frequency.value = kind === 'lab' ? 180 : 500;
  f.Q.value = kind === 'lab' ? 0.7 : 0.9;
  const g = ac.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(kind === 'lab' ? 0.09 : kind === 'title' ? 0.05 : 0.08, ac.currentTime + 2);
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();
  lfo.frequency.value = 0.09;
  lfoGain.gain.value = kind === 'lab' ? 30 : 320;
  lfo.connect(lfoGain).connect(f.frequency);
  s.connect(f).connect(g).connect(musicBus);
  s.start();
  lfo.start();
  ambience = {
    stop: () => {
      const now = ac!.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + 0.8);
      s.stop(now + 0.9);
      lfo.stop(now + 0.9);
    },
  };
}

export function playTheme(t: Theme) {
  wanted = t;
  if (!ac || theme === t) return;
  theme = t;
  step = 0;
  nextTime = ac.currentTime + 0.1;
  clearInterval(timer);
  if (t !== 'none') timer = window.setInterval(tick, 150);
  startAmbience(t);
}

// ---------- bruitages ----------
const now = () => (ac ? ac.currentTime : 0);
let stepFlip = false;

export const sfx = {
  step() {
    if (!ac) return;
    stepFlip = !stepFlip;
    noise(sfxBus, now(), 0.06, 0.09, 'bandpass', stepFlip ? 900 : 700);
  },
  bump() {
    tone(sfxBus, 'square', 90, now(), 0.07, 0.04, { glide: 60, filter: 600 });
  },
  blip() {
    tone(sfxBus, 'square', 620 + Math.random() * 60, now(), 0.025, 0.02, { release: 0.015, filter: 3000 });
  },
  select() {
    const t = now();
    tone(sfxBus, 'square', 523, t, 0.06, 0.05, { filter: 3000 });
    tone(sfxBus, 'square', 784, t + 0.06, 0.08, 0.05, { filter: 3000 });
  },
  advance() {
    tone(sfxBus, 'triangle', 880, now(), 0.05, 0.05);
  },
  clue() {
    const t = now();
    [72, 76, 79, 84].forEach((n, i) => tone(sfxBus, 'triangle', hz(n), t + i * 0.09, 0.3, 0.09, { release: 0.2 }));
    tone(sfxBus, 'sine', hz(96), t + 0.36, 0.6, 0.03, { release: 0.5 });
  },
  item() {
    const t = now();
    [79, 83, 86, 91, 95].forEach((n, i) => tone(sfxBus, 'square', hz(n), t + i * 0.05, 0.12, 0.035, { filter: 4000 }));
  },
  door() {
    const t = now();
    noise(sfxBus, t, 0.45, 0.18, 'lowpass', 300, 2200);
    tone(sfxBus, 'sine', 70, t, 0.25, 0.25, { glide: 45 });
  },
  page() {
    noise(sfxBus, now(), 0.18, 0.12, 'highpass', 2500, 5000);
  },
  key() {
    tone(sfxBus, 'square', 1200, now(), 0.03, 0.03, { filter: 5000 });
  },
  wrong() {
    const t = now();
    tone(sfxBus, 'sawtooth', 150, t, 0.18, 0.07, { filter: 900 });
    tone(sfxBus, 'sawtooth', 110, t + 0.2, 0.3, 0.07, { filter: 900 });
  },
  success() {
    const t = now();
    [60, 64, 67, 72, 76].forEach((n, i) => tone(sfxBus, 'triangle', hz(n), t + i * 0.07, 1.4 - i * 0.1, 0.07, { release: 1 }));
  },
};
