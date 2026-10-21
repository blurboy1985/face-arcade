// Background music: a tiny Web Audio chiptune sequencer plus one original song per game.
// Songs are written as 16-step bars (16th notes). Melody tokens: "E5" note, "-" hold, "." rest.
import { audio, getAudioContext, loadStr, saveStr } from "./util.js";

const MUSIC_KEY = "faceArcadeMusic";
const VOLUME = 0.13;      // music sits under the sound effects
const LOOKAHEAD = 0.15;   // seconds of notes scheduled ahead
const STEPS_PER_BAR = 16;

export const musicPrefs = { enabled: loadStr(MUSIC_KEY, "1") !== "0" };

// ---------- Notes & chords ----------
const NOTE_IDX = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
const midiOf = (name, oct) => 12 * (oct + 1) + NOTE_IDX[name];
const parseNote = (tok) => { const m = /^([A-G]#?)(\d)$/.exec(tok); return m ? midiOf(m[1], +m[2]) : null; };
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

const CHORDS = {
  C: ["C", "E", "G"], Am: ["A", "C", "E"], F: ["F", "A", "C"], G: ["G", "B", "D"],
  Em: ["E", "G", "B"], D: ["D", "F#", "A"],
};
// Chord tones stacked upward from the root in the given octave, plus the octave on top.
function chordTones(name, oct) {
  const out = [];
  for (const t of CHORDS[name]) {
    let m = midiOf(t, oct);
    while (out.length && m <= out[out.length - 1]) m += 12;
    out.push(m);
  }
  out.push(out[0] + 12);
  return out;
}

// ---------- Track builders (all return [{ step, midi?, kind?, len }]) ----------
function melody(bars) {
  const toks = [];
  bars.forEach((bar, i) => {
    const t = bar.trim().split(/\s+/);
    if (t.length !== STEPS_PER_BAR) console.warn(`music: melody bar ${i + 1} has ${t.length} steps, expected ${STEPS_PER_BAR}`);
    toks.push(...t);
  });
  const events = [];
  toks.forEach((tok, step) => {
    const midi = parseNote(tok);
    if (midi === null) return;
    let len = 1;
    while (toks[step + len] === "-") len++;
    events.push({ step, midi, len });
  });
  return events;
}

function arpeggio(chords, oct, order) {
  const events = [];
  chords.forEach((c, bar) => {
    const tones = chordTones(c, oct);
    for (let i = 0; i < STEPS_PER_BAR; i++) events.push({ step: bar * STEPS_PER_BAR + i, midi: tones[order[i % order.length]], len: 1 });
  });
  return events;
}

function bassline(chords, style) {
  const events = [];
  chords.forEach((c, bar) => {
    const root = chordTones(c, 2)[0], fifth = root + 7, base = bar * STEPS_PER_BAR;
    if (style === "pulse") {        // steady 8ths, octave jump on the off-beats
      for (let i = 0; i < 16; i += 2) events.push({ step: base + i, midi: i % 4 === 2 ? root + 12 : root, len: 1 });
    } else if (style === "oompah") { // bouncy root–fifth on quarter notes
      for (let i = 0; i < 16; i += 4) events.push({ step: base + i, midi: (i / 4) % 2 ? fifth + 12 : root + 12, len: 2 });
    } else {                         // "drive": 8ths on the root, walk up to the fifth at the end of the bar
      for (let i = 0; i < 16; i += 2) events.push({ step: base + i, midi: i >= 12 ? fifth : root, len: 1 });
    }
  });
  return events;
}

function drums(pattern, bars) {
  const toks = pattern.trim().split(/\s+/);
  const events = [];
  for (let bar = 0; bar < bars; bar++) {
    toks.forEach((k, i) => { if (k !== ".") events.push({ step: bar * STEPS_PER_BAR + i, kind: k, len: 1 }); });
  }
  return events;
}

// ---------- Songs (original compositions) ----------
function song({ bpm, chords, lead, arp, bass, beat, voices }) {
  const length = chords.length * STEPS_PER_BAR;
  const tracks = { lead: melody(lead), bass: bassline(chords, bass), drums: drums(beat, chords.length) };
  if (arp) tracks.arp = arpeggio(chords, arp.oct, arp.order);
  // Index events by step for quick lookup while playing.
  const byStep = Array.from({ length }, () => []);
  for (const [voice, events] of Object.entries(tracks)) for (const e of events) byStep[e.step % length].push({ voice, ...e });
  return { bpm, length, byStep, voices };
}

export const SONGS = {
  // Face Pilot — "Starfield Drift": moody A-minor synth arps.
  pilot: song({
    bpm: 118,
    chords: ["Am", "F", "C", "G", "Am", "F", "C", "G"],
    lead: [
      "A4 - - - C5 - E5 - D5 - C5 - B4 - - -",
      "A4 - - - F4 - A4 - C5 - - - A4 - - -",
      "G4 - - - C5 - E5 - G5 - - - E5 - D5 -",
      "D5 - - - B4 - - - G4 - - - . . . .",
      "E5 - - - E5 - D5 - C5 - - - A4 - - -",
      "C5 - - - A4 - F4 - A4 - C5 - F5 - - -",
      "E5 - - - G5 - E5 - C5 - - - D5 - E5 -",
      "D5 - - - - - - - B4 - - - G4 - - -",
    ],
    arp: { oct: 4, order: [0, 1, 2, 3, 2, 1] },
    bass: "pulse",
    beat: "k . h . s . h . k . h k s . h .",
    voices: { lead: ["square", 0.32, 2600], arp: ["sawtooth", 0.14, 1400], bass: ["triangle", 0.75] },
  }),

  // Face Jump — "Hilltop Hop": bouncy C-major platformer tune.
  jump: song({
    bpm: 150,
    chords: ["C", "Am", "F", "G", "C", "Am", "F", "G"],
    lead: [
      "E5 - G5 - C6 - G5 - E5 - C5 - D5 - E5 -",
      "A4 - C5 - E5 - - - D5 - C5 - A4 - - -",
      "F4 - A4 - C5 - F5 - E5 - D5 - C5 - A4 -",
      "G4 - B4 - D5 - G5 - - - F5 - E5 - D5 -",
      "C5 . C5 . E5 - G5 - E5 . E5 . G5 - C6 -",
      "B5 - A5 - G5 - E5 - A5 - - - . . . .",
      "F5 - E5 - D5 - C5 - A4 - C5 - D5 - F5 -",
      "E5 - D5 - - - B4 - - - G4 - - - . .",
    ],
    bass: "oompah",
    beat: "k . h . s . h . k . h . s . h h",
    voices: { lead: ["square", 0.3, 3200], bass: ["triangle", 0.8] },
  }),

  // Face Pong — "Rally Rush": driving E-minor arcade track.
  pong: song({
    bpm: 140,
    chords: ["Em", "C", "G", "D", "Em", "C", "G", "D"],
    lead: [
      "E5 - - B4 - - E5 - G5 - F#5 - E5 - D5 -",
      "E5 - - - C5 - - - G4 - - - C5 - D5 -",
      "D5 - - B4 - - D5 - G5 - - - F#5 - G5 -",
      "A5 - - - F#5 - - - D5 - - - . . . .",
      "G5 - G5 - F#5 - E5 - B4 - - - E5 - - -",
      "G5 - G5 - A5 - G5 - E5 - - - C5 - - -",
      "B5 - A5 - G5 - D5 - G5 - A5 - B5 - D6 -",
      "C#6 - - - A5 - - - F#5 - - - D5 - - -",
    ],
    arp: { oct: 4, order: [0, 2, 1, 3] },
    bass: "drive",
    beat: "k . h k s . h . k . h k s . h h",
    voices: { lead: ["square", 0.28, 3000], arp: ["triangle", 0.2], bass: ["sawtooth", 0.4, 700] },
  }),
};

// ---------- Player ----------
let noiseBuffer = null;
function getNoise(ac) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

export class Music {
  constructor(songDef) {
    this.song = songDef;
    this.playing = false;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.bus = null;
    // Don't keep playing in a background tab; the game resumes it on its next frame.
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.pause(); });
  }

  // Call every frame with whether music should be playing right now.
  setPlaying(on) {
    on = on && musicPrefs.enabled && !document.hidden;
    if (on && !this.playing) this.resume();
    else if (!on && this.playing) this.pause();
  }

  // Back to the start of the song (e.g. a new game); playback resumes via setPlaying.
  restart() { this.pause(); this.step = 0; }

  resume() {
    const ac = getAudioContext();
    if (!ac) return;
    if (!this.bus) {
      this.bus = ac.createGain();
      this.bus.gain.value = 0;
      this.bus.connect(ac.destination);
    }
    this.playing = true;
    this.bus.gain.cancelScheduledValues(ac.currentTime);
    this.bus.gain.setTargetAtTime(audio.muted ? 0 : VOLUME, ac.currentTime, 0.05);
    this.nextTime = ac.currentTime + 0.05;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    const ac = getAudioContext();
    if (ac && this.bus) { this.bus.gain.cancelScheduledValues(ac.currentTime); this.bus.gain.setTargetAtTime(0, ac.currentTime, 0.04); }
  }

  schedule() {
    const ac = getAudioContext();
    if (!ac || !this.playing) return;
    this.bus.gain.setTargetAtTime(audio.muted ? 0 : VOLUME, ac.currentTime, 0.05); // follows the M (mute) key
    const stepDur = 60 / this.song.bpm / 4;
    if (this.nextTime < ac.currentTime - 0.05) this.nextTime = ac.currentTime + 0.02; // timers were throttled: skip ahead
    while (this.nextTime < ac.currentTime + LOOKAHEAD) {
      for (const e of this.song.byStep[this.step]) this.play(ac, e, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % this.song.length;
    }
  }

  play(ac, e, t, stepDur) {
    if (e.voice === "drums") { this.drum(ac, e.kind, t); return; }
    const [type, vol, cutoff] = this.song.voices[e.voice];
    const dur = e.len * stepDur;
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(hz(e.midi), t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.setTargetAtTime(vol * 0.55, t + 0.02, 0.1);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.9, 0.025);
    let out = o;
    if (cutoff) {
      const f = ac.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = cutoff;
      o.connect(f); out = f;
    }
    out.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.2);
  }

  drum(ac, kind, t) {
    const g = ac.createGain();
    g.connect(this.bus);
    if (kind === "k") { // kick: fast pitch drop
      const o = ac.createOscillator();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g); o.start(t); o.stop(t + 0.18);
      return;
    }
    const src = ac.createBufferSource();
    src.buffer = getNoise(ac);
    const f = ac.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = kind === "s" ? 1200 : 7000;
    const [vol, len] = kind === "s" ? [0.35, 0.13] : [0.12, 0.04];
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g);
    src.start(t); src.stop(t + len + 0.02);
  }
}

// Wires the menu's "Music" checkbox; setMusicEnabled keeps it in sync when the N key toggles music.
export function bindMusicToggle(checkbox) {
  checkbox.checked = musicPrefs.enabled;
  checkbox.addEventListener("change", () => setMusicEnabled(checkbox.checked));
}

export function setMusicEnabled(on) {
  musicPrefs.enabled = on;
  saveStr(MUSIC_KEY, on ? "1" : "0");
  const cb = document.getElementById("music-toggle");
  if (cb) cb.checked = on;
}
