// Musique et bruitages synthétisés en direct (Web Audio) : aucun fichier son à charger.
// Le navigateur exige un geste de l'utilisateur avant de jouer du son : unlock() est
// appelé au premier bouton pressé.

type Theme = 'title' | 'outdoor' | 'lab' | 'home' | 'azura' | 'none';

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
  if (ac.state !== 'running') void ac.resume();
  // iPhone : jouer un son vide pendant le geste achève de « déverrouiller » l'audio
  if (!primed) {
    primed = true;
    const b = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = b;
    src.connect(ac.destination);
    src.start(0);
  }
  if (wanted !== theme) playTheme(wanted);
}
let primed = false;

/** Après un passage en arrière-plan, iOS suspend l'audio : on le relance au retour. */
export function resumeAudio() {
  if (ac && ac.state !== 'running') void ac.resume();
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
// Chez Betti : une berceuse douce en fa majeur, boîte à musique et nappes chaudes.
const HOME_CHORDS = [
  [53, 57, 60], // fa
  [48, 52, 55], // do
  [50, 53, 57], // ré mineur
  [46, 50, 53], // si bémol
];
const HOME_TUNE = [72, -1, 69, 72, 74, -1, 72, -1, 69, -1, 67, 69, 65, -1, -1, -1, 69, -1, 67, 69, 70, -1, 69, -1, 65, -1, 67, -1, 65, -1, -1, -1];

// Azura : ré majeur, lumineux et aérien ; un accord de sol mineur glisse un peu de nostalgie.
const AZ_CHORDS = [
  [62, 66, 69], // ré
  [62, 67, 71], // sol
  [59, 62, 66], // si mineur
  [61, 64, 69], // la
  [62, 66, 69], // ré
  [62, 67, 71], // sol
  [62, 67, 70], // sol mineur
  [61, 64, 69], // la
];
const AZ_PENTA = [74, 76, 78, 81, 83, 86];
const AZ_TUNE = [78, -1, 76, 78, 81, -1, 78, -1, 76, -1, 74, -1, 71, -1, -1, -1, 74, -1, 76, 74, 71, -1, 69, -1, 71, -1, 74, -1, 76, -1, -1, -1];

function scheduleAzura(t: number) {
  const chord = AZ_CHORDS[Math.floor(step / 8) % AZ_CHORDS.length];
  if (step % 8 === 0) {
    for (const n of chord) {
      tone(musicBus, 'triangle', hz(n - 12), t, STEP * 8, 0.03, { attack: 1.4, release: 1.8, detune: 4 });
      tone(musicBus, 'sine', hz(n), t, STEP * 8, 0.025, { attack: 1.8, release: 1.8, detune: -5 });
    }
    tone(musicBus, 'sine', hz(chord[0] - 24), t, STEP * 8, 0.1, { attack: 1, release: 1.4 });
  }
  // une harpe légère : des notes de la gamme, comme de l'eau qui ruisselle
  if (step % 2 === 1 && Math.random() > 0.35) {
    const n = AZ_PENTA[Math.floor(Math.random() * AZ_PENTA.length)];
    tone(musicBus, 'sine', hz(n), t, 0.5, 0.022, { attack: 0.005, release: 0.45 });
  }
  // la mélodie revient une fois sur deux
  if (Math.floor(step / 32) % 2 === 1) {
    const n = AZ_TUNE[step % AZ_TUNE.length];
    if (n > 0) {
      tone(musicBus, 'triangle', hz(n), t, 1.1, 0.04, { attack: 0.03, release: 0.9 });
      tone(musicBus, 'sine', hz(n + 12), t + 0.4, 0.7, 0.01, { attack: 0.03, release: 0.6 });
    }
  }
  // des oiseaux, de temps en temps
  if (Math.random() > 0.93) {
    const f = 2400 + Math.random() * 1600;
    tone(musicBus, 'sine', f, t, 0.08, 0.012, { glide: f * 1.3, release: 0.06 });
    tone(musicBus, 'sine', f * 1.1, t + 0.11, 0.07, 0.01, { glide: f * 0.9, release: 0.05 });
  }
}

function scheduleStep(t: number) {
  if (theme === 'azura') return scheduleAzura(t);
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
  } else if (theme === 'home') {
    const chord = HOME_CHORDS[Math.floor(step / 8) % HOME_CHORDS.length];
    if (step % 8 === 0) {
      for (const n of chord) tone(musicBus, 'triangle', hz(n), t, STEP * 8, 0.035, { attack: 1.6, release: 1.8, detune: 4 });
      tone(musicBus, 'sine', hz(chord[0] - 12), t, STEP * 8, 0.08, { attack: 1, release: 1.5 });
    }
    // la boîte à musique : une mélodie lente qui revient
    const n = HOME_TUNE[step % HOME_TUNE.length];
    if (n > 0) {
      tone(musicBus, 'sine', hz(n), t, 1.3, 0.05, { attack: 0.005, release: 1.2 });
      tone(musicBus, 'sine', hz(n + 12), t, 0.6, 0.012, { attack: 0.005, release: 0.55 });
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
  if (!ac || kind === 'none' || kind === 'home') return;
  // vent (extérieur) ou ronronnement de ventilation (labo) : bruit filtré en continu
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const f = ac.createBiquadFilter();
  f.type = kind === 'lab' ? 'lowpass' : 'bandpass';
  f.frequency.value = kind === 'lab' ? 180 : kind === 'azura' ? 1400 : 500;
  f.Q.value = kind === 'lab' ? 0.7 : 0.9;
  const g = ac.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(kind === 'lab' ? 0.09 : kind === 'title' ? 0.05 : kind === 'azura' ? 0.03 : 0.08, ac.currentTime + 2);
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
  /** Pixel content : deux petits bips qui montent. */
  pixelHappy() {
    const t = now();
    tone(sfxBus, 'sine', 1180, t, 0.07, 0.05, { glide: 1500 });
    tone(sfxBus, 'sine', 1500, t + 0.09, 0.09, 0.05, { glide: 1900 });
  },
  /** Pixel inquiet : un petit gémissement électronique. */
  pixelWhine() {
    tone(sfxBus, 'sine', 760, now(), 0.42, 0.03, { glide: 430, release: 0.3 });
  },
  /** Pixel prête son énergie : un bourdonnement électrique qui crépite. */
  zap() {
    const t = now();
    tone(sfxBus, 'sawtooth', 95, t, 1.9, 0.035, { attack: 0.1, release: 0.4, filter: 1400 });
    tone(sfxBus, 'square', 190, t, 1.9, 0.012, { attack: 0.2, release: 0.4, filter: 2200, detune: 9 });
    for (let i = 0; i < 9; i++) noise(sfxBus, t + i * 0.2 + Math.random() * 0.1, 0.05, 0.06, 'highpass', 3500, 7000);
  },
  /** Bruit métallique dans le conduit. */
  clank() {
    const t = now();
    tone(sfxBus, 'square', 140 + Math.random() * 60, t, 0.08, 0.04, { glide: 90, filter: 1500 });
    noise(sfxBus, t, 0.09, 0.07, 'bandpass', 1200, 2600);
  },
  /** Des griffes qui grattent derrière une porte. */
  scratch() {
    noise(sfxBus, now(), 0.12, 0.05, 'bandpass', 2600, 4200);
  },
  /** Quelques notes de la berceuse, comme une boîte à musique qu'on remonte. */
  musicBox() {
    const t = now();
    [72, 69, 72, 74, 72, 69, 67, 65].forEach((n, i) => {
      tone(sfxBus, 'sine', hz(n + 12), t + i * 0.32, 0.9, 0.05, { attack: 0.004, release: 0.85 });
    });
  },
  /** Le petit projecteur de Pixel qui s'allume. */
  projector() {
    const t = now();
    tone(sfxBus, 'square', 1800, t, 0.03, 0.03, { filter: 3000 });
    noise(sfxBus, t + 0.05, 0.9, 0.035, 'bandpass', 900, 1800);
    tone(sfxBus, 'sine', 220, t + 0.05, 0.9, 0.03, { glide: 440 });
  },
  throwNut() {
    noise(sfxBus, now(), 0.16, 0.06, 'bandpass', 1800, 3200);
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

// ---------- grésillements du récepteur radio ----------
let staticNodes: { noise: GainNode; tone: GainNode; stop: () => void } | null = null;

export function startStatic() {
  if (!ac || staticNodes) return;
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  // un souffle doux et étouffé plutôt qu'un grésillement agressif
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 850;
  f.Q.value = 0.4;
  const f2 = ac.createBiquadFilter();
  f2.type = 'highpass';
  f2.frequency.value = 160;
  // une lente « respiration » du souffle, comme une onde qui va et vient
  const breath = ac.createOscillator();
  breath.frequency.value = 0.35;
  const breathGain = ac.createGain();
  breathGain.gain.value = 0.25;
  const swell = ac.createGain();
  swell.gain.value = 0.75;
  breath.connect(breathGain).connect(swell.gain);
  const noise = ac.createGain();
  noise.gain.value = 0.045;
  s.connect(f).connect(f2).connect(swell).connect(noise).connect(sfxBus);
  // le signal lointain : des bips réguliers, doux
  const o = ac.createOscillator();
  o.type = 'sine';
  o.frequency.value = 660;
  const lfo = ac.createOscillator();
  lfo.type = 'square';
  lfo.frequency.value = 3.2;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 0.5;
  const tone = ac.createGain();
  tone.gain.value = 0;
  const am = ac.createGain();
  am.gain.value = 0.5;
  lfo.connect(lfoGain).connect(am.gain);
  o.connect(am).connect(tone).connect(sfxBus);
  s.start();
  o.start();
  lfo.start();
  breath.start();
  staticNodes = {
    noise,
    tone,
    stop: () => {
      const t = ac!.currentTime;
      noise.gain.setTargetAtTime(0, t, 0.05);
      tone.gain.setTargetAtTime(0, t, 0.05);
      s.stop(t + 0.3);
      o.stop(t + 0.3);
      lfo.stop(t + 0.3);
      breath.stop(t + 0.3);
    },
  };
}

/** clarity : 0 = que du bruit, 1 = signal parfaitement accordé. */
export function setStatic(clarity: number) {
  if (!ac || !staticNodes) return;
  const t = ac.currentTime;
  staticNodes.noise.gain.setTargetAtTime(0.05 * (1 - clarity * 0.7), t, 0.08);
  staticNodes.tone.gain.setTargetAtTime(0.05 * clarity * clarity, t, 0.08);
}

export function stopStatic() {
  staticNodes?.stop();
  staticNodes = null;
}

// ---------- musique de fin : la réussite du départ, la tristesse de laisser Pixel ----------
// Une pièce écrite d'avance (~36 s), calée sur la cinématique de fin (voir ui.playFinale).
export function playEnding(): () => void {
  if (!ac) return () => {};
  const t0 = ac.currentTime + 0.05;
  const bus = ac.createGain();
  bus.gain.value = 0.9;
  // un écho doux qui fait office de réverbération
  const delay = ac.createDelay(1);
  delay.delayTime.value = 0.36;
  const fb = ac.createGain();
  fb.gain.value = 0.38;
  const damp = ac.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 2200;
  bus.connect(musicBus);
  bus.connect(delay);
  delay.connect(damp).connect(fb).connect(delay);
  damp.connect(musicBus);

  const pad = (notes: number[], at: number, dur: number, vol = 1) => {
    for (const n of notes) {
      tone(bus, 'triangle', hz(n), t0 + at, dur, 0.045 * vol, { attack: Math.min(1.6, dur / 3), release: Math.min(2, dur / 2), detune: 4 });
      tone(bus, 'sawtooth', hz(n - 12), t0 + at, dur, 0.018 * vol, { attack: Math.min(1.8, dur / 3), release: Math.min(2, dur / 2), detune: -7, filter: 900 });
    }
    tone(bus, 'sine', hz(notes[0] - 24), t0 + at, dur, 0.11 * vol, { attack: 0.6, release: 1.4 });
  };
  // boîte à musique : une note claire qui s'éteint lentement
  const bell = (n: number, at: number, vol = 1, len = 1.6) => {
    tone(bus, 'sine', hz(n), t0 + at, len, 0.07 * vol, { attack: 0.004, release: len - 0.05 });
    tone(bus, 'sine', hz(n + 12), t0 + at, len * 0.5, 0.018 * vol, { attack: 0.004, release: len * 0.5 - 0.05 });
  };
  const arp = (notes: number[], at: number, dur: number, rate: number, vol = 1) => {
    for (let i = 0, t = at; t < at + dur - 0.05; i++, t += rate) {
      tone(bus, 'square', hz(notes[i % notes.length] + 12), t0 + t, rate * 0.9, 0.012 * vol, { release: rate * 0.6, filter: 2600 });
    }
  };

  // A. Pixel s'endort (la mineur, fa) — 0 à 7,6 s
  pad([57, 60, 64], 0, 4.2, 0.8);
  pad([53, 57, 60], 3.8, 4.2, 0.8);
  [[76, 2.4], [74, 2.9], [72, 3.4], [71, 4.2], [69, 5.0], [72, 6.2], [71, 6.7], [69, 7.2]].forEach(([n, at]) => bell(n, at, 0.9));
  bell(88, 5.3, 0.5, 0.9); // le clignement de l'œil

  // B. Le transfert s'élance (ré m, la m, fa, sol, puis mi) — 7,6 à 18,5 s
  const prog: [number[], number][] = [[[50, 53, 57], 7.6], [[57, 60, 64], 9.5], [[53, 57, 60], 11.4], [[55, 59, 62], 13.3]];
  for (const [ch, at] of prog) {
    pad(ch, at, 2.1, 0.9);
    arp([ch[0], ch[1], ch[2], ch[1] + 12], at, 1.9, at < 11 ? 0.24 : 0.16, 0.9);
  }
  pad([52, 56, 59, 64], 15.2, 3.4, 1.1); // mi majeur : la tension avant l'arrivée
  arp([52, 56, 59, 64, 68], 15.2, 3.3, 0.11, 1.2);
  noise(bus, t0 + 14.6, 4, 0.05, 'bandpass', 400, 6000); // la montée

  // C. Le flash et Azura (do majeur, fa, sol, do) — 18,5 à 26 s
  noise(bus, t0 + 18.5, 2.6, 0.09, 'highpass', 3000, 9000);
  pad([48, 52, 55, 60, 64], 18.5, 3.2, 1.3);
  [84, 88, 91, 96].forEach((n, i) => bell(n, 18.55 + i * 0.07, 0.6, 2.4));
  pad([53, 57, 60, 64], 21.2, 2.2, 1.0);
  pad([55, 59, 62, 65], 23.0, 1.8, 1.0);
  pad([48, 52, 55, 60], 24.6, 3.4, 1.1);
  // le thème du début, mais en majeur : on est arrivé
  [[76, 20.4], [74, 20.9], [72, 21.4], [74, 22.2], [76, 23.0], [79, 23.6], [84, 24.6]].forEach(([n, at]) => bell(n, at, 1, 2));

  // D. Le texte final : la joie retombe, Pixel est resté là-bas — 26 à 36 s
  pad([57, 60, 64, 71], 26.2, 4, 0.7);
  pad([53, 57, 60, 67], 29.8, 3.2, 0.6);
  pad([48, 52, 55, 62], 32.6, 4.2, 0.55);
  [[76, 27.2], [74, 27.7], [72, 28.2], [71, 29.0], [69, 30.0]].forEach(([n, at]) => bell(n, at, 0.7, 2));
  bell(88, 33.6, 0.35, 2.4); // un dernier « clignement »

  return () => {
    const t = ac!.currentTime;
    bus.gain.setTargetAtTime(0, t, 0.3);
    fb.gain.setTargetAtTime(0, t, 0.3);
  };
}

// ---------- vagues de chaleur : sirène lointaine et grondement ----------
let heatNodes: { siren: GainNode; rumble: GainNode } | null = null;

/** siren, rumble : 0 à 1. Crée les sons à la première demande, puis ne fait que régler leur volume. */
export function setHeatSound(siren: number, rumble: number) {
  if (!ac) return;
  if (!heatNodes) {
    if (siren <= 0 && rumble <= 0) return;
    // la sirène : une plainte qui monte et descend, étouffée par la distance
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 520;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.22;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain).connect(o.frequency);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    const sg = ac.createGain();
    sg.gain.value = 0;
    o.connect(lp).connect(sg).connect(sfxBus);
    // le grondement de la chaleur : un souffle très grave
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const rf = ac.createBiquadFilter();
    rf.type = 'lowpass';
    rf.frequency.value = 220;
    const rg = ac.createGain();
    rg.gain.value = 0;
    s.connect(rf).connect(rg).connect(sfxBus);
    o.start();
    lfo.start();
    s.start();
    heatNodes = { siren: sg, rumble: rg };
  }
  const t = ac.currentTime;
  heatNodes.siren.gain.setTargetAtTime(0.05 * siren, t, 0.4);
  heatNodes.rumble.gain.setTargetAtTime(0.16 * rumble, t, 0.4);
}

/** Battement de cœur sourd, quand la chaleur devient dangereuse. */
export function heartbeat(vol = 1) {
  if (!ac) return;
  const t = now();
  tone(sfxBus, 'sine', 62, t, 0.12, 0.16 * vol, { glide: 40 });
  tone(sfxBus, 'sine', 58, t + 0.2, 0.14, 0.12 * vol, { glide: 38 });
}
